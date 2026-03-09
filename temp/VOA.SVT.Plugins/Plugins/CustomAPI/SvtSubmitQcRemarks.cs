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

            var taskIds = ParseTaskIds(GetInput(context, "taskList"));
            if (taskIds.Count == 0)
            {
                taskIds = ParseTaskIds(GetInput(context, "taskId"));
            }
            var qcOutcome = NormalizeOptionalStringValue(GetInput(context, "qcOutcome"));
            var qcRemark = NormalizeOptionalStringValue(GetInput(context, "qcRemark"));
            var qcReviewedBy = NormalizeOptionalStringValue(GetInput(context, "qcReviewedBy"));

            if (taskIds.Count == 0)
            {
                throw new InvalidPluginExecutionException("taskId or taskList is required.");
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

            var targetUrl = apiConfig.Address.Trim();
            var payload = new Dictionary<string, object>
            {
                ["taskList"] = taskIds,
                ["qcOutcome"] = qcOutcome ?? string.Empty,
                ["qcRemark"] = qcRemark,
                ["qcReviewedBy"] = qcReviewedBy ?? string.Empty
            };
            var jsonBody = JsonSerializer.Serialize(payload);

            trace?.Trace(
                $"Posting QC remarks to APIM. Url={Truncate(targetUrl, 300)} TaskCount={taskIds.Count} Payload={Truncate(jsonBody, 500)}");

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

                using (var request = new HttpRequestMessage(HttpMethod.Post, targetUrl))
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

        private static List<string> ParseTaskIds(string raw)
        {
            var result = new List<string>();
            if (string.IsNullOrWhiteSpace(raw))
            {
                return result;
            }

            var trimmed = raw.Trim();
            if (trimmed.StartsWith("["))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<string[]>(trimmed);
                    if (parsed != null)
                    {
                        foreach (var item in parsed)
                        {
                            AddTaskId(result, item);
                        }
                        return result;
                    }
                }
                catch
                {
                    // fall back to simple parsing
                }
            }

            if (trimmed.Contains(","))
            {
                foreach (var part in trimmed.Split(','))
                {
                    AddTaskId(result, part);
                }
                return result;
            }

            AddTaskId(result, trimmed);
            return result;
        }

        private static void AddTaskId(ICollection<string> list, string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            var normalized = NormalizeTaskId(value);
            if (!string.IsNullOrWhiteSpace(normalized))
            {
                list.Add(normalized);
            }
        }

        private static string NormalizeTaskId(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var sb = new StringBuilder();
            foreach (var ch in value)
            {
                if (char.IsDigit(ch))
                {
                    sb.Append(ch);
                }
            }
            var digits = sb.ToString();
            return string.IsNullOrWhiteSpace(digits) ? value.Trim() : digits;
        }

        private static string NormalizeOptionalStringValue(string value)
            => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string Truncate(string s, int maxLen)
            => string.IsNullOrEmpty(s) ? s : (s.Length > maxLen ? s.Substring(0, maxLen) : s);
    }
}
