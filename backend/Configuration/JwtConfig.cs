namespace SltCommunicationSystem.Api.Configuration;

/// <summary>
/// Reads JWT configuration from environment variables.
/// Structured so real SLT AD / Microsoft Entra ID integration can be
/// added after SLT provides the required access and configuration.
/// </summary>
public static class JwtConfig
{
    /// <summary>Secret signing key (minimum 32 chars in production).</summary>
    public static string SecretKey =>
        Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
        ?? throw new InvalidOperationException(
            "JWT_SECRET_KEY environment variable is not set. " +
            "Add it to backend/.env for local development.");

    /// <summary>Token issuer – identifies this API.</summary>
    public static string Issuer =>
        Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "SltCommunicationSystem";

    /// <summary>Token audience – identifies the React SPA.</summary>
    public static string Audience =>
        Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "SltCommunicationSystemClient";

    /// <summary>Token lifetime in minutes (default 480 = 8 hours).</summary>
    public static int ExpiryMinutes =>
        int.TryParse(Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES"), out var m) ? m : 480;
}
