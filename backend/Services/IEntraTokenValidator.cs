namespace SltCommunicationSystem.Api.Services;

public class EntraValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ObjectId { get; set; }        // 'oid' claim (immutable unique user identifier)
    public string? TenantId { get; set; }        // 'tid' claim (Microsoft directory tenant ID)
    public string? Email { get; set; }           // 'preferred_username' or 'email' or 'upn'
    public string? FullName { get; set; }        // 'name' claim
    public string? Subject { get; set; }         // 'sub' claim
    public bool IsCryptographicallyVerified { get; set; } // Flag confirming cryptographic signature verification
}

public interface IEntraTokenValidator
{
    Task<EntraValidationResult> ValidateTokenAsync(string token);
}
