using Microsoft.AspNetCore.Mvc;
using SltCommunicationSystem.Api.Configuration;
using SltCommunicationSystem.Api.Data;

namespace SltCommunicationSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public HealthController(IConfiguration configuration, AppDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var dbMetadata = DatabaseConfig.GetDatabaseSanitizedMetadata(_configuration);
        bool isDbConnected = false;

        try
        {
            isDbConnected = await _context.Database.CanConnectAsync();
        }
        catch
        {
            isDbConnected = false;
        }

        return Ok(new
        {
            Status = isDbConnected ? "Healthy" : "Degraded",
            Timestamp = DateTime.UtcNow.ToString("o"),
            Service = "SLT Inter-Departmental Communication & Collaboration API",
            Version = "1.0.0",
            Database = new
            {
                Configured = true,
                Connected = isDbConnected,
                Host = _configuration["Database:Host"] ?? Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost",
                Port = _configuration["Database:Port"] ?? Environment.GetEnvironmentVariable("DB_PORT") ?? "5432",
                Database = _configuration["Database:Name"] ?? Environment.GetEnvironmentVariable("DB_NAME") ?? "slt_collab_db"
            }
        });
    }
}
