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
public class AssignmentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IChatService _chatService;
    private readonly ILogger<AssignmentsController> _logger;

    public AssignmentsController(AppDbContext context, IChatService chatService, ILogger<AssignmentsController> logger)
    {
        _context = context;
        _chatService = chatService;
        _logger = logger;
    }

    /// <summary>
    /// Get all Digital Lab users available for supervisor assignment (Active DIGITAL_LAB_USER role).
    /// Used by DGM/Admin in supervisor selection dropdowns.
    /// </summary>
    [HttpGet("supervisors")]
    [Authorize(Roles = "ADMIN,DGM")]
    public async Task<IActionResult> GetAvailableSupervisors()
    {
        var supervisors = await _context.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Where(u => u.IsActive && u.UserRoles.Any(ur => ur.Role.Name == "DIGITAL_LAB_USER"))
            .ToListAsync();

        var candidateDtos = new List<SupervisorCandidateDto>();
        foreach (var s in supervisors)
        {
            var activeCount = await _context.ProjectAssignments
                .CountAsync(pa => pa.UserId == s.Id && pa.IsActive && 
                    (pa.Status == "PENDING_ACCEPTANCE" || pa.Status == "ACCEPTED"));

            candidateDtos.Add(new SupervisorCandidateDto
            {
                Id = s.Id,
                Username = s.Username,
                FullName = s.FullName,
                Email = s.Email,
                DepartmentName = s.Department?.Name ?? "Digital Lab",
                ActiveAssignmentsCount = activeCount,
                IsActive = s.IsActive
            });
        }

        return Ok(candidateDtos);
    }

    /// <summary>
    /// Get all APPROVED proposals waiting for supervisor assignment.
    /// </summary>
    [HttpGet("unassigned-projects")]
    [Authorize(Roles = "ADMIN,DGM")]
    public async Task<IActionResult> GetUnassignedApprovedProjects()
    {
        // Proposals that are APPROVED and do NOT have an active assignment with status PENDING_ACCEPTANCE or ACCEPTED
        var projects = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .Include(p => p.Assignments)
            .Where(p => (p.Status == "APPROVED" || p.Status == "ASSIGNMENT_DECLINED") &&
                        !p.Assignments.Any(a => a.IsActive && (a.Status == "PENDING_ACCEPTANCE" || a.Status == "ACCEPTED")))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.ProjectCode,
                p.Title,
                p.BusinessProblem,
                p.ExpectedOutcome,
                p.Priority,
                p.Status,
                p.DepartmentId,
                DepartmentName = p.Department.Name,
                RequesterName = p.CreatedByUser.FullName,
                p.TargetEndDate,
                p.CreatedAt,
                p.ReviewedAt
            })
            .ToListAsync();

        return Ok(projects);
    }

    /// <summary>
    /// Assign an approved project proposal to a Digital Lab Supervisor (DGM & ADMIN only).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,DGM")]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var assignerId = GetCurrentUserId();
        var assigner = await _context.Users.FindAsync(assignerId);
        if (assigner == null) return Unauthorized();

        // 1. Fetch Project
        var project = await _context.Projects
            .Include(p => p.CreatedByUser)
            .Include(p => p.Department)
            .Include(p => p.Assignments)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

        if (project == null)
            return NotFound(new { message = "Project not found." });

        // Rule: Only APPROVED or ASSIGNMENT_DECLINED projects can be assigned
        if (project.Status != "APPROVED" && project.Status != "ASSIGNMENT_DECLINED")
        {
            return BadRequest(new { message = $"Only 'APPROVED' projects can be assigned. Current status is '{project.Status}'." });
        }

        // Rule: Prevent duplicate active assignment for the same project
        var hasActiveAssignment = project.Assignments
            .Any(a => a.IsActive && (a.Status == "PENDING_ACCEPTANCE" || a.Status == "ACCEPTED"));

        if (hasActiveAssignment)
        {
            return BadRequest(new { message = "This project already has an active pending or accepted assignment." });
        }

        // 2. Fetch Supervisor User
        var supervisor = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.SupervisorUserId);

        if (supervisor == null)
            return NotFound(new { message = "Supervisor user not found." });

        // Rule: Prevent assigning inactive users
        if (!supervisor.IsActive)
            return BadRequest(new { message = "The selected supervisor account is inactive." });

        // Rule: Must have DIGITAL_LAB_USER role
        var isDigitalLab = supervisor.UserRoles.Any(ur => ur.Role.Name == "DIGITAL_LAB_USER");
        if (!isDigitalLab)
            return BadRequest(new { message = "Selected user does not have the DIGITAL_LAB_USER role." });

        // Create assignment record
        var assignment = new ProjectAssignment
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            UserId = supervisor.Id,
            AssignmentRole = string.IsNullOrWhiteSpace(request.AssignmentRole) ? "Supervisor" : request.AssignmentRole.Trim(),
            Status = "PENDING_ACCEPTANCE",
            Instructions = request.Instructions?.Trim(),
            AssignedDeadline = DateTime.SpecifyKind(request.AssignedDeadline, DateTimeKind.Utc),
            AssignedByUserId = assigner.Id,
            AssignedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.ProjectAssignments.Add(assignment);

        // Update Project status to ASSIGNED_PENDING_ACCEPTANCE
        var prevStatus = project.Status;
        project.Status = "PENDING_ACCEPTANCE";
        project.UpdatedAt = DateTime.UtcNow;

        // Record ProjectStatusHistory
        _context.ProjectStatusHistory.Add(new ProjectStatusHistory
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            PreviousStatus = prevStatus,
            NewStatus = "PENDING_ACCEPTANCE",
            Remarks = $"Assigned to Digital Lab supervisor {supervisor.FullName} by {assigner.FullName}. Deadline: {request.AssignedDeadline:yyyy-MM-dd}",
            ChangedByUserId = assigner.Id,
            ChangedAt = DateTime.UtcNow
        });

        // Notifications
        // 1. To Supervisor: "You have been assigned as supervisor for..."
        _context.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = supervisor.Id,
            Title = "New Project Assignment Received",
            Message = $"You have been assigned as {assignment.AssignmentRole} for project '{project.Title}' ({project.ProjectCode}) by DGM. Please accept or decline.",
            Type = "AssignmentReceived",
            ReferenceId = assignment.Id.ToString(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        // Audit Log
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = assigner.Id,
            Action = "PROJECT_ASSIGNED",
            EntityName = "ProjectAssignment",
            EntityId = assignment.Id.ToString(),
            Details = $"Project {project.ProjectCode} assigned to supervisor {supervisor.Username} ({supervisor.FullName}) by {assigner.Username}. Deadline: {request.AssignedDeadline:yyyy-MM-dd}",
            IpAddress = ip,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        _logger.LogInformation("Project {Code} assigned to {Supervisor} by {Assigner}", project.ProjectCode, supervisor.Username, assigner.Username);

        var dto = await MapToAssignmentDto(assignment.Id);
        return CreatedAtAction(nameof(GetAssignmentById), new { id = assignment.Id }, dto);
    }

    /// <summary>
    /// Get all assignments received by the logged-in DIGITAL_LAB_USER (Pending, Accepted, Declined).
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "ADMIN,DIGITAL_LAB_USER")]
    public async Task<IActionResult> GetMyAssignments([FromQuery] string? status)
    {
        var userId = GetCurrentUserId();

        var query = _context.ProjectAssignments
            .Include(pa => pa.Project)
                .ThenInclude(p => p.Department)
            .Include(pa => pa.Project)
                .ThenInclude(p => p.CreatedByUser)
            .Include(pa => pa.User)
            .Include(pa => pa.AssignedByUser)
            .Where(pa => pa.UserId == userId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(pa => pa.Status == status);
        }

        var list = await query
            .OrderByDescending(pa => pa.AssignedAt)
            .Select(pa => MapToDto(pa))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>
    /// DGM / Admin / Higher Management listing of all project assignments.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN,DGM,HIGHER_MANAGEMENT")]
    public async Task<IActionResult> GetAllAssignments([FromQuery] string? status, [FromQuery] Guid? supervisorId)
    {
        var query = _context.ProjectAssignments
            .Include(pa => pa.Project)
                .ThenInclude(p => p.Department)
            .Include(pa => pa.Project)
                .ThenInclude(p => p.CreatedByUser)
            .Include(pa => pa.User)
            .Include(pa => pa.AssignedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(pa => pa.Status == status);
        }

        if (supervisorId.HasValue && supervisorId.Value != Guid.Empty)
        {
            query = query.Where(pa => pa.UserId == supervisorId.Value);
        }

        var list = await query
            .OrderByDescending(pa => pa.AssignedAt)
            .Select(pa => MapToDto(pa))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>
    /// Get single assignment details by ID with role-based visibility.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAssignmentById(Guid id)
    {
        var userId = GetCurrentUserId();
        var assignment = await _context.ProjectAssignments
            .Include(pa => pa.Project)
                .ThenInclude(p => p.Department)
            .Include(pa => pa.Project)
                .ThenInclude(p => p.CreatedByUser)
            .Include(pa => pa.User)
            .Include(pa => pa.AssignedByUser)
            .FirstOrDefaultAsync(pa => pa.Id == id);

        if (assignment == null)
            return NotFound(new { message = "Assignment not found." });

        // Security check:
        // Admin, DGM, Higher Management can view all.
        // Digital lab user can only view their own assignments.
        // Requester can view assignments for their own projects.
        var isManagement = User.IsInRole("ADMIN") || User.IsInRole("DGM") || User.IsInRole("HIGHER_MANAGEMENT");
        if (!isManagement)
        {
            var isAssignedSupervisor = assignment.UserId == userId;
            var isProjectRequester = assignment.Project.CreatedByUserId == userId;

            if (!isAssignedSupervisor && !isProjectRequester)
            {
                return Forbid();
            }
        }

        return Ok(MapToDto(assignment));
    }

    /// <summary>
    /// Supervisor Accept or Decline assignment.
    /// Mandatory decline reason required when declining.
    /// </summary>
    [HttpPost("{id:guid}/respond")]
    [Authorize(Roles = "ADMIN,DIGITAL_LAB_USER")]
    public async Task<IActionResult> RespondToAssignment(Guid id, [FromBody] RespondAssignmentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var action = request.Action.Trim().ToUpperInvariant();
        if (action != "ACCEPT" && action != "DECLINE")
        {
            return BadRequest(new { message = "Action must be either 'ACCEPT' or 'DECLINE'." });
        }

        if (action == "DECLINE" && string.IsNullOrWhiteSpace(request.DeclineReason))
        {
            return BadRequest(new { message = "A mandatory decline reason is required when declining an assignment." });
        }

        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var assignment = await _context.ProjectAssignments
            .Include(pa => pa.Project)
                .ThenInclude(p => p.CreatedByUser)
            .Include(pa => pa.Project)
                .ThenInclude(p => p.Department)
            .Include(pa => pa.User)
            .Include(pa => pa.AssignedByUser)
            .FirstOrDefaultAsync(pa => pa.Id == id);

        if (assignment == null)
            return NotFound(new { message = "Assignment not found." });

        // Ensure user is the assigned supervisor (or Admin)
        if (!User.IsInRole("ADMIN") && assignment.UserId != userId)
        {
            return Forbid();
        }

        // Ensure assignment is still in PENDING_ACCEPTANCE
        if (assignment.Status != "PENDING_ACCEPTANCE")
        {
            return BadRequest(new { message = $"Assignment cannot be modified. Current status is '{assignment.Status}'." });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (action == "ACCEPT")
        {
            assignment.Status = "ACCEPTED";
            assignment.RespondedAt = DateTime.UtcNow;
            assignment.IsActive = true;

            // Update Project: Mark project as assigned
            assignment.Project.Status = "ASSIGNED";
            assignment.Project.UpdatedAt = DateTime.UtcNow;

            // ProjectStatusHistory
            _context.ProjectStatusHistory.Add(new ProjectStatusHistory
            {
                Id = Guid.NewGuid(),
                ProjectId = assignment.ProjectId,
                PreviousStatus = "PENDING_ACCEPTANCE",
                NewStatus = "ASSIGNED",
                Remarks = $"Assignment accepted by supervisor {assignment.User.FullName}.",
                ChangedByUserId = user.Id,
                ChangedAt = DateTime.UtcNow
            });

            // Notifications
            // 1. To DGM (AssignedByUser or all DGMs)
            if (assignment.AssignedByUserId.HasValue)
            {
                _context.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = assignment.AssignedByUserId.Value,
                    Title = "Assignment Accepted",
                    Message = $"Supervisor {assignment.User.FullName} accepted assignment for project '{assignment.Project.Title}' ({assignment.Project.ProjectCode}).",
                    Type = "AssignmentAccepted",
                    ReferenceId = assignment.Id.ToString(),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // 2. To Requester: "Supervisor accepted your project"
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = assignment.Project.CreatedByUserId,
                Title = "Digital Lab Supervisor Assigned! 🚀",
                Message = $"Supervisor {assignment.User.FullName} has accepted your project '{assignment.Project.Title}'. Project is now officially ASSIGNED.",
                Type = "ProjectAssignedToSupervisor",
                ReferenceId = assignment.ProjectId.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            // Audit Log
            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Action = "ASSIGNMENT_ACCEPTED",
                EntityName = "ProjectAssignment",
                EntityId = assignment.Id.ToString(),
                Details = $"Supervisor {assignment.User.Username} accepted project {assignment.Project.ProjectCode}.",
                IpAddress = ip,
                Timestamp = DateTime.UtcNow
            });
        }
        else // DECLINE
        {
            assignment.Status = "DECLINED";
            assignment.DeclineReason = request.DeclineReason?.Trim();
            assignment.RespondedAt = DateTime.UtcNow;
            assignment.IsActive = false; // no longer active

            // Update Project: Mark project status as ASSIGNMENT_DECLINED so DGM can reassign
            assignment.Project.Status = "ASSIGNMENT_DECLINED";
            assignment.Project.UpdatedAt = DateTime.UtcNow;

            // ProjectStatusHistory
            _context.ProjectStatusHistory.Add(new ProjectStatusHistory
            {
                Id = Guid.NewGuid(),
                ProjectId = assignment.ProjectId,
                PreviousStatus = "PENDING_ACCEPTANCE",
                NewStatus = "ASSIGNMENT_DECLINED",
                Remarks = $"Assignment declined by supervisor {assignment.User.FullName}. Reason: {request.DeclineReason}",
                ChangedByUserId = user.Id,
                ChangedAt = DateTime.UtcNow
            });

            // Notification to DGM (Allow DGM to reassign)
            if (assignment.AssignedByUserId.HasValue)
            {
                _context.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = assignment.AssignedByUserId.Value,
                    Title = "Assignment Declined by Supervisor",
                    Message = $"Supervisor {assignment.User.FullName} declined assignment for '{assignment.Project.Title}'. Reason: {request.DeclineReason}. You may reassign to another supervisor.",
                    Type = "AssignmentDeclined",
                    ReferenceId = assignment.ProjectId.ToString(),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Audit Log
            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Action = "ASSIGNMENT_DECLINED",
                EntityName = "ProjectAssignment",
                EntityId = assignment.Id.ToString(),
                Details = $"Supervisor {assignment.User.Username} declined project {assignment.Project.ProjectCode}. Reason: {request.DeclineReason}",
                IpAddress = ip,
                Timestamp = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Assignment {Id} responded with {Action} by {User}", assignment.Id, action, user.Username);

        // Phase 07: Automatically initialize dedicated 3-participant Project Chat Room upon acceptance
        if (action == "ACCEPT")
        {
            try
            {
                await _chatService.EnsureProjectChatRoomAsync(
                    assignment.ProjectId,
                    assignment.UserId,
                    assignment.AssignedByUserId,
                    assignment.Project.CreatedByUserId
                );
                _logger.LogInformation("Dedicated Project Chat Room initialized for accepted project {ProjectId}", assignment.ProjectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize chat room for accepted project {ProjectId}", assignment.ProjectId);
            }
        }

        var dto = await MapToAssignmentDto(assignment.Id);
        return Ok(dto);
    }

    /// <summary>
    /// Cancel an active assignment (DGM & ADMIN only). Allows DGM to withdraw or re-allocate an assignment.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "ADMIN,DGM")]
    public async Task<IActionResult> CancelAssignment(Guid id, [FromBody] CancelAssignmentRequest request)
    {
        var cancelerId = GetCurrentUserId();
        var canceler = await _context.Users.FindAsync(cancelerId);
        if (canceler == null) return Unauthorized();

        var assignment = await _context.ProjectAssignments
            .Include(pa => pa.Project)
            .Include(pa => pa.User)
            .FirstOrDefaultAsync(pa => pa.Id == id);

        if (assignment == null)
            return NotFound(new { message = "Assignment not found." });

        if (assignment.Status == "CANCELLED" || assignment.Status == "DECLINED")
        {
            return BadRequest(new { message = $"Assignment is already {assignment.Status}." });
        }

        assignment.Status = "CANCELLED";
        assignment.IsActive = false;
        assignment.Project.Status = "APPROVED"; // Returns project to approved unassigned pool
        assignment.Project.UpdatedAt = DateTime.UtcNow;

        // ProjectStatusHistory
        _context.ProjectStatusHistory.Add(new ProjectStatusHistory
        {
            Id = Guid.NewGuid(),
            ProjectId = assignment.ProjectId,
            PreviousStatus = "PENDING_ACCEPTANCE",
            NewStatus = "APPROVED",
            Remarks = $"Assignment to {assignment.User.FullName} was cancelled by {canceler.FullName}. Reason: {request.Reason ?? "Administrative reassignment"}",
            ChangedByUserId = canceler.Id,
            ChangedAt = DateTime.UtcNow
        });

        // Notify Supervisor
        _context.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = assignment.UserId,
            Title = "Assignment Cancelled",
            Message = $"Your assignment for '{assignment.Project.Title}' has been cancelled by DGM ({request.Reason ?? "Reassignment"}).",
            Type = "AssignmentCancelled",
            ReferenceId = assignment.Id.ToString(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        // Audit Log
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = canceler.Id,
            Action = "ASSIGNMENT_CANCELLED",
            EntityName = "ProjectAssignment",
            EntityId = assignment.Id.ToString(),
            Details = $"Assignment of project {assignment.Project.ProjectCode} to {assignment.User.Username} was cancelled by {canceler.Username}.",
            IpAddress = ip,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var dto = await MapToAssignmentDto(assignment.Id);
        return Ok(dto);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    private async Task<ProjectAssignmentDto?> MapToAssignmentDto(Guid id)
    {
        var pa = await _context.ProjectAssignments
            .Include(x => x.Project)
                .ThenInclude(p => p.Department)
            .Include(x => x.Project)
                .ThenInclude(p => p.CreatedByUser)
            .Include(x => x.User)
            .Include(x => x.AssignedByUser)
            .FirstOrDefaultAsync(x => x.Id == id);

        return pa == null ? null : MapToDto(pa);
    }

    private static ProjectAssignmentDto MapToDto(ProjectAssignment pa)
    {
        return new ProjectAssignmentDto
        {
            Id = pa.Id,
            ProjectId = pa.ProjectId,
            ProjectCode = pa.Project?.ProjectCode ?? "",
            ProjectTitle = pa.Project?.Title ?? "",
            DepartmentName = pa.Project?.Department?.Name ?? "",
            RequesterName = pa.Project?.CreatedByUser?.FullName ?? "",
            RequesterEmail = pa.Project?.CreatedByUser?.Email ?? "",
            UserId = pa.UserId,
            SupervisorName = pa.User?.FullName ?? "",
            SupervisorUsername = pa.User?.Username ?? "",
            SupervisorEmail = pa.User?.Email ?? "",
            AssignmentRole = pa.AssignmentRole,
            Status = pa.Status,
            Instructions = pa.Instructions,
            DeclineReason = pa.DeclineReason,
            AssignedDeadline = pa.AssignedDeadline,
            AssignedByUserId = pa.AssignedByUserId,
            AssignedByUserName = pa.AssignedByUser?.Username,
            AssignedByUserFullName = pa.AssignedByUser?.FullName,
            AssignedAt = pa.AssignedAt,
            RespondedAt = pa.RespondedAt,
            IsActive = pa.IsActive
        };
    }
}
