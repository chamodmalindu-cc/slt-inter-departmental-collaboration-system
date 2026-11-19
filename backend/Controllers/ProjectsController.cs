using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Data;
using SltCommunicationSystem.Api.Models.DTOs;
using SltCommunicationSystem.Api.Models.Entities;
using SltCommunicationSystem.Api.Services;
using System.Security.Claims;

namespace SltCommunicationSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IChatService _chatService;

    // Valid status transitions for lifecycle management
    private static readonly Dictionary<string, string> ValidTransitions = new()
    {
        ["ASSIGNED"]    = "DEVELOPMENT",
        ["DEVELOPMENT"] = "TESTING",
        ["TESTING"]     = "POC",
        ["POC"]         = "VALIDATE",
        ["VALIDATE"]    = "HANDOVER"
    };

    // Statuses that are part of the active lifecycle (assigned or beyond)
    private static readonly HashSet<string> LifecycleStatuses = new()
    {
        "ASSIGNED", "DEVELOPMENT", "TESTING", "POC", "VALIDATE", "HANDOVER"
    };

    public ProjectsController(AppDbContext context, IChatService chatService)
    {
        _context = context;
        _chatService = chatService;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentUserName => User.FindFirstValue(ClaimTypes.Name) ?? "";
    private List<string> CurrentUserRoles => User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

    // ─── GET /api/projects ────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetProjects([FromQuery] string? status = null)
    {
        var userId = CurrentUserId;
        var roles = CurrentUserRoles;

        var query = _context.Projects
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Assignments.Where(a => a.Status == "ACCEPTED" && a.IsActive))
                .ThenInclude(a => a.User)
            .AsQueryable();

        // Role-based filtering
        if (roles.Contains("DIGITAL_LAB_USER"))
        {
            // Show only projects where this user is the accepted supervisor
            var assignedProjectIds = await _context.ProjectAssignments
                .Where(a => a.UserId == userId && a.Status == "ACCEPTED" && a.IsActive)
                .Select(a => a.ProjectId)
                .ToListAsync();
            query = query.Where(p => assignedProjectIds.Contains(p.Id) && LifecycleStatuses.Contains(p.Status));
        }
        else if (roles.Contains("NON_DIGITAL_LAB_USER"))
        {
            // Show only projects created by this user
            query = query.Where(p => p.CreatedByUserId == userId);
        }
        else if (roles.Contains("DGM") || roles.Contains("ADMIN") || roles.Contains("HIGHER_MANAGEMENT"))
        {
            // Show all lifecycle projects + filter by status if requested
            if (string.IsNullOrEmpty(status))
                query = query.Where(p => LifecycleStatuses.Contains(p.Status));
        }

        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status.ToUpperInvariant());

        var projects = await query.OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt).ToListAsync();

        var result = projects.Select(p =>
        {
            var acceptedAssignment = p.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
            var deadline = acceptedAssignment?.AssignedDeadline ?? p.TargetEndDate;
            return new ProjectListItemDto
            {
                Id = p.Id,
                ProjectCode = p.ProjectCode,
                Title = p.Title,
                Status = p.Status,
                Priority = p.Priority,
                DepartmentName = p.Department?.Name ?? "",
                RequesterName = p.CreatedByUser?.FullName ?? "",
                SupervisorName = acceptedAssignment?.User?.FullName,
                TargetEndDate = p.TargetEndDate,
                AssignedDeadline = acceptedAssignment?.AssignedDeadline,
                CreatedAt = p.CreatedAt,
                IsOverdue = deadline.HasValue && deadline.Value < DateTime.UtcNow
                    && p.Status != "HANDOVER"
            };
        }).ToList();

        return Ok(result);
    }

    // ─── GET /api/projects/{id} ───────────────────────────────────────────────
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var userId = CurrentUserId;
        var roles = CurrentUserRoles;

        var project = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .Include(p => p.ReviewedByUser)
            .Include(p => p.Assignments)
                .ThenInclude(a => a.User)
            .Include(p => p.StatusHistory)
                .ThenInclude(h => h.ChangedByUser)
            .Include(p => p.ProgressUpdates)
                .ThenInclude(pu => pu.SupervisorUser)
            .Include(p => p.Handover)
                .ThenInclude(h => h!.SupervisorUser)
            .Include(p => p.Ratings)
                .ThenInclude(r => r.RatedByUser)
            .Include(p => p.Ratings)
                .ThenInclude(r => r.RatedSupervisor)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        // Access control
        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        var isSupervisor = acceptedAssignment?.UserId == userId;
        var isRequester = project.CreatedByUserId == userId;
        var isDgmOrAdmin = roles.Contains("DGM") || roles.Contains("ADMIN");
        var isHigherMgmt = roles.Contains("HIGHER_MANAGEMENT");

        if (!isSupervisor && !isRequester && !isDgmOrAdmin && !isHigherMgmt)
            return Forbid();

        var canUpdateStatus = isSupervisor && LifecycleStatuses.Contains(project.Status) && project.Status != "HANDOVER";
        var canAddProgress = isSupervisor && LifecycleStatuses.Contains(project.Status);
        var canSubmitHandover = isSupervisor && project.Status == "HANDOVER" && project.Handover == null;
        var hasRated = project.Ratings.Any(r => r.RatedByUserId == userId);
        var canRate = (isRequester || isDgmOrAdmin) && project.Status == "HANDOVER"
            && project.Handover != null && !hasRated && !isSupervisor;

        var dto = new ProjectDetailDto
        {
            Id = project.Id,
            ProjectCode = project.ProjectCode,
            Title = project.Title,
            Description = project.Description,
            BusinessProblem = project.BusinessProblem,
            ExpectedOutcome = project.ExpectedOutcome,
            ImpactCostSaving = project.ImpactCostSaving,
            ImpactRevenue = project.ImpactRevenue,
            ImpactProcessOptimization = project.ImpactProcessOptimization,
            QuantifiedImpact = project.QuantifiedImpact,
            AdditionalInformation = project.AdditionalInformation,
            Status = project.Status,
            Priority = project.Priority,
            DepartmentName = project.Department?.Name ?? "",
            DepartmentCode = project.Department?.Code ?? "",
            RequesterName = project.CreatedByUser?.FullName ?? "",
            RequesterEmail = project.CreatedByUser?.Email ?? "",
            SupervisorName = acceptedAssignment?.User?.FullName,
            SupervisorEmail = acceptedAssignment?.User?.Email,
            SupervisorUserId = acceptedAssignment?.UserId,
            TargetEndDate = project.TargetEndDate,
            AssignedDeadline = acceptedAssignment?.AssignedDeadline,
            StartDate = project.StartDate,
            ActualEndDate = project.ActualEndDate,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            ReviewRemarks = project.ReviewRemarks,
            RejectionReason = project.RejectionReason,
            ReviewedByUserName = project.ReviewedByUser?.FullName,
            ReviewedAt = project.ReviewedAt,
            AssignmentId = acceptedAssignment?.Id,
            CanUpdateStatus = canUpdateStatus,
            CanAddProgress = canAddProgress,
            CanSubmitHandover = canSubmitHandover,
            CanRate = canRate,
            HasRated = hasRated,
            StatusHistory = project.StatusHistory.OrderBy(h => h.ChangedAt).Select(h => new ProjectStatusHistoryItemDto
            {
                Id = h.Id,
                PreviousStatus = h.PreviousStatus,
                NewStatus = h.NewStatus,
                Remarks = h.Remarks,
                ChangedByName = h.ChangedByUser?.FullName ?? "System",
                ChangedAt = h.ChangedAt
            }).ToList(),
            ProgressUpdates = project.ProgressUpdates.OrderByDescending(pu => pu.CreatedAt).Select(pu => new ProjectProgressUpdateDto
            {
                Id = pu.Id,
                ProjectId = pu.ProjectId,
                SupervisorName = pu.SupervisorUser?.FullName ?? "",
                UpdateType = pu.UpdateType,
                Description = pu.Description,
                CompletedActivities = pu.CompletedActivities,
                CurrentChallenges = pu.CurrentChallenges,
                NextPlannedActivities = pu.NextPlannedActivities,
                MilestoneTitle = pu.MilestoneTitle,
                MilestoneDate = pu.MilestoneDate,
                CreatedAt = pu.CreatedAt
            }).ToList(),
            Handover = project.Handover == null ? null : new ProjectHandoverDto
            {
                Id = project.Handover.Id,
                ProjectId = project.Handover.ProjectId,
                ProjectCode = project.ProjectCode,
                SupervisorName = project.Handover.SupervisorUser?.FullName ?? "",
                FinalSummary = project.Handover.FinalSummary,
                DeliverablesCompleted = project.Handover.DeliverablesCompleted,
                TechnicalDocumentationLinks = project.Handover.TechnicalDocumentationLinks,
                DeploymentDetails = project.Handover.DeploymentDetails,
                KnownLimitations = project.Handover.KnownLimitations,
                Recommendations = project.Handover.Recommendations,
                HandoverDate = project.Handover.HandoverDate,
                SubmittedAt = project.Handover.SubmittedAt,
                IsFinalized = project.Handover.IsFinalized
            },
            Ratings = project.Ratings.Select(r => new RatingDto
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                RaterType = r.RaterType,
                RaterName = r.RatedByUser?.FullName ?? "",
                SupervisorName = r.RatedSupervisor?.FullName ?? "",
                TechnicalQuality = r.TechnicalQuality,
                Communication = r.Communication,
                TimelyDelivery = r.TimelyDelivery,
                Professionalism = r.Professionalism,
                OverallRating = r.OverallRating,
                AverageScore = Math.Round((r.TechnicalQuality + r.Communication + r.TimelyDelivery + r.Professionalism + r.OverallRating) / 5.0, 2),
                WrittenFeedback = r.WrittenFeedback,
                CreatedAt = r.CreatedAt
            }).ToList()
        };

        return Ok(dto);
    }

    // ─── PATCH /api/projects/{id}/status ─────────────────────────────────────
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "DIGITAL_LAB_USER")]
    public async Task<IActionResult> UpdateProjectStatus(Guid id, [FromBody] UpdateProjectStatusRequest request)
    {
        var userId = CurrentUserId;

        var project = await _context.Projects
            .Include(p => p.Assignments)
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        // Only the accepted supervisor can update status
        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        if (acceptedAssignment?.UserId != userId)
            return Forbid();

        var currentStatus = project.Status;
        var newStatus = request.NewStatus.ToUpperInvariant();

        // Validate transition
        if (!ValidTransitions.TryGetValue(currentStatus, out var expectedNext) || expectedNext != newStatus)
        {
            return BadRequest(new
            {
                message = $"Invalid status transition from '{currentStatus}' to '{newStatus}'. " +
                          $"Expected next status: '{(ValidTransitions.ContainsKey(currentStatus) ? ValidTransitions[currentStatus] : "none (terminal)")}'."
            });
        }

        var previousStatus = currentStatus;
        project.Status = newStatus;
        project.UpdatedAt = DateTime.UtcNow;
        if (newStatus == "DEVELOPMENT") project.StartDate = DateTime.UtcNow;
        if (newStatus == "HANDOVER") project.ActualEndDate = DateTime.UtcNow;

        // Record status history
        _context.ProjectStatusHistory.Add(new ProjectStatusHistory
        {
            ProjectId = id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Remarks = request.Comments,
            ChangedByUserId = userId,
            ChangedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // Post system message in project chat
        try
        {
            var chatRoom = await _context.ChatRooms.FirstOrDefaultAsync(cr => cr.ProjectId == id);
            if (chatRoom != null)
            {
                var statusLabel = GetStatusLabel(newStatus);
                await _chatService.AddSystemMessageAsync(chatRoom.Id,
                    $"🔄 Project status advanced to **{statusLabel}** by supervisor {CurrentUserName}." +
                    (string.IsNullOrEmpty(request.Comments) ? "" : $" Comment: {request.Comments}"));
            }
        }
        catch { /* Non-critical – do not fail the request */ }

        // Send notifications to DGM and Requester
        await SendLifecycleNotificationsAsync(project, $"Project '{project.Title}' advanced to status: {newStatus}",
            $"The project has progressed to {GetStatusLabel(newStatus)} stage.", "STATUS_UPDATE", id.ToString());

        // Audit log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = "PROJECT_STATUS_UPDATE",
            EntityName = "Project",
            EntityId = id.ToString(),
            Details = $"Status changed from {previousStatus} to {newStatus}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Project status updated to {newStatus}.", projectId = id, newStatus });
    }

    // ─── POST /api/projects/{id}/progress ────────────────────────────────────
    [HttpPost("{id:guid}/progress")]
    [Authorize(Roles = "DIGITAL_LAB_USER")]
    public async Task<IActionResult> AddProgressUpdate(Guid id, [FromBody] CreateProgressUpdateRequest request)
    {
        var userId = CurrentUserId;

        var project = await _context.Projects
            .Include(p => p.Assignments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        if (acceptedAssignment?.UserId != userId)
            return Forbid();

        if (!LifecycleStatuses.Contains(project.Status))
            return BadRequest(new { message = "Progress updates can only be added to active lifecycle projects." });

        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest(new { message = "Description is required." });

        var validTypes = new[] { "Progress", "Milestone", "Issue" };
        if (!validTypes.Contains(request.UpdateType))
            request.UpdateType = "Progress";

        var update = new ProjectProgressUpdate
        {
            ProjectId = id,
            SupervisorUserId = userId,
            UpdateType = request.UpdateType,
            Description = request.Description,
            CompletedActivities = request.CompletedActivities,
            CurrentChallenges = request.CurrentChallenges,
            NextPlannedActivities = request.NextPlannedActivities,
            MilestoneTitle = request.MilestoneTitle,
            MilestoneDate = request.MilestoneDate.HasValue ? DateTime.SpecifyKind(request.MilestoneDate.Value, DateTimeKind.Utc) : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProjectProgressUpdates.Add(update);

        // Post system message if milestone
        if (request.UpdateType == "Milestone" && !string.IsNullOrEmpty(request.MilestoneTitle))
        {
            try
            {
                var chatRoom = await _context.ChatRooms.FirstOrDefaultAsync(cr => cr.ProjectId == id);
                if (chatRoom != null)
                    await _chatService.AddSystemMessageAsync(chatRoom.Id,
                        $"🏁 Milestone recorded: **{request.MilestoneTitle}** by {CurrentUserName}.");
            }
            catch { }
        }

        // Notify DGM and Requester
        await SendLifecycleNotificationsAsync(project, $"Progress update on '{project.Title}'",
            $"New {request.UpdateType} update: {request.Description.Substring(0, Math.Min(100, request.Description.Length))}...",
            "PROGRESS_UPDATE", id.ToString());

        await _context.SaveChangesAsync();

        var supervisor = await _context.Users.FindAsync(userId);
        var resultDto = new ProjectProgressUpdateDto
        {
            Id = update.Id,
            ProjectId = id,
            SupervisorName = supervisor?.FullName ?? "",
            UpdateType = update.UpdateType,
            Description = update.Description,
            CompletedActivities = update.CompletedActivities,
            CurrentChallenges = update.CurrentChallenges,
            NextPlannedActivities = update.NextPlannedActivities,
            MilestoneTitle = update.MilestoneTitle,
            MilestoneDate = update.MilestoneDate,
            CreatedAt = update.CreatedAt
        };

        return CreatedAtAction(nameof(GetProject), new { id }, resultDto);
    }

    // ─── GET /api/projects/{id}/progress ─────────────────────────────────────
    [HttpGet("{id:guid}/progress")]
    public async Task<IActionResult> GetProgressUpdates(Guid id)
    {
        var userId = CurrentUserId;
        var roles = CurrentUserRoles;

        var project = await _context.Projects
            .Include(p => p.Assignments)
            .Include(p => p.ProgressUpdates)
                .ThenInclude(pu => pu.SupervisorUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        var isSupervisor = acceptedAssignment?.UserId == userId;
        var isRequester = project.CreatedByUserId == userId;
        var isDgmOrAdmin = roles.Contains("DGM") || roles.Contains("ADMIN");
        var isHigherMgmt = roles.Contains("HIGHER_MANAGEMENT");

        if (!isSupervisor && !isRequester && !isDgmOrAdmin && !isHigherMgmt)
            return Forbid();

        var updates = project.ProgressUpdates.OrderByDescending(pu => pu.CreatedAt).Select(pu => new ProjectProgressUpdateDto
        {
            Id = pu.Id,
            ProjectId = pu.ProjectId,
            SupervisorName = pu.SupervisorUser?.FullName ?? "",
            UpdateType = pu.UpdateType,
            Description = pu.Description,
            CompletedActivities = pu.CompletedActivities,
            CurrentChallenges = pu.CurrentChallenges,
            NextPlannedActivities = pu.NextPlannedActivities,
            MilestoneTitle = pu.MilestoneTitle,
            MilestoneDate = pu.MilestoneDate,
            CreatedAt = pu.CreatedAt
        }).ToList();

        return Ok(updates);
    }

    // ─── POST /api/projects/{id}/handover ────────────────────────────────────
    [HttpPost("{id:guid}/handover")]
    [Authorize(Roles = "DIGITAL_LAB_USER")]
    public async Task<IActionResult> SubmitHandover(Guid id, [FromBody] SubmitHandoverRequest request)
    {
        var userId = CurrentUserId;

        var project = await _context.Projects
            .Include(p => p.Assignments)
            .Include(p => p.Handover)
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        if (acceptedAssignment?.UserId != userId)
            return Forbid();

        if (project.Status != "HANDOVER")
            return BadRequest(new { message = "Handover can only be submitted when project is in HANDOVER status." });

        if (project.Handover != null)
            return BadRequest(new { message = "A handover record already exists for this project." });

        if (string.IsNullOrWhiteSpace(request.FinalSummary) || string.IsNullOrWhiteSpace(request.DeliverablesCompleted))
            return BadRequest(new { message = "Final summary and deliverables completed are required." });

        var handover = new ProjectHandover
        {
            ProjectId = id,
            SupervisorUserId = userId,
            FinalSummary = request.FinalSummary,
            DeliverablesCompleted = request.DeliverablesCompleted,
            TechnicalDocumentationLinks = request.TechnicalDocumentationLinks,
            DeploymentDetails = request.DeploymentDetails,
            KnownLimitations = request.KnownLimitations,
            Recommendations = request.Recommendations,
            HandoverDate = DateTime.SpecifyKind(request.HandoverDate, DateTimeKind.Utc),
            SubmittedAt = DateTime.UtcNow,
            IsFinalized = true
        };

        _context.ProjectHandovers.Add(handover);
        project.UpdatedAt = DateTime.UtcNow;

        // Post system message
        try
        {
            var chatRoom = await _context.ChatRooms.FirstOrDefaultAsync(cr => cr.ProjectId == id);
            if (chatRoom != null)
                await _chatService.AddSystemMessageAsync(chatRoom.Id,
                    $"✅ Project handover submitted by **{CurrentUserName}**. The project has been formally handed over. DGM and Requester may now rate the supervisor's performance.");
        }
        catch { }

        // Notify DGM and Requester
        await SendLifecycleNotificationsAsync(project, $"Handover submitted for '{project.Title}'",
            "The supervisor has submitted the formal project handover. You can now review and rate the supervisor's performance.",
            "HANDOVER_SUBMITTED", id.ToString());

        // Audit log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = "PROJECT_HANDOVER_SUBMITTED",
            EntityName = "ProjectHandover",
            EntityId = id.ToString(),
            Details = $"Handover submitted for project {project.ProjectCode}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var supervisor = await _context.Users.FindAsync(userId);
        var dto = new ProjectHandoverDto
        {
            Id = handover.Id,
            ProjectId = handover.ProjectId,
            ProjectCode = project.ProjectCode,
            SupervisorName = supervisor?.FullName ?? "",
            FinalSummary = handover.FinalSummary,
            DeliverablesCompleted = handover.DeliverablesCompleted,
            TechnicalDocumentationLinks = handover.TechnicalDocumentationLinks,
            DeploymentDetails = handover.DeploymentDetails,
            KnownLimitations = handover.KnownLimitations,
            Recommendations = handover.Recommendations,
            HandoverDate = handover.HandoverDate,
            SubmittedAt = handover.SubmittedAt,
            IsFinalized = handover.IsFinalized
        };

        return CreatedAtAction(nameof(GetHandover), new { id }, dto);
    }

    // ─── GET /api/projects/{id}/handover ─────────────────────────────────────
    [HttpGet("{id:guid}/handover")]
    public async Task<IActionResult> GetHandover(Guid id)
    {
        var userId = CurrentUserId;
        var roles = CurrentUserRoles;

        var project = await _context.Projects
            .Include(p => p.Assignments)
            .Include(p => p.Handover)
                .ThenInclude(h => h!.SupervisorUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        var isSupervisor = acceptedAssignment?.UserId == userId;
        var isRequester = project.CreatedByUserId == userId;
        var isDgmOrAdmin = roles.Contains("DGM") || roles.Contains("ADMIN");
        var isHigherMgmt = roles.Contains("HIGHER_MANAGEMENT");

        if (!isSupervisor && !isRequester && !isDgmOrAdmin && !isHigherMgmt) return Forbid();

        if (project.Handover == null) return NotFound(new { message = "No handover record found." });

        var dto = new ProjectHandoverDto
        {
            Id = project.Handover.Id,
            ProjectId = project.Handover.ProjectId,
            ProjectCode = project.ProjectCode,
            SupervisorName = project.Handover.SupervisorUser?.FullName ?? "",
            FinalSummary = project.Handover.FinalSummary,
            DeliverablesCompleted = project.Handover.DeliverablesCompleted,
            TechnicalDocumentationLinks = project.Handover.TechnicalDocumentationLinks,
            DeploymentDetails = project.Handover.DeploymentDetails,
            KnownLimitations = project.Handover.KnownLimitations,
            Recommendations = project.Handover.Recommendations,
            HandoverDate = project.Handover.HandoverDate,
            SubmittedAt = project.Handover.SubmittedAt,
            IsFinalized = project.Handover.IsFinalized
        };

        return Ok(dto);
    }

    // ─── POST /api/projects/{id}/rate ─────────────────────────────────────────
    [HttpPost("{id:guid}/rate")]
    public async Task<IActionResult> SubmitRating(Guid id, [FromBody] SubmitRatingRequest request)
    {
        var userId = CurrentUserId;
        var roles = CurrentUserRoles;

        var project = await _context.Projects
            .Include(p => p.Assignments)
            .Include(p => p.Handover)
            .Include(p => p.Ratings)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        // Only DGM/ADMIN or the Requester can rate
        var isDgmOrAdmin = roles.Contains("DGM") || roles.Contains("ADMIN");
        var isRequester = project.CreatedByUserId == userId;

        if (!isDgmOrAdmin && !isRequester)
            return Forbid();

        // Cannot rate before handover
        if (project.Status != "HANDOVER")
            return BadRequest(new { message = "Ratings can only be submitted after the project reaches HANDOVER status." });

        if (project.Handover == null)
            return BadRequest(new { message = "Cannot rate before the supervisor submits the handover record." });

        // No self-rating (supervisor cannot rate their own project)
        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        if (acceptedAssignment?.UserId == userId)
            return Forbid();

        // One rating per rater per project
        if (project.Ratings.Any(r => r.RatedByUserId == userId))
            return BadRequest(new { message = "You have already rated this project/supervisor." });

        // Validate scores
        var scores = new[] { request.TechnicalQuality, request.Communication, request.TimelyDelivery, request.Professionalism, request.OverallRating };
        if (scores.Any(s => s < 1 || s > 5))
            return BadRequest(new { message = "All rating scores must be between 1 and 5." });

        var raterType = isDgmOrAdmin ? "DGM" : "Requester";
        var supervisorId = acceptedAssignment!.UserId;

        var rating = new Rating
        {
            ProjectId = id,
            RatedByUserId = userId,
            RatedSupervisorId = supervisorId,
            RaterType = raterType,
            TechnicalQuality = request.TechnicalQuality,
            Communication = request.Communication,
            TimelyDelivery = request.TimelyDelivery,
            Professionalism = request.Professionalism,
            OverallRating = request.OverallRating,
            WrittenFeedback = request.WrittenFeedback,
            CreatedAt = DateTime.UtcNow
        };

        _context.Ratings.Add(rating);

        // Post system message
        try
        {
            var chatRoom = await _context.ChatRooms.FirstOrDefaultAsync(cr => cr.ProjectId == id);
            if (chatRoom != null)
            {
                var avg = Math.Round((request.TechnicalQuality + request.Communication + request.TimelyDelivery + request.Professionalism + request.OverallRating) / 5.0, 1);
                await _chatService.AddSystemMessageAsync(chatRoom.Id,
                    $"⭐ Supervisor performance rated by {raterType} — Average Score: {avg}/5.");
            }
        }
        catch { }

        // Notify supervisor
        var notification = new Notification
        {
            UserId = supervisorId,
            Title = "Performance Rating Received",
            Message = $"Your performance on project '{project.Title}' has been rated by {raterType}.",
            Type = "RATING_RECEIVED",
            ReferenceId = id.ToString(),
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);

        // Audit log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = "SUPERVISOR_RATED",
            EntityName = "Rating",
            EntityId = id.ToString(),
            Details = $"Rating submitted by {raterType} for project {project.ProjectCode}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var rater = await _context.Users.FindAsync(userId);
        var supervisor = await _context.Users.FindAsync(supervisorId);
        var avg2 = Math.Round((rating.TechnicalQuality + rating.Communication + rating.TimelyDelivery + rating.Professionalism + rating.OverallRating) / 5.0, 2);

        return CreatedAtAction(nameof(GetRatings), new { id }, new RatingDto
        {
            Id = rating.Id,
            ProjectId = rating.ProjectId,
            RaterType = rating.RaterType,
            RaterName = rater?.FullName ?? "",
            SupervisorName = supervisor?.FullName ?? "",
            TechnicalQuality = rating.TechnicalQuality,
            Communication = rating.Communication,
            TimelyDelivery = rating.TimelyDelivery,
            Professionalism = rating.Professionalism,
            OverallRating = rating.OverallRating,
            AverageScore = avg2,
            WrittenFeedback = rating.WrittenFeedback,
            CreatedAt = rating.CreatedAt
        });
    }

    // ─── GET /api/projects/{id}/ratings ──────────────────────────────────────
    [HttpGet("{id:guid}/ratings")]
    public async Task<IActionResult> GetRatings(Guid id)
    {
        var userId = CurrentUserId;
        var roles = CurrentUserRoles;

        var project = await _context.Projects
            .Include(p => p.Assignments)
            .Include(p => p.Ratings)
                .ThenInclude(r => r.RatedByUser)
            .Include(p => p.Ratings)
                .ThenInclude(r => r.RatedSupervisor)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound(new { message = "Project not found." });

        var acceptedAssignment = project.Assignments.FirstOrDefault(a => a.Status == "ACCEPTED" && a.IsActive);
        var isSupervisor = acceptedAssignment?.UserId == userId;
        var isRequester = project.CreatedByUserId == userId;
        var isDgmOrAdmin = roles.Contains("DGM") || roles.Contains("ADMIN");
        var isHigherMgmt = roles.Contains("HIGHER_MANAGEMENT");

        if (!isSupervisor && !isRequester && !isDgmOrAdmin && !isHigherMgmt) return Forbid();

        var ratings = project.Ratings.Select(r =>
        {
            var avg = Math.Round((r.TechnicalQuality + r.Communication + r.TimelyDelivery + r.Professionalism + r.OverallRating) / 5.0, 2);
            return new RatingDto
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                RaterType = r.RaterType,
                RaterName = r.RatedByUser?.FullName ?? "",
                SupervisorName = r.RatedSupervisor?.FullName ?? "",
                TechnicalQuality = r.TechnicalQuality,
                Communication = r.Communication,
                TimelyDelivery = r.TimelyDelivery,
                Professionalism = r.Professionalism,
                OverallRating = r.OverallRating,
                AverageScore = avg,
                WrittenFeedback = r.WrittenFeedback,
                CreatedAt = r.CreatedAt
            };
        }).ToList();

        return Ok(ratings);
    }

    // ─── GET /api/projects/supervisor-performance ─────────────────────────────
    [HttpGet("supervisor-performance")]
    [Authorize(Roles = "ADMIN,DGM,HIGHER_MANAGEMENT")]
    public async Task<IActionResult> GetSupervisorPerformance()
    {
        var supervisors = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Department)
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "DIGITAL_LAB_USER") && u.IsActive)
            .ToListAsync();

        var allAssignments = await _context.ProjectAssignments
            .Where(a => a.Status == "ACCEPTED")
            .ToListAsync();

        var allRatings = await _context.Ratings
            .ToListAsync();

        var allProjects = await _context.Projects.ToListAsync();

        var result = supervisors.Select(sup =>
        {
            var supAssignments = allAssignments.Where(a => a.UserId == sup.Id).ToList();
            var supProjectIds = supAssignments.Select(a => a.ProjectId).ToHashSet();
            var supProjects = allProjects.Where(p => supProjectIds.Contains(p.Id)).ToList();
            var supRatings = allRatings.Where(r => r.RatedSupervisorId == sup.Id).ToList();

            return new SupervisorPerformanceStatsDto
            {
                SupervisorId = sup.Id,
                SupervisorName = sup.FullName,
                DepartmentName = sup.Department?.Name ?? "",
                TotalProjects = supProjects.Count,
                CompletedProjects = supProjects.Count(p => p.Status == "HANDOVER"),
                ActiveProjects = supProjects.Count(p => LifecycleStatuses.Contains(p.Status) && p.Status != "HANDOVER"),
                AverageTechnicalQuality = supRatings.Any() ? Math.Round(supRatings.Average(r => r.TechnicalQuality), 2) : 0,
                AverageCommunication = supRatings.Any() ? Math.Round(supRatings.Average(r => r.Communication), 2) : 0,
                AverageTimelyDelivery = supRatings.Any() ? Math.Round(supRatings.Average(r => r.TimelyDelivery), 2) : 0,
                AverageProfessionalism = supRatings.Any() ? Math.Round(supRatings.Average(r => r.Professionalism), 2) : 0,
                AverageOverallRating = supRatings.Any() ? Math.Round(supRatings.Average(r => r.OverallRating), 2) : 0,
                TotalRatings = supRatings.Count
            };
        }).ToList();

        return Ok(result);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private async Task SendLifecycleNotificationsAsync(Project project, string title, string message, string type, string referenceId)
    {
        var recipientIds = new HashSet<Guid>();

        // Add DGM(s)
        var dgmRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "DGM");
        if (dgmRole != null)
        {
            var dgmUserIds = await _context.UserRoles
                .Where(ur => ur.RoleId == dgmRole.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();
            foreach (var uid in dgmUserIds) recipientIds.Add(uid);
        }

        // Add requester
        recipientIds.Add(project.CreatedByUserId);

        // Don't notify the current user (they triggered it)
        recipientIds.Remove(CurrentUserId);

        foreach (var uid in recipientIds)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = uid,
                Title = title,
                Message = message,
                Type = type,
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    private static string GetStatusLabel(string status) => status switch
    {
        "ASSIGNED" => "Assigned",
        "DEVELOPMENT" => "Development",
        "TESTING" => "Testing",
        "POC" => "Proof of Concept (POC)",
        "VALIDATE" => "Validation",
        "HANDOVER" => "Handover",
        _ => status
    };
}
