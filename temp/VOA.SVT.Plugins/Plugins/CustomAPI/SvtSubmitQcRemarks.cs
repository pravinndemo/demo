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
    public class SvtSubmitQcRemarks : PluginBase
    {
        /// <summary>
        /// Name of the API configuration returned by voa_CredentialProvider
        /// </summary>
        private const string CONFIGURATION_NAME = "SVTTaskAssignment";

        public SvtSubmitQcRemarks(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtSubmitQcRemarks))
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
            if (userContext.Persona != UserPersona.QA && userContext.Persona != UserPersona.Manager)
            {
                trace?.Trace(
                    $"SvtSubmitQcRemarks denied. User={context.InitiatingUserId}, Persona={userContext.Persona}");
                throw new InvalidPluginExecutionException("Submit QC remarks is restricted to QA/Manager role/team.");
            }

            var taskId = NormalizeOptionalStringValue(GetInput(context, "taskId"));
            var qcOutcome = NormalizeOptionalStringValue(GetInput(context, "qcOutcome"));
            var qcRemark = NormalizeOptionalStringValue(GetInput(context, "qcRemark"));
            var qcReviewedBy = NormalizeOptionalStringValue(GetInput(context, "qcReviewedBy"));

            if (string.IsNullOrWhiteSpace(taskId))
            {
                throw new InvalidPluginExecutionException("taskId is required.");
            }

            if (string.IsNullOrWhiteSpace(qcOutcome))
            {
                throw new InvalidPluginExecutionException("qcOutcome is required.");
            }

            if (string.IsNullOrWhiteSpace(qcReviewedBy))
            {
                var fallbackId = context.InitiatingUserId != Guid.Empty
                    ? context.InitiatingUserId
                    : context.UserId;
                qcReviewedBy = fallbackId == Guid.Empty ? string.Empty : fallbackId.ToString();
            }

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
                throw new InvalidPluginExecutionException("SVTTaskAssignment configuration missing Address.");
            }

            trace?.Trace("SvtSubmitQcRemarks started.");

            // 2) OAuth token (if needed)
            trace?.Trace("Generating authentication token...");
            var auth = new Authentication(localPluginContext, apiConfig);
            var authResult = auth.GenerateAuthentication();

            var fullUrl = BuildUrl(apiConfig.Address, taskId);
            var payload = new Dictionary<string, object>
            {
                ["qcOutcome"] = qcOutcome ?? string.Empty,
                ["qcRemark"] = qcRemark,
                ["qcReviewedBy"] = qcReviewedBy ?? string.Empty
            };
            var jsonBody = JsonSerializer.Serialize(payload);

            trace?.Trace($"Posting QC remarks to APIM. Url={Truncate(fullUrl, 300)} Payload={Truncate(jsonBody, 500)}");

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

                using (var request = new HttpRequestMessage(HttpMethod.Post, fullUrl))
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
                                $"Submit QC remarks failed ({(int)response.StatusCode} {response.ReasonPhrase}).");
                        }

                        context.OutputParameters["Result"] = string.IsNullOrWhiteSpace(body) ? "success" : body;
                        trace?.Trace("SvtSubmitQcRemarks completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        trace?.Trace($"APIM call exception: {ex}");
                        if (ex is InvalidPluginExecutionException)
                        {
                            throw;
                        }
                        throw new InvalidPluginExecutionException("Submit QC remarks failed.");
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

        private static string NormalizeOptionalStringValue(string value)
            => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string BuildUrl(string baseAddress, string taskId)
        {
            if (string.IsNullOrWhiteSpace(baseAddress))
            {
                return baseAddress;
            }

            var trimmed = baseAddress.TrimEnd('/');

            if (trimmed.Contains("{taskId}", StringComparison.Ordinal))
            {
                return trimmed.Replace("{taskId}", taskId);
            }

            if (trimmed.Contains("{id}", StringComparison.Ordinal))
            {
                return trimmed.Replace("{id}", taskId);
            }

            return $"{trimmed}/{taskId}/qc-remarks";
        }

        private static string Truncate(string s, int maxLen)
            => string.IsNullOrEmpty(s) ? s : (s.Length > maxLen ? s.Substring(0, maxLen) : s);
    }
}
