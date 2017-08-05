using System;

namespace WarmaHordes.Models
{
    public class FileBlob
    {
        public Guid FileGuid { get; set; }
        public byte[] FileData { get; set; }
    }
}