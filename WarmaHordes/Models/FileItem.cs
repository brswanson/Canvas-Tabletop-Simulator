using System;
using Microsoft.WindowsAzure.Storage.Table;
using Newtonsoft.Json;

namespace WarmaHordes.Models
{
    public class FileItem : TableEntity
    {
        public Guid FileGuid { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public string UserName { get; set; }
        public string UserToken { get; set; }
        public string Value { get; set; }

        public override string ToString()
        {
            var returnValue = $"{Timestamp:MM/dd/yyyy hh:mm:ss} | {Name} | {Type} | {Description} | {UserName}";
            if (!string.IsNullOrEmpty(Value)) returnValue += $"\r\n{Value}";

            return returnValue;
        }

        public T GetValue<T>()
        {
            return string.IsNullOrEmpty(Value) ? default(T) : JsonConvert.DeserializeObject<T>(Value);
        }
    }
}