namespace SltCommunicationSystem.Api.Models.Entities;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProjectCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string BusinessProblem { get; set; } = string.Empty;
    public string ExpectedOutcome { get; set; } = string.Empty;
    public bool ImpactCostSaving { get; set; } = false;
    public bool ImpactRevenue { get; set; } = false;
    public bool ImpactProcessOptimization { get; set; } = false;
    public string? QuantifiedImpact { get; set; }
    public string? AdditionalInformation { get; set; }
    public string Status { get; set; } = "PENDING_REVIEW";
    public string Priority { get; set; } = "Medium";
    public Guid DepartmentId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime? TargetEndDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Evaluation & Review Fields
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewRemarks { get; set; }
    public string? RejectionReason { get; set; }

    // Navigation properties
    public Department Department { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? ReviewedByUser { get; set; }
    public ICollection<ProjectAssignment> Assignments { get; set; } = new List<ProjectAssignment>();
    public ICollection<ProjectStatusHistory> StatusHistory { get; set; } = new List<ProjectStatusHistory>();
    public ICollection<ChatRoom> ChatRooms { get; set; } = new List<ChatRoom>();
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public ICollection<ProjectProgressUpdate> ProgressUpdates { get; set; } = new List<ProjectProgressUpdate>();
    public ProjectHandover? Handover { get; set; }
}
