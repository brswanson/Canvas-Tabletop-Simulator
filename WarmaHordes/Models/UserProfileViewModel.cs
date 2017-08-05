namespace WarmaHordes.Models
{
    public class UserProfileViewModel
    {
        public string EmailAddress { get; set; }
        public string Name { get; set; }
        public string ProfileImage { get; set; }
        public string UserId { get; set; }
        public string IdToken { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }
}