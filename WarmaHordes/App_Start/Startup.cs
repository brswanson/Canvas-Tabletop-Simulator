﻿using System.Configuration;
using Auth0.Owin;
using Microsoft.Owin;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Owin;

namespace WarmaHordes
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // Configure Auth0 parameters
            var auth0Domain = ConfigurationManager.AppSettings["auth0:Domain"];
            var auth0ClientId = ConfigurationManager.AppSettings["auth0:ClientId"];
            var auth0ClientSecret = ConfigurationManager.AppSettings["auth0:ClientSecret"];

            // Set Cookies as default authentication type
            app.SetDefaultSignInAsAuthenticationType(CookieAuthenticationDefaults.AuthenticationType);
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AuthenticationType = CookieAuthenticationDefaults.AuthenticationType,
                LoginPath = new PathString("/Account/Login")
            });

            // Configure Auth0 authentication
            var options = new Auth0AuthenticationOptions
            {
                Domain = auth0Domain,
                ClientId = auth0ClientId,
                ClientSecret = auth0ClientSecret,

                // Save the tokens to claims
                SaveIdToken = true,
                SaveAccessToken = true,
                SaveRefreshToken = true
            };

            options.Scope.Add("offline_access"); // Request a refresh_token
            app.UseAuth0Authentication(options);

            // Turn on SignalR listening
            app.MapSignalR();
        }
    }
}