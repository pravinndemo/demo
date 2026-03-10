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
    public class SvtGetAuditLogs : PluginBase
    {
        /// <summary>
        /// Name of the API configuration returned by voa_CredentialProvider.
        /// Expected Address example:
        /// https://ctp-iaz-app-dev-salesverification-api.azurewebsites.net/v1/audit-logs
        /// </summary>
        private const string CONFIGURATION_NAME = "SVTAuditLogs";

        public SvtGetAuditLogs(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtGetAuditLogs))
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
            var taskId = NormalizeOptionalStringValue(GetInput(context, "taskId"));
            var auditType = NormalizeAuditType(GetInput(context, "auditType"));

            if (string.IsNullOrWhiteSpace(taskId))
            {
                context.OutputParameters["Result"] = BuildErrorPayload("taskId is required.");
                return;
            }

            if (string.IsNullOrWhiteSpace(auditType))
            {
                context.OutputParameters["Result"] = BuildErrorPayload("auditType is required and must be QC or SL.");
                return;
            }

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
                context.OutputParameters["Result"] = BuildErrorPayload("SVTAuditLogs configuration missing Address.");
                return;
            }

            localPluginContext.TracingService.Trace("SvtGetAuditLogs started.");

            localPluginContext.TracingService.Trace("Generating authentication token...");
            var auth = new Authentication(localPluginContext, apiConfig);
            var authResult = auth.GenerateAuthentication();

            var fullUrl = BuildUrl(apiConfig.Address, taskId, auditType);
            localPluginContext.TracingService.Trace($"Calling audit logs URL: {Truncate(fullUrl, 300)}");

            using (var httpClient = new HttpClient())
            {
                httpClient.Timeout = TimeSpan.FromSeconds(30);
                httpClient.ApplyVOAConfiguration(localPluginContext);

                if (!string.IsNullOrWhiteSpace(apiConfig.APIMSubscriptionKey))
                {
                    httpClient.DefaultRequestHeaders.Remove("Ocp-Apim-Subscription-Key");
                    httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", apiConfig.APIMSubscriptionKey);
                }

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
                            localPluginContext.TracingService.Trace(
                                $"Audit logs call failed. Status={(int)response.StatusCode} {response.ReasonPhrase}. BodySnippet={Truncate(body, 500)}");

                            context.OutputParameters["Result"] = BuildErrorPayload(
                                $"Audit logs call failed ({(int)response.StatusCode} {response.ReasonPhrase}).");
                            return;
                        }

                        localPluginContext.TracingService.Trace($"Audit logs response snippet: {Truncate(body, 200)}");
                        context.OutputParameters["Result"] = body;
                        localPluginContext.TracingService.Trace("SvtGetAuditLogs completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        localPluginContext.TracingService.Trace($"Audit logs call exception: {ex}");
                        context.OutputParameters["Result"] = BuildErrorPayload("Failed to call audit logs API.");
                    }
                    finally
                    {
                        response?.Dispose();
                    }
                }
            }
        }

        private static string BuildUrl(string baseAddress, string taskId, string auditType)
        {
            var trimmed = (baseAddress ?? string.Empty).Trim();
            if (trimmed.Length == 0)
            {
                return trimmed;
            }

            if (trimmed.Contains("{taskId}", StringComparison.Ordinal))
            {
                trimmed = trimmed.Replace("{taskId}", HttpUtility.UrlEncode(taskId));
            }

            if (trimmed.Contains("{auditType}", StringComparison.Ordinal))
            {
                trimmed = trimmed.Replace("{auditType}", HttpUtility.UrlEncode(auditType));
            }

            if (trimmed.IndexOf("taskId=", StringComparison.OrdinalIgnoreCase) >= 0
                && trimmed.IndexOf("auditType=", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return trimmed;
            }

            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absoluteUri))
            {
                var builder = new UriBuilder(absoluteUri);
                var query = HttpUtility.ParseQueryString(builder.Query ?? string.Empty);
                query["taskId"] = taskId;
                query["auditType"] = auditType;
                builder.Query = query.ToString();
                return builder.Uri.ToString();
            }

            var separator = trimmed.Contains("?") ? "&" : "?";
            return $"{trimmed}{separator}taskId={HttpUtility.UrlEncode(taskId)}&auditType={HttpUtility.UrlEncode(auditType)}";
        }

        private static string GetInput(IPluginExecutionContext context, string key)
            => context.InputParameters.Contains(key) ? context.InputParameters[key]?.ToString() : null;

        private static string NormalizeAuditType(string value)
        {
            var normalized = NormalizeOptionalStringValue(value);
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return null;
            }

            var upper = normalized.ToUpperInvariant();
            return upper == "QC" || upper == "SL" ? upper : null;
        }

        private static string NormalizeOptionalStringValue(string value)
            => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string Truncate(string s, int maxLen)
            => string.IsNullOrEmpty(s) ? s : (s.Length > maxLen ? s.Substring(0, maxLen) : s);

        private static string BuildErrorPayload(string message)
        {
            var payload = new
            {
                items = Array.Empty<object>(),
                errorMessage = message ?? string.Empty
            };

            return JsonSerializer.Serialize(payload);
        }
    }
}
