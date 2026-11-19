using System.ComponentModel.DataAnnotations;

namespace SltCommunicationSystem.Api.Models.DTOs;

// ─── Request DTOs ────────────────────────────────────────────────────────────

public class LoginRequest
{
    [Required(ErrorMessage = "Username is required.")]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MaxLength(255)]
    public string Password { get; set; } = string.Empty;
}

public class EntraLoginRequest
{
    [Required(ErrorMessage = "Microsoft authentication token is required.")]
    public string IdToken { get; set; } = string.Empty;
}

public class LinkEntraRequest
{
    [Required(ErrorMessage = "Target User ID is required.")]
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "Microsoft Directory Tenant ID is required.")]
    [MaxLength(100)]
    public string EntraTenantId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Microsoft Object ID (oid) is required.")]
    [MaxLength(100)]
    public string EntraObjectId { get; set; } = string.Empty;
}

public class EntraConfigDto
{
    public bool Enabled { get; set; }
    public string? ClientId { get; set; }
    public string? TenantId { get; set; }
    public string? RedirectUri { get; set; }
    public string? Authority { get; set; }
    public string? Scope { get; set; }
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresInSeconds { get; set; }
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public bool IsDemoAccount { get; set; }
    public bool IsActive { get; set; }
}
