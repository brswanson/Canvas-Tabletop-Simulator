using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Table;
using Newtonsoft.Json;
using WarmaHordes.Common;
using WarmaHordes.Models;
using WarmaHordes.Services.Interaces;
using WarmaHordes.Support;

namespace WarmaHordes.Services
{
    public class FileTableStorageService : BaseStorageAccountService, IFileTableStorageService
    {
        public FileTableStorageService(string connectionString) : base(connectionString)
        {
            FileTable = GetTableReference(CommonValues.TableStorageName.Files);
        }

        public CloudBlob FileBlob { get; set; }
        public CloudBlobContainer FileBlobContainer { get; set; }
        public CloudTable FileTable { get; set; }

        public async Task<object> AddItem(Guid fileId, string fileName, string fileType, string fileDescription,
            DateTime fileCreateDate, string userName, string userToken, object value)
        {
            try
            {
                // Try to create the table in case it doesn't exist yet.
                await CreateTableAsync();

                if (string.IsNullOrEmpty(userName)) userName = CommonValues.SystemValues.System;

                var encodedUserToken = Functions.GetStringSha256Hash(userToken);
                var item = new FileItem
                {
                    // Required/table storage fields
                    PartitionKey = encodedUserToken,
                    RowKey = fileId.ToString(),

                    // File fields
                    FileGuid = fileId,
                    Name = fileName,
                    Type = fileType,
                    Description = fileDescription,
                    UserName = userName,
                    UserToken = encodedUserToken,
                    Value = null
                };

                if (value != null) item.Value = JsonConvert.SerializeObject(value, new JsonSerializerSettings { ReferenceLoopHandling = ReferenceLoopHandling.Ignore });

                if (item.Value != null && item.Value.Length > 30000) item.Value = item.Value.Substring(0, 30000) + "*** truncated ***";

                var insertOperation = TableOperation.Insert(item);
                FileTable.Execute(insertOperation);

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
            var retrieveOperation = TableOperation.Retrieve<FileItem>(partitionKey, rowKey);
            var retrievedResult = await FileTable.ExecuteAsync(retrieveOperation);

            return (FileItem)retrievedResult.Result;
        }

        public object GetItemById(Guid fileId)
        {
            var query = new TableQuery<FileItem>();
            var items = FileTable.ExecuteQuery(query).AsQueryable();

            return items.FirstOrDefault(c => c.FileGuid == fileId);
        }

        public IEnumerable<object> GetItems(string userToken, string type, string description, bool hashedIds = false)
        {
            var hashTokens = new List<string>
            {
                Functions.GetStringSha256Hash(userToken)
            };

            return GetItems(hashTokens, type, description, hashedIds);
        }

        public IEnumerable<object> GetItems(IEnumerable<string> userIds, string type, string description,
            bool hashedIds = false)
        {
            var hashedUserIds = hashedIds ? userIds.ToList() : userIds.Select(Functions.GetStringSha256Hash).ToList();

            // Only get items where the User token matches; if no token is specified don't execute the query and instead return nothing
            if (hashedUserIds.Count == 0) return new List<FileItem>().AsQueryable();

            var query = new TableQuery<FileItem>();
            var items = FileTable.ExecuteQuery(query).AsQueryable();

            // Add Where clause for userToken param; only get items for the passed in User
            items = items.Where(x => hashedUserIds.Contains(x.UserToken));

            // Add Where clause for Type param; looks at file type only
            if (!string.IsNullOrEmpty(type)) items = items.Where(x => x.Type == null || x.Type == type);

            // Add Where clause for Description param; looks at file description and name
            if (!string.IsNullOrEmpty(description))
            {
                items = items.Where(x => x.Description != null
                                         && x.Description.IndexOf(description, StringComparison.OrdinalIgnoreCase) != -1
                                         || x.Name != null && x.Name.Contains(description));
            }

            return items;
        }

        private CloudTable GetTableReference(string tableName)
        {
            var storageAccount = CloudStorageAccount.Parse(ConnectionString);
            var tableClient = storageAccount.CreateCloudTableClient();

            return tableClient.GetTableReference(tableName);
        }
    }
}