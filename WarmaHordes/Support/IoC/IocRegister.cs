using System.Configuration;
using Ninject;
using WarmaHordes.Services;
using WarmaHordes.Services.Interaces;

namespace WarmaHordes.Support.IoC
{
    public class IocRegister
    {
        public static void RegisterServices(IKernel kernel)
        {
            // Azure Storage Services
            kernel.Bind<IFileTableStorageService>().To<FileTableStorageService>()
                .WithConstructorArgument("connectionString", GetStorageConnectionString());
            kernel.Bind<IGameTableStorageService>().To<GameTableStorageService>()
                .WithConstructorArgument("connectionString", GetStorageConnectionString());
            kernel.Bind<IBlobStorageService>().To<FileBlobStorageService>()
                .WithConstructorArgument("connectionString", GetStorageConnectionString());

            // Services
            kernel.Bind<ITokenService>().To<TokenService>();
        }

        private static string GetStorageConnectionString()
        {
            return ConfigurationManager.ConnectionStrings["storageConnectionString"].ConnectionString;
        }
    }
}