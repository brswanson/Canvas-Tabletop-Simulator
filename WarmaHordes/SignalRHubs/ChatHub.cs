﻿using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

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