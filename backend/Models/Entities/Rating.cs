namespace SltCommunicationSystem.Api.Models.Entities;

public class Rating
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid RatedByUserId { get; set; }         // The person giving the rating (DGM or Requester)
    public Guid RatedSupervisorId { get; set; }     // The supervisor being rated
    public string RaterType { get; set; } = string.Empty; // "DGM" | "Requester"

    // Multi-dimension ratings (1-5)
    public int TechnicalQuality { get; set; }
    public int Communication { get; set; }
    public int TimelyDelivery { get; set; }
    public int Professionalism { get; set; }
    public int OverallRating { get; set; }

    public string? WrittenFeedback { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User RatedByUser { get; set; } = null!;
    public User RatedSupervisor { get; set; } = null!;
}
