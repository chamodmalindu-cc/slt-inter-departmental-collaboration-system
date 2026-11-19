using Microsoft.AspNetCore.Http;

namespace SltCommunicationSystem.Api.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _storageDirectory;
    private readonly ILogger<FileStorageService> _logger;

    public long MaxFileSizeBytes => 10 * 1024 * 1024; // 10 MB

    public IReadOnlySet<string> AllowedExtensions { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".txt",
        ".csv",
        ".jpg",
        ".jpeg",
        ".png"
    };

    private static readonly HashSet<string> BlockedExecutableExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".bat", ".cmd", ".ps1", ".sh", ".bash", ".php", ".phtml",
        ".js", ".mjs", ".html", ".htm", ".aspx", ".asp", ".py", ".rb",
        ".vbs", ".dll", ".so", ".bin", ".msi", ".jar", ".com", ".scr"
    };

    public FileStorageService(IWebHostEnvironment environment, ILogger<FileStorageService> logger)
    {
        _logger = logger;
        // Store uploads in "backend/uploads" (outside web root / wwwroot)
        _storageDirectory = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(_storageDirectory))
        {
            Directory.CreateDirectory(_storageDirectory);
            _logger.LogInformation("Created attachments upload directory at {StorageDirectory}", _storageDirectory);
        }
    }

    public (bool IsValid, string? ErrorMessage) ValidateFile(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return (false, "File is empty or no file was uploaded.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return (false, $"File size ({file.Length / (1024 * 1024):F1} MB) exceeds the maximum allowed size of 10 MB.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext))
        {
            return (false, "Files without a file extension are not supported.");
        }

        if (BlockedExecutableExtensions.Contains(ext))
        {
            return (false, $"File type '{ext}' is prohibited for security reasons.");
        }

        if (!AllowedExtensions.Contains(ext))
        {
            return (false, $"File type '{ext}' is not supported. Supported types: PDF, Word, Excel, PowerPoint, Text, CSV, and Images (JPG, PNG).");
        }

        // Verify magic bytes for common formats if file has sufficient length
        try
        {
            using var stream = file.OpenReadStream();
            var header = new byte[8];
            var bytesRead = stream.Read(header, 0, header.Length);

            if (bytesRead >= 4)
            {
                // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
                if (ext == ".pdf" && (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46))
                {
                    return (false, "File signature does not match a valid PDF document.");
                }

                // PNG: 0x89 0x50 0x4E 0x47
                if (ext == ".png" && (header[0] != 0x89 || header[1] != 0x50 || header[2] != 0x4E || header[3] != 0x47))
                {
                    return (false, "File signature does not match a valid PNG image.");
                }

                // JPEG: 0xFF 0xD8 0xFF
                if ((ext == ".jpg" || ext == ".jpeg") && (header[0] != 0xFF || header[1] != 0xD8 || header[2] != 0xFF))
                {
                    return (false, "File signature does not match a valid JPEG image.");
                }

                // Office Open XML (DOCX, XLSX, PPTX) are ZIP containers: 0x50 0x4B 0x03 0x04 or 0x50 0x4B 0x05 0x06
                if ((ext == ".docx" || ext == ".xlsx" || ext == ".pptx") && (header[0] != 0x50 || header[1] != 0x4B))
                {
                    return (false, $"File signature does not match a valid {ext.ToUpperInvariant()} document.");
                }

                // Legacy Office (DOC, XLS, PPT) OLE Compound File: 0xD0 0xCF 0x11 0xE0
                if ((ext == ".doc" || ext == ".xls" || ext == ".ppt") && (header[0] != 0xD0 || header[1] != 0xCF || header[2] != 0x11 || header[3] != 0xE0))
                {
                    return (false, $"File signature does not match a valid legacy {ext.ToUpperInvariant()} document.");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to inspect file header for {FileName}", file.FileName);
        }

        return (true, null);
    }

    public async Task<(string storedFileName, string storagePath, string contentType, long fileSize, string fileExtension)> SaveFileAsync(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeId = Guid.NewGuid().ToString("N");
        var storedFileName = $"{safeId}{ext}";
        var storagePath = Path.Combine(_storageDirectory, storedFileName);

        using (var stream = new FileStream(storagePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream);
        }

        var contentType = GetContentType(ext);
        _logger.LogInformation("Saved attachment {OriginalFileName} as {StoredFileName} ({FileSize} bytes)",
            file.FileName, storedFileName, file.Length);

        return (storedFileName, storagePath, contentType, file.Length, ext);
    }

    public string GetFilePath(string storedFileName)
    {
        // Enforce path traversal protection: strip any path characters
        var safeFileName = Path.GetFileName(storedFileName);
        var fullPath = Path.GetFullPath(Path.Combine(_storageDirectory, safeFileName));

        // Ensure the path is strictly within _storageDirectory
        var normalizedStorageDir = Path.GetFullPath(_storageDirectory) + Path.DirectorySeparatorChar;
        if (!fullPath.StartsWith(normalizedStorageDir, StringComparison.OrdinalIgnoreCase) &&
            !fullPath.Equals(Path.GetFullPath(_storageDirectory), StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Path traversal detected.");
        }

        return fullPath;
    }

    public bool DeleteFile(string storedFileName)
    {
        try
        {
            var path = GetFilePath(storedFileName);
            if (File.Exists(path))
            {
                File.Delete(path);
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting stored file {StoredFileName}", storedFileName);
        }
        return false;
    }

    public bool CanViewInline(string fileExtension)
    {
        var ext = fileExtension.ToLowerInvariant();
        return ext is ".pdf" or ".jpg" or ".jpeg" or ".png";
    }

    public string GetContentType(string fileExtension)
    {
        return fileExtension.ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt" => "text/plain; charset=utf-8",
            ".csv" => "text/csv; charset=utf-8",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => "application/octet-stream"
        };
    }
}
