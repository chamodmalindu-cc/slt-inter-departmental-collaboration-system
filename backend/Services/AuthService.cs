using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SltCommunicationSystem.Api.Configuration;
using SltCommunicationSystem.Api.Data;
using SltCommunicationSystem.Api.Models.DTOs;
using SltCommunicationSystem.Api.Models.Entities;

namespace SltCommunicationSystem.Api.Services;

/// <summary>
/// Local authentication service using PBKDF2-SHA256 hashed passwords.
/// Designed for phased integration: start with demo/local accounts,
/// then plug in real SLT AD / Microsoft Entra ID without changing consumers.
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext db, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string ipAddress)
    {
        // 1. Sanitize input
        var username = request.Username.Trim().ToLowerInvariant();
        var password = request.Password;

        // 2. Load user with roles and department
        var user = await _db.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username && u.IsActive);

        if (user == null)
        {
            _logger.LogWarning("Login failed – user not found or inactive: {Username} from {IP}", username, ipAddress);
            await WriteAuditLogAsync(null, "LOGIN_FAILED", "User", null, $"User not found: {username}", ipAddress);
            return null;
        }

        // 3. Verify password
        if (!VerifyPassword(password, user.PasswordHash, user.PasswordSalt))
        {
            _logger.LogWarning("Login failed – invalid password: {Username} from {IP}", username, ipAddress);
            await WriteAuditLogAsync(user.Id, "LOGIN_FAILED", "User", user.Id.ToString(), "Invalid password", ipAddress);
            return null;
        }

        // 4. Build profile DTO
        var profile = BuildProfileDto(user);

        // 5. Generate JWT
        var token = GenerateJwtToken(profile);
        var expiresAt = DateTime.UtcNow.AddMinutes(JwtConfig.ExpiryMinutes);

        await WriteAuditLogAsync(user.Id, "LOGIN_SUCCESS", "User", user.Id.ToString(), $"Login from {ipAddress}", ipAddress);
        _logger.LogInformation("Login success: {Username} [{Roles}] from {IP}", username, string.Join(",", profile.Roles), ipAddress);

        return new LoginResponse
        {
            Token = token,
            TokenType = "Bearer",
            ExpiresInSeconds = JwtConfig.ExpiryMinutes * 60,
            ExpiresAt = expiresAt,
            User = profile
        };
    }

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
    {
        var user = await _db.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        return user == null ? null : BuildProfileDto(user);
    }

    public bool VerifyPassword(string password, string storedHash, string storedSalt)
    {
        try
        {
            var saltBytes = Convert.FromBase64String(storedSalt);
            var expectedHash = Convert.ToBase64String(
                Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, 100_000, HashAlgorithmName.SHA256, 32));
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expectedHash),
                Encoding.UTF8.GetBytes(storedHash));
        }
        catch
        {
            return false;
        }
    }

    public string GenerateJwtToken(UserProfileDto user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new("fullName", user.FullName),
            new("departmentCode", user.DepartmentCode),
            new("isDemoAccount", user.IsDemoAccount.ToString().ToLower()),
        };

        // Add one role claim per role
        foreach (var role in user.Roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: JwtConfig.Issuer,
            audience: JwtConfig.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(JwtConfig.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<(LoginResponse? Response, string? ErrorMessage)> LoginWithEntraAsync(
        EntraValidationResult validation, string ipAddress)
    {
        // 1. Strict Cryptographic Verification Check
        if (!validation.IsValid || !validation.IsCryptographicallyVerified)
        {
            return (null, validation.ErrorMessage ?? "Microsoft authentication token failed cryptographic verification.");
        }

        if (string.IsNullOrWhiteSpace(validation.ObjectId) || string.IsNullOrWhiteSpace(validation.TenantId))
        {
            return (null, "Microsoft token must contain both immutable object identifier ('oid') and tenant identifier ('tid').");
        }

        // 2. Trusted Identity Match: MUST match BOTH EntraTenantId and EntraObjectId
        // The composite (EntraTenantId, EntraObjectId) is the single source of truth for identity mapping.
        var user = await _db.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.EntraTenantId == validation.TenantId 
                                   && u.EntraObjectId == validation.ObjectId 
                                   && u.IsActive);

        // 3. Security Rule: Strictly prevent automatic account linking via unverified email claim.
        // If an Entra ID identity is not pre-registered or linked by an Administrator, reject the login.
        if (user == null)
        {
            _logger.LogWarning(
                "Microsoft Entra login denied – unlinked identity: tid={TenantId}, oid={ObjectId}, email={Email} from {IP}",
                validation.TenantId, validation.ObjectId, validation.Email, ipAddress);

            await WriteAuditLogAsync(null, "ENTRA_LOGIN_DENIED", "User", null,
                $"Unlinked Microsoft Entra account: oid={validation.ObjectId}, tid={validation.TenantId}, email={validation.Email}", ipAddress);

            return (null, $"Access Denied: Microsoft account (OID: {validation.ObjectId}, TID: {validation.TenantId}) has not been linked to an SLT employee account. Administrator approval is required for account linking.");
        }

        // 4. Update login tracking
        user.LastEntraLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // 5. Build application profile with PRESERVED existing application roles (NEVER auto-elevates privileges)
        var profile = BuildProfileDto(user);

        // 6. Generate standard signed SLT Application JWT
        var token = GenerateJwtToken(profile);
        var expiresAt = DateTime.UtcNow.AddMinutes(JwtConfig.ExpiryMinutes);

        await WriteAuditLogAsync(user.Id, "ENTRA_LOGIN_SUCCESS", "User", user.Id.ToString(),
            $"Entra ID login from {ipAddress} (tid: {validation.TenantId}, oid: {validation.ObjectId})", ipAddress);

        _logger.LogInformation("Microsoft Entra login success: {Username} [{Roles}] from {IP}",
            user.Username, string.Join(",", profile.Roles), ipAddress);

        return (new LoginResponse
        {
            Token = token,
            TokenType = "Bearer",
            ExpiresInSeconds = JwtConfig.ExpiryMinutes * 60,
            ExpiresAt = expiresAt,
            User = profile
        }, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> LinkEntraIdentityAsync(
        Guid adminUserId, Guid targetUserId, string entraTenantId, string entraObjectId, string ipAddress)
    {
        // 1. Validate inputs
        if (string.IsNullOrWhiteSpace(entraTenantId) || string.IsNullOrWhiteSpace(entraObjectId))
        {
            return (false, "Tenant ID and Object ID are required.");
        }

        entraTenantId = entraTenantId.Trim();
        entraObjectId = entraObjectId.Trim();

        // 2. Locate target user
        var targetUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId && u.IsActive);
        if (targetUser == null)
        {
            return (false, "Target employee account was not found or is deactivated.");
        }

        // 3. Security Check: Prevent Duplicate Identity Mapping
        var existingSameIdentity = await _db.Users
            .FirstOrDefaultAsync(u => u.EntraTenantId == entraTenantId 
                                   && u.EntraObjectId == entraObjectId 
                                   && u.Id != targetUserId);

        if (existingSameIdentity != null)
        {
            _logger.LogWarning("Admin {AdminId} attempted duplicate Entra identity link to {TargetUser}, already assigned to {ExistingUser}",
                adminUserId, targetUser.Username, existingSameIdentity.Username);

            return (false, $"Conflict: Microsoft Entra identity (OID: {entraObjectId}) is already mapped to user '{existingSameIdentity.Username}'. Duplicate mappings are prohibited.");
        }

        // Check if oid alone is already mapped to another user
        var existingSameOid = await _db.Users
            .FirstOrDefaultAsync(u => u.EntraObjectId == entraObjectId && u.Id != targetUserId);

        if (existingSameOid != null)
        {
            return (false, $"Conflict: Microsoft Entra Object ID ({entraObjectId}) is already assigned to user '{existingSameOid.Username}'.");
        }

        // 4. Securely assign the Microsoft Entra identity
        var oldOid = targetUser.EntraObjectId;
        var oldTid = targetUser.EntraTenantId;

        targetUser.EntraTenantId = entraTenantId;
        targetUser.EntraObjectId = entraObjectId;
        targetUser.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // 5. Write comprehensive audit log
        await WriteAuditLogAsync(adminUserId, "ENTRA_IDENTITY_LINKED", "User", targetUser.Id.ToString(),
            $"Admin linked Entra identity (TID: {entraTenantId}, OID: {entraObjectId}) to employee {targetUser.Username} (prev OID: {oldOid ?? "none"})",
            ipAddress);

        _logger.LogInformation("Admin {AdminId} successfully linked Entra identity ({Tid}, {Oid}) to user {Username}",
            adminUserId, entraTenantId, entraObjectId, targetUser.Username);

        return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> UnlinkEntraIdentityAsync(
        Guid adminUserId, Guid targetUserId, string ipAddress)
    {
        var targetUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (targetUser == null)
        {
            return (false, "Target employee account was not found.");
        }

        var prevOid = targetUser.EntraObjectId;
        var prevTid = targetUser.EntraTenantId;

        targetUser.EntraTenantId = null;
        targetUser.EntraObjectId = null;
        targetUser.LastEntraLoginAt = null;
        targetUser.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await WriteAuditLogAsync(adminUserId, "ENTRA_IDENTITY_UNLINKED", "User", targetUser.Id.ToString(),
            $"Admin unlinked Entra identity from employee {targetUser.Username} (prev TID: {prevTid}, OID: {prevOid})",
            ipAddress);

        return (true, null);
    }

    public EntraConfigDto GetEntraConfig()
    {
        var tenantId = Environment.GetEnvironmentVariable("ENTRA_TENANT_ID") 
                       ?? _configuration["MicrosoftEntra:TenantId"] 
                       ?? _configuration["SLT_ENTRA_TENANT_ID"];
        var clientId = Environment.GetEnvironmentVariable("ENTRA_CLIENT_ID") 
                       ?? _configuration["MicrosoftEntra:ClientId"] 
                       ?? _configuration["SLT_ENTRA_CLIENT_ID"];
        var redirectUri = Environment.GetEnvironmentVariable("ENTRA_REDIRECT_URI") 
                          ?? _configuration["MicrosoftEntra:RedirectUri"] 
                          ?? "http://127.0.0.1:5173/login";
        var scope = Environment.GetEnvironmentVariable("ENTRA_API_SCOPE") 
                    ?? _configuration["MicrosoftEntra:Scope"] 
                    ?? "openid profile email User.Read";

        var isConfigured = !string.IsNullOrWhiteSpace(tenantId) && 
                           !tenantId.StartsWith("00000000") && 
                           !string.IsNullOrWhiteSpace(clientId) && 
                           !clientId.StartsWith("00000000");

        return new EntraConfigDto
        {
            Enabled = isConfigured,
            TenantId = isConfigured ? tenantId : null,
            ClientId = isConfigured ? clientId : null,
            RedirectUri = redirectUri,
            Authority = isConfigured ? $"https://login.microsoftonline.com/{tenantId}" : null,
            Scope = scope
        };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static UserProfileDto BuildProfileDto(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        FullName = user.FullName,
        DepartmentName = user.Department?.Name ?? string.Empty,
        DepartmentCode = user.Department?.Code ?? string.Empty,
        Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
        IsDemoAccount = user.IsDemoAccount,
        IsActive = user.IsActive
    };

    private async Task WriteAuditLogAsync(
        Guid? userId, string action, string entity, string? entityId, string details, string ipAddress)
    {
        try
        {
            _db.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityName = entity,
                EntityId = entityId,
                Details = details,
                IpAddress = ipAddress,
                Timestamp = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log for action {Action}", action);
        }
    }
}
