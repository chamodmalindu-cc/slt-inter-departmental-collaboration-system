namespace SltCommunicationSystem.Api.Models.Entities;

public class ProjectHandover
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid SupervisorUserId { get; set; }
    public string FinalSummary { get; set; } = string.Empty;
    public string DeliverablesCompleted { get; set; } = string.Empty;
    public string? TechnicalDocumentationLinks { get; set; }
    public string? DeploymentDetails { get; set; }
    public string? KnownLimitations { get; set; }
    public string? Recommendations { get; set; }
    public DateTime HandoverDate { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public bool IsFinalized { get; set; } = false;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User SupervisorUser { get; set; } = null!;
}
