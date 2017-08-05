using System.Collections.Generic;
using System.Web;
using WarmaHordes.Models;

namespace WarmaHordes.Services.Interaces
{
    public interface ITokenService
    {
        IEnumerable<TokenViewModel> GetUserTokens(IEnumerable<string> userId, bool hashedUserIds = false);
        IEnumerable<TokenViewModel> GetUserTokens(string userId, bool hashedUserIds = false);
        IEnumerable<TokenViewModel> GetGameTokens(string gameId);
        bool SaveToken(string userName, string userId, HttpPostedFileBase file);
    }
}