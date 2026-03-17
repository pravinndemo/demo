using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Extensions;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Web;
using VOA.Common;
using VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model;
using VOA.SVT.Plugins.Helpers;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class SvtGetAuditLogs : PluginBase
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private static readonly Regex GuidTokenRegex = new Regex(
            @"(?i)\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

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

                        var transformedBody = TransformAuditLogPayload(
                            body,
                            localPluginContext.SystemUserService,
                            localPluginContext.TracingService);

                        localPluginContext.TracingService.Trace($"Audit logs response snippet: {Truncate(transformedBody, 200)}");
                        context.OutputParameters["Result"] = transformedBody;
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

        private static string TransformAuditLogPayload(
            string responseBody,
            IOrganizationService service,
            ITracingService trace)
        {
            if (string.IsNullOrWhiteSpace(responseBody))
            {
                return responseBody;
            }

            try
            {
                var payload = JsonSerializer.Deserialize<AuditLogsPayload>(responseBody, JsonOptions);
                if (payload?.AuditHistory == null || payload.AuditHistory.Count == 0)
                {
                    return responseBody;
                }

                var assigneeIds = CollectAssigneeIds(payload);
                if (assigneeIds.Count == 0)
                {
                    return responseBody;
                }

                var userNames = ResolveUserNames(service, assigneeIds, trace);
                if (userNames.Count == 0)
                {
                    return responseBody;
                }

                var changed = false;
                foreach (var historyItem in payload.AuditHistory)
                {
                    if (historyItem?.Changes == null || historyItem.Changes.Count == 0)
                    {
                        continue;
                    }

                    foreach (var change in historyItem.Changes)
                    {
                        if (change == null || !ShouldResolveAssigneeField(change.FieldName))
                        {
                            continue;
                        }

                        if (TryReplaceGuidTokensWithNames(change.OldValue, userNames, out var nextOldValue))
                        {
                            change.OldValue = nextOldValue;
                            changed = true;
                        }

                        if (TryReplaceGuidTokensWithNames(change.NewValue, userNames, out var nextNewValue))
                        {
                            change.NewValue = nextNewValue;
                            changed = true;
                        }
                    }
                }

                return changed
                    ? JsonSerializer.Serialize(payload, JsonOptions)
                    : responseBody;
            }
            catch (Exception ex)
            {
                trace?.Trace($"SvtGetAuditLogs transform skipped due to error: {ex}");
                return responseBody;
            }
        }

        private static HashSet<Guid> CollectAssigneeIds(AuditLogsPayload payload)
        {
            var ids = new HashSet<Guid>();
            if (payload?.AuditHistory == null)
            {
                return ids;
            }

            foreach (var historyItem in payload.AuditHistory)
            {
                if (historyItem?.Changes == null || historyItem.Changes.Count == 0)
                {
                    continue;
                }

                foreach (var change in historyItem.Changes)
                {
                    if (change == null || !ShouldResolveAssigneeField(change.FieldName))
                    {
                        continue;
                    }

                    AddGuidTokens(GetJsonStringValue(change.OldValue), ids);
                    AddGuidTokens(GetJsonStringValue(change.NewValue), ids);
                }
            }

            return ids;
        }

        private static void AddGuidTokens(string value, ISet<Guid> ids)
        {
            if (string.IsNullOrWhiteSpace(value) || ids == null)
            {
                return;
            }

            foreach (Match match in GuidTokenRegex.Matches(value))
            {
                var token = match.Value.Trim('{', '}');
                if (Guid.TryParse(token, out var id) && id != Guid.Empty)
                {
                    ids.Add(id);
                }
            }
        }

        private static bool ShouldResolveAssigneeField(string fieldName)
        {
            var normalized = NormalizeFieldName(fieldName);
            return normalized == "assignedto"
                || normalized == "qcassignedto"
                || normalized.EndsWith("assignedto", StringComparison.Ordinal);
        }

        private static string NormalizeFieldName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var buffer = new char[value.Length];
            var count = 0;

            foreach (var ch in value)
            {
                if (!char.IsLetterOrDigit(ch))
                {
                    continue;
                }

                buffer[count++] = char.ToLowerInvariant(ch);
            }

            return new string(buffer, 0, count);
        }

        private static Dictionary<Guid, string> ResolveUserNames(
            IOrganizationService service,
            IEnumerable<Guid> userIds,
            ITracingService trace)
        {
            var ids = userIds?
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToArray() ?? Array.Empty<Guid>();

            var users = new Dictionary<Guid, string>();
            if (service == null || ids.Length == 0)
            {
                return users;
            }

            const int batchSize = 200;
            for (var i = 0; i < ids.Length; i += batchSize)
            {
                var batch = ids
                    .Skip(i)
                    .Take(batchSize)
                    .Cast<object>()
                    .ToArray();

                var query = new QueryExpression("systemuser")
                {
                    ColumnSet = new ColumnSet("systemuserid", "fullname", "firstname", "lastname"),
                    NoLock = true
                };
                query.Criteria.AddCondition("systemuserid", ConditionOperator.In, batch);

                var result = service.RetrieveMultiple(query);
                if (result?.Entities == null || result.Entities.Count == 0)
                {
                    continue;
                }

                foreach (var entity in result.Entities)
                {
                    var userId = entity.Id != Guid.Empty
                        ? entity.Id
                        : entity.GetAttributeValue<Guid>("systemuserid");

                    if (userId == Guid.Empty)
                    {
                        continue;
                    }

                    var displayName = entity.GetAttributeValue<string>("fullname");
                    if (string.IsNullOrWhiteSpace(displayName))
                    {
                        var firstName = entity.GetAttributeValue<string>("firstname") ?? string.Empty;
                        var lastName = entity.GetAttributeValue<string>("lastname") ?? string.Empty;
                        displayName = $"{firstName} {lastName}".Trim();
                    }

                    if (!string.IsNullOrWhiteSpace(displayName))
                    {
                        users[userId] = displayName;
                    }
                }
            }

            trace?.Trace($"SvtGetAuditLogs resolved {users.Count} user names for {ids.Length} assignee ids.");
            return users;
        }

        private static string ReplaceGuidTokensWithNames(string value, IReadOnlyDictionary<Guid, string> userNames)
        {
            if (string.IsNullOrWhiteSpace(value) || userNames == null || userNames.Count == 0)
            {
                return value;
            }

            return GuidTokenRegex.Replace(value, match =>
            {
                var token = match.Value.Trim('{', '}');
                if (Guid.TryParse(token, out var id)
                    && userNames.TryGetValue(id, out var displayName)
                    && !string.IsNullOrWhiteSpace(displayName))
                {
                    return displayName;
                }

                return match.Value;
            });
        }

        private static bool TryReplaceGuidTokensWithNames(
            JsonElement value,
            IReadOnlyDictionary<Guid, string> userNames,
            out JsonElement updatedValue)
        {
            updatedValue = value;

            var rawValue = GetJsonStringValue(value);
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                return false;
            }

            var replacedValue = ReplaceGuidTokensWithNames(rawValue, userNames);
            if (string.Equals(rawValue, replacedValue, StringComparison.Ordinal))
            {
                return false;
            }

            updatedValue = CreateJsonStringElement(replacedValue);
            return true;
        }

        private static string GetJsonStringValue(JsonElement value)
        {
            return value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
        }

        private static JsonElement CreateJsonStringElement(string value)
        {
            var json = JsonSerializer.Serialize(value ?? string.Empty);
            using (var document = JsonDocument.Parse(json))
            {
                return document.RootElement.Clone();
            }
        }

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
