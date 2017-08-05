using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;

namespace WarmaHordes
{
    [HubName("tokenHub")]
    public class TokenHub : Hub
    {
        [HubMethodName("sendAdd")]
        public void SendTokenAdd(Object obj)
        {
            //Call the client method to update clients with the new token except the sender of the token
            Clients.Others.addToken(obj);
        }

        [HubMethodName("sendRemove")]
        public void SendTokenRemove(Object obj)
        {
            //Call the client method to update clients with the token removal except the sender of the message
            Clients.Others.removeToken(obj);
        }
    }
}