using System.Web.Http;
using WarmaHordes.Services.Interaces;

namespace WarmaHordes.Api
{
    public class UserController : ApiController
    {
        public UserController(IFileTableStorageService azureBlobStorageService)
        {
            ServiceAzureTableStorage = azureBlobStorageService;
        }

        private IFileTableStorageService ServiceAzureTableStorage { get; }
    }
}