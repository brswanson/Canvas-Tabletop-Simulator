using System;
using System.Drawing;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using ImageResizer;

namespace WarmaHordes.Common
{
    public class Functions
    {
        public static string GetTimeStamp()
        {
            return "[" + DateTime.Now.ToShortTimeString() + "]";
        }

        public static string GetStringSha256Hash(string text)
        {
            if (string.IsNullOrEmpty(text)) { return string.Empty; }

            using (var sha = new SHA256Managed())
            {
                var textData = Encoding.UTF8.GetBytes(text);
                var hash = sha.ComputeHash(textData);
                return BitConverter.ToString(hash).Replace("-", string.Empty);
            }
        }

        public static class ImageHelper
        {
            public static Image LoadFromAspNetUrl(string url)
            {
                if (HttpContext.Current == null)
                {
                    throw new ApplicationException("Can't use HttpContext.Current in non-ASP.NET context");
                }

                return Image.FromFile(HttpContext.Current.Server.MapPath(url));
            }

            public static string ReturnImageAsUrl(string url)
            {
                return HttpContext.Current.Server.MapPath(url);
            }

            public static Stream ToJpeg(HttpPostedFileBase file)
            {
                var jpegStream = new MemoryStream();

                var resizer = new ImageJob(file, jpegStream, new ResizeSettings("format=jpg;mode=max"));
                resizer.Build();

                jpegStream.Position = 0;
                return jpegStream;
            }
        }
    }
}