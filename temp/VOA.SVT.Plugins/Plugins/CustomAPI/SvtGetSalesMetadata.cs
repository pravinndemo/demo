using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Extensions;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Web;
using VOA.Common;
using VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model;
using VOA.SVT.Plugins.Helpers;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class SvtGetSalesMetadata : PluginBase
    {
        /// <summary>
        /// Name of the API configuration returned by voa_CredentialProvider
        /// </summary>
        private const string CONFIGURATION_NAME = "SVTGetSalesMetadata";

        public SvtGetSalesMetadata(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtGetSalesMetadata))
        {
            // Custom API plugin -> generally no secure/unsecure config usage.
        }

        protected override void ExecuteCdsPlugin(ILocalPluginContext localPluginContext)
        {
            if (localPluginContext == null)
            {
                throw new ArgumentNullException(nameof(localPluginContext));
            }

            var context = localPluginContext.PluginExecutionContext;

            // 1) Read secrets/config from credential provider action
            var getSecretsRequest = new OrganizationRequest("voa_CredentialProvider")
            {
                ["ConfigurationName"] = CONFIGURATION_NAME
            };

            localPluginContext.TracingService.Trace("Retrieving configuration from voa_CredentialProvider...");

            var getSecretsResponse = localPluginContext.SystemUserService.Execute(getSecretsRequest);

            var apiConfig = new APIRequestConfiguration
            {
                Address = getSecretsResponse.Results.Contains("Address") ? (string)getSecretsResponse.Results["Address"] : null,
                ClientId = getSecretsResponse.Results.Contains("ClientId") ? (string)getSecretsResponse.Results["ClientId"] : null,
                ClientSecret = getSecretsResponse.Results.Contains("ClientSecret") ? (string)getSecretsResponse.Results["ClientSecret"] : null,
                Scope = getSecretsResponse.Results.Contains("Scope") ? (string)getSecretsResponse.Results["Scope"] : null,
                APIMSubscriptionKey = getSecretsResponse.Results.Contains("APIMSubscriptionKey") ? (string)getSecretsResponse.Results["APIMSubscriptionKey"] : null,
                TenantId = getSecretsResponse.Results.Contains("TenantId") ? (string)getSecretsResponse.Results["TenantId"] : null
            };

            if (string.IsNullOrWhiteSpace(apiConfig.Address))
            {
                context.OutputParameters["Result"] = BuildErrorPayload("SVTGetSalesMetadata configuration missing Address.");
                return;
            }

            localPluginContext.TracingService.Trace("SVT GetSalesMetadata started.");

            // 2) OAuth token (if needed)
            localPluginContext.TracingService.Trace("Generating authentication token...");
            var auth = new Authentication(localPluginContext, apiConfig);
            var authResult = auth.GenerateAuthentication();

            // 3) Build full URL (base Address + optional query from Custom API inputs)
            var searchQuery = CustomApiQueryHelper.BuildSearchQuery(context.InputParameters);
            var fullUrl = BuildUrl(apiConfig.Address, searchQuery);

            localPluginContext.TracingService.Trace($"Calling APIM URL: {Truncate(fullUrl, 300)}");

            using (var httpClient = new HttpClient())
            {
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                // Optional: add correlation headers etc (your helper)
                httpClient.ApplyVOAConfiguration(localPluginContext);

                // APIM subscription key
                if (!string.IsNullOrWhiteSpace(apiConfig.APIMSubscriptionKey))
                {
                    httpClient.DefaultRequestHeaders.Remove("Ocp-Apim-Subscription-Key");
                    httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", apiConfig.APIMSubscriptionKey);
                }

                // Bearer token (only if APIM requires it)
                if (!string.IsNullOrWhiteSpace(authResult?.AccessToken))
                {
                    httpClient.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", authResult.AccessToken);
                }

                using (var request = new HttpRequestMessage(HttpMethod.Get, fullUrl))
                {
                    HttpResponseMessage response = null;
                    string body = string.Empty;

                    try
                    {
                        // Sync plugin: avoid deadlocks by using GetAwaiter().GetResult()
                        response = httpClient.SendAsync(request).GetAwaiter().GetResult();
                        body = response.Content?.ReadAsStringAsync().GetAwaiter().GetResult() ?? string.Empty;

                        if (!response.IsSuccessStatusCode)
                        {
                            localPluginContext.TracingService.Trace(
                                $"APIM call failed. Status={(int)response.StatusCode} {response.ReasonPhrase}. BodySnippet={Truncate(body, 500)}");

                            context.OutputParameters["Result"] = BuildErrorPayload(
                                $"APIM call failed ({(int)response.StatusCode} {response.ReasonPhrase}).");
                            return;
                        }

                        // Trace minimal response snippet (avoid PII / noisy logs)
                        localPluginContext.TracingService.Trace($"APIM response snippet: {Truncate(body, 200)}");

                        // Return raw JSON back via Custom API output parameter (Result)
                        context.OutputParameters["Result"] = body;
                        localPluginContext.TracingService.Trace("SVT GetSalesMetadata completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        localPluginContext.TracingService.Trace($"APIM call exception: {ex}");
                        context.OutputParameters["Result"] = BuildErrorPayload(
                            "Failed to call APIM for SVT sales metadata.");
                    }
                    finally
                    {
                        response?.Dispose();
                    }
                }
            }
        }

        private static string BuildUrl(string baseAddress, string searchQuery)
        {
            if (string.IsNullOrWhiteSpace(searchQuery))
            {
                return baseAddress;
            }

            var trimmed = searchQuery.Trim();
            if (trimmed.StartsWith("?", StringComparison.Ordinal))
            {
                trimmed = trimmed.Substring(1);
            }

            if (baseAddress.Contains("?"))
            {
                return baseAddress.EndsWith("&", StringComparison.Ordinal)
                    ? baseAddress + HttpUtility.UrlEncode(trimmed)
                    : baseAddress + "&" + trimmed;
            }

            return baseAddress + "?" + trimmed;
        }

        private static string Truncate(string s, int maxLen)
            => string.IsNullOrEmpty(s) ? s : (s.Length > maxLen ? s.Substring(0, maxLen) : s);

        private static string BuildErrorPayload(string message)
        {
            var payload = new
            {
                billingAuthority = Array.Empty<string>(),
                errorMessage = message ?? string.Empty
            };
            return JsonSerializer.Serialize(payload);
        }
    }
}
