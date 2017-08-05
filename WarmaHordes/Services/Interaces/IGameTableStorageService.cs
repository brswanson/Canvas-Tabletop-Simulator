using System.Collections.Generic;
using System.Threading.Tasks;

namespace WarmaHordes.Services.Interaces
{
    public interface IGameTableStorageService
    {
        Task<bool> CreateTableAsync();
        Task<bool> DeleteTableAsync();
        Task<bool> ClearTableAsync();
        Task<bool> DoesTableExistAsybc();
        Task<object> AddItem(string id, string name, string userName, string userToken);
        Task<object> GetItem(string partitionKey, string rowKey);
        IEnumerable<object> GetItemsById(string id);
        IEnumerable<object> GetItemsByUserId(string userToken);
        Task<bool> AddUserToGame(string userToken, string gameId);
    }
}