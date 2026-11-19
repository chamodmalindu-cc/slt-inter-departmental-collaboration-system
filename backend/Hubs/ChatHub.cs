using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SltCommunicationSystem.Api.Services;

namespace SltCommunicationSystem.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly IUserPresenceTracker _presenceTracker;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(
        IChatService chatService,
        IUserPresenceTracker presenceTracker,
        ILogger<ChatHub> logger)
    {
        _chatService = chatService;
        _presenceTracker = presenceTracker;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId != Guid.Empty)
        {
            var isFirstConnection = await _presenceTracker.UserConnected(userId, Context.ConnectionId);
            if (isFirstConnection)
            {
                await Clients.All.SendAsync("UserPresenceChanged", new
                {
                    UserId = userId,
                    IsOnline = true
                });
            }
            _logger.LogInformation("ChatHub: User {UserId} connected (ConnectionId: {ConnId}).", userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId();
        if (userId != Guid.Empty)
        {
            var isLastConnection = await _presenceTracker.UserDisconnected(userId, Context.ConnectionId);
            if (isLastConnection)
            {
                await Clients.All.SendAsync("UserPresenceChanged", new
                {
                    UserId = userId,
                    IsOnline = false
                });
            }
            _logger.LogInformation("ChatHub: User {UserId} disconnected.", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Join a specific project chat room group.
    /// Strictly verifies that the caller is one of the three authorized participants.
    /// </summary>
    public async Task JoinRoom(string roomId)
    {
        var userId = GetCurrentUserId();
        if (!Guid.TryParse(roomId, out var roomGuid))
        {
            throw new HubException("Invalid room ID format.");
        }

        var isAuthorized = await _chatService.IsUserParticipantAsync(roomGuid, userId);
        if (!isAuthorized)
        {
            _logger.LogWarning("Security Violation: User {UserId} attempted unauthorized access to ChatRoom {RoomId}.", userId, roomId);
            throw new HubException("Access Denied: You are not an authorized participant in this project chat room.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        await Clients.OthersInGroup(roomId).SendAsync("UserJoinedRoom", new
        {
            RoomId = roomId,
            UserId = userId
        });

        _logger.LogInformation("User {UserId} joined SignalR group for room {RoomId}.", userId, roomId);
    }

    /// <summary>
    /// Leave a project chat room group.
    /// </summary>
    public async Task LeaveRoom(string roomId)
    {
        var userId = GetCurrentUserId();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        await Clients.OthersInGroup(roomId).SendAsync("UserLeftRoom", new
        {
            RoomId = roomId,
            UserId = userId
        });
    }

    /// <summary>
    /// Send real-time chat message to authorized room group.
    /// Persists message, broadcasts to group, and delivers notifications to other participants.
    /// </summary>
    public async Task SendMessage(string roomId, string content)
    {
        var userId = GetCurrentUserId();
        if (!Guid.TryParse(roomId, out var roomGuid))
        {
            throw new HubException("Invalid room ID format.");
        }

        var isAuthorized = await _chatService.IsUserParticipantAsync(roomGuid, userId);
        if (!isAuthorized)
        {
            _logger.LogWarning("Security Violation: User {UserId} attempted to post message in unauthorized ChatRoom {RoomId}.", userId, roomId);
            throw new HubException("Access Denied: You are not authorized to post messages in this room.");
        }

        try
        {
            var messageDto = await _chatService.SaveMessageAsync(roomGuid, userId, content, "Text");

            // Broadcast message payload to everyone in the room group
            await Clients.Group(roomId).SendAsync("ReceiveMessage", messageDto);

            // Also broadcast global activity signal so participant sidebars update in real-time
            var participantUserIds = await _chatService.GetRoomParticipantUserIdsAsync(roomGuid);
            foreach (var participantId in participantUserIds)
            {
                if (participantId != userId)
                {
                    await Clients.User(participantId.ToString()).SendAsync("RoomActivityUpdate", new
                    {
                        RoomId = roomId,
                        LastMessage = messageDto
                    });
                }
            }
        }
        catch (ArgumentException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    /// <summary>
    /// Broadcast typing status to room participants.
    /// </summary>
    public async Task SendTyping(string roomId, bool isTyping)
    {
        var userId = GetCurrentUserId();
        if (!Guid.TryParse(roomId, out var roomGuid)) return;

        var isAuthorized = await _chatService.IsUserParticipantAsync(roomGuid, userId);
        if (!isAuthorized) return;

        await Clients.OthersInGroup(roomId).SendAsync("UserTyping", new
        {
            RoomId = roomId,
            UserId = userId,
            IsTyping = isTyping
        });
    }

    /// <summary>
    /// Mark room messages as read by caller.
    /// </summary>
    public async Task MarkRoomAsRead(string roomId)
    {
        var userId = GetCurrentUserId();
        if (!Guid.TryParse(roomId, out var roomGuid)) return;

        await _chatService.MarkAsReadAsync(roomGuid, userId);
        await Clients.OthersInGroup(roomId).SendAsync("RoomRead", new
        {
            RoomId = roomId,
            UserId = userId
        });
    }

    private Guid GetCurrentUserId()
    {
        var subClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;

        return Guid.TryParse(subClaim, out var userId) ? userId : Guid.Empty;
    }
}
