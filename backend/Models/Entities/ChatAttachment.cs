namespace SltCommunicationSystem.Api.Models.Entities;

public class ChatAttachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChatRoomId { get; set; }
    public Guid UploadedByUserId { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;    // UUID.ext on disk
    public string FileExtension { get; set; } = string.Empty;     // .pdf, .docx, etc.
    public string ContentType { get; set; } = string.Empty;       // MIME type
    public long FileSize { get; set; }                             // bytes
    public string StoragePath { get; set; } = string.Empty;       // absolute path on server (never sent to client)

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ChatRoom ChatRoom { get; set; } = null!;
    public User UploadedByUser { get; set; } = null!;
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
