using SltCommunicationSystem.Api.Models.DTOs;
using SltCommunicationSystem.Api.Models.Entities;

namespace SltCommunicationSystem.Api.Services;

public interface IChatService
{
    Task<ChatRoom> EnsureProjectChatRoomAsync(Guid projectId, Guid supervisorUserId, Guid? dgmUserId, Guid requesterUserId);
    Task<List<ChatRoomSummaryDto>> GetUserChatRoomsAsync(Guid userId);
    Task<ChatRoomSummaryDto?> GetRoomSummaryAsync(Guid roomId, Guid userId);
    Task<List<ChatMessageDto>> GetRoomMessagesAsync(Guid roomId, Guid userId);
    Task<ChatMessageDto> SaveMessageAsync(Guid roomId, Guid senderUserId, string content, string messageType = "Text", Guid? attachmentId = null);
    Task<ChatMessageDto> AddSystemMessageAsync(Guid roomId, string content, Guid? actorUserId = null);
    Task<bool> IsUserParticipantAsync(Guid roomId, Guid userId);
    Task MarkAsReadAsync(Guid roomId, Guid userId);
    Task<List<Guid>> GetRoomParticipantUserIdsAsync(Guid roomId);
}
