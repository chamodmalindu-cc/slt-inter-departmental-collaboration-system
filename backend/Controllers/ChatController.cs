using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Data;
using SltCommunicationSystem.Api.Hubs;
using SltCommunicationSystem.Api.Models.DTOs;
using SltCommunicationSystem.Api.Models.Entities;
using SltCommunicationSystem.Api.Services;

namespace SltCommunicationSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _chatHubContext;
    private readonly IFileStorageService _fileStorageService;
    private readonly AppDbContext _context;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        IChatService chatService,
        IHubContext<ChatHub> chatHubContext,
        IFileStorageService fileStorageService,
        AppDbContext context,
        ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _chatHubContext = chatHubContext;
        _fileStorageService = fileStorageService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all chat rooms where the logged-in user is an authorized participant.
    /// Includes project metadata, unread message counts, last message, and participant presence.
    /// </summary>
    [HttpGet("rooms")]
    public async Task<IActionResult> GetMyChatRooms()
    {
        var userId = GetCurrentUserId();
        var rooms = await _chatService.GetUserChatRoomsAsync(userId);
        return Ok(rooms);
    }

    /// <summary>
    /// Get room overview and participant list for a specific room.
    /// Strictly verifies the caller is an enrolled participant.
    /// </summary>
    [HttpGet("rooms/{roomId:guid}")]
    public async Task<IActionResult> GetRoomById(Guid roomId)
    {
        var userId = GetCurrentUserId();
        var isParticipant = await _chatService.IsUserParticipantAsync(roomId, userId);
        if (!isParticipant)
        {
            _logger.LogWarning("Security Check Failed: User {UserId} attempted to view unauthorized ChatRoom {RoomId}.", userId, roomId);
            return Forbid();
        }

        var room = await _chatService.GetRoomSummaryAsync(roomId, userId);
        if (room == null)
            return NotFound(new { message = "Chat room not found or inactive." });

        return Ok(room);
    }

    /// <summary>
    /// Retrieve full message history for a specific project chat room.
    /// Marks the room as read for the caller.
    /// </summary>
    [HttpGet("rooms/{roomId:guid}/messages")]
    public async Task<IActionResult> GetRoomMessages(Guid roomId)
    {
        var userId = GetCurrentUserId();
        var isParticipant = await _chatService.IsUserParticipantAsync(roomId, userId);
        if (!isParticipant)
        {
            _logger.LogWarning("Security Check Failed: User {UserId} attempted to read messages from unauthorized ChatRoom {RoomId}.", userId, roomId);
            return Forbid();
        }

        try
        {
            var messages = await _chatService.GetRoomMessagesAsync(roomId, userId);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Send a message via REST API (fallback / complementary to direct SignalR send).
    /// Persists message, broadcasts to SignalR group, and alerts other participants.
    /// </summary>
    [HttpPost("rooms/{roomId:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid roomId, [FromBody] SendMessageRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetCurrentUserId();
        var isParticipant = await _chatService.IsUserParticipantAsync(roomId, userId);
        if (!isParticipant)
        {
            _logger.LogWarning("Security Check Failed: User {UserId} attempted to post message in unauthorized ChatRoom {RoomId}.", userId, roomId);
            return Forbid();
        }

        try
        {
            var messageDto = await _chatService.SaveMessageAsync(roomId, userId, request.Content, "Text");

            // Broadcast via SignalR to room group
            await _chatHubContext.Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", messageDto);

            // Broadcast room activity to participants
            var participantUserIds = await _chatService.GetRoomParticipantUserIdsAsync(roomId);
            foreach (var participantId in participantUserIds)
            {
                if (participantId != userId)
                {
                    await _chatHubContext.Clients.User(participantId.ToString()).SendAsync("RoomActivityUpdate", new
                    {
                        RoomId = roomId.ToString(),
                        LastMessage = messageDto
                    });
                }
            }

            return Ok(messageDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Mark room messages as read for the caller.
    /// </summary>
    [HttpPost("rooms/{roomId:guid}/read")]
    public async Task<IActionResult> MarkRoomRead(Guid roomId)
    {
        var userId = GetCurrentUserId();
        var isParticipant = await _chatService.IsUserParticipantAsync(roomId, userId);
        if (!isParticipant) return Forbid();

        await _chatService.MarkAsReadAsync(roomId, userId);
        return Ok(new { success = true });
    }

    /// <summary>
    /// Get or locate the dedicated chat room for a specific project.
    /// Verifies caller authorization.
    /// </summary>
    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetChatRoomByProject(Guid projectId)
    {
        var userId = GetCurrentUserId();

        var room = await _context.ChatRooms
            .Include(cr => cr.Participants)
            .FirstOrDefaultAsync(cr => cr.ProjectId == projectId && cr.IsActive);

        if (room == null)
        {
            return NotFound(new { message = "No chat room found for this project yet. A chat room is created automatically when the assignment is accepted." });
        }

        var isParticipant = room.Participants.Any(p => p.UserId == userId);
        if (!isParticipant)
        {
            // Management role check (Admin / DGM)
            var isAdmin = User.IsInRole("ADMIN");
            if (!isAdmin)
            {
                return Forbid();
            }
        }

        var summary = await _chatService.GetRoomSummaryAsync(room.Id, userId);
        return Ok(summary);
    }

    /// <summary>
    /// Upload a document or image attachment to a project chat room.
    /// Strictly verifies room membership, validates file size (max 10MB) and type.
    /// Stores file on disk outside public directory, persists metadata, records audit log,
    /// and broadcasts new attachment message via SignalR to room participants.
    /// </summary>
    [HttpPost("rooms/{roomId:guid}/attachments")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> UploadAttachment(Guid roomId, IFormFile? file)
    {
        var userId = GetCurrentUserId();
        var isParticipant = await _chatService.IsUserParticipantAsync(roomId, userId);
        if (!isParticipant)
        {
            _logger.LogWarning("Security Check Failed: User {UserId} attempted to upload attachment to unauthorized ChatRoom {RoomId}.", userId, roomId);
            return Forbid();
        }

        var validation = _fileStorageService.ValidateFile(file);
        if (!validation.IsValid)
        {
            return BadRequest(new { message = validation.ErrorMessage });
        }

        try
        {
            // Save file to disk with unique GUID filename
            var (storedFileName, storagePath, contentType, fileSize, fileExtension) = await _fileStorageService.SaveFileAsync(file!);

            // Save ChatAttachment record
            var attachment = new ChatAttachment
            {
                Id = Guid.NewGuid(),
                ChatRoomId = roomId,
                UploadedByUserId = userId,
                OriginalFileName = Path.GetFileName(file!.FileName),
                StoredFileName = storedFileName,
                FileExtension = fileExtension,
                ContentType = contentType,
                FileSize = fileSize,
                StoragePath = storagePath,
                UploadedAt = DateTime.UtcNow
            };

            _context.ChatAttachments.Add(attachment);

            // Audit Log
            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = "CHAT_ATTACHMENT_UPLOAD",
                EntityName = "ChatAttachment",
                EntityId = attachment.Id.ToString(),
                Details = $"Uploaded attachment '{attachment.OriginalFileName}' ({attachment.FileSize} bytes, {attachment.FileExtension}) to room {roomId}",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Create corresponding chat message linking this attachment
            var messageDto = await _chatService.SaveMessageAsync(
                roomId,
                userId,
                attachment.OriginalFileName,
                "Attachment",
                attachment.Id);

            var canViewInline = _fileStorageService.CanViewInline(attachment.FileExtension);
            var attachmentDto = new ChatAttachmentDto
            {
                Id = attachment.Id,
                ChatRoomId = attachment.ChatRoomId,
                UploadedByUserId = attachment.UploadedByUserId,
                UploadedByUserName = messageDto.SenderName,
                OriginalFileName = attachment.OriginalFileName,
                FileExtension = attachment.FileExtension,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                UploadedAt = attachment.UploadedAt,
                DownloadUrl = $"/api/chat/attachments/{attachment.Id}/download",
                ViewUrl = canViewInline ? $"/api/chat/attachments/{attachment.Id}/view" : null,
                CanViewInline = canViewInline
            };

            // Broadcast message (with attachment) via SignalR to the room group
            await _chatHubContext.Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", messageDto);
            await _chatHubContext.Clients.Group(roomId.ToString()).SendAsync("ReceiveAttachment", attachmentDto);

            // Broadcast room activity to all participants
            var participantUserIds = await _chatService.GetRoomParticipantUserIdsAsync(roomId);
            foreach (var participantId in participantUserIds)
            {
                if (participantId != userId)
                {
                    await _chatHubContext.Clients.User(participantId.ToString()).SendAsync("RoomActivityUpdate", new
                    {
                        RoomId = roomId.ToString(),
                        LastMessage = messageDto
                    });
                }
            }

            return Ok(new
            {
                message = "Attachment uploaded successfully.",
                attachment = attachmentDto,
                chatMessage = messageDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload attachment to room {RoomId}", roomId);
            return StatusCode(500, new { message = "An error occurred while uploading the file." });
        }
    }

    /// <summary>
    /// Retrieve list of all attachments shared in a specific chat room.
    /// Strictly verifies caller is an authorized participant.
    /// </summary>
    [HttpGet("rooms/{roomId:guid}/attachments")]
    public async Task<IActionResult> GetRoomAttachments(Guid roomId)
    {
        var userId = GetCurrentUserId();
        var isParticipant = await _chatService.IsUserParticipantAsync(roomId, userId);
        if (!isParticipant)
        {
            _logger.LogWarning("Security Check Failed: User {UserId} attempted to view attachments for unauthorized ChatRoom {RoomId}.", userId, roomId);
            return Forbid();
        }

        var attachments = await _context.ChatAttachments
            .Where(ca => ca.ChatRoomId == roomId)
            .Include(ca => ca.UploadedByUser)
            .OrderByDescending(ca => ca.UploadedAt)
            .ToListAsync();

        var dtoList = attachments.Select(a =>
        {
            var canViewInline = _fileStorageService.CanViewInline(a.FileExtension);
            return new ChatAttachmentDto
            {
                Id = a.Id,
                ChatRoomId = a.ChatRoomId,
                UploadedByUserId = a.UploadedByUserId,
                UploadedByUserName = a.UploadedByUser?.FullName ?? "Unknown User",
                OriginalFileName = a.OriginalFileName,
                FileExtension = a.FileExtension,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                UploadedAt = a.UploadedAt,
                DownloadUrl = $"/api/chat/attachments/{a.Id}/download",
                ViewUrl = canViewInline ? $"/api/chat/attachments/{a.Id}/view" : null,
                CanViewInline = canViewInline
            };
        }).ToList();

        return Ok(dtoList);
    }

    /// <summary>
    /// Securely download an attachment file.
    /// Verifies caller is an authorized participant in the attachment's chat room.
    /// Prevents path traversal and forces attachment Content-Disposition header.
    /// </summary>
    [HttpGet("attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAttachment(Guid attachmentId)
    {
        var userId = GetCurrentUserId();
        var attachment = await _context.ChatAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId);

        if (attachment == null)
        {
            return NotFound(new { message = "Attachment not found." });
        }

        var isParticipant = await _chatService.IsUserParticipantAsync(attachment.ChatRoomId, userId);
        if (!isParticipant)
        {
            _logger.LogWarning("Security Check Failed: User {UserId} attempted unauthorized download of Attachment {AttachmentId}.", userId, attachmentId);
            return Forbid();
        }

        var filePath = _fileStorageService.GetFilePath(attachment.StoredFileName);
        if (!System.IO.File.Exists(filePath))
        {
            _logger.LogError("Physical attachment file missing on disk: {FilePath}", filePath);
            return NotFound(new { message = "Attachment file not found on disk." });
        }

        // Record Audit Log for secure download
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "CHAT_ATTACHMENT_DOWNLOAD",
            EntityName = "ChatAttachment",
            EntityId = attachment.Id.ToString(),
            Details = $"Downloaded file '{attachment.OriginalFileName}' ({attachment.FileSize} bytes)",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return PhysicalFile(filePath, attachment.ContentType, attachment.OriginalFileName, enableRangeProcessing: true);
    }

    /// <summary>
    /// Securely view an attachment inline (supported for safe types like PDF and images).
    /// If file type is not safe for inline viewing, forces download disposition.
    /// </summary>
    [HttpGet("attachments/{attachmentId:guid}/view")]
    public async Task<IActionResult> ViewAttachment(Guid attachmentId)
    {
        var userId = GetCurrentUserId();
        var attachment = await _context.ChatAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId);

        if (attachment == null)
        {
            return NotFound(new { message = "Attachment not found." });
        }

        var isParticipant = await _chatService.IsUserParticipantAsync(attachment.ChatRoomId, userId);
        if (!isParticipant)
        {
            _logger.LogWarning("Security Check Failed: User {UserId} attempted unauthorized view of Attachment {AttachmentId}.", userId, attachmentId);
            return Forbid();
        }

        var filePath = _fileStorageService.GetFilePath(attachment.StoredFileName);
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "Attachment file not found on disk." });
        }

        // If file extension is not safe for inline viewing, force download disposition
        if (!_fileStorageService.CanViewInline(attachment.FileExtension))
        {
            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = "CHAT_ATTACHMENT_DOWNLOAD",
                EntityName = "ChatAttachment",
                EntityId = attachment.Id.ToString(),
                Details = $"Downloaded file '{attachment.OriginalFileName}' ({attachment.FileSize} bytes) via view fallback",
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return PhysicalFile(filePath, attachment.ContentType, attachment.OriginalFileName, enableRangeProcessing: true);
        }

        // Record Audit Log for inline view
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "CHAT_ATTACHMENT_VIEW",
            EntityName = "ChatAttachment",
            EntityId = attachment.Id.ToString(),
            Details = $"Viewed file inline '{attachment.OriginalFileName}' ({attachment.ContentType})",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        Response.Headers.Append("Content-Disposition", $"inline; filename=\"{Uri.EscapeDataString(attachment.OriginalFileName)}\"");
        return PhysicalFile(filePath, attachment.ContentType, enableRangeProcessing: true);
    }

    private Guid GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(subClaim, out var userId) ? userId : Guid.Empty;
    }
}
