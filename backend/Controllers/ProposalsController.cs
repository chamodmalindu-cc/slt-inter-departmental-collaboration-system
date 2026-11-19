using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Data;
using SltCommunicationSystem.Api.Models.DTOs;
using SltCommunicationSystem.Api.Models.Entities;
using System.Security.Claims;

namespace SltCommunicationSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProposalsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProposalsController> _logger;

    public ProposalsController(AppDbContext context, ILogger<ProposalsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Submit a new project proposal (NON_DIGITAL_LAB_USER & ADMIN).
    /// Department is automatically retrieved from the logged-in user.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,NON_DIGITAL_LAB_USER")]
    public async Task<IActionResult> CreateProposal([FromBody] CreateProposalRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetCurrentUserId();
        var user = await _context.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return Unauthorized(new { message = "Authenticated user not found in database." });

        if (user.Department == null)
            return BadRequest(new { message = "User is not assigned to any department." });

        // Generate sequential unique proposal code
        var year = DateTime.UtcNow.Year;
        var proposalCount = await _context.Projects
            .CountAsync(p => p.CreatedAt.Year == year);
        var code = $"PROP-{year}-{(proposalCount + 1):D4}";

        var proposal = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = code,
            Title = request.Title.Trim(),
            Description = request.BusinessProblem.Length > 2000 
                ? request.BusinessProblem[..2000] 
                : request.BusinessProblem,
            BusinessProblem = request.BusinessProblem.Trim(),
            ExpectedOutcome = request.ExpectedOutcome.Trim(),
            ImpactCostSaving = request.ImpactCostSaving,
            ImpactRevenue = request.ImpactRevenue,
            ImpactProcessOptimization = request.ImpactProcessOptimization,
            QuantifiedImpact = request.QuantifiedImpact?.Trim(),
            AdditionalInformation = request.AdditionalInformation?.Trim(),
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority,
            Status = "PENDING_REVIEW",
            DepartmentId = user.DepartmentId,
            CreatedByUserId = user.Id,
            TargetEndDate = request.TargetDeadline.HasValue ? DateTime.SpecifyKind(request.TargetDeadline.Value, DateTimeKind.Utc) : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(proposal);

        // Record Initial Status History
        _context.ProjectStatusHistory.Add(new ProjectStatusHistory
        {
            Id = Guid.NewGuid(),
            ProjectId = proposal.Id,
            PreviousStatus = null,
            NewStatus = "PENDING_REVIEW",
            Remarks = "Project proposal submitted by department requester.",
            ChangedByUserId = user.Id,
            ChangedAt = DateTime.UtcNow
        });

        // 1. Notification for Submitter
        _context.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = "Proposal Submitted",
            Message = $"Your project proposal '{proposal.Title}' ({proposal.ProjectCode}) was successfully submitted for DGM review.",
            Type = "ProposalSubmitted",
            ReferenceId = proposal.Id.ToString(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        // 2. Notification for DGM users
        var dgmUsers = await _context.Users
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "DGM" || ur.Role.Name == "ADMIN"))
            .ToListAsync();

        foreach (var dgm in dgmUsers)
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = dgm.Id,
                Title = "New Proposal Awaiting Review",
                Message = $"New proposal '{proposal.Title}' ({proposal.ProjectCode}) submitted by {user.FullName} ({user.Department.Name}).",
                Type = "NewProposalPending",
                ReferenceId = proposal.Id.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Audit Logging
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Action = "PROPOSAL_SUBMITTED",
            EntityName = "Project",
            EntityId = proposal.Id.ToString(),
            Details = $"Proposal {proposal.ProjectCode} submitted by {user.Username} ({user.Department.Name}).",
            IpAddress = ip,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Proposal {Code} created by {User}", proposal.ProjectCode, user.Username);

        var dto = await MapToDto(proposal.Id);
        return CreatedAtAction(nameof(GetProposalById), new { id = proposal.Id }, dto);
    }

    /// <summary>
    /// View proposals submitted by the logged-in requester or their department.
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "ADMIN,NON_DIGITAL_LAB_USER")]
    public async Task<IActionResult> GetMyProposals()
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var isAdmin = User.IsInRole("ADMIN");

        var query = _context.Projects
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .Include(p => p.ReviewedByUser)
            .AsQueryable();

        if (!isAdmin)
        {
            // Requester can view proposals they created
            query = query.Where(p => p.CreatedByUserId == userId || p.DepartmentId == user.DepartmentId);
        }

        var proposals = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapToSimpleDto(p))
            .ToListAsync();

        return Ok(proposals);
    }

    /// <summary>
    /// DGM & Higher Management view of all submitted proposals with filters.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN,DGM,HIGHER_MANAGEMENT,DIGITAL_LAB_USER")]
    public async Task<IActionResult> GetAllProposals(
        [FromQuery] Guid? departmentId,
        [FromQuery] string? status,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? searchTerm)
    {
        var isDigitalLab = User.IsInRole("DIGITAL_LAB_USER") && !User.IsInRole("ADMIN") && !User.IsInRole("DGM") && !User.IsInRole("HIGHER_MANAGEMENT");

        var query = _context.Projects
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .Include(p => p.ReviewedByUser)
            .AsQueryable();

        // Digital Lab users can view approved proposals ready for assignment
        if (isDigitalLab)
        {
            query = query.Where(p => p.Status == "APPROVED" || p.Status == "Ongoing" || p.Status == "Assigned");
        }
        else if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Status == status);
        }

        if (departmentId.HasValue && departmentId.Value != Guid.Empty)
        {
            query = query.Where(p => p.DepartmentId == departmentId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(p => p.CreatedAt >= startDate.Value.ToUniversalTime());
        }

        if (endDate.HasValue)
        {
            query = query.Where(p => p.CreatedAt <= endDate.Value.ToUniversalTime());
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(term) ||
                p.ProjectCode.ToLower().Contains(term) ||
                p.BusinessProblem.ToLower().Contains(term) ||
                p.Department.Name.ToLower().Contains(term));
        }

        var list = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapToSimpleDto(p))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>
    /// Get full proposal details with evaluation and status history.
    /// Enforces departmental and role permissions.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProposalById(Guid id)
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var proposal = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.CreatedByUser)
            .Include(p => p.ReviewedByUser)
            .Include(p => p.StatusHistory)
                .ThenInclude(sh => sh.ChangedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null)
            return NotFound(new { message = "Proposal not found." });

        // Permission check: Non-Digital Lab users can only view their own or department proposals
        var isManagementOrAdmin = User.IsInRole("ADMIN") || User.IsInRole("DGM") || User.IsInRole("HIGHER_MANAGEMENT");
        var isDigitalLab = User.IsInRole("DIGITAL_LAB_USER");

        if (!isManagementOrAdmin)
        {
            if (isDigitalLab)
            {
                // Can only view if approved or assigned
                if (proposal.Status != "APPROVED" && proposal.Status != "Ongoing" && proposal.Status != "Assigned")
                {
                    return Forbid();
                }
            }
            else
            {
                // Non-digital lab user: strictly restricted to their department or own created proposal
                if (proposal.CreatedByUserId != userId && proposal.DepartmentId != user.DepartmentId)
                {
                    return Forbid();
                }
            }
        }

        var dto = MapToFullDto(proposal);
        return Ok(dto);
    }

    /// <summary>
    /// Update proposal. Allowed ONLY while status is PENDING_REVIEW and by the requester.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN,NON_DIGITAL_LAB_USER")]
    public async Task<IActionResult> UpdateProposal(Guid id, [FromBody] UpdateProposalRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetCurrentUserId();
        var proposal = await _context.Projects
            .Include(p => p.Department)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null)
            return NotFound(new { message = "Proposal not found." });

        var isAdmin = User.IsInRole("ADMIN");

        // Prevent modification by unauthorized users
        if (!isAdmin && proposal.CreatedByUserId != userId)
            return Forbid();

        // Prevent editing if already reviewed/evaluated
        if (proposal.Status != "PENDING_REVIEW")
        {
            return BadRequest(new
            {
                message = $"Proposal cannot be modified because its current status is '{proposal.Status}'. Only proposals in 'PENDING_REVIEW' can be edited."
            });
        }

        proposal.Title = request.Title.Trim();
        proposal.Description = request.BusinessProblem.Length > 2000 
            ? request.BusinessProblem[..2000] 
            : request.BusinessProblem;
        proposal.BusinessProblem = request.BusinessProblem.Trim();
        proposal.ExpectedOutcome = request.ExpectedOutcome.Trim();
        proposal.ImpactCostSaving = request.ImpactCostSaving;
        proposal.ImpactRevenue = request.ImpactRevenue;
        proposal.ImpactProcessOptimization = request.ImpactProcessOptimization;
        proposal.QuantifiedImpact = request.QuantifiedImpact?.Trim();
        proposal.AdditionalInformation = request.AdditionalInformation?.Trim();
        proposal.Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority;
        proposal.TargetEndDate = request.TargetDeadline.HasValue ? DateTime.SpecifyKind(request.TargetDeadline.Value, DateTimeKind.Utc) : null;
        proposal.UpdatedAt = DateTime.UtcNow;

        _context.ProjectStatusHistory.Add(new ProjectStatusHistory
        {
            Id = Guid.NewGuid(),
            ProjectId = proposal.Id,
            PreviousStatus = "PENDING_REVIEW",
            NewStatus = "PENDING_REVIEW",
            Remarks = "Proposal details updated by requester.",
            ChangedByUserId = userId,
            ChangedAt = DateTime.UtcNow
        });

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "PROPOSAL_UPDATED",
            EntityName = "Project",
            EntityId = proposal.Id.ToString(),
            Details = $"Proposal {proposal.ProjectCode} modified while in PENDING_REVIEW.",
            IpAddress = ip,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var updatedDto = await MapToDto(proposal.Id);
        return Ok(updatedDto);
    }

    /// <summary>
    /// DGM & ADMIN evaluation endpoint.
    /// Approve or Reject proposal. Rejection reason is mandatory when rejected.
    /// </summary>
    [HttpPost("{id:guid}/evaluate")]
    [Authorize(Roles = "ADMIN,DGM")]
    public async Task<IActionResult> EvaluateProposal(Guid id, [FromBody] EvaluateProposalRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var decision = request.Decision.Trim().ToUpperInvariant();
        if (decision != "APPROVE" && decision != "REJECT")
        {
            return BadRequest(new { message = "Invalid evaluation decision. Must be 'APPROVE' or 'REJECT'." });
        }

        // Mandatory rejection reason validation
        if (decision == "REJECT" && string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return BadRequest(new { message = "A rejection reason is mandatory when rejecting a proposal." });
        }

        var reviewerId = GetCurrentUserId();
        var reviewer = await _context.Users.FindAsync(reviewerId);
        if (reviewer == null) return Unauthorized();

        var proposal = await _context.Projects
            .Include(p => p.CreatedByUser)
            .Include(p => p.Department)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null)
            return NotFound(new { message = "Proposal not found." });

        var prevStatus = proposal.Status;
        var newStatus = decision == "APPROVE" ? "APPROVED" : "REJECTED";

        proposal.Status = newStatus;
        proposal.ReviewedByUserId = reviewer.Id;
        proposal.ReviewedAt = DateTime.UtcNow;
        proposal.ReviewRemarks = request.EvaluationComments?.Trim();
        proposal.RejectionReason = decision == "REJECT" ? request.RejectionReason?.Trim() : null;
        proposal.UpdatedAt = DateTime.UtcNow;

        var remarks = decision == "APPROVE"
            ? $"Proposal approved by DGM. Comments: {request.EvaluationComments ?? "Approved for development"}"
            : $"Proposal rejected by DGM. Reason: {request.RejectionReason}. {request.EvaluationComments ?? ""}";

        // Status History
        _context.ProjectStatusHistory.Add(new ProjectStatusHistory
        {
            Id = Guid.NewGuid(),
            ProjectId = proposal.Id,
            PreviousStatus = prevStatus,
            NewStatus = newStatus,
            Remarks = remarks,
            ChangedByUserId = reviewer.Id,
            ChangedAt = DateTime.UtcNow
        });

        // Notifications for Requester
        if (decision == "APPROVE")
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = proposal.CreatedByUserId,
                Title = "Proposal Approved! 🎉",
                Message = $"Congratulations! Your project proposal '{proposal.Title}' ({proposal.ProjectCode}) has been approved by DGM.",
                Type = "ProposalApproved",
                ReferenceId = proposal.Id.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = proposal.CreatedByUserId,
                Title = "Proposal Rejected",
                Message = $"Your proposal '{proposal.Title}' ({proposal.ProjectCode}) was rejected by DGM. Reason: {request.RejectionReason}",
                Type = "ProposalRejected",
                ReferenceId = proposal.Id.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Audit Logging
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = reviewer.Id,
            Action = decision == "APPROVE" ? "PROPOSAL_APPROVED" : "PROPOSAL_REJECTED",
            EntityName = "Project",
            EntityId = proposal.Id.ToString(),
            Details = remarks,
            IpAddress = ip,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Proposal {Code} evaluated as {Status} by {Reviewer}", 
            proposal.ProjectCode, newStatus, reviewer.Username);

        var resultDto = await MapToDto(proposal.Id);
        return Ok(resultDto);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    private async Task<ProposalDto?> MapToDto(Guid id)
    {
        var p = await _context.Projects
            .Include(x => x.Department)
            .Include(x => x.CreatedByUser)
            .Include(x => x.ReviewedByUser)
            .Include(x => x.StatusHistory)
                .ThenInclude(sh => sh.ChangedByUser)
            .FirstOrDefaultAsync(x => x.Id == id);

        return p == null ? null : MapToFullDto(p);
    }

    private static ProposalDto MapToSimpleDto(Project p)
    {
        return new ProposalDto
        {
            Id = p.Id,
            ProjectCode = p.ProjectCode,
            Title = p.Title,
            Description = p.Description,
            BusinessProblem = p.BusinessProblem,
            ExpectedOutcome = p.ExpectedOutcome,
            ImpactCostSaving = p.ImpactCostSaving,
            ImpactRevenue = p.ImpactRevenue,
            ImpactProcessOptimization = p.ImpactProcessOptimization,
            QuantifiedImpact = p.QuantifiedImpact,
            AdditionalInformation = p.AdditionalInformation,
            Status = p.Status,
            Priority = p.Priority,
            DepartmentId = p.DepartmentId,
            DepartmentName = p.Department?.Name ?? "",
            DepartmentCode = p.Department?.Code ?? "",
            CreatedByUserId = p.CreatedByUserId,
            CreatedByUserName = p.CreatedByUser?.Username ?? "",
            CreatedByUserFullName = p.CreatedByUser?.FullName ?? "",
            CreatedByUserEmail = p.CreatedByUser?.Email ?? "",
            TargetEndDate = p.TargetEndDate,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            ReviewedByUserId = p.ReviewedByUserId,
            ReviewedByUserName = p.ReviewedByUser?.Username,
            ReviewedByUserFullName = p.ReviewedByUser?.FullName,
            ReviewedAt = p.ReviewedAt,
            ReviewRemarks = p.ReviewRemarks,
            RejectionReason = p.RejectionReason
        };
    }

    private static ProposalDto MapToFullDto(Project p)
    {
        var dto = MapToSimpleDto(p);
        dto.StatusHistory = p.StatusHistory
            .OrderByDescending(sh => sh.ChangedAt)
            .Select(sh => new ProposalStatusHistoryDto
            {
                Id = sh.Id,
                PreviousStatus = sh.PreviousStatus,
                NewStatus = sh.NewStatus,
                Remarks = sh.Remarks,
                ChangedByUserName = sh.ChangedByUser?.FullName ?? sh.ChangedByUser?.Username ?? "System",
                ChangedAt = sh.ChangedAt
            }).ToList();

        return dto;
    }
}
