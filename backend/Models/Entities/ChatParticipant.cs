namespace SltCommunicationSystem.Api.Models.Entities;

public class ChatParticipant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChatRoomId { get; set; }
    public Guid UserId { get; set; }
    public bool IsAdmin { get; set; } = false;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReadAt { get; set; }

    // Navigation properties
    public ChatRoom ChatRoom { get; set; } = null!;
    public User User { get; set; } = null!;
}
