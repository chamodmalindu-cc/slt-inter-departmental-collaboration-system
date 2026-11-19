using Npgsql;

namespace SltCommunicationSystem.Api.Configuration;

public static class DatabaseConfig
{
    public static string GetPostgreSqlConnectionString(IConfiguration configuration)
    {
        // 1. Try environment variables first (Preferred for security)
        var host = Environment.GetEnvironmentVariable("DB_HOST") 
                   ?? configuration["Database:Host"] 
                   ?? "localhost";

        var portStr = Environment.GetEnvironmentVariable("DB_PORT") 
                      ?? configuration["Database:Port"] 
                      ?? "5432";

        var database = Environment.GetEnvironmentVariable("DB_NAME") 
                       ?? configuration["Database:Name"] 
                       ?? "slt_collab_db";

        var user = Environment.GetEnvironmentVariable("DB_USER") 
                   ?? configuration["Database:User"] 
                   ?? "postgres";

        var password = Environment.GetEnvironmentVariable("DB_PASSWORD") 
                       ?? configuration["Database:Password"] 
                       ?? string.Empty;

        int.TryParse(portStr, out var port);
        if (port <= 0) port = 5432;

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = database,
            Username = user,
            Password = password,
            Pooling = true,
            Timeout = 15,
            CommandTimeout = 30
        };

        return builder.ConnectionString;
    }

    public static object GetDatabaseSanitizedMetadata(IConfiguration configuration)
    {
        var host = Environment.GetEnvironmentVariable("DB_HOST") 
                   ?? configuration["Database:Host"] 
                   ?? "localhost";

        var portStr = Environment.GetEnvironmentVariable("DB_PORT") 
                      ?? configuration["Database:Port"] 
                      ?? "5432";

        var database = Environment.GetEnvironmentVariable("DB_NAME") 
                       ?? configuration["Database:Name"] 
                       ?? "slt_collab_db";

        var password = Environment.GetEnvironmentVariable("DB_PASSWORD") 
                       ?? configuration["Database:Password"];

        return new
        {
            Configured = !string.IsNullOrEmpty(password) || !string.IsNullOrEmpty(host),
            Host = host,
            Port = portStr,
            Database = database
        };
    }
}
