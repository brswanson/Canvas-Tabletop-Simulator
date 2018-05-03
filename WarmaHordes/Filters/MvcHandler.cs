using System.Web.Mvc;

namespace WarmaHordes.Filters
{
    public class MvcHandler : AuthorizeAttribute
    {
        public override void OnAuthorization(AuthorizationContext filterContext)
        {
        }
    }
}