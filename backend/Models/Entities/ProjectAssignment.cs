namespace SltCommunicationSystem.Api.Models.Entities;

public class ProjectAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public string AssignmentRole { get; set; } = "Supervisor"; // e.g. "Supervisor", "Member"
    public string Status { get; set; } = "PENDING_ACCEPTANCE"; // PENDING_ACCEPTANCE, ACCEPTED, DECLINED, CANCELLED
    public string? Instructions { get; set; }
    public string? DeclineReason { get; set; }
    public DateTime? AssignedDeadline { get; set; }
    public Guid? AssignedByUserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
    public User? AssignedByUser { get; set; }
}
