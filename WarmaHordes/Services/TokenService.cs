using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using WarmaHordes.Common;
using WarmaHordes.Models;
using WarmaHordes.Services.Interaces;

namespace WarmaHordes.Services
{
    public class TokenService : ITokenService
    {
        public TokenService(IFileTableStorageService tableStorageService, IBlobStorageService blobStorageService,
            IGameTableStorageService gameTableStorageService)
        {
            TableStorageService = tableStorageService;
            BlobStorageService = blobStorageService;
            GameTableStorageService = gameTableStorageService;
        }

        private IFileTableStorageService TableStorageService { get; }
        private IBlobStorageService BlobStorageService { get; }
        private IGameTableStorageService GameTableStorageService { get; }

        public IEnumerable<TokenViewModel> GetUserTokens(string userId, bool hashedUserIds = false)
        {
            var userIds = new List<string>
            {
                userId
            };

            return GetUserTokens(userIds, hashedUserIds);
        }

        public IEnumerable<TokenViewModel> GetUserTokens(IEnumerable<string> userIds, bool hashedUserIds = false)
        {
            var tokens = TableStorageService.GetItems(userIds, null, null, hashedUserIds);
            var tokenModels = new List<TokenViewModel>();

            // Save the files from Blob storage if they don't already exist to a temp location
            foreach (FileItem token in tokens)
            {
                SaveTokenToTemp(token);

                tokenModels.Add(new TokenViewModel
                {
                    Id = token.FileGuid.ToString(),
                    Name = token.Name,
                    Type = token.Type,
                    ImageUri = "/Temp/" + token.FileGuid + ".jpg"
                });
            }

            return tokenModels;
        }

        public IEnumerable<TokenViewModel> GetGameTokens(string gameId)
        {
            var games = (IEnumerable<GameItem>)GameTableStorageService.GetItemsById(gameId);
            var gameUserIds = games.Select(c => c.UserId);
            var tokens = GetUserTokens(gameUserIds, true);

            return tokens;
        }

        public bool SaveToken(string userName, string userId, HttpPostedFileBase file)
        {
            var fileGuid = Guid.NewGuid();
            // Add the file to Azure Table storage
            TableStorageService.AddItem(fileGuid, file.FileName, file.ContentType, $"File size: {file.ContentLength}",
                DateTime.Now, userName, userId);

            // Add the file to Azure Blob storage
            BlobStorageService.LoadContentsToStorage(fileGuid.ToString(), Functions.ImageHelper.ToJpeg(file));

            return true;
        }

        private void SaveTokenToTemp(FileItem token)
        {
            var filePath = HttpRuntime.AppDomainAppPath + @"\Temp\" + token.FileGuid + ".jpg";
            if (File.Exists(filePath)) { return; }

            // Save the file if it isn't in our temp already
            var stream = BlobStorageService.GetContentsFromStorageStreamed(token.FileGuid.ToString());
            using (var fileStream = File.Create(filePath))
            {
                stream.Seek(0, SeekOrigin.Begin);
                stream.CopyTo(fileStream);
            }
        }
    }
}