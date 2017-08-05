using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using WarmaHordes.Services.Interaces;

namespace WarmaHordes.Services
{
    public class BaseBlobStorageService : BaseStorageAccountService, IBlobStorageService
    {
        protected string QueueName = string.Empty;

        public BaseBlobStorageService(string connectionString) : base(connectionString)
        {
        }

        public async Task<string> LoadContentsToStorage(string content)
        {
            var uniqueId = Guid.NewGuid().ToString();
            var container = GetContainerReference(QueueName);
            var blockBlob = container.GetBlockBlobReference(uniqueId);

            await blockBlob.UploadTextAsync(content);

            return uniqueId;
        }

        public string LoadContentsToStorage(string uniqueId, Stream stream)
        {
            try
            {
                var container = GetContainerReference(QueueName);
                var blockBlob = container.GetBlockBlobReference(uniqueId);

                blockBlob.UploadFromStream(stream);

                return uniqueId;
            }
            catch (Exception ex)
            {
                return ex.ToString();
            }
        }

        public async Task LoadContentsToStorage(string uniqueId, string content)
        {
            var container = GetContainerReference(QueueName);
            var blockBlob = container.GetBlockBlobReference(uniqueId);

            await blockBlob.UploadTextAsync(content);
        }

        public async Task<string> GetContentsFromStorage(string uniqueId)
        {
            var container = GetContainerReference(QueueName);
            var blockBlob = container.GetBlockBlobReference(uniqueId);

            return await blockBlob.DownloadTextAsync();
        }

        public MemoryStream GetContentsFromStorageStreamed(string uniqueId)
        {
            var container = GetContainerReference(QueueName);
            var blockBlob = container.GetBlockBlobReference(uniqueId);

            var ms = new MemoryStream();
            blockBlob.DownloadToStream(ms);

            return ms;
        }

        public async Task DownloadContentsFromStorageToDisk(string uniqueId, string fullFilePath)
        {
            var container = GetContainerReference(QueueName);
            var blockBlob = container.GetBlockBlobReference(uniqueId);

            await blockBlob.DownloadToFileAsync(fullFilePath, FileMode.OpenOrCreate);
        }

        public async Task DeleteContentsFromStorage(string uniqueId)
        {
            var container = GetContainerReference(QueueName);
            var blockBlob = container.GetBlockBlobReference(uniqueId);

            await blockBlob.DeleteAsync();
        }

        public string GetBlobSasUri(string uniqueId, string fileName, int startTime = -1, int endTime = 1)
        {
            var container = GetContainerReference(QueueName);
            var blockBlob = container.GetBlockBlobReference(uniqueId);

            var sasPolicy = new SharedAccessBlobPolicy
            {
                SharedAccessStartTime = DateTime.UtcNow.AddMinutes(startTime),
                SharedAccessExpiryTime = DateTime.UtcNow.AddMinutes(endTime),
                Permissions = SharedAccessBlobPermissions.Read
            };

            var sasBlobToken = blockBlob.GetSharedAccessSignature(sasPolicy, new SharedAccessBlobHeaders
            {
                ContentDisposition = "attachment; filename=" + fileName
            });

            return blockBlob.Uri + sasBlobToken;
        }

        protected CloudBlobContainer GetContainerReference(string containerName)
        {
            var storageAccount = CloudStorageAccount.Parse(ConnectionString);
            var blobClient = storageAccount.CreateCloudBlobClient();

            return blobClient.GetContainerReference(containerName);
        }
    }
}