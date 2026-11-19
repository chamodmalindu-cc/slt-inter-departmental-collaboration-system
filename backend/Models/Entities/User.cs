namespace SltCommunicationSystem.Api.Models.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DepartmentId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public bool IsDemoAccount { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public string? EntraObjectId { get; set; }
    public string? EntraTenantId { get; set; }
    public DateTime? LastEntraLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Department Department { get; set; } = null!;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<Project> CreatedProjects { get; set; } = new List<Project>();
    public ICollection<ProjectAssignment> ProjectAssignments { get; set; } = new List<ProjectAssignment>();
    public ICollection<ProjectStatusHistory> StatusChanges { get; set; } = new List<ProjectStatusHistory>();
    public ICollection<ChatParticipant> ChatParticipants { get; set; } = new List<ChatParticipant>();
    public ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Rating> GivenRatings { get; set; } = new List<Rating>();
    public ICollection<Rating> ReceivedRatings { get; set; } = new List<Rating>(); // as supervisor
    public ICollection<ProjectProgressUpdate> ProgressUpdates { get; set; } = new List<ProjectProgressUpdate>();
    public ICollection<ProjectHandover> ProjectHandovers { get; set; } = new List<ProjectHandover>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<ChatAttachment> UploadedAttachments { get; set; } = new List<ChatAttachment>();
}
