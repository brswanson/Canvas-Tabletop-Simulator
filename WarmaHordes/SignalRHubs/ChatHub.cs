using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
// ReSharper disable UnusedMember.Global // Note: These methods are called via front end JS SignalR hubs

namespace WarmaHordes.SignalRHubs
{
    [HubName("chatHub")]
    public class ChatHub : Hub
    {
        [HubMethodName("send")]
        public void Send(string message)
        {
            // Call the chatMsg method to update all clients.
            Clients.All.chatMsg(Context.User.Identity.Name, message);
        }
    }
}