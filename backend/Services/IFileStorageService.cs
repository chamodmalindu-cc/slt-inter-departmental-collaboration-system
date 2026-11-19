using Microsoft.AspNetCore.Http;

namespace SltCommunicationSystem.Api.Services;

public interface IFileStorageService
{
    long MaxFileSizeBytes { get; }
    IReadOnlySet<string> AllowedExtensions { get; }
    (bool IsValid, string? ErrorMessage) ValidateFile(IFormFile? file);
    Task<(string storedFileName, string storagePath, string contentType, long fileSize, string fileExtension)> SaveFileAsync(IFormFile file);
    string GetFilePath(string storedFileName);
    bool DeleteFile(string storedFileName);
    bool CanViewInline(string fileExtension);
    string GetContentType(string fileExtension);
}
