using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SltCommunicationSystem.Api.Models.DTOs;
using SltCommunicationSystem.Api.Services;
using System.Security.Claims;

namespace SltCommunicationSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEntraTokenValidator _entraTokenValidator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        IEntraTokenValidator entraTokenValidator,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _entraTokenValidator = entraTokenValidator;
        _logger = logger;
    }

    /// <summary>Returns public Microsoft Entra ID configuration for client SPA.</summary>
    [HttpGet("entra-config")]
    [AllowAnonymous]
    public IActionResult GetEntraConfig()
    {
        var config = _authService.GetEntraConfig();
        return Ok(config);
    }

    /// <summary>
    /// Authenticate using Microsoft Entra ID (Azure Active Directory) token.
    /// Validates token cryptographically, verifies tenant, matches authorized employee account,
    /// and issues an SLT application JWT with preserved role permissions.
    /// </summary>
    [HttpPost("entra-login")]
    [AllowAnonymous]
    public async Task<IActionResult> EntraLogin([FromBody] EntraLoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { Message = "Invalid request.", Errors = ModelState.Values
                .SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // Validate Microsoft token
        var validation = await _entraTokenValidator.ValidateTokenAsync(request.IdToken);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Entra token validation failed from {IP}: {Error}", ipAddress, validation.ErrorMessage);
            return Unauthorized(new { Message = validation.ErrorMessage ?? "Invalid Microsoft Entra token." });
        }

        // Complete account mapping and session generation
        var (result, errorMessage) = await _authService.LoginWithEntraAsync(validation, ipAddress);

        if (result == null)
        {
            // If user is not authorized or registered in the database, return 403 Forbidden
            if (errorMessage != null && errorMessage.StartsWith("Access Denied", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Message = errorMessage });
            }

            return BadRequest(new { Message = errorMessage ?? "Microsoft authentication failed." });
        }

        return Ok(result);
    }

    /// <summary>Authenticate and receive a JWT token (Local / Demo accounts).</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { Message = "Invalid request.", Errors = ModelState.Values
                .SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await _authService.LoginAsync(request, ipAddress);

        if (result == null)
            return Unauthorized(new { Message = "Invalid username or password." });

        return Ok(result);
    }

    /// <summary>Returns the authenticated user's profile. Requires a valid JWT.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { Message = "Invalid token." });

        var profile = await _authService.GetProfileAsync(userId);
        if (profile == null)
            return NotFound(new { Message = "User not found or account deactivated." });

        return Ok(profile);
    }

    /// <summary>Logout – client must discard the token. Logged server-side.</summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        _logger.LogInformation("User logged out: {Username}", username);
        return Ok(new { Message = "Logged out successfully." });
    }

    // ─── Administrator Account Linking Endpoints ────────────────────────────

    /// <summary>
    /// Administrator-approved linking of Microsoft Entra ID to an existing employee account.
    /// Strictly requires ADMIN role. Prevents duplicate identity mappings.
    /// </summary>
    [HttpPost("admin/link-entra")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> LinkEntraIdentity([FromBody] LinkEntraRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { Message = "Invalid request.", Errors = ModelState.Values
                .SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminIdStr, out var adminId))
            return Unauthorized(new { Message = "Invalid admin token." });

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (success, errorMessage) = await _authService.LinkEntraIdentityAsync(
            adminId, request.UserId, request.EntraTenantId, request.EntraObjectId, ipAddress);

        if (!success)
        {
            if (errorMessage != null && errorMessage.StartsWith("Conflict", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { Message = errorMessage });
            }
            return BadRequest(new { Message = errorMessage ?? "Failed to link Microsoft Entra identity." });
        }

        return Ok(new { Message = "Microsoft Entra identity successfully linked to employee account." });
    }

    /// <summary>
    /// Administrator unlinking of Microsoft Entra ID from an employee account.
    /// </summary>
    [HttpPost("admin/unlink-entra/{userId}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UnlinkEntraIdentity([FromRoute] Guid userId)
    {
        var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminIdStr, out var adminId))
            return Unauthorized(new { Message = "Invalid admin token." });

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (success, errorMessage) = await _authService.UnlinkEntraIdentityAsync(adminId, userId, ipAddress);

        if (!success)
        {
            return BadRequest(new { Message = errorMessage ?? "Failed to unlink Microsoft Entra identity." });
        }

        return Ok(new { Message = "Microsoft Entra identity unlinked successfully." });
    }

    // ─── Role-scoped endpoints (for testing / permission validation) ─────────

    /// <summary>Admin-only endpoint.</summary>
    [HttpGet("admin-only")]
    [Authorize(Roles = "ADMIN")]
    public IActionResult AdminOnly() =>
        Ok(new { Message = "Admin access granted.", Role = "ADMIN" });

    /// <summary>DGM-only endpoint.</summary>
    [HttpGet("dgm-only")]
    [Authorize(Roles = "ADMIN,DGM")]
    public IActionResult DgmOnly() =>
        Ok(new { Message = "DGM access granted.", Roles = "ADMIN,DGM" });

    /// <summary>Management dashboard access.</summary>
    [HttpGet("management")]
    [Authorize(Roles = "ADMIN,DGM,HIGHER_MANAGEMENT")]
    public IActionResult ManagementAccess() =>
        Ok(new { Message = "Management access granted." });

    /// <summary>Digital Lab user endpoint.</summary>
    [HttpGet("digital-lab")]
    [Authorize(Roles = "ADMIN,DGM,HIGHER_MANAGEMENT,DIGITAL_LAB_USER")]
    public IActionResult DigitalLabAccess() =>
        Ok(new { Message = "Digital Lab access granted." });

    /// <summary>All authenticated users.</summary>
    [HttpGet("authenticated")]
    [Authorize]
    public IActionResult AuthenticatedAccess() =>
        Ok(new
        {
            Message = "Authenticated access granted.",
            User = User.FindFirstValue(ClaimTypes.Name),
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
        });
}
