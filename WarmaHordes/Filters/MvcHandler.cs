using System.Web.Mvc;

namespace WarmaHordes.Filters
{
    public class MvcHandler : AuthorizeAttribute
    {
        public override void OnAuthorization(AuthorizationContext filterContext)
        {
            var userInfo = filterContext.Controller.ViewBag.UserInfo;
            var debug = string.Empty;
        }
    }
}