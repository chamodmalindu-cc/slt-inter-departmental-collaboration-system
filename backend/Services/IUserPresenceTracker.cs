namespace SltCommunicationSystem.Api.Services;

public interface IUserPresenceTracker
{
    Task<bool> UserConnected(Guid userId, string connectionId);
    Task<bool> UserDisconnected(Guid userId, string connectionId);
    bool IsUserOnline(Guid userId);
    Task<IReadOnlyCollection<Guid>> GetOnlineUsersAsync();
}
