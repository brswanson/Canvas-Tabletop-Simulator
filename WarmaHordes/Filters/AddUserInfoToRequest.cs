using System.Web;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace WarmaHordes.Filters
{
    public class AddUserInfoToRequest : AuthorizationFilterAttribute
    {
        public override void OnAuthorization(HttpActionContext actionContext)
        {
            base.OnAuthorization(actionContext);
            var identity = HttpContext.Current.User.Identity.Name;

            actionContext.Request.Properties.Add("UserInfo", identity);
        }
    }
}