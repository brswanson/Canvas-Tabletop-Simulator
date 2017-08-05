namespace WarmaHordes.Services
{
    public class BaseStorageAccountService
    {
        public BaseStorageAccountService(string connectionString)
        {
            ConnectionString = connectionString;
        }
        public string ConnectionString { get; set; }
    }
}