using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Table;
using WarmaHordes.Common;
using WarmaHordes.Models;
using WarmaHordes.Services.Interaces;
using WarmaHordes.Support;

namespace WarmaHordes.Services
{
    public class GameTableStorageService : BaseStorageAccountService, IGameTableStorageService
    {
        public GameTableStorageService(string connectionString) : base(connectionString)
        {
            FileTable = GetTableReference(CommonValues.TableStorageName.Games);
        }

        public CloudBlob FileBlob { get; set; }
        public CloudBlobContainer FileBlobContainer { get; set; }
        public CloudTable FileTable { get; set; }

        public async Task<object> AddItem(string id, string name, string userName, string userToken)
        {
            if (id == null) return null;

            try
            {
                if (string.IsNullOrEmpty(userName)) userName = CommonValues.SystemValues.System;


                var encodedUserToken = Functions.GetStringSha256Hash(userToken);
                var item = new GameItem
                {
                    // Required/table storage fields
                    PartitionKey = encodedUserToken,
                    RowKey = id,

                    // Game fields
                    Id = id,
                    Name = name,
                    UserName = userName,
                    UserId = encodedUserToken
                };

                var insertOperation = TableOperation.Insert(item);
                await FileTable.ExecuteAsync(insertOperation);

                return item;
            }
            catch (Exception ex)
            {
                return ex;
            }
        }

        public async Task<bool> ClearTableAsync()
        {
            try
            {
                await DeleteTableAsync();
                await Task.Delay(60000);
                await CreateTableAsync();
                await Task.Delay(10000);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> CreateTableAsync()
        {
            return await FileTable.CreateIfNotExistsAsync();
        }

        public async Task<bool> DeleteTableAsync()
        {
            return await FileTable.DeleteIfExistsAsync();
        }

        public async Task<bool> DoesTableExistAsybc()
        {
            return await FileTable.ExistsAsync();
        }

        public async Task<object> GetItem(string partitionKey, string rowKey)
        {
            var retrieveOperation = TableOperation.Retrieve<GameItem>(partitionKey, rowKey);
            var retrievedResult = await FileTable.ExecuteAsync(retrieveOperation);

            return (GameItem) retrievedResult.Result;
        }

        public IEnumerable<object> GetItemsById(string id)
        {
            var query = new TableQuery<GameItem>();
            var items = FileTable.ExecuteQuery(query).AsQueryable();

            return items.Where(c => c.Id == id);
        }

        public IEnumerable<object> GetItemsByUserId(string userId)
        {
            userId = Functions.GetStringSha256Hash(userId);

            // Only get items where the User token matches; if no token is specified don't execute the query and instead return nothing
            if (string.IsNullOrEmpty(userId)) return new List<GameItem>().AsQueryable();

            var query = new TableQuery<GameItem>();
            var items = FileTable.ExecuteQuery(query).AsQueryable();

            // Add Where clause for userToken param; only get items for the passed in User
            items = items.Where(x => x.UserId == userId);

            return items;
        }

        public async Task<bool> AddUserToGame(string userToken, string gameId)
        {
            var userGames = (IEnumerable<GameItem>) GetItemsByUserId(userToken);

            if (!userGames.Select(c => c.Id).Contains(gameId)) await AddItem(gameId, "name", "userName", userToken);

            return true;
        }

        private CloudTable GetTableReference(string tableName)
        {
            var storageAccount = CloudStorageAccount.Parse(ConnectionString);
            var tableClient = storageAccount.CreateCloudTableClient();

            return tableClient.GetTableReference(tableName);
        }
    }
}