using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Data;
using SltCommunicationSystem.Api.Models.DTOs;
using SltCommunicationSystem.Api.Models.Entities;

namespace SltCommunicationSystem.Api.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _context;
    private readonly IUserPresenceTracker _presenceTracker;

    public ChatService(AppDbContext context, IUserPresenceTracker presenceTracker)
    {
        _context = context;
        _presenceTracker = presenceTracker;
    }

    /// <summary>
    /// Ensures a dedicated chat room exists for an accepted project with the exact three authorized participants:
    /// DGM, Project Requester, and Assigned Digital Lab Supervisor.
    /// </summary>
    public async Task<ChatRoom> EnsureProjectChatRoomAsync(
        Guid projectId,
        Guid supervisorUserId,
        Guid? dgmUserId,
        Guid requesterUserId)
    {
        var project = await _context.Projects
            .Include(p => p.Department)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new InvalidOperationException($"Project with ID {projectId} not found.");

        // Find DGM user if not explicitly passed
        if (!dgmUserId.HasValue || dgmUserId.Value == Guid.Empty)
        {
            var dgmRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "DGM");
            if (dgmRole != null)
            {
                var dgmUser = await _context.UserRoles
                    .Where(ur => ur.RoleId == dgmRole.Id)
                    .Select(ur => ur.UserId)
                    .FirstOrDefaultAsync();

                if (dgmUser != Guid.Empty)
                    dgmUserId = dgmUser;
            }
        }

        var existingRoom = await _context.ChatRooms
            .Include(cr => cr.Participants)
            .FirstOrDefaultAsync(cr => cr.ProjectId == projectId && cr.IsActive);

        if (existingRoom != null)
        {
            // Verify all 3 authorized participants are enrolled
            var requiredUserIds = new List<Guid> { supervisorUserId, requesterUserId };
            if (dgmUserId.HasValue) requiredUserIds.Add(dgmUserId.Value);

            bool modified = false;
            foreach (var uid in requiredUserIds)
            {
                if (!existingRoom.Participants.Any(p => p.UserId == uid))
                {
                    existingRoom.Participants.Add(new ChatParticipant
                    {
                        Id = Guid.NewGuid(),
                        ChatRoomId = existingRoom.Id,
                        UserId = uid,
                        JoinedAt = DateTime.UtcNow
                    });
                    modified = true;
                }
            }

            if (modified)
                await _context.SaveChangesAsync();

            return existingRoom;
        }

        // Create new dedicated Project Chat Room
        var newRoom = new ChatRoom
        {
            Id = Guid.NewGuid(),
            Title = $"{project.ProjectCode} - {project.Title}",
            RoomType = "ProjectGroup",
            ProjectId = projectId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Add the 3 authorized participants
        newRoom.Participants.Add(new ChatParticipant
        {
            Id = Guid.NewGuid(),
            ChatRoomId = newRoom.Id,
            UserId = supervisorUserId,
            IsAdmin = false,
            JoinedAt = DateTime.UtcNow
        });

        newRoom.Participants.Add(new ChatParticipant
        {
            Id = Guid.NewGuid(),
            ChatRoomId = newRoom.Id,
            UserId = requesterUserId,
            IsAdmin = false,
            JoinedAt = DateTime.UtcNow
        });

        if (dgmUserId.HasValue && dgmUserId.Value != Guid.Empty)
        {
            newRoom.Participants.Add(new ChatParticipant
            {
                Id = Guid.NewGuid(),
                ChatRoomId = newRoom.Id,
                UserId = dgmUserId.Value,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            });
        }

        _context.ChatRooms.Add(newRoom);
        await _context.SaveChangesAsync();

        // Add Initial System Message
        var supervisor = await _context.Users.FindAsync(supervisorUserId);
        var supervisorName = supervisor?.FullName ?? "Digital Lab Specialist";

        var initialSystemMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatRoomId = newRoom.Id,
            SenderUserId = supervisorUserId,
            MessageContent = $"🚀 Digital Lab Supervisor {supervisorName} accepted the project assignment. Dedicated project collaboration room initialized.",
            MessageType = "System",
            SentAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(initialSystemMessage);
        await _context.SaveChangesAsync();

        return newRoom;
    }

    public async Task<List<ChatRoomSummaryDto>> GetUserChatRoomsAsync(Guid userId)
    {
        var participantEntries = await _context.ChatParticipants
            .Where(cp => cp.UserId == userId)
            .Include(cp => cp.ChatRoom)
                .ThenInclude(cr => cr.Project!)
                    .ThenInclude(p => p.Department)
            .ToListAsync();

        var roomIds = participantEntries.Select(cp => cp.ChatRoomId).ToList();

        var allParticipants = await _context.ChatParticipants
            .Where(cp => roomIds.Contains(cp.ChatRoomId))
            .Include(cp => cp.User)
                .ThenInclude(u => u.Department)
            .Include(cp => cp.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .ToListAsync();

        var latestMessages = await _context.ChatMessages
            .Where(cm => roomIds.Contains(cm.ChatRoomId))
            .Include(cm => cm.SenderUser)
                .ThenInclude(u => u.Department)
            .Include(cm => cm.SenderUser)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Include(cm => cm.Attachment)
                .ThenInclude(a => a!.UploadedByUser)
            .OrderByDescending(cm => cm.SentAt)
            .ToListAsync();

        var summaries = new List<ChatRoomSummaryDto>();

        foreach (var pe in participantEntries)
        {
            var room = pe.ChatRoom;
            if (!room.IsActive) continue;

            var roomParticipants = allParticipants
                .Where(p => p.ChatRoomId == room.Id)
                .Select(p => new ChatParticipantDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    FullName = p.User.FullName,
                    Username = p.User.Username,
                    Role = p.User.UserRoles.FirstOrDefault()?.Role.Name ?? "User",
                    DepartmentCode = p.User.Department?.Code ?? "",
                    IsOnline = _presenceTracker.IsUserOnline(p.UserId),
                    JoinedAt = p.JoinedAt,
                    LastReadAt = p.LastReadAt
                })
                .ToList();

            var roomMsgs = latestMessages.Where(m => m.ChatRoomId == room.Id).ToList();
            var lastMsg = roomMsgs.FirstOrDefault();

            // Unread count: messages sent after pe.LastReadAt and not sent by current user
            var lastRead = pe.LastReadAt ?? pe.JoinedAt;
            var unreadCount = roomMsgs.Count(m => m.SentAt > lastRead && m.SenderUserId != userId);

            summaries.Add(new ChatRoomSummaryDto
            {
                Id = room.Id,
                Title = room.Title,
                RoomType = room.RoomType,
                ProjectId = room.ProjectId,
                ProjectCode = room.Project?.ProjectCode,
                ProjectTitle = room.Project?.Title,
                DepartmentName = room.Project?.Department?.Name,
                CreatedAt = room.CreatedAt,
                UnreadCount = unreadCount,
                LastMessage = lastMsg != null ? MapToMessageDto(lastMsg, userId) : null,
                Participants = roomParticipants
            });
        }

        return summaries
            .OrderByDescending(s => s.LastMessage?.SentAt ?? s.CreatedAt)
            .ToList();
    }

    public async Task<ChatRoomSummaryDto?> GetRoomSummaryAsync(Guid roomId, Guid userId)
    {
        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatRoomId == roomId && cp.UserId == userId);

        if (participant == null) return null;

        var room = await _context.ChatRooms
            .Include(cr => cr.Project!)
                .ThenInclude(p => p.Department)
            .FirstOrDefaultAsync(cr => cr.Id == roomId);

        if (room == null || !room.IsActive) return null;

        var rawParticipants = await _context.ChatParticipants
            .Where(cp => cp.ChatRoomId == roomId)
            .Include(cp => cp.User)
                .ThenInclude(u => u.Department)
            .Include(cp => cp.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .ToListAsync();

        var participants = rawParticipants
            .Select(p => new ChatParticipantDto
            {
                Id = p.Id,
                UserId = p.UserId,
                FullName = p.User.FullName,
                Username = p.User.Username,
                Role = p.User.UserRoles.FirstOrDefault()?.Role.Name ?? "User",
                DepartmentCode = p.User.Department?.Code ?? "",
                IsOnline = _presenceTracker.IsUserOnline(p.UserId),
                JoinedAt = p.JoinedAt,
                LastReadAt = p.LastReadAt
            })
            .ToList();

        var lastMsg = await _context.ChatMessages
            .Where(cm => cm.ChatRoomId == roomId)
            .Include(cm => cm.SenderUser)
                .ThenInclude(u => u.Department)
            .Include(cm => cm.SenderUser)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Include(cm => cm.Attachment)
                .ThenInclude(a => a!.UploadedByUser)
            .OrderByDescending(cm => cm.SentAt)
            .FirstOrDefaultAsync();

        return new ChatRoomSummaryDto
        {
            Id = room.Id,
            Title = room.Title,
            RoomType = room.RoomType,
            ProjectId = room.ProjectId,
            ProjectCode = room.Project?.ProjectCode,
            ProjectTitle = room.Project?.Title,
            DepartmentName = room.Project?.Department?.Name,
            CreatedAt = room.CreatedAt,
            UnreadCount = 0,
            LastMessage = lastMsg != null ? MapToMessageDto(lastMsg, userId) : null,
            Participants = participants
        };
    }

    public async Task<List<ChatMessageDto>> GetRoomMessagesAsync(Guid roomId, Guid userId)
    {
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatRoomId == roomId && cp.UserId == userId);

        if (!isParticipant)
            throw new UnauthorizedAccessException("You are not an authorized participant in this room.");

        // Update caller's LastReadAt
        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatRoomId == roomId && cp.UserId == userId);

        if (participant != null)
        {
            participant.LastReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        var messages = await _context.ChatMessages
            .Where(cm => cm.ChatRoomId == roomId)
            .Include(cm => cm.SenderUser)
                .ThenInclude(u => u.Department)
            .Include(cm => cm.SenderUser)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Include(cm => cm.Attachment)
                .ThenInclude(a => a!.UploadedByUser)
            .OrderBy(cm => cm.SentAt)
            .ToListAsync();

        return messages.Select(m => MapToMessageDto(m, userId)).ToList();
    }

    public async Task<ChatMessageDto> SaveMessageAsync(
        Guid roomId,
        Guid senderUserId,
        string content,
        string messageType = "Text",
        Guid? attachmentId = null)
    {
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatRoomId == roomId && cp.UserId == senderUserId);

        if (!isParticipant)
            throw new UnauthorizedAccessException("User is not an authorized participant in this room.");

        var cleanContent = content.Trim();
        if (string.IsNullOrWhiteSpace(cleanContent))
            throw new ArgumentException("Message content cannot be empty.");

        if (cleanContent.Length > 2000)
            throw new ArgumentException("Message content cannot exceed 2000 characters.");

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatRoomId = roomId,
            SenderUserId = senderUserId,
            MessageContent = cleanContent,
            MessageType = messageType,
            AttachmentId = attachmentId,
            SentAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);

        // Update sender's LastReadAt
        var senderParticipant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatRoomId == roomId && cp.UserId == senderUserId);
        if (senderParticipant != null)
        {
            senderParticipant.LastReadAt = DateTime.UtcNow;
        }

        // Query room and other participants for notification creation
        var room = await _context.ChatRooms
            .Include(cr => cr.Project)
            .FirstOrDefaultAsync(cr => cr.Id == roomId);

        var sender = await _context.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == senderUserId);

        var otherParticipants = await _context.ChatParticipants
            .Where(cp => cp.ChatRoomId == roomId && cp.UserId != senderUserId)
            .ToListAsync();

        var snippet = messageType == "Attachment" 
            ? $"📎 Shared an attachment: {cleanContent}" 
            : (cleanContent.Length > 60 ? cleanContent.Substring(0, 57) + "..." : cleanContent);
        var projectLabel = room?.Project?.ProjectCode ?? room?.Title ?? "Project Chat";

        foreach (var op in otherParticipants)
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = op.UserId,
                Title = $"Chat: {projectLabel}",
                Message = $"{sender?.FullName ?? "Participant"}: \"{snippet}\"",
                Type = "ChatMessage",
                ReferenceId = roomId.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        message.SenderUser = sender!;
        if (attachmentId.HasValue)
        {
            message.Attachment = await _context.ChatAttachments
                .Include(a => a.UploadedByUser)
                .FirstOrDefaultAsync(a => a.Id == attachmentId.Value);
        }

        return MapToMessageDto(message, senderUserId);
    }

    public async Task<ChatMessageDto> AddSystemMessageAsync(Guid roomId, string content, Guid? actorUserId = null)
    {
        var room = await _context.ChatRooms.FindAsync(roomId)
            ?? throw new InvalidOperationException($"Chat room {roomId} not found.");

        Guid senderId;
        if (actorUserId.HasValue && actorUserId.Value != Guid.Empty)
        {
            senderId = actorUserId.Value;
        }
        else
        {
            // Use first participant as proxy sender
            var firstParticipant = await _context.ChatParticipants
                .FirstOrDefaultAsync(cp => cp.ChatRoomId == roomId);
            senderId = firstParticipant?.UserId ?? Guid.Empty;
        }

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatRoomId = roomId,
            SenderUserId = senderId,
            MessageContent = content.Trim(),
            MessageType = "System",
            SentAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        var sender = await _context.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == senderId);

        message.SenderUser = sender!;
        return MapToMessageDto(message, Guid.Empty);
    }

    public async Task<bool> IsUserParticipantAsync(Guid roomId, Guid userId)
    {
        return await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatRoomId == roomId && cp.UserId == userId);
    }

    public async Task MarkAsReadAsync(Guid roomId, Guid userId)
    {
        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatRoomId == roomId && cp.UserId == userId);

        if (participant != null)
        {
            participant.LastReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<Guid>> GetRoomParticipantUserIdsAsync(Guid roomId)
    {
        return await _context.ChatParticipants
            .Where(cp => cp.ChatRoomId == roomId)
            .Select(cp => cp.UserId)
            .ToListAsync();
    }

    private static ChatMessageDto MapToMessageDto(ChatMessage msg, Guid currentUserId)
    {
        ChatAttachmentDto? attachmentDto = null;
        if (msg.Attachment != null)
        {
            var isSafeInline = msg.Attachment.FileExtension.ToLowerInvariant() is ".pdf" or ".jpg" or ".jpeg" or ".png";
            attachmentDto = new ChatAttachmentDto
            {
                Id = msg.Attachment.Id,
                ChatRoomId = msg.Attachment.ChatRoomId,
                UploadedByUserId = msg.Attachment.UploadedByUserId,
                UploadedByUserName = msg.Attachment.UploadedByUser?.FullName ?? "User",
                OriginalFileName = msg.Attachment.OriginalFileName,
                FileExtension = msg.Attachment.FileExtension,
                ContentType = msg.Attachment.ContentType,
                FileSize = msg.Attachment.FileSize,
                UploadedAt = msg.Attachment.UploadedAt,
                DownloadUrl = $"/api/chat/attachments/{msg.Attachment.Id}/download",
                ViewUrl = isSafeInline ? $"/api/chat/attachments/{msg.Attachment.Id}/view" : null,
                CanViewInline = isSafeInline
            };
        }

        return new ChatMessageDto
        {
            Id = msg.Id,
            ChatRoomId = msg.ChatRoomId,
            SenderUserId = msg.SenderUserId,
            SenderName = msg.SenderUser?.FullName ?? "Unknown User",
            SenderUsername = msg.SenderUser?.Username ?? "",
            SenderRole = msg.SenderUser?.UserRoles?.FirstOrDefault()?.Role?.Name ?? "User",
            SenderDepartment = msg.SenderUser?.Department?.Code ?? "",
            MessageContent = msg.MessageContent,
            MessageType = msg.MessageType,
            SentAt = msg.SentAt,
            IsMine = currentUserId != Guid.Empty && msg.SenderUserId == currentUserId,
            AttachmentId = msg.AttachmentId,
            Attachment = attachmentDto
        };
    }
}
