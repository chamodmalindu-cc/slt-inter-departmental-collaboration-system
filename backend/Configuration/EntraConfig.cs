namespace SltCommunicationSystem.Api.Configuration;

/// <summary>
/// Configuration for Microsoft Entra ID (Azure Active Directory) authentication.
/// Reads from appsettings.json "MicrosoftEntra" section or environment variables:
///   - ENTRA_TENANT_ID or MicrosoftEntra:TenantId
///   - ENTRA_CLIENT_ID or MicrosoftEntra:ClientId
///   - ENTRA_AUDIENCE or MicrosoftEntra:Audience
///   - ENTRA_INSTANCE or MicrosoftEntra:Instance
///   - ENTRA_TEST_SIGNING_KEY or MicrosoftEntra:TestSigningKey
/// </summary>
public class EntraConfig
{
    public const string SectionName = "MicrosoftEntra";

    public string? TenantId { get; set; }
    public string? ClientId { get; set; }
    public string? Audience { get; set; }
    public string Instance { get; set; } = "https://login.microsoftonline.com/";
    public string? TestSigningKey { get; set; }

    /// <summary>
    /// Indicates whether valid, non-placeholder Microsoft Entra application credentials are provided.
    /// </summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(TenantId) &&
        !TenantId.StartsWith("00000000") &&
        !string.IsNullOrWhiteSpace(ClientId) &&
        !ClientId.StartsWith("00000000");

    /// <summary>
    /// Indicates whether a valid test signing key is configured for cryptographically verified testing.
    /// Minimum 32 characters for HMAC-SHA256.
    /// </summary>
    public bool HasTestSigningKey =>
        !string.IsNullOrWhiteSpace(TestSigningKey) &&
        TestSigningKey.Length >= 32;

    /// <summary>
    /// Authority URL for this tenant, e.g. https://login.microsoftonline.com/{TenantId}/v2.0
    /// </summary>
    public string Authority => $"{Instance.TrimEnd('/')}/{TenantId}/v2.0";

    /// <summary>
    /// OpenID Connect discovery endpoint for public signing keys and issuer configuration.
    /// </summary>
    public string MetadataAddress => $"{Instance.TrimEnd('/')}/{TenantId}/v2.0/.well-known/openid-configuration";
}
