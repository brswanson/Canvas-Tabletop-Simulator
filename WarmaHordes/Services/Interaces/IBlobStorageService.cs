using System.IO;
using System.Threading.Tasks;

namespace WarmaHordes.Services.Interaces
{
    public interface IBlobStorageService
    {
        Task<string> LoadContentsToStorage(string content);
        string LoadContentsToStorage(string uniqueId, Stream stream);
        Task LoadContentsToStorage(string uniqueId, string content);
        Task<string> GetContentsFromStorage(string uniqueId);
        MemoryStream GetContentsFromStorageStreamed(string uniqueId);
        Task DownloadContentsFromStorageToDisk(string uniqueId, string fullFilePath);
        Task DeleteContentsFromStorage(string uniqueId);
        string GetBlobSasUri(string uniqueId, string fileName, int startTime = -1, int endTime = 1);
    }
}