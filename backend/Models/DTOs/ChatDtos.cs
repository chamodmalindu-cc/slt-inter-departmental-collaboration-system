using System.ComponentModel.DataAnnotations;

namespace SltCommunicationSystem.Api.Models.DTOs;

public class ChatRoomSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RoomType { get; set; } = "ProjectGroup";
    public Guid? ProjectId { get; set; }
    public string? ProjectCode { get; set; }
    public string? ProjectTitle { get; set; }
    public string? DepartmentName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int UnreadCount { get; set; }
    public ChatMessageDto? LastMessage { get; set; }
    public List<ChatParticipantDto> Participants { get; set; } = new();
}

public class ChatParticipantDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public bool IsOnline { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; set; }
}

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public Guid ChatRoomId { get; set; }
    public Guid SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderUsername { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string SenderDepartment { get; set; } = string.Empty;
    public string MessageContent { get; set; } = string.Empty;
    public string MessageType { get; set; } = "Text"; // Text, System, Attachment
    public DateTime SentAt { get; set; }
    public bool IsMine { get; set; }
    public Guid? AttachmentId { get; set; }
    public ChatAttachmentDto? Attachment { get; set; }
}

public class ChatAttachmentDto
{
    public Guid Id { get; set; }
    public Guid ChatRoomId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string UploadedByUserName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public string DownloadUrl { get; set; } = string.Empty;
    public string? ViewUrl { get; set; }
    public bool CanViewInline { get; set; }
}

public class SendMessageRequest
{
    [Required(ErrorMessage = "Message content is required.")]
    [StringLength(2000, MinimumLength = 1, ErrorMessage = "Message must be between 1 and 2000 characters.")]
    public string Content { get; set; } = string.Empty;
}

public class CreateSystemMessageRequest
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}
