using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using SltCommunicationSystem.Api.Configuration;

namespace SltCommunicationSystem.Api.Services;

public class EntraTokenValidator : IEntraTokenValidator
{
    private readonly EntraConfig _entraConfig;
    private readonly ILogger<EntraTokenValidator> _logger;
    private readonly IWebHostEnvironment _env;
    private ConfigurationManager<OpenIdConnectConfiguration>? _configurationManager;

    public EntraTokenValidator(
        IConfiguration configuration,
        ILogger<EntraTokenValidator> logger,
        IWebHostEnvironment env)
    {
        _logger = logger;
        _env = env;

        // Bind from config or environment variables
        _entraConfig = new EntraConfig
        {
            TenantId = Environment.GetEnvironmentVariable("ENTRA_TENANT_ID") 
                       ?? configuration["MicrosoftEntra:TenantId"] 
                       ?? configuration["SLT_ENTRA_TENANT_ID"],
            ClientId = Environment.GetEnvironmentVariable("ENTRA_CLIENT_ID") 
                       ?? configuration["MicrosoftEntra:ClientId"] 
                       ?? configuration["SLT_ENTRA_CLIENT_ID"],
            Audience = Environment.GetEnvironmentVariable("ENTRA_AUDIENCE") 
                       ?? configuration["MicrosoftEntra:Audience"],
            Instance = Environment.GetEnvironmentVariable("ENTRA_INSTANCE") 
                       ?? configuration["MicrosoftEntra:Instance"] 
                       ?? "https://login.microsoftonline.com/",
            TestSigningKey = Environment.GetEnvironmentVariable("ENTRA_TEST_SIGNING_KEY")
                             ?? configuration["MicrosoftEntra:TestSigningKey"]
        };

        if (_entraConfig.IsConfigured)
        {
            try
            {
                _configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                    _entraConfig.MetadataAddress,
                    new OpenIdConnectConfigurationRetriever(),
                    new HttpDocumentRetriever());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not initialize Entra OpenID configuration manager for {TenantId}", _entraConfig.TenantId);
            }
        }
        else if (_entraConfig.HasTestSigningKey)
        {
            _logger.LogInformation("EntraTokenValidator initialized in Cryptographic Test Mode with configured test signing key.");
        }
        else
        {
            _logger.LogWarning(
                "Microsoft Entra ID is not configured. The /api/auth/entra-login endpoint will reject " +
                "all Microsoft tokens until valid ENTRA_TENANT_ID and ENTRA_CLIENT_ID are provided.");
        }
    }

    public async Task<EntraValidationResult> ValidateTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return new EntraValidationResult { IsValid = false, ErrorMessage = "Token cannot be empty." };
        }

        var handler = new JwtSecurityTokenHandler();
        if (!handler.CanReadToken(token))
        {
            return new EntraValidationResult { IsValid = false, ErrorMessage = "Invalid JWT token structure." };
        }

        JwtSecurityToken jwt;
        try
        {
            jwt = handler.ReadJwtToken(token);
        }
        catch (Exception ex)
        {
            return new EntraValidationResult { IsValid = false, ErrorMessage = $"Malformed JWT: {ex.Message}" };
        }

        // ── 1. Production Mode: Cryptographic validation against Microsoft OIDC keys ──
        if (_entraConfig.IsConfigured && _configurationManager != null)
        {
            try
            {
                var oidcConfig = await _configurationManager.GetConfigurationAsync(CancellationToken.None);
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKeys = oidcConfig.SigningKeys,
                    ValidateIssuer = true,
                    ValidIssuers = new[]
                    {
                        $"https://login.microsoftonline.com/{_entraConfig.TenantId}/v2.0",
                        $"https://sts.windows.net/{_entraConfig.TenantId}/"
                    },
                    ValidateAudience = true,
                    ValidAudiences = new[]
                    {
                        _entraConfig.ClientId,
                        _entraConfig.Audience ?? $"api://{_entraConfig.ClientId}"
                    },
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(2)
                };

                var principal = handler.ValidateToken(token, validationParameters, out var validatedToken);
                return ExtractAndValidateClaims(principal, jwt, _entraConfig.TenantId);
            }
            catch (SecurityTokenExpiredException)
            {
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Microsoft authentication token has expired." };
            }
            catch (SecurityTokenInvalidSignatureException)
            {
                _logger.LogWarning("Microsoft Entra token has an invalid cryptographic signature — rejected.");
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Microsoft token has an invalid cryptographic signature." };
            }
            catch (SecurityTokenInvalidIssuerException)
            {
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Token issuer is invalid or originates from an untrusted tenant." };
            }
            catch (SecurityTokenInvalidAudienceException)
            {
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Token audience does not match this application registration." };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Microsoft Entra token validation failed");
                return new EntraValidationResult { IsValid = false, ErrorMessage = $"Microsoft token verification failed: {ex.Message}" };
            }
        }

        // ── 2. Test / Staging Mode: Cryptographic validation using configured test signing key ──
        // Only enabled when ENTRA_TEST_SIGNING_KEY is explicitly configured in environment/configuration.
        // Even in test mode, cryptographic signature verification is ALWAYS strictly enforced.
        // Forged, tampered, expired, or invalid tokens are unconditionally rejected.
        if (_entraConfig.HasTestSigningKey)
        {
            try
            {
                var expectedTenant = !string.IsNullOrWhiteSpace(_entraConfig.TenantId) && !_entraConfig.TenantId.StartsWith("00000000")
                    ? _entraConfig.TenantId
                    : "72f988bf-86f1-41af-91ab-2d7cd011db47";
                var expectedAudience = _entraConfig.ClientId ?? "00000000-0000-0000-0000-000000000000";

                var testKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_entraConfig.TestSigningKey!));
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = testKey,
                    ValidateIssuer = true,
                    ValidIssuers = new[]
                    {
                        $"https://login.microsoftonline.com/{expectedTenant}/v2.0",
                        $"https://sts.windows.net/{expectedTenant}/"
                    },
                    ValidateAudience = true,
                    ValidAudiences = new[]
                    {
                        expectedAudience,
                        _entraConfig.Audience ?? $"api://{expectedAudience}"
                    },
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                var principal = handler.ValidateToken(token, validationParameters, out var validatedToken);
                return ExtractAndValidateClaims(principal, jwt, expectedTenant);
            }
            catch (SecurityTokenExpiredException)
            {
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Microsoft authentication token has expired." };
            }
            catch (SecurityTokenInvalidSignatureException)
            {
                _logger.LogWarning("Security Violation: Cryptographic signature verification failed for Microsoft token.");
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Invalid token signature. Cryptographic verification failed." };
            }
            catch (SecurityTokenInvalidIssuerException)
            {
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Token issuer is invalid or originates from an untrusted tenant." };
            }
            catch (SecurityTokenInvalidAudienceException)
            {
                return new EntraValidationResult { IsValid = false, ErrorMessage = "Token audience does not match this application registration." };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Token cryptographic validation failed: {Message}", ex.Message);
                return new EntraValidationResult { IsValid = false, ErrorMessage = $"Cryptographic token validation failed: {ex.Message}" };
            }
        }

        // ── 3. Unconfigured Environment: Safely reject all Microsoft authentication attempts ──
        _logger.LogWarning(
            "Microsoft Entra ID authentication rejected: tenant is not configured. " +
            "Set ENTRA_TENANT_ID and ENTRA_CLIENT_ID environment variables to enable Microsoft login.");

        return new EntraValidationResult
        {
            IsValid = false,
            ErrorMessage = "Microsoft Entra ID authentication is not yet configured for this environment. " +
                           "Please use username and password login, or contact your administrator to configure the Microsoft tenant."
        };
    }

    private static EntraValidationResult ExtractAndValidateClaims(
        ClaimsPrincipal principal, JwtSecurityToken jwt, string? expectedTenantId)
    {
        var oid = principal.FindFirst("oid")?.Value 
                  ?? principal.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;

        var tid = principal.FindFirst("tid")?.Value
                  ?? principal.FindFirst("http://schemas.microsoft.com/identity/claims/tenantid")?.Value;

        var email = principal.FindFirst("preferred_username")?.Value
                    ?? principal.FindFirst(ClaimTypes.Email)?.Value
                    ?? principal.FindFirst("upn")?.Value;

        var name = principal.FindFirst("name")?.Value
                   ?? principal.FindFirst(ClaimTypes.Name)?.Value;

        // Security check: oid claim is mandatory for Entra identity mapping
        if (string.IsNullOrWhiteSpace(oid))
        {
            return new EntraValidationResult
            {
                IsValid = false,
                ErrorMessage = "Cryptographically verified token is missing the required immutable user identifier ('oid')."
            };
        }

        // Security check: tid claim is mandatory for Entra identity mapping
        if (string.IsNullOrWhiteSpace(tid))
        {
            return new EntraValidationResult
            {
                IsValid = false,
                ErrorMessage = "Cryptographically verified token is missing the required tenant identifier ('tid')."
            };
        }

        // Security check: verify tenant matches expected tenant if configured
        if (!string.IsNullOrWhiteSpace(expectedTenantId) && 
            !string.Equals(tid, expectedTenantId, StringComparison.OrdinalIgnoreCase))
        {
            return new EntraValidationResult
            {
                IsValid = false,
                ErrorMessage = "Access Denied: Microsoft account belongs to an unauthorized tenant."
            };
        }

        return new EntraValidationResult
        {
            IsValid = true,
            IsCryptographicallyVerified = true,
            ObjectId = oid,
            TenantId = tid,
            Email = email,
            FullName = name,
            Subject = jwt.Subject
        };
    }
}
