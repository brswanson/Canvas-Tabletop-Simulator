using Microsoft.WindowsAzure.Storage.Table;

namespace WarmaHordes.Models
{
    public class GameItem : TableEntity
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string UserName { get; set; }
        public string UserId { get; set; }
    }
}