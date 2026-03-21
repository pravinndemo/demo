using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Extensions;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Web;
using VOA.Common;
using VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class SvtGetSalesParticularImages : PluginBase
    {
        /// <summary>
        /// Name of the API configuration returned by voa_CredentialProvider.
        /// Set this in Dataverse credential provider to the APIM endpoint that proxies SharePoint image reads.
        /// </summary>
        private const string CONFIGURATION_NAME = "SVTGetSalesParticularImages";

        public SvtGetSalesParticularImages(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtGetSalesParticularImages))
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
            var trace = localPluginContext.TracingService;

            var saleId = GetInput(context, "saleId");
            if (string.IsNullOrWhiteSpace(saleId))
            {
                throw new InvalidPluginExecutionException("saleId is required.");
            }

            var attribute = GetInput(context, "attribute");
            var compareWith = GetInput(context, "compareWith");
            var source = GetInput(context, "source");
            var continuationToken = GetInput(context, "continuationToken");
            var top = GetIntInput(context, "top");

            // 1) Read secrets/config from credential provider action
            var getSecretsRequest = new OrganizationRequest("voa_CredentialProvider")
            {
                ["ConfigurationName"] = CONFIGURATION_NAME
            };

            trace?.Trace("Retrieving configuration from voa_CredentialProvider...");

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
                context.OutputParameters["Result"] = BuildErrorPayload(
                    saleId,
                    attribute,
                    "SVTGetSalesParticularImages configuration missing Address.");
                return;
            }

            trace?.Trace("SvtGetSalesParticularImages started.");

            // 2) OAuth token (if needed)
            trace?.Trace("Generating authentication token...");
            var auth = new Authentication(localPluginContext, apiConfig);
            var authResult = auth.GenerateAuthentication();

            // 3) Build URL and call APIM endpoint
            var fullUrl = BuildUrl(apiConfig.Address, saleId, attribute, compareWith, source, continuationToken, top);
            trace?.Trace($"Calling APIM URL: {Truncate(fullUrl, 400)}");

            using (var httpClient = new HttpClient())
            {
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                // Optional: add correlation headers etc.
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
                        response = httpClient.SendAsync(request).GetAwaiter().GetResult();
                        body = response.Content?.ReadAsStringAsync().GetAwaiter().GetResult() ?? string.Empty;

                        if (!response.IsSuccessStatusCode)
                        {
                            trace?.Trace(
                                $"APIM call failed. Status={(int)response.StatusCode} {response.ReasonPhrase}. BodySnippet={Truncate(body, 500)}");

                            context.OutputParameters["Result"] = BuildErrorPayload(
                                saleId,
                                attribute,
                                $"APIM call failed ({(int)response.StatusCode} {response.ReasonPhrase}).");
                            return;
                        }

                        trace?.Trace($"APIM response snippet: {Truncate(body, 300)}");
                        context.OutputParameters["Result"] = body;
                        trace?.Trace("SvtGetSalesParticularImages completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        trace?.Trace($"APIM call exception: {ex}");
                        context.OutputParameters["Result"] = BuildErrorPayload(
                            saleId,
                            attribute,
                            "Failed to call APIM for sales particular images.");
                    }
                    finally
                    {
                        response?.Dispose();
                    }
                }
            }
        }

        private static string BuildUrl(
            string baseAddress,
            string saleId,
            string attribute,
            string compareWith,
            string source,
            string continuationToken,
            int? top)
        {
            var url = (baseAddress ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(url))
            {
                return url;
            }

            // Path token substitution first
            if (url.Contains("{saleId}", StringComparison.Ordinal))
            {
                url = url.Replace("{saleId}", HttpUtility.UrlEncode(saleId));
            }
            if (url.Contains("{attribute}", StringComparison.Ordinal))
            {
                url = url.Replace("{attribute}", HttpUtility.UrlEncode(attribute ?? string.Empty));
            }
            if (url.Contains("{compareWith}", StringComparison.Ordinal))
            {
                url = url.Replace("{compareWith}", HttpUtility.UrlEncode(compareWith ?? string.Empty));
            }
            if (url.Contains("{source}", StringComparison.Ordinal))
            {
                url = url.Replace("{source}", HttpUtility.UrlEncode(source ?? string.Empty));
            }

            // If no saleId token exists, append a conventional path segment.
            if (!url.Contains("/sales/", StringComparison.OrdinalIgnoreCase)
                && !url.EndsWith("/sales", StringComparison.OrdinalIgnoreCase))
            {
                url = url.TrimEnd('/') + "/sales/{saleId}/particular-images";
                url = url.Replace("{saleId}", HttpUtility.UrlEncode(saleId));
            }
            else if (url.EndsWith("/sales", StringComparison.OrdinalIgnoreCase))
            {
                url = $"{url.TrimEnd('/')}/{HttpUtility.UrlEncode(saleId)}/particular-images";
            }

            var queryParts = new List<string>();
            AddQueryPart(queryParts, "attribute", attribute);
            AddQueryPart(queryParts, "compareWith", compareWith);
            AddQueryPart(queryParts, "source", source);
            AddQueryPart(queryParts, "continuationToken", continuationToken);
            if (top.HasValue && top.Value > 0)
            {
                AddQueryPart(queryParts, "top", top.Value.ToString());
            }

            if (queryParts.Count == 0)
            {
                return url;
            }

            var query = string.Join("&", queryParts);
            if (url.Contains("?", StringComparison.Ordinal))
            {
                return url.EndsWith("&", StringComparison.Ordinal) ? url + query : url + "&" + query;
            }

            return url + "?" + query;
        }

        private static void AddQueryPart(ICollection<string> queryParts, string key, string value)
        {
            if (queryParts == null || string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            queryParts.Add($"{HttpUtility.UrlEncode(key)}={HttpUtility.UrlEncode(value)}");
        }

        private static int? GetIntInput(IPluginExecutionContext context, string key)
        {
            if (context?.InputParameters == null || !context.InputParameters.Contains(key))
            {
                return null;
            }

            var raw = context.InputParameters[key]?.ToString();
            return int.TryParse(raw, out var parsed) ? parsed : null;
        }

        private static string GetInput(IPluginExecutionContext context, string key)
            => context.InputParameters.Contains(key) ? context.InputParameters[key]?.ToString() : null;

        private static string BuildErrorPayload(string saleId, string attribute, string message)
        {
            var payload = new
            {
                saleId = saleId ?? string.Empty,
                attribute = attribute ?? string.Empty,
                images = Array.Empty<object>(),
                continuationToken = string.Empty,
                errorMessage = message ?? string.Empty
            };
            return JsonSerializer.Serialize(payload);
        }

        private static string Truncate(string value, int maxLength)
            => string.IsNullOrEmpty(value) ? value : (value.Length > maxLength ? value.Substring(0, maxLength) : value);
    }
}