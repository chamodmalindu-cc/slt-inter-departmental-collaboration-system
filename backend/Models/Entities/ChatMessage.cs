namespace SltCommunicationSystem.Api.Models.Entities;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChatRoomId { get; set; }
    public Guid SenderUserId { get; set; }
    public string MessageContent { get; set; } = string.Empty;
    public string MessageType { get; set; } = "Text"; // Text, System, Attachment
    public bool IsEdited { get; set; } = false;
    public DateTime? EditedAt { get; set; }
    public Guid? AttachmentId { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ChatRoom ChatRoom { get; set; } = null!;
    public User SenderUser { get; set; } = null!;
    public ChatAttachment? Attachment { get; set; }
}
