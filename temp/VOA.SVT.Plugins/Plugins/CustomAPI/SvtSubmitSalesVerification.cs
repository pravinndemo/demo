using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Extensions;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using VOA.Common;
using VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model;
using VOA.SVT.Plugins.Helpers;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class SvtSubmitSalesVerification : PluginBase
    {
        /// <summary>
        /// Name of the API configuration returned by voa_CredentialProvider
        /// </summary>
        private const string CONFIGURATION_NAME = "SVTGetSalesRecord";

        public SvtSubmitSalesVerification(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtSubmitSalesVerification))
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

            var userContext = UserContextResolver.Resolve(
                localPluginContext.SystemUserService,
                context.InitiatingUserId,
                trace);
            if (userContext.Persona != UserPersona.User)
            {
                trace?.Trace(
                    $"SvtSubmitSalesVerification denied. User={context.InitiatingUserId}, Persona={userContext.Persona}");
                throw new InvalidPluginExecutionException("Submit Sales Verification is restricted to caseworker role/team.");
            }

            var saleId = GetInput(context, "saleId");
            if (string.IsNullOrWhiteSpace(saleId))
            {
                throw new InvalidPluginExecutionException("saleId is required.");
            }

            var payloadOverride = GetInput(context, "saleSubmitPayload");
            if (string.IsNullOrWhiteSpace(payloadOverride))
            {
                payloadOverride = GetInput(context, "payload");
            }
            var saleSubmitRemarks = GetInput(context, "saleSubmitRemarks");

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
                throw new InvalidPluginExecutionException("SVTGetSalesRecord configuration missing Address.");
            }

            trace?.Trace("SvtSubmitSalesVerification started.");

            // 2) OAuth token (if needed)
            trace?.Trace("Generating authentication token...");
            var auth = new Authentication(localPluginContext, apiConfig);
            var authResult = auth.GenerateAuthentication();

            var fullUrl = BuildUrl(apiConfig.Address, saleId);
            var jsonBody = BuildRequestBody(context, payloadOverride, saleSubmitRemarks);

            trace?.Trace($"Submitting sales verification. Url={Truncate(fullUrl, 300)} Payload={Truncate(jsonBody, 500)}");

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

                using (var request = new HttpRequestMessage(HttpMethod.Put, fullUrl))
                {
                    request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
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
                            throw new InvalidPluginExecutionException(
                                $"Submit sales verification failed ({(int)response.StatusCode} {response.ReasonPhrase}).");
                        }

                        context.OutputParameters["Result"] = string.IsNullOrWhiteSpace(body) ? "success" : body;
                        trace?.Trace("SvtSubmitSalesVerification completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        trace?.Trace($"APIM call exception: {ex}");
                        if (ex is InvalidPluginExecutionException)
                        {
                            throw;
                        }
                        throw new InvalidPluginExecutionException("Submit sales verification failed.");
                    }
                    finally
                    {
                        response?.Dispose();
                    }
                }
            }
        }

        private static string GetInput(IPluginExecutionContext context, string key)
            => context.InputParameters.Contains(key) ? context.InputParameters[key]?.ToString() : null;

        private static string BuildRequestBody(IPluginExecutionContext context, string payloadOverride, string saleSubmitRemarks)
        {
            var remarksOverride = NormalizeOptionalString(saleSubmitRemarks);
            if (!string.IsNullOrWhiteSpace(payloadOverride))
            {
                var trimmed = payloadOverride.Trim();
                if (string.IsNullOrWhiteSpace(remarksOverride))
                {
                    return trimmed;
                }

                try
                {
                    var root = JsonSerializer.Deserialize<Dictionary<string, object>>(trimmed);
                    if (root == null)
                    {
                        return trimmed;
                    }
                    var details = EnsureObject(root, "salesVerificationDetails");
                    details["remarks"] = remarksOverride;
                    root["salesVerificationDetails"] = details;
                    return JsonSerializer.Serialize(root);
                }
                catch
                {
                    return trimmed;
                }
            }

            var payload = new Dictionary<string, object>
            {
                ["salesVerificationTaskDetails"] = BuildSalesVerificationTaskDetails(context),
                ["salesParticularDetails"] = BuildSalesParticularDetails(context),
                ["salesVerificationDetails"] = BuildSalesVerificationDetails(context, remarksOverride)
            };

            return JsonSerializer.Serialize(payload);
        }

        private static Dictionary<string, object> BuildSalesVerificationTaskDetails(IPluginExecutionContext context)
        {
            return new Dictionary<string, object>
            {
                ["taskId"] = NormalizeOptionalString(GetInput(context, "taskId")),
                ["taskStatus"] = NormalizeOptionalString(GetInput(context, "taskStatus")),
                ["salesSource"] = NormalizeOptionalString(GetInput(context, "salesSource")),
                ["wltId"] = NormalizeOptionalString(GetInput(context, "wltId")),
                ["lrpddId"] = NormalizeOptionalString(GetInput(context, "lrpddId"))
            };
        }

        private static Dictionary<string, object> BuildSalesParticularDetails(IPluginExecutionContext context)
        {
            return new Dictionary<string, object>
            {
                ["salesParticular"] = NormalizeOptionalString(GetInput(context, "salesParticular")),
                ["linkParticulars"] = NormalizeOptionalString(GetInput(context, "linkParticulars")),
                ["kitchenAge"] = NormalizeOptionalString(GetInput(context, "kitchenAge")),
                ["kitchenSpecification"] = NormalizeOptionalString(GetInput(context, "kitchenSpecification")),
                ["bathroomAge"] = NormalizeOptionalString(GetInput(context, "bathroomAge")),
                ["bathroomSpecification"] = NormalizeOptionalString(GetInput(context, "bathroomSpecification")),
                ["glazing"] = NormalizeOptionalString(GetInput(context, "glazing")),
                ["heating"] = NormalizeOptionalString(GetInput(context, "heating")),
                ["decorativeFinishes"] = NormalizeOptionalString(GetInput(context, "decorativeFinishes")),
                ["conditionScore"] = NormalizeOptionalString(GetInput(context, "conditionScore")),
                ["conditionCategory"] = NormalizeOptionalString(GetInput(context, "conditionCategory")),
                ["particularNotes"] = NormalizeOptionalString(GetInput(context, "particularNotes"))
            };
        }

        private static Dictionary<string, object> BuildSalesVerificationDetails(IPluginExecutionContext context, string remarksOverride)
        {
            var remarks = !string.IsNullOrWhiteSpace(remarksOverride)
                ? remarksOverride
                : NormalizeOptionalString(GetInput(context, "remarks"));
            return new Dictionary<string, object>
            {
                ["isSaleUseful"] = NormalizeOptionalString(GetInput(context, "isSaleUseful")),
                ["whyNotUseful"] = NormalizeOptionalString(GetInput(context, "whyNotUseful")),
                ["additionalNotes"] = NormalizeOptionalString(GetInput(context, "additionalNotes")),
                ["remarks"] = remarks
            };
        }

        private static object NormalizeOptionalString(string value)
            => string.IsNullOrWhiteSpace(value) ? null : value;

        private static Dictionary<string, object> EnsureObject(Dictionary<string, object> root, string key)
        {
            if (root != null && root.TryGetValue(key, out var value))
            {
                if (value is Dictionary<string, object> dict)
                {
                    return dict;
                }
                if (value is JsonElement element && element.ValueKind == JsonValueKind.Object)
                {
                    try
                    {
                        var parsed = JsonSerializer.Deserialize<Dictionary<string, object>>(element.GetRawText());
                        if (parsed != null)
                        {
                            return parsed;
                        }
                    }
                    catch
                    {
                        // ignore parse errors
                    }
                }
            }
            return new Dictionary<string, object>();
        }

        private static string BuildUrl(string baseAddress, string saleId)
        {
            if (string.IsNullOrWhiteSpace(baseAddress))
            {
                return baseAddress;
            }

            var trimmed = baseAddress.TrimEnd('/');

            if (trimmed.Contains("{saleId}", StringComparison.Ordinal))
            {
                return trimmed.Replace("{saleId}", saleId);
            }

            if (trimmed.Contains("{id}", StringComparison.Ordinal))
            {
                return trimmed.Replace("{id}", saleId);
            }

            if (trimmed.EndsWith("/sales", StringComparison.OrdinalIgnoreCase))
            {
                return $"{trimmed}/{saleId}";
            }

            return $"{trimmed}/sales/{saleId}";
        }

        private static string Truncate(string s, int maxLen)
            => string.IsNullOrEmpty(s) ? s : (s.Length > maxLen ? s.Substring(0, maxLen) : s);
    }
}
