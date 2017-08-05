using WarmaHordes.Support;

namespace WarmaHordes.Services
{
    public class FileBlobStorageService : BaseBlobStorageService
    {
        public FileBlobStorageService(string connectionString) : base(connectionString)
        {
            QueueName = CommonValues.BlobStorageContainerNames.Files;
        }
    }
}