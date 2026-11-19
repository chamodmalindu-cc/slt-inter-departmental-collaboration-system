namespace SltCommunicationSystem.Api.Models.DTOs;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalProjects { get; set; }
    public int TotalDepartments { get; set; }
    public int TotalAuditLogs { get; set; }
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
    public List<SystemMetricDto> Metrics { get; set; } = new();
}

public class DgmDashboardDto
{
    public int PendingProposalsCount { get; set; }
    public int ApprovedProjectsCount { get; set; }
    public int OngoingProjectsCount { get; set; }
    public int TotalSupervisorsCount { get; set; }
    public List<ProjectSummaryDto> PendingProposals { get; set; } = new();
    public List<ProjectSummaryDto> ActiveProjects { get; set; } = new();
}

public class HigherManagementDashboardDto
{
    public int TotalProjects { get; set; }
    public double ProjectCompletionRate { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
    public List<DepartmentPerformanceDto> DepartmentStats { get; set; } = new();
    public List<SupervisorPerformanceDto> SupervisorPerformance { get; set; } = new();
}

public class DigitalLabDashboardDto
{
    public int AssignedProjectsCount { get; set; }
    public int PendingAcceptanceCount { get; set; }
    public int OngoingWorkCount { get; set; }
    public int CompletedProjectsCount { get; set; }
    public List<ProjectSummaryDto> AssignedProjects { get; set; } = new();
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

public class NonDigitalLabDashboardDto
{
    public int SubmittedProposalsCount { get; set; }
    public int ApprovedCount { get; set; }
    public int UnderReviewCount { get; set; }
    public int OngoingCount { get; set; }
    public List<ProjectSummaryDto> MyProposals { get; set; } = new();
    public List<RecentActivityDto> ProjectUpdates { get; set; } = new();
}

public class ProjectSummaryDto
{
    public Guid Id { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? SupervisorName { get; set; }
    public int ProgressPercentage { get; set; }
}

public class RecentActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Type { get; set; } = "info"; // info, success, warning
}

public class SystemMetricDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Change { get; set; } = string.Empty;
    public bool IsPositive { get; set; }
}

public class DepartmentPerformanceDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int TotalProjects { get; set; }
    public int Completed { get; set; }
    public double SatisfactionRating { get; set; }
}

public class SupervisorPerformanceDto
{
    public string SupervisorName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int ActiveProjects { get; set; }
    public int DeliveredProjects { get; set; }
    public double AverageRating { get; set; }
}
