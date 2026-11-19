using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Models.Entities;

namespace SltCommunicationSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectAssignment> ProjectAssignments => Set<ProjectAssignment>();
    public DbSet<ProjectStatusHistory> ProjectStatusHistory => Set<ProjectStatusHistory>();
    public DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
    public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatAttachment> ChatAttachments => Set<ChatAttachment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<ProjectProgressUpdate> ProjectProgressUpdates => Set<ProjectProgressUpdate>();
    public DbSet<ProjectHandover> ProjectHandovers => Set<ProjectHandover>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // -------------------------------------------------------------
        // Department Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Name).IsRequired().HasMaxLength(100);
            entity.Property(d => d.Code).IsRequired().HasMaxLength(20);
            entity.Property(d => d.Description).HasMaxLength(500);

            entity.HasIndex(d => d.Code).IsUnique();
            entity.HasIndex(d => d.Name);
            entity.HasIndex(d => d.IsActive);
        });

        // -------------------------------------------------------------
        // Role Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Name).IsRequired().HasMaxLength(50);
            entity.Property(r => r.Description).HasMaxLength(250);

            entity.HasIndex(r => r.Name).IsUnique();
        });

        // -------------------------------------------------------------
        // User Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(u => u.PasswordSalt).IsRequired().HasMaxLength(255);
            entity.Property(u => u.EntraObjectId).HasMaxLength(100);
            entity.Property(u => u.EntraTenantId).HasMaxLength(100);

            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => new { u.EntraTenantId, u.EntraObjectId })
                .IsUnique()
                .HasFilter("\"EntraTenantId\" IS NOT NULL AND \"EntraObjectId\" IS NOT NULL");
            entity.HasIndex(u => u.EntraObjectId)
                .IsUnique()
                .HasFilter("\"EntraObjectId\" IS NOT NULL");
            entity.HasIndex(u => u.DepartmentId);
            entity.HasIndex(u => u.IsActive);
            entity.HasIndex(u => u.IsDemoAccount);

            entity.HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // UserRole (Many-to-Many Join)
        // -------------------------------------------------------------
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });

            entity.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // -------------------------------------------------------------
        // Project Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.ProjectCode).IsRequired().HasMaxLength(50);
            entity.Property(p => p.Title).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Description).IsRequired().HasMaxLength(2000);
            entity.Property(p => p.BusinessProblem).HasMaxLength(4000);
            entity.Property(p => p.ExpectedOutcome).HasMaxLength(4000);
            entity.Property(p => p.QuantifiedImpact).HasMaxLength(2000);
            entity.Property(p => p.AdditionalInformation).HasMaxLength(4000);
            entity.Property(p => p.ReviewRemarks).HasMaxLength(2000);
            entity.Property(p => p.RejectionReason).HasMaxLength(2000);
            entity.Property(p => p.Status).IsRequired().HasMaxLength(50);
            entity.Property(p => p.Priority).IsRequired().HasMaxLength(20);

            entity.HasIndex(p => p.ProjectCode).IsUnique();
            entity.HasIndex(p => p.Status);
            entity.HasIndex(p => p.Priority);
            entity.HasIndex(p => p.DepartmentId);
            entity.HasIndex(p => p.CreatedByUserId);
            entity.HasIndex(p => p.CreatedAt);

            entity.HasOne(p => p.Department)
                .WithMany(d => d.Projects)
                .HasForeignKey(p => p.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.CreatedByUser)
                .WithMany(u => u.CreatedProjects)
                .HasForeignKey(p => p.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.ReviewedByUser)
                .WithMany()
                .HasForeignKey(p => p.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // ProjectAssignment Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ProjectAssignment>(entity =>
        {
            entity.HasKey(pa => pa.Id);
            entity.Property(pa => pa.AssignmentRole).IsRequired().HasMaxLength(50);
            entity.Property(pa => pa.Status).IsRequired().HasMaxLength(50);
            entity.Property(pa => pa.Instructions).HasMaxLength(4000);
            entity.Property(pa => pa.DeclineReason).HasMaxLength(2000);

            entity.HasIndex(pa => pa.ProjectId);
            entity.HasIndex(pa => pa.UserId);
            entity.HasIndex(pa => pa.Status);
            entity.HasIndex(pa => pa.IsActive);

            entity.HasOne(pa => pa.Project)
                .WithMany(p => p.Assignments)
                .HasForeignKey(pa => pa.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pa => pa.User)
                .WithMany(u => u.ProjectAssignments)
                .HasForeignKey(pa => pa.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(pa => pa.AssignedByUser)
                .WithMany()
                .HasForeignKey(pa => pa.AssignedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // ProjectStatusHistory Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ProjectStatusHistory>(entity =>
        {
            entity.HasKey(psh => psh.Id);
            entity.Property(psh => psh.PreviousStatus).HasMaxLength(50);
            entity.Property(psh => psh.NewStatus).IsRequired().HasMaxLength(50);
            entity.Property(psh => psh.Remarks).HasMaxLength(1000);

            entity.HasIndex(psh => psh.ProjectId);
            entity.HasIndex(psh => psh.ChangedAt);

            entity.HasOne(psh => psh.Project)
                .WithMany(p => p.StatusHistory)
                .HasForeignKey(psh => psh.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(psh => psh.ChangedByUser)
                .WithMany(u => u.StatusChanges)
                .HasForeignKey(psh => psh.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // ChatRoom Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ChatRoom>(entity =>
        {
            entity.HasKey(cr => cr.Id);
            entity.Property(cr => cr.Title).IsRequired().HasMaxLength(100);
            entity.Property(cr => cr.RoomType).IsRequired().HasMaxLength(50);

            entity.HasIndex(cr => cr.ProjectId);
            entity.HasIndex(cr => cr.CreatedAt);

            entity.HasOne(cr => cr.Project)
                .WithMany(p => p.ChatRooms)
                .HasForeignKey(cr => cr.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // -------------------------------------------------------------
        // ChatParticipant Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ChatParticipant>(entity =>
        {
            entity.HasKey(cp => cp.Id);

            entity.HasIndex(cp => cp.ChatRoomId);
            entity.HasIndex(cp => cp.UserId);
            entity.HasIndex(cp => new { cp.ChatRoomId, cp.UserId }).IsUnique();

            entity.HasOne(cp => cp.ChatRoom)
                .WithMany(cr => cr.Participants)
                .HasForeignKey(cp => cp.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cp => cp.User)
                .WithMany(u => u.ChatParticipants)
                .HasForeignKey(cp => cp.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // ChatMessage Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(cm => cm.Id);
            entity.Property(cm => cm.MessageContent).IsRequired().HasMaxLength(4000);
            entity.Property(cm => cm.MessageType).IsRequired().HasMaxLength(20);

            entity.HasIndex(cm => cm.ChatRoomId);
            entity.HasIndex(cm => cm.SenderUserId);
            entity.HasIndex(cm => cm.SentAt);

            entity.HasOne(cm => cm.ChatRoom)
                .WithMany(cr => cr.Messages)
                .HasForeignKey(cm => cm.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cm => cm.SenderUser)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(cm => cm.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(cm => cm.Attachment)
                .WithMany(ca => ca.Messages)
                .HasForeignKey(cm => cm.AttachmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // -------------------------------------------------------------
        // ChatAttachment Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ChatAttachment>(entity =>
        {
            entity.HasKey(ca => ca.Id);
            entity.Property(ca => ca.OriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(ca => ca.StoredFileName).IsRequired().HasMaxLength(255);
            entity.Property(ca => ca.FileExtension).IsRequired().HasMaxLength(50);
            entity.Property(ca => ca.ContentType).IsRequired().HasMaxLength(100);
            entity.Property(ca => ca.StoragePath).IsRequired().HasMaxLength(500);

            entity.HasIndex(ca => ca.ChatRoomId);
            entity.HasIndex(ca => ca.UploadedByUserId);
            entity.HasIndex(ca => ca.UploadedAt);

            entity.HasOne(ca => ca.ChatRoom)
                .WithMany(cr => cr.Attachments)
                .HasForeignKey(ca => ca.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ca => ca.UploadedByUser)
                .WithMany(u => u.UploadedAttachments)
                .HasForeignKey(ca => ca.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // Notification Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Title).IsRequired().HasMaxLength(150);
            entity.Property(n => n.Message).IsRequired().HasMaxLength(1000);
            entity.Property(n => n.Type).IsRequired().HasMaxLength(50);
            entity.Property(n => n.ReferenceId).HasMaxLength(100);

            entity.HasIndex(n => n.UserId);
            entity.HasIndex(n => n.IsRead);
            entity.HasIndex(n => n.CreatedAt);

            entity.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // -------------------------------------------------------------
        // Rating Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<Rating>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.RaterType).IsRequired().HasMaxLength(20);
            entity.Property(r => r.WrittenFeedback).HasMaxLength(2000);

            entity.HasIndex(r => r.ProjectId);
            entity.HasIndex(r => r.RatedByUserId);
            entity.HasIndex(r => r.RatedSupervisorId);
            entity.HasIndex(r => new { r.ProjectId, r.RatedByUserId }).IsUnique(); // one rating per rater per project
            entity.HasIndex(r => r.CreatedAt);

            entity.HasOne(r => r.Project)
                .WithMany(p => p.Ratings)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.RatedByUser)
                .WithMany(u => u.GivenRatings)
                .HasForeignKey(r => r.RatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.RatedSupervisor)
                .WithMany(u => u.ReceivedRatings)
                .HasForeignKey(r => r.RatedSupervisorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // ProjectProgressUpdate Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ProjectProgressUpdate>(entity =>
        {
            entity.HasKey(pu => pu.Id);
            entity.Property(pu => pu.UpdateType).IsRequired().HasMaxLength(20);
            entity.Property(pu => pu.Description).IsRequired().HasMaxLength(4000);
            entity.Property(pu => pu.CompletedActivities).HasMaxLength(4000);
            entity.Property(pu => pu.CurrentChallenges).HasMaxLength(4000);
            entity.Property(pu => pu.NextPlannedActivities).HasMaxLength(4000);
            entity.Property(pu => pu.MilestoneTitle).HasMaxLength(200);

            entity.HasIndex(pu => pu.ProjectId);
            entity.HasIndex(pu => pu.SupervisorUserId);
            entity.HasIndex(pu => pu.CreatedAt);

            entity.HasOne(pu => pu.Project)
                .WithMany(p => p.ProgressUpdates)
                .HasForeignKey(pu => pu.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pu => pu.SupervisorUser)
                .WithMany(u => u.ProgressUpdates)
                .HasForeignKey(pu => pu.SupervisorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // ProjectHandover Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<ProjectHandover>(entity =>
        {
            entity.HasKey(ph => ph.Id);
            entity.Property(ph => ph.FinalSummary).IsRequired().HasMaxLength(8000);
            entity.Property(ph => ph.DeliverablesCompleted).IsRequired().HasMaxLength(8000);
            entity.Property(ph => ph.TechnicalDocumentationLinks).HasMaxLength(4000);
            entity.Property(ph => ph.DeploymentDetails).HasMaxLength(4000);
            entity.Property(ph => ph.KnownLimitations).HasMaxLength(4000);
            entity.Property(ph => ph.Recommendations).HasMaxLength(4000);

            entity.HasIndex(ph => ph.ProjectId).IsUnique(); // one handover per project
            entity.HasIndex(ph => ph.SupervisorUserId);

            entity.HasOne(ph => ph.Project)
                .WithOne(p => p.Handover)
                .HasForeignKey<ProjectHandover>(ph => ph.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ph => ph.SupervisorUser)
                .WithMany(u => u.ProjectHandovers)
                .HasForeignKey(ph => ph.SupervisorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // -------------------------------------------------------------
        // AuditLog Configuration
        // -------------------------------------------------------------
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(al => al.Id);
            entity.Property(al => al.Action).IsRequired().HasMaxLength(100);
            entity.Property(al => al.EntityName).IsRequired().HasMaxLength(100);
            entity.Property(al => al.EntityId).HasMaxLength(100);
            entity.Property(al => al.IpAddress).HasMaxLength(50);

            entity.HasIndex(al => al.UserId);
            entity.HasIndex(al => al.Action);
            entity.HasIndex(al => al.EntityName);
            entity.HasIndex(al => al.Timestamp);

            entity.HasOne(al => al.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
