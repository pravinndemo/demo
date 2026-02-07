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
    public class SvtTaskAssignment : PluginBase
    {
        /// <summary>
        /// Name of the API configuration returned by voa_CredentialProvider
        /// </summary>
        private const string CONFIGURATION_NAME = "SVTTaskAssignment";

        public SvtTaskAssignment(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtTaskAssignment))
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
            var userContext = UserContextResolver.Resolve(
                localPluginContext.SystemUserService,
                context.InitiatingUserId,
                localPluginContext.TracingService);
            var screenName = GetInput(context, "screenName");
            if (string.IsNullOrWhiteSpace(screenName))
            {
                screenName = GetInput(context, "canvasScreenName");
            }
            var assignmentContext = AssignmentContextResolver.Resolve(screenName);
            if (!AssignmentContextResolver.IsAuthorized(userContext.Persona, assignmentContext))
            {
                localPluginContext.TracingService.Trace(
                    $"SVT TaskAssignment denied. User={context.InitiatingUserId}, Persona={userContext.Persona}, Screen={screenName ?? "<null>"}");
                throw new InvalidPluginExecutionException("SVT task assignment is restricted based on assignment context and role.");
            }

            var assignedToUserId = GetInput(context, "assignedToUserId");
            var taskStatus = GetInput(context, "taskStatus");
            var saleId = GetInput(context, "saleId");
            var taskId = GetInput(context, "taskId");
            var assignedByUserId = GetInput(context, "assignedByUserId");
            var date = GetInput(context, "date");
            var taskIds = ParseTaskIds(taskId);

            if (string.IsNullOrWhiteSpace(assignedByUserId))
            {
                var fallbackId = context.InitiatingUserId != Guid.Empty
                    ? context.InitiatingUserId
                    : context.UserId;
                assignedByUserId = fallbackId == Guid.Empty ? string.Empty : fallbackId.ToString();
            }

            if (string.IsNullOrWhiteSpace(assignedToUserId) || taskIds.Count == 0)
            {
                throw new InvalidPluginExecutionException("assignedToUserId and taskId are required.");
            }

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
                throw new InvalidPluginExecutionException("SVTTaskAssignment configuration missing Address.");
            }

            localPluginContext.TracingService.Trace("SVT TaskAssignment started.");

            // 2) OAuth token (if needed)
            localPluginContext.TracingService.Trace("Generating authentication token...");
            var auth = new Authentication(localPluginContext, apiConfig);
            var authResult = auth.GenerateAuthentication();

            var payload = new Dictionary<string, object>
            {
                ["source"] = ResolveSource(screenName, assignmentContext),
                ["assignedTo"] = assignedToUserId ?? string.Empty,
                ["taskList"] = taskIds,
                ["requestedBy"] = assignedByUserId ?? string.Empty,
                ["taskStatus"] = taskStatus ?? string.Empty,
                ["saleId"] = saleId ?? string.Empty,
                ["date"] = date ?? string.Empty
            };

            var jsonBody = JsonSerializer.Serialize(payload);

            localPluginContext.TracingService.Trace($"Posting assignment to APIM. Payload={Truncate(jsonBody, 500)}");

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

                using (var request = new HttpRequestMessage(HttpMethod.Post, apiConfig.Address))
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
                            localPluginContext.TracingService.Trace(
                                $"APIM call failed. Status={(int)response.StatusCode} {response.ReasonPhrase}. BodySnippet={Truncate(body, 500)}");

                            context.OutputParameters["Result"] = BuildResult(false, "Assignment failed.", body);
                            return;
                        }

                        context.OutputParameters["Result"] = BuildResult(true, "Assignment succeeded.", body);
                        localPluginContext.TracingService.Trace("SVT TaskAssignment completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        localPluginContext.TracingService.Trace($"APIM call exception: {ex}");
                        context.OutputParameters["Result"] = BuildResult(false, "Assignment failed.", ex.Message);
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

        private static string ResolveSource(string screenName, AssignmentContext context)
        {
            var lower = (screenName ?? string.Empty).Trim().ToLowerInvariant();
            if (lower.Contains("assignment") && lower.Contains("manager"))
            {
                return "MAT";
            }

            if (lower.Contains("assignment") && (lower.Contains("qc") || lower.Contains("quality")))
            {
                return "QCAT";
            }

            if ((lower.Contains("qc") || lower.Contains("quality")) && lower.Contains("view") && !lower.Contains("assignment"))
            {
                return "QCV";
            }

            if (lower.Contains("caseworker"))
            {
                return "CWV";
            }

            if (lower.Contains("sales") || lower.Contains("record search") || lower.Contains("recordsearch"))
            {
                return "SRS";
            }

            switch (context)
            {
                case AssignmentContext.Manager:
                    return "MAT";
                case AssignmentContext.Qa:
                    return "QCAT";
                default:
                    return string.Empty;
            }
        }

        private static string BuildResult(bool success, string message, string payload)
        {
            var safeMessage = (message ?? string.Empty).Replace("\"", "'");
            var safePayload = (payload ?? string.Empty).Replace("\"", "'");
            return "{" +
                   "\"success\":" + (success ? "true" : "false") + "," +
                   "\"message\":\"" + safeMessage + "\"," +
                   "\"payload\":\"" + safePayload + "\"" +
                   "}";
        }

        private static string Truncate(string s, int maxLen)
            => string.IsNullOrEmpty(s) ? s : (s.Length > maxLen ? s.Substring(0, maxLen) : s);
    }
}
