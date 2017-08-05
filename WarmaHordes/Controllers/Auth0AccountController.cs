using System;
using System.Configuration;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using Microsoft.Owin.Security;

namespace WarmaHordes.Controllers
{
    public class Auth0AccountController : Controller
    {
        private IAuthenticationManager AuthenticationManager => HttpContext.GetOwinContext().Authentication;

        // GET: /Auth0Account/ExternalLoginCallback
        [AllowAnonymous]
        public async Task<ActionResult> ExternalLoginCallback(string returnUrl, string error, string error_description)
        {
            // Signout of any existing auth for the User
            AuthenticationManager.SignOut(DefaultAuthenticationTypes.ExternalCookie);

            // Should only occur if the Auth0 account is misconfigured for this app's environment
            var externalIdentity =
                await AuthenticationManager.GetExternalIdentityAsync(DefaultAuthenticationTypes.ExternalCookie);
            if (externalIdentity == null)
                throw new Exception("Application is not configured to interact with Auth0 correctly");

            // Authenticate the user
            AuthenticationManager.SignIn(new AuthenticationProperties { IsPersistent = false }, CreateIdentity(externalIdentity));
            return RedirectToLocal(returnUrl);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult LogOff(string returnUrl)
        {
            var appTypes = AuthenticationManager.GetAuthenticationTypes().Select(at => at.AuthenticationType).ToArray();
            AuthenticationManager.SignOut(appTypes);

            var absoluteReturnUrl = string.IsNullOrEmpty(returnUrl)
                ? Url.Action("Index", "Home", new { }, Request.Url.Scheme)
                : Url.IsLocalUrl(returnUrl)
                    ? new Uri(Request.Url, returnUrl).AbsoluteUri
                    : returnUrl;

            return Redirect($"https://{ConfigurationManager.AppSettings["auth0:Domain"]}/v2/logout?returnTo={absoluteReturnUrl}");
        }

        private static ClaimsIdentity CreateIdentity(ClaimsIdentity externalIdentity)
        {
            var identity = new ClaimsIdentity(externalIdentity.Claims, DefaultAuthenticationTypes.ApplicationCookie);

            // This claim is required for the ASP.NET Anti-Forgery Token to function.
            // See http://msdn.microsoft.com/en-us/library/system.web.helpers.antiforgeryconfig.uniqueclaimtypeidentifier(v=vs.111).aspx
            identity.AddClaim(
                new Claim(
                    "http://schemas.microsoft.com/accesscontrolservice/2010/07/claims/identityprovider",
                    "ASP.NET Identity",
                    "http://www.w3.org/2001/XMLSchema#string"));

            return identity;
        }

        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);

            return RedirectToAction("Index", "Home");
        }
    }
}