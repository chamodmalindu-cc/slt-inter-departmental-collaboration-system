namespace SltCommunicationSystem.Api.Models.Entities;

public class ProjectProgressUpdate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid SupervisorUserId { get; set; }
    public string UpdateType { get; set; } = "Progress"; // "Progress" | "Milestone" | "Issue"
    public string Description { get; set; } = string.Empty;
    public string? CompletedActivities { get; set; }
    public string? CurrentChallenges { get; set; }
    public string? NextPlannedActivities { get; set; }
    public string? MilestoneTitle { get; set; }
    public DateTime? MilestoneDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User SupervisorUser { get; set; } = null!;
}
