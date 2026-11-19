using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Configuration;
using SltCommunicationSystem.Api.Data;

namespace SltCommunicationSystem.Api.Controllers;

[ApiController]
[Route("api/database")]
public class DatabaseTestController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public DatabaseTestController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpGet("test")]
    public async Task<IActionResult> TestConnection()
    {
        var startTime = DateTime.UtcNow;
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            var responseTimeMs = (DateTime.UtcNow - startTime).TotalMilliseconds;

            if (!canConnect)
            {
                return StatusCode(503, new
                {
                    Success = false,
                    Message = "Database connectivity test failed: Cannot establish connection to PostgreSQL.",
                    Timestamp = DateTime.UtcNow,
                    Metadata = DatabaseConfig.GetDatabaseSanitizedMetadata(_configuration)
                });
            }

            var departmentCount = await _context.Departments.CountAsync();
            var roleCount = await _context.Roles.CountAsync();
            var userCount = await _context.Users.CountAsync();
            var projectCount = await _context.Projects.CountAsync();

            return Ok(new
            {
                Success = true,
                Message = "Database connection established successfully.",
                LatencyMs = Math.Round(responseTimeMs, 2),
                Timestamp = DateTime.UtcNow,
                DatabaseMetadata = DatabaseConfig.GetDatabaseSanitizedMetadata(_configuration),
                EntityStatistics = new
                {
                    Departments = departmentCount,
                    Roles = roleCount,
                    Users = userCount,
                    Projects = projectCount
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = "An error occurred while testing database connectivity.",
                Error = ex.Message,
                Timestamp = DateTime.UtcNow,
                Metadata = DatabaseConfig.GetDatabaseSanitizedMetadata(_configuration)
            });
        }
    }
}
