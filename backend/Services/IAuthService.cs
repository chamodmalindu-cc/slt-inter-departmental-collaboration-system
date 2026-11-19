using SltCommunicationSystem.Api.Models.DTOs;

namespace SltCommunicationSystem.Api.Services;

/// <summary>
/// Authentication service interface.
/// Structured to allow real SLT AD / Microsoft Entra ID integration
/// to be plugged in after SLT provides the required configuration.
/// Currently supports local PBKDF2-hashed password authentication for:
///   - Permanent system accounts (ADMIN, DGM, HIGHER_MANAGEMENT)
///   - Demo test accounts (DIGITAL_LAB_USER, NON_DIGITAL_LAB_USER)
/// </summary>
public interface IAuthService
{
    /// <summary>Validates credentials and returns a JWT login response, or null on failure.</summary>
    Task<LoginResponse?> LoginAsync(LoginRequest request, string ipAddress);

    /// <summary>Returns the full profile for an authenticated user by ID.</summary>
    Task<UserProfileDto?> GetProfileAsync(Guid userId);

    /// <summary>Verifies a PBKDF2-hashed password against stored hash and salt.</summary>
    bool VerifyPassword(string password, string storedHash, string storedSalt);

    /// <summary>Generates a signed JWT for the given user and roles.</summary>
    string GenerateJwtToken(UserProfileDto user);

    /// <summary>
    /// Authenticates a user via validated Microsoft Entra ID claims (oid, tid, email).
    /// Enforces verified account mapping, prevents unauthorized accounts, and preserves existing roles.
    /// </summary>
    Task<(LoginResponse? Response, string? ErrorMessage)> LoginWithEntraAsync(EntraValidationResult validation, string ipAddress);

    /// <summary>
    /// Retrieves public Entra ID configuration for client SPA MSAL initialization.
    /// </summary>
    EntraConfigDto GetEntraConfig();

    /// <summary>
    /// Administrator-approved linking of a Microsoft Entra ID (tid + oid) to an existing employee account.
    /// Strictly enforces unique identity mapping and prevents duplicate accounts.
    /// </summary>
    Task<(bool Success, string? ErrorMessage)> LinkEntraIdentityAsync(
        Guid adminUserId, Guid targetUserId, string entraTenantId, string entraObjectId, string ipAddress);

    /// <summary>
    /// Administrator-approved unlinking of a Microsoft Entra ID from an employee account.
    /// </summary>
    Task<(bool Success, string? ErrorMessage)> UnlinkEntraIdentityAsync(
        Guid adminUserId, Guid targetUserId, string ipAddress);
}
