using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SltCommunicationSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProposalFieldsToProject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdditionalInformation",
                table: "Projects",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessProblem",
                table: "Projects",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ExpectedOutcome",
                table: "Projects",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "ImpactCostSaving",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ImpactProcessOptimization",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ImpactRevenue",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "QuantifiedImpact",
                table: "Projects",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Projects",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewRemarks",
                table: "Projects",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "Projects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "Projects",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ReviewedByUserId",
                table: "Projects",
                column: "ReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Users_ReviewedByUserId",
                table: "Projects",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Users_ReviewedByUserId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_ReviewedByUserId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "AdditionalInformation",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "BusinessProblem",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ExpectedOutcome",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ImpactCostSaving",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ImpactProcessOptimization",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ImpactRevenue",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "QuantifiedImpact",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ReviewRemarks",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "Projects");
        }
    }
}
