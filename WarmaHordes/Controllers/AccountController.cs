using System;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using Microsoft.Owin.Security;
using WarmaHordes.Models;
using WarmaHordes.Services.Interaces;
using WarmaHordes.Support;

namespace WarmaHordes.Controllers
{
    // Great tutorial here: https://auth0.com/docs/quickstart/webapp/aspnet-owin
    public class AccountController : Controller
    {
        private const string TokenUploadResponseTempData = "TokenUploadError";
        private const int MaximumTokenSizeInMegabytes = 4;
        private const int MaximumTokenSizeInKilobytes = MaximumTokenSizeInMegabytes * 1024;
        private const int MaximumTokenSizeInBytes = MaximumTokenSizeInKilobytes * 1024;

        public AccountController(ITokenService tokenService)
        {
            TokenService = tokenService;
        }

        private ITokenService TokenService { get; }

        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            return new ChallengeResult("Auth0", returnUrl ?? Url.Action("Index", "Home"));
        }

        [Authorize]
        public ActionResult UserProfile()
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

            ViewBag.Message = TempData[TokenUploadResponseTempData];
            ViewBag.Tokens = TokenService.GetUserTokens(user.UserId);

            return View(user);
        }

        [Authorize]
        public ActionResult Logout()
        {
            HttpContext.GetOwinContext().Authentication.SignOut();
            return RedirectToAction("Index", "Home");
        }

        [Authorize]
        [HttpPost]
        public ActionResult Token(HttpPostedFileBase file)
        {
            if (file == null)
            {
                TempData[TokenUploadResponseTempData] = "No file was selected to upload.";
                return RedirectToAction("UserProfile", "Account");
            }

            if (file.ContentLength > MaximumTokenSizeInBytes)
            {
                TempData[TokenUploadResponseTempData] =
                    $"File must be no larger than {MaximumTokenSizeInMegabytes} megabytes";
                return RedirectToAction("UserProfile", "Account");
            }

            try
            {
                var claimsIdentity = User.Identity as ClaimsIdentity;
                var userName = claimsIdentity?.Name;
                var userId = claimsIdentity?.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;

                // Save the token to Blob and Table storage
                TokenService.SaveToken(userName, userId, file);

                ViewBag.Message = $"{file.FileName} was uploaded successfully";
                return RedirectToAction("UserProfile", "Account");
            }
            catch (Exception ex)
            {
                ViewBag.Message = ex.ToString();
                return RedirectToAction("UserProfile", "Account");
            }
        }
    }

    internal class ChallengeResult : HttpUnauthorizedResult
    {
        private const string XsrfKey = "XsrfId";

        public ChallengeResult(string provider, string redirectUri)
            : this(provider, redirectUri, null)
        {
        }

        public ChallengeResult(string provider, string redirectUri, string userId)
        {
            LoginProvider = provider;
            RedirectUri = redirectUri;
            UserId = userId;
        }

        public string LoginProvider { get; set; }
        public string RedirectUri { get; set; }
        public string UserId { get; set; }

        public override void ExecuteResult(ControllerContext context)
        {
            var properties = new AuthenticationProperties {RedirectUri = RedirectUri};
            if (UserId != null)
                properties.Dictionary[XsrfKey] = UserId;

            context.HttpContext.GetOwinContext().Authentication.Challenge(properties, LoginProvider);
        }
    }
}