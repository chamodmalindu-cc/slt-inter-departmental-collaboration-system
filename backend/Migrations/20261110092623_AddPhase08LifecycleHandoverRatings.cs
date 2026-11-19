using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SltCommunicationSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase08LifecycleHandoverRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_Departments_TargetDepartmentId",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "Feedback",
                table: "Ratings");

            migrationBuilder.RenameColumn(
                name: "TargetDepartmentId",
                table: "Ratings",
                newName: "RatedSupervisorId");

            migrationBuilder.RenameColumn(
                name: "Score",
                table: "Ratings",
                newName: "TimelyDelivery");

            migrationBuilder.RenameIndex(
                name: "IX_Ratings_TargetDepartmentId",
                table: "Ratings",
                newName: "IX_Ratings_RatedSupervisorId");

            migrationBuilder.AddColumn<int>(
                name: "Communication",
                table: "Ratings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OverallRating",
                table: "Ratings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Professionalism",
                table: "Ratings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RaterType",
                table: "Ratings",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TechnicalQuality",
                table: "Ratings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "WrittenFeedback",
                table: "Ratings",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProjectHandovers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupervisorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FinalSummary = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    DeliverablesCompleted = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    TechnicalDocumentationLinks = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    DeploymentDetails = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    KnownLimitations = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Recommendations = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    HandoverDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsFinalized = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectHandovers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectHandovers_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectHandovers_Users_SupervisorUserId",
                        column: x => x.SupervisorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProjectProgressUpdates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupervisorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdateType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    CompletedActivities = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CurrentChallenges = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    NextPlannedActivities = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    MilestoneTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    MilestoneDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectProgressUpdates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectProgressUpdates_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectProgressUpdates_Users_SupervisorUserId",
                        column: x => x.SupervisorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_ProjectId_RatedByUserId",
                table: "Ratings",
                columns: new[] { "ProjectId", "RatedByUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectHandovers_ProjectId",
                table: "ProjectHandovers",
                column: "ProjectId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectHandovers_SupervisorUserId",
                table: "ProjectHandovers",
                column: "SupervisorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectProgressUpdates_CreatedAt",
                table: "ProjectProgressUpdates",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectProgressUpdates_ProjectId",
                table: "ProjectProgressUpdates",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectProgressUpdates_SupervisorUserId",
                table: "ProjectProgressUpdates",
                column: "SupervisorUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_Users_RatedSupervisorId",
                table: "Ratings",
                column: "RatedSupervisorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_Users_RatedSupervisorId",
                table: "Ratings");

            migrationBuilder.DropTable(
                name: "ProjectHandovers");

            migrationBuilder.DropTable(
                name: "ProjectProgressUpdates");

            migrationBuilder.DropIndex(
                name: "IX_Ratings_ProjectId_RatedByUserId",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "Communication",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "OverallRating",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "Professionalism",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "RaterType",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "TechnicalQuality",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "WrittenFeedback",
                table: "Ratings");

            migrationBuilder.RenameColumn(
                name: "TimelyDelivery",
                table: "Ratings",
                newName: "Score");

            migrationBuilder.RenameColumn(
                name: "RatedSupervisorId",
                table: "Ratings",
                newName: "TargetDepartmentId");

            migrationBuilder.RenameIndex(
                name: "IX_Ratings_RatedSupervisorId",
                table: "Ratings",
                newName: "IX_Ratings_TargetDepartmentId");

            migrationBuilder.AddColumn<string>(
                name: "Feedback",
                table: "Ratings",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_Departments_TargetDepartmentId",
                table: "Ratings",
                column: "TargetDepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
