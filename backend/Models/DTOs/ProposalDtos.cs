using System.ComponentModel.DataAnnotations;

namespace SltCommunicationSystem.Api.Models.DTOs;

public class CreateProposalRequest
{
    [Required(ErrorMessage = "Project title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Research or business problem is required.")]
    [MaxLength(4000)]
    public string BusinessProblem { get; set; } = string.Empty;

    [Required(ErrorMessage = "Expected outcome is required.")]
    [MaxLength(4000)]
    public string ExpectedOutcome { get; set; } = string.Empty;

    public bool ImpactCostSaving { get; set; }
    public bool ImpactRevenue { get; set; }
    public bool ImpactProcessOptimization { get; set; }

    [MaxLength(2000)]
    public string? QuantifiedImpact { get; set; }

    public DateTime? TargetDeadline { get; set; }

    [MaxLength(4000)]
    public string? AdditionalInformation { get; set; }

    [MaxLength(20)]
    public string Priority { get; set; } = "Medium";
}

public class UpdateProposalRequest
{
    [Required(ErrorMessage = "Project title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Research or business problem is required.")]
    [MaxLength(4000)]
    public string BusinessProblem { get; set; } = string.Empty;

    [Required(ErrorMessage = "Expected outcome is required.")]
    [MaxLength(4000)]
    public string ExpectedOutcome { get; set; } = string.Empty;

    public bool ImpactCostSaving { get; set; }
    public bool ImpactRevenue { get; set; }
    public bool ImpactProcessOptimization { get; set; }

    [MaxLength(2000)]
    public string? QuantifiedImpact { get; set; }

    public DateTime? TargetDeadline { get; set; }

    [MaxLength(4000)]
    public string? AdditionalInformation { get; set; }

    [MaxLength(20)]
    public string Priority { get; set; } = "Medium";
}

public class EvaluateProposalRequest
{
    [Required(ErrorMessage = "Evaluation decision ('APPROVE' or 'REJECT') is required.")]
    public string Decision { get; set; } = string.Empty; // "APPROVE" or "REJECT"

    [MaxLength(2000)]
    public string? EvaluationComments { get; set; }

    [MaxLength(2000)]
    public string? RejectionReason { get; set; }
}

public class ProposalDto
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
    
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;

    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public string CreatedByUserFullName { get; set; } = string.Empty;
    public string CreatedByUserEmail { get; set; } = string.Empty;

    public DateTime? TargetEndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewedByUserName { get; set; }
    public string? ReviewedByUserFullName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewRemarks { get; set; }
    public string? RejectionReason { get; set; }

    public List<ProposalStatusHistoryDto> StatusHistory { get; set; } = new();
}

public class ProposalStatusHistoryDto
{
    public Guid Id { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string ChangedByUserName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
