using System.Security.Claims;
using System.Web;
using System.Web.Helpers;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace WarmaHordes
{
    public class MvcApplication : HttpApplication
    {
        protected void Application_Start()
        {
            // Force HTTPS because security
            GlobalFilters.Filters.Add(new RequireHttpsAttribute());

            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            // Added for AntiForgery token
            AntiForgeryConfig.UniqueClaimTypeIdentifier = ClaimsIdentity.DefaultNameClaimType;
            AntiForgeryConfig.RequireSsl = true;
        }
    }
}