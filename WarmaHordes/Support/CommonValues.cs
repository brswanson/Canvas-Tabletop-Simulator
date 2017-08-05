using System.Security.Claims;

namespace WarmaHordes.Support
{
    public class CommonValues
    {
        public class IdentityClaims
        {
            public const string EmailAddress = ClaimTypes.Email;
            public const string ProfileImage = "picture";
            public const string UserId = "user_id";
            public const string IdToken = "id_token";
            public const string AccessToken = "access_token";
            public const string RefreshToken = "refresh_token";
        }

        public class Images
        {
            public const string AnonymousUser = "Misc/anon_user_1280.png";
        }

        public class Caching
        {
            public const int TimeoutInHours = 6;
            public const int TimeoutInMinutes = TimeoutInHours * 60;
            public const int TimeoutInSeconds = TimeoutInMinutes * 60;
            public const string User = "User";
        }

        public class TableStorageName
        {
            public const string Games = "games";
            public const string Files = "files";
        }

        public class BlobStorageContainerNames
        {
            public const string Files = "files";
        }

        public class SystemValues
        {
            public const string System = "SYSTEM";
        }
    }
}