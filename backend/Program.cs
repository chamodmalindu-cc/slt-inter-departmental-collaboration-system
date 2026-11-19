using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SltCommunicationSystem.Api.Configuration;
using SltCommunicationSystem.Api.Data;
using SltCommunicationSystem.Api.Hubs;
using SltCommunicationSystem.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── 1. Load .env for local development ──────────────────────────────────────
var envFilePath = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envFilePath))
{
    foreach (var line in File.ReadAllLines(envFilePath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#'))
            continue;
        var eqIndex = trimmed.IndexOf('=');
        if (eqIndex <= 0) continue;
        var key = trimmed[..eqIndex].Trim();
        var value = trimmed[(eqIndex + 1)..].Trim();
        Environment.SetEnvironmentVariable(key, value);
    }
}
builder.Configuration.AddEnvironmentVariables();

// ─── 2. Database ──────────────────────────────────────────────────────────────
var connectionString = DatabaseConfig.GetPostgreSqlConnectionString(builder.Configuration);
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// ─── 3. JWT Authentication ───────────────────────────────────────────────────
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? throw new InvalidOperationException("JWT_SECRET_KEY is not set.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Dev only – enable HTTPS in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer           = true,
        ValidIssuer              = JwtConfig.Issuer,
        ValidateAudience         = true,
        ValidAudience            = JwtConfig.Audience,
        ValidateLifetime         = true,
        ClockSkew                = TimeSpan.FromMinutes(1)
    };

    // Support JWT authentication for SignalR WebSockets via query string 'access_token'
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/hubs/chat") || path.StartsWithSegments("/hubs/notifications")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ─── 4. Application Services ─────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IEntraTokenValidator, EntraTokenValidator>();
builder.Services.AddSingleton<IUserPresenceTracker, UserPresenceTracker>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddSingleton<IFileStorageService, FileStorageService>();

// ─── 5. API Infrastructure ───────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT Bearer support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title   = "SLT Communication System API",
        Version = "v1",
        Description = "Inter-Departmental Project Communication & Collaboration System for SLT"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter your JWT token (without 'Bearer ' prefix)"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ─── 6. SignalR ───────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── 7. CORS Configuration ──────────────────────────────────────────────────
const string corsPolicyName = "AllowFrontendDev";
var configuredOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

var allowedOrigins = configuredOrigins != null && configuredOrigins.Length > 0
    ? configuredOrigins
    : new[] { "http://localhost:5173", "http://127.0.0.1:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ─── Build ────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ─── 8. Database migration and seeding ───────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        if (db.Database.IsRelational())
            await db.Database.MigrateAsync();
        await DbInitializer.SeedAsync(db);

        // Phase 07: Ensure dedicated 3-participant chat rooms exist for any active assigned projects
        try
        {
            var chatService = services.GetRequiredService<IChatService>();
            var assignedProjects = await db.Projects
                .Include(p => p.Assignments)
                .Where(p => p.Status == "ASSIGNED")
                .ToListAsync();

            foreach (var proj in assignedProjects)
            {
                var acceptedAssignment = proj.Assignments
                    .FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
                if (acceptedAssignment != null)
                {
                    await chatService.EnsureProjectChatRoomAsync(
                        proj.Id,
                        acceptedAssignment.UserId,
                        acceptedAssignment.AssignedByUserId,
                        proj.CreatedByUserId
                    );
                }
            }
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogWarning(ex, "Failed to auto-initialize chat rooms during startup.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database migration or seeding.");
        if (app.Environment.IsDevelopment()) throw;
    }
}

// ─── 9. Middleware pipeline ───────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(corsPolicyName);
app.UseAuthentication(); // Must be before UseAuthorization
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");
app.MapGet("/", () => Results.Json(new
{
    Message       = "SLT Inter-Departmental Communication & Collaboration API",
    HealthCheck   = "/api/health",
    DatabaseTest  = "/api/database/test",
    Login         = "/api/auth/login",
    Documentation = "/swagger"
}));

app.Run();
