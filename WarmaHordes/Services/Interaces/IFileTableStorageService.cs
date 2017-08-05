using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WarmaHordes.Services.Interaces
{
    public interface IFileTableStorageService
    {
        Task<bool> CreateTableAsync();
        Task<bool> DeleteTableAsync();
        Task<bool> ClearTableAsync();
        Task<bool> DoesTableExistAsybc();

        Task<object> AddItem(Guid fileId, string fileName, string fileType, string fileDescription,
            DateTime fileCreateDate, string userName, string userToken, object value = null);

        Task<object> GetItem(string partitionKey, string rowKey);
        object GetItemById(Guid fileId);

        IEnumerable<object> GetItems(string userToken, string type = null, string description = null,
            bool hashedIds = false);

        IEnumerable<object> GetItems(IEnumerable<string> userToken, string type = null, string description = null,
            bool hashedIds = false);
    }
}