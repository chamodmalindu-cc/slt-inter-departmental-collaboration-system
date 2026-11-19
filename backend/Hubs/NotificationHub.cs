using Microsoft.AspNetCore.SignalR;

namespace SltCommunicationSystem.Api.Hubs;

public class NotificationHub : Hub
{
    public async Task SendNotification(string department, string message)
    {
        await Clients.Others.SendAsync("ReceiveNotification", department, message);
    }
}
