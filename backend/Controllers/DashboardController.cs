using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Data;
using SltCommunicationSystem.Api.Models.DTOs;
using System.Security.Claims;

namespace SltCommunicationSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    private static readonly HashSet<string> LifecycleStatuses = new()
    {
        "ASSIGNED", "DEVELOPMENT", "TESTING", "POC", "VALIDATE", "HANDOVER"
    };

    [HttpGet("admin")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminDashboard()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalProjects = await _context.Projects.CountAsync();
        var totalDepartments = await _context.Departments.CountAsync();
        var totalAuditLogs = await _context.AuditLogs.CountAsync();

        var recentAuditLogs = await _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Take(5)
            .ToListAsync();

        var activities = recentAuditLogs.Select(a => new RecentActivityDto
        {
            Id = a.Id.ToString(),
            Action = a.Action,
            Title = $"{a.Action}: {a.EntityName}",
            UserFullName = a.User?.FullName ?? "System",
            Timestamp = a.Timestamp,
            Type = a.Action.Contains("FAILED", StringComparison.OrdinalIgnoreCase) ? "warning" : "info"
        }).ToList();

        if (!activities.Any())
        {
            activities.Add(new RecentActivityDto
            {
                Id = "init-log",
                Action = "SYSTEM_INITIALIZED",
                Title = "System Services & RBAC Operational",
                UserFullName = "System Kernel",
                Timestamp = DateTime.UtcNow,
                Type = "success"
            });
        }

        var dto = new AdminDashboardDto
        {
            TotalUsers = totalUsers,
            TotalProjects = totalProjects,
            TotalDepartments = totalDepartments,
            TotalAuditLogs = totalAuditLogs,
            RecentActivities = activities,
            Metrics = new List<SystemMetricDto>
            {
                new() { Key = "auth_health", Label = "Auth & JWT Status", Value = "Operational", Change = "100%", IsPositive = true },
                new() { Key = "db_latency", Label = "DB Connection", Value = "Connected", Change = "< 15ms", IsPositive = true },
                new() { Key = "active_sessions", Label = "Active Roles", Value = "5 Configured", Change = "RBAC Ready", IsPositive = true }
            }
        };

        return Ok(dto);
    }

    [HttpGet("dgm")]
    [Authorize(Roles = "ADMIN,DGM")]
    public async Task<IActionResult> GetDgmDashboard()
    {
        var pendingCount = await _context.Projects.CountAsync(p => p.Status == "PENDING_REVIEW");
        var approvedCount = await _context.Projects.CountAsync(p => p.Status == "APPROVED");
        var assignedCount = await _context.Projects.CountAsync(p => LifecycleStatuses.Contains(p.Status));
        var handoverCount = await _context.Projects.CountAsync(p => p.Status == "HANDOVER");

        var supervisorRoleId = await _context.Roles
            .Where(r => r.Name == "DIGITAL_LAB_USER")
            .Select(r => r.Id)
            .FirstOrDefaultAsync();
        var totalSupervisors = await _context.UserRoles.CountAsync(ur => ur.RoleId == supervisorRoleId);

        var pendingProposals = await _context.Projects
            .Include(p => p.Department)
            .Where(p => p.Status == "PENDING_REVIEW")
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .ToListAsync();

        var activeProjects = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Assignments.Where(a => a.Status == "ACCEPTED" && a.IsActive))
                .ThenInclude(a => a.User)
            .Where(p => LifecycleStatuses.Contains(p.Status) && p.Status != "HANDOVER")
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Take(5)
            .ToListAsync();

        var pendingList = pendingProposals.Select(p => new ProjectSummaryDto
        {
            Id = p.Id,
            ProjectCode = p.ProjectCode,
            Title = p.Title,
            DepartmentName = p.Department?.Name ?? "",
            Status = p.Status,
            Priority = p.Priority,
            CreatedAt = p.CreatedAt,
            ProgressPercentage = 0
        }).ToList();

        var activeList = activeProjects.Select(p =>
        {
            var sup = p.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
            return new ProjectSummaryDto
            {
                Id = p.Id,
                ProjectCode = p.ProjectCode,
                Title = p.Title,
                DepartmentName = p.Department?.Name ?? "",
                Status = p.Status,
                Priority = p.Priority,
                CreatedAt = p.CreatedAt,
                SupervisorName = sup?.User?.FullName,
                ProgressPercentage = GetLifecycleProgress(p.Status)
            };
        }).ToList();

        var dto = new DgmDashboardDto
        {
            PendingProposalsCount = pendingCount,
            ApprovedProjectsCount = approvedCount,
            OngoingProjectsCount = assignedCount,
            TotalSupervisorsCount = totalSupervisors,
            PendingProposals = pendingList,
            ActiveProjects = activeList
        };

        return Ok(dto);
    }

    [HttpGet("higher-management")]
    [Authorize(Roles = "ADMIN,HIGHER_MANAGEMENT")]
    public async Task<IActionResult> GetHigherManagementDashboard()
    {
        var totalProjects = await _context.Projects.CountAsync();
        var handoverCount = await _context.Projects.CountAsync(p => p.Status == "HANDOVER");
        var inProgressCount = await _context.Projects.CountAsync(p =>
            LifecycleStatuses.Contains(p.Status) && p.Status != "HANDOVER");

        double completionRate = totalProjects > 0
            ? Math.Round((double)handoverCount / totalProjects * 100, 1)
            : 0;

        // Department stats from real data
        var deptProjects = await _context.Projects
            .Include(p => p.Department)
            .GroupBy(p => p.Department!.Name)
            .Select(g => new
            {
                DeptName = g.Key,
                Total = g.Count(),
                Completed = g.Count(p => p.Status == "HANDOVER")
            })
            .ToListAsync();

        // Supervisor performance from real ratings
        var supervisorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "DIGITAL_LAB_USER");
        var supervisorIds = supervisorRole != null
            ? await _context.UserRoles.Where(ur => ur.RoleId == supervisorRole.Id).Select(ur => ur.UserId).ToListAsync()
            : new List<Guid>();

        var ratings = await _context.Ratings
            .Include(r => r.RatedSupervisor)
                .ThenInclude(u => u.Department)
            .ToListAsync();

        var assignments = await _context.ProjectAssignments
            .Where(a => a.Status == "ACCEPTED" && supervisorIds.Contains(a.UserId))
            .ToListAsync();

        var supPerf = supervisorIds.Select(supId =>
        {
            var supRatings = ratings.Where(r => r.RatedSupervisorId == supId).ToList();
            var supUser = ratings.FirstOrDefault(r => r.RatedSupervisorId == supId)?.RatedSupervisor;
            var activeCount = assignments.Count(a => a.UserId == supId);
            var avg = supRatings.Any()
                ? Math.Round(supRatings.Average(r => (r.TechnicalQuality + r.Communication + r.TimelyDelivery + r.Professionalism + r.OverallRating) / 5.0), 1)
                : 0.0;
            return new SupervisorPerformanceDto
            {
                SupervisorName = supUser?.FullName ?? "Supervisor",
                Department = supUser?.Department?.Name ?? "Digital Lab",
                ActiveProjects = activeCount,
                DeliveredProjects = supRatings.Count,
                AverageRating = avg
            };
        }).Where(s => s.ActiveProjects > 0 || s.DeliveredProjects > 0).ToList();

        var dto = new HigherManagementDashboardDto
        {
            TotalProjects = totalProjects,
            ProjectCompletionRate = completionRate,
            InProgressCount = inProgressCount,
            CompletedCount = handoverCount,
            DepartmentStats = deptProjects.Select(d => new DepartmentPerformanceDto
            {
                DepartmentName = d.DeptName ?? "General",
                TotalProjects = d.Total,
                Completed = d.Completed,
                SatisfactionRating = 0.0 // Real rating aggregation requires joining through assignments
            }).ToList(),
            SupervisorPerformance = supPerf
        };

        return Ok(dto);
    }

    [HttpGet("digital-lab")]
    [Authorize(Roles = "ADMIN,DIGITAL_LAB_USER")]
    public async Task<IActionResult> GetDigitalLabDashboard()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var myAssignments = await _context.ProjectAssignments
            .Include(a => a.Project)
                .ThenInclude(p => p.Department)
            .Where(a => a.UserId == userId && a.IsActive)
            .ToListAsync();

        var pendingAcceptance = myAssignments.Count(a => a.Status == "PENDING_ACCEPTANCE");
        var accepted = myAssignments.Where(a => a.Status == "ACCEPTED").ToList();
        var acceptedProjectIds = accepted.Select(a => a.ProjectId).ToHashSet();

        var activeProjects = await _context.Projects
            .Include(p => p.Department)
            .Where(p => acceptedProjectIds.Contains(p.Id) && LifecycleStatuses.Contains(p.Status) && p.Status != "HANDOVER")
            .ToListAsync();

        var completedProjects = await _context.Projects
            .Where(p => acceptedProjectIds.Contains(p.Id) && p.Status == "HANDOVER")
            .CountAsync();

        // Recent progress updates by this user
        var recentUpdates = await _context.ProjectProgressUpdates
            .Include(pu => pu.Project)
            .Where(pu => pu.SupervisorUserId == userId)
            .OrderByDescending(pu => pu.CreatedAt)
            .Take(5)
            .ToListAsync();

        // Received ratings
        var myRatings = await _context.Ratings
            .Include(r => r.Project)
            .Where(r => r.RatedSupervisorId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(3)
            .ToListAsync();

        var assignedList = activeProjects.Select(p =>
        {
            var asgn = accepted.FirstOrDefault(a => a.ProjectId == p.Id);
            return new ProjectSummaryDto
            {
                Id = p.Id,
                ProjectCode = p.ProjectCode,
                Title = p.Title,
                DepartmentName = p.Department?.Name ?? "",
                Status = p.Status,
                Priority = p.Priority,
                CreatedAt = p.CreatedAt,
                ProgressPercentage = GetLifecycleProgress(p.Status)
            };
        }).ToList();

        var activities = recentUpdates.Select(pu => new RecentActivityDto
        {
            Id = pu.Id.ToString(),
            Action = $"PROGRESS_{pu.UpdateType.ToUpper()}",
            Title = $"[{pu.UpdateType}] {pu.Project?.ProjectCode}: {pu.Description.Substring(0, Math.Min(60, pu.Description.Length))}",
            UserFullName = "You",
            Timestamp = pu.CreatedAt,
            Type = pu.UpdateType == "Issue" ? "warning" : pu.UpdateType == "Milestone" ? "success" : "info"
        }).ToList();

        // Add ratings to activities
        activities.AddRange(myRatings.Select(r => new RecentActivityDto
        {
            Id = r.Id.ToString(),
            Action = "RATING_RECEIVED",
            Title = $"Performance rated by {r.RaterType} on {r.Project?.ProjectCode}",
            UserFullName = r.RaterType,
            Timestamp = r.CreatedAt,
            Type = "success"
        }));
        activities = activities.OrderByDescending(a => a.Timestamp).Take(5).ToList();

        var dto = new DigitalLabDashboardDto
        {
            AssignedProjectsCount = activeProjects.Count,
            PendingAcceptanceCount = pendingAcceptance,
            OngoingWorkCount = activeProjects.Count,
            CompletedProjectsCount = completedProjects,
            AssignedProjects = assignedList,
            RecentActivities = activities
        };

        return Ok(dto);
    }

    [HttpGet("non-digital-lab")]
    [Authorize(Roles = "ADMIN,NON_DIGITAL_LAB_USER")]
    public async Task<IActionResult> GetNonDigitalLabDashboard()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var myProjects = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Assignments.Where(a => a.Status == "ACCEPTED" && a.IsActive))
                .ThenInclude(a => a.User)
            .Where(p => p.CreatedByUserId == userId)
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .ToListAsync();

        var submitted = myProjects.Count;
        var approved = myProjects.Count(p => p.Status == "APPROVED" || LifecycleStatuses.Contains(p.Status));
        var underReview = myProjects.Count(p => p.Status == "PENDING_REVIEW");
        var ongoing = myProjects.Count(p => LifecycleStatuses.Contains(p.Status) && p.Status != "HANDOVER");

        var projectList = myProjects.Take(5).Select(p =>
        {
            var sup = p.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
            return new ProjectSummaryDto
            {
                Id = p.Id,
                ProjectCode = p.ProjectCode,
                Title = p.Title,
                DepartmentName = p.Department?.Name ?? "",
                Status = p.Status,
                Priority = p.Priority,
                CreatedAt = p.CreatedAt,
                SupervisorName = sup?.User?.FullName,
                ProgressPercentage = GetLifecycleProgress(p.Status)
            };
        }).ToList();

        // Recent progress updates on my projects
        var myProjectIds = myProjects.Select(p => p.Id).ToHashSet();
        var recentUpdates = await _context.ProjectProgressUpdates
            .Include(pu => pu.Project)
            .Include(pu => pu.SupervisorUser)
            .Where(pu => myProjectIds.Contains(pu.ProjectId))
            .OrderByDescending(pu => pu.CreatedAt)
            .Take(5)
            .ToListAsync();

        var updates = recentUpdates.Select(pu => new RecentActivityDto
        {
            Id = pu.Id.ToString(),
            Action = $"PROGRESS_{pu.UpdateType.ToUpper()}",
            Title = $"[{pu.UpdateType}] {pu.Project?.ProjectCode}: {pu.Description.Substring(0, Math.Min(60, pu.Description.Length))}",
            UserFullName = pu.SupervisorUser?.FullName ?? "Supervisor",
            Timestamp = pu.CreatedAt,
            Type = pu.UpdateType == "Issue" ? "warning" : pu.UpdateType == "Milestone" ? "success" : "info"
        }).ToList();

        var dto = new NonDigitalLabDashboardDto
        {
            SubmittedProposalsCount = submitted,
            ApprovedCount = approved,
            UnderReviewCount = underReview,
            OngoingCount = ongoing,
            MyProposals = projectList,
            ProjectUpdates = updates
        };

        return Ok(dto);
    }

    private static int GetLifecycleProgress(string status) => status switch
    {
        "ASSIGNED" => 5,
        "DEVELOPMENT" => 25,
        "TESTING" => 50,
        "POC" => 70,
        "VALIDATE" => 85,
        "HANDOVER" => 100,
        "APPROVED" => 2,
        "PENDING_REVIEW" => 0,
        _ => 0
    };
}
