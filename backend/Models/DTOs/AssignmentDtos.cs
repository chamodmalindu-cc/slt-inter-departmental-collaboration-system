using System.ComponentModel.DataAnnotations;

namespace SltCommunicationSystem.Api.Models.DTOs;

public class CreateAssignmentRequest
{
    [Required(ErrorMessage = "Project ID is required.")]
    public Guid ProjectId { get; set; }

    [Required(ErrorMessage = "Supervisor User ID is required.")]
    public Guid SupervisorUserId { get; set; }

    [Required(ErrorMessage = "Project assignment deadline is required.")]
    public DateTime AssignedDeadline { get; set; }

    [MaxLength(4000)]
    public string? Instructions { get; set; }

    [MaxLength(50)]
    public string AssignmentRole { get; set; } = "Supervisor";
}

public class RespondAssignmentRequest
{
    [Required(ErrorMessage = "Action must be 'ACCEPT' or 'DECLINE'.")]
    public string Action { get; set; } = string.Empty; // "ACCEPT" or "DECLINE"

    [MaxLength(2000)]
    public string? DeclineReason { get; set; }
}

public class CancelAssignmentRequest
{
    [MaxLength(2000)]
    public string? Reason { get; set; }
}

public class ProjectAssignmentDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;

    public Guid UserId { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public string SupervisorUsername { get; set; } = string.Empty;
    public string SupervisorEmail { get; set; } = string.Empty;

    public string AssignmentRole { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // PENDING_ACCEPTANCE, ACCEPTED, DECLINED, CANCELLED
    public string? Instructions { get; set; }
    public string? DeclineReason { get; set; }
    public DateTime? AssignedDeadline { get; set; }

    public Guid? AssignedByUserId { get; set; }
    public string? AssignedByUserName { get; set; }
    public string? AssignedByUserFullName { get; set; }

    public DateTime AssignedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public bool IsActive { get; set; }
}

public class SupervisorCandidateDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int ActiveAssignmentsCount { get; set; }
    public bool IsActive { get; set; }
}
