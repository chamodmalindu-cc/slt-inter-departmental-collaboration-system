using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SltCommunicationSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddChatAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AttachmentId",
                table: "ChatMessages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChatAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatRoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    StoredFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FileExtension = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatAttachments_ChatRooms_ChatRoomId",
                        column: x => x.ChatRoomId,
                        principalTable: "ChatRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatAttachments_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_AttachmentId",
                table: "ChatMessages",
                column: "AttachmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatAttachments_ChatRoomId",
                table: "ChatAttachments",
                column: "ChatRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatAttachments_UploadedAt",
                table: "ChatAttachments",
                column: "UploadedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatAttachments_UploadedByUserId",
                table: "ChatAttachments",
                column: "UploadedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_ChatAttachments_AttachmentId",
                table: "ChatMessages",
                column: "AttachmentId",
                principalTable: "ChatAttachments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_ChatAttachments_AttachmentId",
                table: "ChatMessages");

            migrationBuilder.DropTable(
                name: "ChatAttachments");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_AttachmentId",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "AttachmentId",
                table: "ChatMessages");
        }
    }
}
