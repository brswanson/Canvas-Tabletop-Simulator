using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
// ReSharper disable UnusedMember.Global // Note: These methods are called via front end JS SignalR hubs

namespace WarmaHordes.SignalRHubs
{
    [HubName("logHub")]
    public class LogHub : Hub
    {
        private const int DiceMin = 1;
        private const int DiceMax = 6;
        private const int DiceRollsMax = 5;

        /// <summary>
        ///     Updates clients with log messages. Sends to all clients and the sender so all messages are affected by latency
        ///     equally.
        /// </summary>
        /// <param name="message"></param>
        [HubMethodName("send")]
        public void Send(string message)
        {
            Clients.All.logMsg(Context.User.Identity.Name, message);
        }

        /// <summary>
        ///     Update clients with dice roll results. Accepts any integer, but only rolls up to five (5) dice at a time.
        /// </summary>
        /// <param name="diceCount"></param>
        [HubMethodName("roll")]
        public void Roll(int diceCount)
        {
            if (diceCount <= 0) return;

            if (diceCount > DiceRollsMax) diceCount = DiceRollsMax;

            var total = 0;
            var rand = new Random(Environment.TickCount);

            var rolls = new List<int>();
            for (var i = 0; i < diceCount; i++)
            {
                var randVal = rand.Next(DiceMin, DiceMax);

                rolls.Add(randVal);
                total += randVal;
            }

            var msg = CreateDiceMessage(Context.User.Identity.Name, diceCount, total, rolls);
            Clients.All.rollDice(total, msg);
        }

        private static string CreateDiceMessage(string user, int diceCount, int total, IEnumerable<int> rolls)
        {
            var sb = new StringBuilder();

            // Ex: John: 5 dice rolled for a total of 30. Average roll of 6. Rolls: 6, 6, 6, 6, 6, 6
            sb.Append(user + ": ");
            sb.Append(diceCount == 1 ? $"{diceCount} die rolled" : $"{diceCount} dice rolled");
            sb.Append($" for a total of {total}. ");
            sb.Append($"Average roll of {Math.Round((double) total / diceCount, 2)}. ");
            sb.Append($"Rolls: {string.Join(", ", rolls)}");

            return sb.ToString();
        }
    }
}