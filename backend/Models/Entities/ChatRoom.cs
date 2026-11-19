namespace SltCommunicationSystem.Api.Models.Entities;

public class ChatRoom
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string RoomType { get; set; } = "ProjectGroup"; // ProjectGroup, Departmental, Direct
    public Guid? ProjectId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Project? Project { get; set; }
    public ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    public ICollection<ChatAttachment> Attachments { get; set; } = new List<ChatAttachment>();
}
