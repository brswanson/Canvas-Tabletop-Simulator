using System.Linq;
using System.Security.Claims;
using System.Web.Mvc;
using WarmaHordes.Models;
using WarmaHordes.Services.Interaces;
using WarmaHordes.Support;

namespace WarmaHordes.Controllers
{
    public class HomeController : Controller
    {
        public HomeController(ITokenService tokenService, IGameTableStorageService gameTableStorageService)
        {
            TokenService = tokenService;
            GameTableStorageService = gameTableStorageService;
        }

        private ITokenService TokenService { get; }
        private IGameTableStorageService GameTableStorageService { get; }

        [Authorize]
        public ActionResult Index(string id = null)
        {
            var claimsIdentity = User.Identity as ClaimsIdentity;
            var user = new UserProfileViewModel
            {
                Name = claimsIdentity?.Name,
                EmailAddress = claimsIdentity?.Claims.FirstOrDefault(c => c.Type == CommonValues.IdentityClaims.EmailAddress)?.Value,
                ProfileImage = claimsIdentity?.Claims.FirstOrDefault(c => c.Type == CommonValues.IdentityClaims.ProfileImage)?.Value,
                UserId = claimsIdentity?.Claims.FirstOrDefault(c => c.Type == CommonValues.IdentityClaims.UserId)?.Value,
                IdToken = claimsIdentity?.Claims.FirstOrDefault(c => c.Type == CommonValues.IdentityClaims.IdToken)?.Value,
                AccessToken = claimsIdentity?.Claims.FirstOrDefault(c => c.Type == CommonValues.IdentityClaims.AccessToken)?.Value,
                RefreshToken = claimsIdentity?.Claims.FirstOrDefault(c => c.Type == CommonValues.IdentityClaims.RefreshToken)?.Value
            };

            // Give them the default anon user picture if they don't have a profile pic
            if (string.IsNullOrEmpty(user.ProfileImage))
            {
                user.ProfileImage = Url.Content($"~/Content/{CommonValues.Images.AnonymousUser}");
            }

            // Try to get the tokens for the current game if an ID is passed in. Else, get the User's tokens
            if (!string.IsNullOrEmpty(id))
            {
                // If the User isn't registered to this game, add them
                GameTableStorageService.AddUserToGame(user.UserId, id);

                ViewBag.Tokens = TokenService.GetGameTokens(id);
            }
            else
            {
                ViewBag.Tokens = TokenService.GetUserTokens(user.UserId);
            }

            ViewBag.Title = "InfyTable";
            return View(user);
        }

        [AllowAnonymous]
        public ActionResult About()
        {
            ViewBag.Title = "About";
            return View();
        }
    }
}