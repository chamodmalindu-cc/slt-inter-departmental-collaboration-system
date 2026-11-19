using System.Collections.Concurrent;

namespace SltCommunicationSystem.Api.Services;

/// <summary>
/// Thread-safe in-memory presence tracker for active SignalR connections.
/// </summary>
public class UserPresenceTracker : IUserPresenceTracker
{
    private static readonly ConcurrentDictionary<Guid, HashSet<string>> OnlineUsers = new();

    public Task<bool> UserConnected(Guid userId, string connectionId)
    {
        bool isFirstConnection = false;
        lock (OnlineUsers)
        {
            if (!OnlineUsers.ContainsKey(userId))
            {
                OnlineUsers[userId] = new HashSet<string>();
                isFirstConnection = true;
            }

            OnlineUsers[userId].Add(connectionId);
        }

        return Task.FromResult(isFirstConnection);
    }

    public Task<bool> UserDisconnected(Guid userId, string connectionId)
    {
        bool isLastConnection = false;
        lock (OnlineUsers)
        {
            if (!OnlineUsers.ContainsKey(userId))
                return Task.FromResult(false);

            OnlineUsers[userId].Remove(connectionId);
            if (OnlineUsers[userId].Count == 0)
            {
                OnlineUsers.TryRemove(userId, out _);
                isLastConnection = true;
            }
        }

        return Task.FromResult(isLastConnection);
    }

    public bool IsUserOnline(Guid userId)
    {
        lock (OnlineUsers)
        {
            return OnlineUsers.TryGetValue(userId, out var connections) && connections.Count > 0;
        }
    }

    public Task<IReadOnlyCollection<Guid>> GetOnlineUsersAsync()
    {
        lock (OnlineUsers)
        {
            return Task.FromResult<IReadOnlyCollection<Guid>>(OnlineUsers.Keys.ToList());
        }
    }
}
