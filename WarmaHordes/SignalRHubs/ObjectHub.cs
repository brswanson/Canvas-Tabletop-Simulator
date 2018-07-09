using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
// ReSharper disable UnusedMember.Global // Note: These methods are called via front end JS SignalR hubs

namespace WarmaHordes.SignalRHubs
{
    [HubName("objHub")]
    public class ObjectHub : Hub
    {
        [HubMethodName("sendAdd")]
        public void SendObjAdd(object obj)
        {
            //Call the client method to update clients with the new obj except the sender of the obj
            Clients.Others.addObj(obj);
        }

        [HubMethodName("sendRemove")]
        public void SendObjRemove(object obj)
        {
            //Call the client method to update clients with the removed obj except the sender of the obj
            Clients.Others.removeObj(obj);
        }

        [HubMethodName("sendMove")]
        public void SendMove(object obj)
        {
            //Call the client method to update clients with the new obj
            Clients.Others.moveObj(obj);
        }

        [HubMethodName("sendUpdate")]
        public void SendUpdate(object obj)
        {
            //Call the client method to update the passed in object for all clients
            Clients.Others.updateObj(obj);
        }
    }
}