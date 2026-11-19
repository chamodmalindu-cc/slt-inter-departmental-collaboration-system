using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SltCommunicationSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectAssignmentWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProjectAssignments_ProjectId_UserId",
                table: "ProjectAssignments");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedByUserId",
                table: "ProjectAssignments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AssignedDeadline",
                table: "ProjectAssignments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeclineReason",
                table: "ProjectAssignments",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Instructions",
                table: "ProjectAssignments",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RespondedAt",
                table: "ProjectAssignments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ProjectAssignments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_AssignedByUserId",
                table: "ProjectAssignments",
                column: "AssignedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_IsActive",
                table: "ProjectAssignments",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_Status",
                table: "ProjectAssignments",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectAssignments_Users_AssignedByUserId",
                table: "ProjectAssignments",
                column: "AssignedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectAssignments_Users_AssignedByUserId",
                table: "ProjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_ProjectAssignments_AssignedByUserId",
                table: "ProjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_ProjectAssignments_IsActive",
                table: "ProjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_ProjectAssignments_Status",
                table: "ProjectAssignments");

            migrationBuilder.DropColumn(
                name: "AssignedByUserId",
                table: "ProjectAssignments");

            migrationBuilder.DropColumn(
                name: "AssignedDeadline",
                table: "ProjectAssignments");

            migrationBuilder.DropColumn(
                name: "DeclineReason",
                table: "ProjectAssignments");

            migrationBuilder.DropColumn(
                name: "Instructions",
                table: "ProjectAssignments");

            migrationBuilder.DropColumn(
                name: "RespondedAt",
                table: "ProjectAssignments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ProjectAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_ProjectId_UserId",
                table: "ProjectAssignments",
                columns: new[] { "ProjectId", "UserId" },
                unique: true);
        }
    }
}
