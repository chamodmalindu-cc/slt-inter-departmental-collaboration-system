namespace SltCommunicationSystem.Api.Models.DTOs;

// ─── Project Lifecycle DTOs ──────────────────────────────────────────────────

public class ProjectDetailDto
{
    public Guid Id { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string BusinessProblem { get; set; } = string.Empty;
    public string ExpectedOutcome { get; set; } = string.Empty;
    public bool ImpactCostSaving { get; set; }
    public bool ImpactRevenue { get; set; }
    public bool ImpactProcessOptimization { get; set; }
    public string? QuantifiedImpact { get; set; }
    public string? AdditionalInformation { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public string? SupervisorName { get; set; }
    public string? SupervisorEmail { get; set; }
    public Guid? SupervisorUserId { get; set; }
    public DateTime? TargetEndDate { get; set; }
    public DateTime? AssignedDeadline { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? ReviewRemarks { get; set; }
    public string? RejectionReason { get; set; }
    public string? ReviewedByUserName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? AssignmentId { get; set; }
    public List<ProjectStatusHistoryItemDto> StatusHistory { get; set; } = new();
    public List<ProjectProgressUpdateDto> ProgressUpdates { get; set; } = new();
    public ProjectHandoverDto? Handover { get; set; }
    public List<RatingDto> Ratings { get; set; } = new();
    public bool CanUpdateStatus { get; set; }
    public bool CanAddProgress { get; set; }
    public bool CanSubmitHandover { get; set; }
    public bool CanRate { get; set; }
    public bool HasRated { get; set; }
}

public class ProjectListItemDto
{
    public Guid Id { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string? SupervisorName { get; set; }
    public DateTime? TargetEndDate { get; set; }
    public DateTime? AssignedDeadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsOverdue { get; set; }
}

public class ProjectStatusHistoryItemDto
{
    public Guid Id { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}

public class UpdateProjectStatusRequest
{
    public string NewStatus { get; set; } = string.Empty;
    public string? Comments { get; set; }
}

// ─── Progress Update DTOs ────────────────────────────────────────────────────

public class ProjectProgressUpdateDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public string UpdateType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CompletedActivities { get; set; }
    public string? CurrentChallenges { get; set; }
    public string? NextPlannedActivities { get; set; }
    public string? MilestoneTitle { get; set; }
    public DateTime? MilestoneDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateProgressUpdateRequest
{
    public string UpdateType { get; set; } = "Progress";
    public string Description { get; set; } = string.Empty;
    public string? CompletedActivities { get; set; }
    public string? CurrentChallenges { get; set; }
    public string? NextPlannedActivities { get; set; }
    public string? MilestoneTitle { get; set; }
    public DateTime? MilestoneDate { get; set; }
}

// ─── Handover DTOs ───────────────────────────────────────────────────────────

public class ProjectHandoverDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string SupervisorName { get; set; } = string.Empty;
    public string FinalSummary { get; set; } = string.Empty;
    public string DeliverablesCompleted { get; set; } = string.Empty;
    public string? TechnicalDocumentationLinks { get; set; }
    public string? DeploymentDetails { get; set; }
    public string? KnownLimitations { get; set; }
    public string? Recommendations { get; set; }
    public DateTime HandoverDate { get; set; }
    public DateTime SubmittedAt { get; set; }
    public bool IsFinalized { get; set; }
}

public class SubmitHandoverRequest
{
    public string FinalSummary { get; set; } = string.Empty;
    public string DeliverablesCompleted { get; set; } = string.Empty;
    public string? TechnicalDocumentationLinks { get; set; }
    public string? DeploymentDetails { get; set; }
    public string? KnownLimitations { get; set; }
    public string? Recommendations { get; set; }
    public DateTime HandoverDate { get; set; }
}

// ─── Rating DTOs ─────────────────────────────────────────────────────────────

public class RatingDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string RaterType { get; set; } = string.Empty;
    public string RaterName { get; set; } = string.Empty;
    public string SupervisorName { get; set; } = string.Empty;
    public int TechnicalQuality { get; set; }
    public int Communication { get; set; }
    public int TimelyDelivery { get; set; }
    public int Professionalism { get; set; }
    public int OverallRating { get; set; }
    public double AverageScore { get; set; }
    public string? WrittenFeedback { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SubmitRatingRequest
{
    public int TechnicalQuality { get; set; }
    public int Communication { get; set; }
    public int TimelyDelivery { get; set; }
    public int Professionalism { get; set; }
    public int OverallRating { get; set; }
    public string? WrittenFeedback { get; set; }
}

// ─── Supervisor Performance ───────────────────────────────────────────────────

public class SupervisorPerformanceStatsDto
{
    public Guid SupervisorId { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int TotalProjects { get; set; }
    public int CompletedProjects { get; set; }
    public int ActiveProjects { get; set; }
    public double AverageTechnicalQuality { get; set; }
    public double AverageCommunication { get; set; }
    public double AverageTimelyDelivery { get; set; }
    public double AverageProfessionalism { get; set; }
    public double AverageOverallRating { get; set; }
    public int TotalRatings { get; set; }
}
