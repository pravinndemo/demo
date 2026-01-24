using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using VOA.Common;
using VOA.SVT.Plugins.Helpers;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class SvtGetAssignableUsers : PluginBase
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public SvtGetAssignableUsers(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtGetAssignableUsers))
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

            var screenName = GetInput(context, "screenName");
            if (string.IsNullOrWhiteSpace(screenName))
            {
                screenName = GetInput(context, "canvasScreenName");
            }

            var assignmentContext = AssignmentContextResolver.Resolve(screenName);
            if (assignmentContext == AssignmentContext.Unknown)
            {
                context.OutputParameters["Result"] = BuildResult(false, "Assignment context could not be determined.", Array.Empty<AssignableUserRecord>());
                return;
            }

            try
            {
                var teamNames = AssignableUserConfig.GetTeamNames(assignmentContext)
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray();
                var roleNames = AssignableUserConfig.GetRoleNames(assignmentContext)
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray();

                var users = new Dictionary<Guid, AssignableUserRecord>();

                if (teamNames.Length > 0)
                {
                    AddUsersFromTeams(localPluginContext.SystemUserService, teamNames, users, trace);
                }

                if (roleNames.Length > 0)
                {
                    AddUsersFromRoles(localPluginContext.SystemUserService, roleNames, users, trace);
                }

                var ordered = users.Values
                    .OrderBy(u => u.FirstName ?? string.Empty)
                    .ThenBy(u => u.LastName ?? string.Empty)
                    .ToList();

                context.OutputParameters["Result"] = BuildResult(true, "Assignable users retrieved.", ordered);
            }
            catch (Exception ex)
            {
                trace?.Trace($"SvtGetAssignableUsers failed: {ex}");
                var message = string.IsNullOrWhiteSpace(ex.Message)
                    ? "Unable to load assignable users."
                    : $"Unable to load assignable users: {ex.Message}";
                context.OutputParameters["Result"] = BuildResult(false, message, Array.Empty<AssignableUserRecord>());
            }
        }

        private static void AddUsersFromTeams(
            IOrganizationService service,
            string[] teamNames,
            Dictionary<Guid, AssignableUserRecord> users,
            ITracingService trace)
        {
            if (service == null || teamNames == null || teamNames.Length == 0)
            {
                return;
            }

            var qe = new QueryExpression("systemuser")
            {
                ColumnSet = new ColumnSet("systemuserid", "firstname", "lastname", "internalemailaddress", "domainname"),
                NoLock = true
            };
            qe.Criteria.AddCondition("isdisabled", ConditionOperator.Equal, false);

            var membershipLink = qe.AddLink("teammembership", "systemuserid", "systemuserid", JoinOperator.Inner);
            var teamLink = membershipLink.AddLink("team", "teamid", "teamid", JoinOperator.Inner);
            teamLink.EntityAlias = "team";
            teamLink.Columns = new ColumnSet("name");
            teamLink.LinkCriteria.AddCondition("teamtype", ConditionOperator.Equal, UserContextConfig.TeamTypeSecurityGroup);
            teamLink.LinkCriteria.AddCondition("name", ConditionOperator.In, teamNames);

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("SvtGetAssignableUsers: no users found for team membership.");
                return;
            }

            foreach (var entity in result.Entities)
            {
                var teamName = GetAliasedString(entity, "team.name");
                UpsertUser(users, entity, teamName, null);
            }
        }

        private static void AddUsersFromRoles(
            IOrganizationService service,
            string[] roleNames,
            Dictionary<Guid, AssignableUserRecord> users,
            ITracingService trace)
        {
            if (service == null || roleNames == null || roleNames.Length == 0)
            {
                return;
            }

            var qe = new QueryExpression("systemuser")
            {
                ColumnSet = new ColumnSet("systemuserid", "firstname", "lastname", "internalemailaddress", "domainname"),
                NoLock = true
            };
            qe.Criteria.AddCondition("isdisabled", ConditionOperator.Equal, false);

            var link = qe.AddLink("systemuserroles", "systemuserid", "systemuserid", JoinOperator.Inner);
            var roleLink = link.AddLink("role", "roleid", "roleid", JoinOperator.Inner);
            roleLink.EntityAlias = "role";
            roleLink.Columns = new ColumnSet("name");
            roleLink.LinkCriteria.AddCondition("name", ConditionOperator.In, roleNames);

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("SvtGetAssignableUsers: no users found for role membership.");
                return;
            }

            foreach (var entity in result.Entities)
            {
                var roleName = GetAliasedString(entity, "role.name");
                UpsertUser(users, entity, null, roleName);
            }
        }

        private static void UpsertUser(
            IDictionary<Guid, AssignableUserRecord> users,
            Entity entity,
            string teamName,
            string roleName)
        {
            if (entity == null)
            {
                return;
            }

            var id = entity.Id;
            if (id == Guid.Empty)
            {
                return;
            }

            if (!users.TryGetValue(id, out var record))
            {
                var email = entity.GetAttributeValue<string>("internalemailaddress");
                if (string.IsNullOrWhiteSpace(email))
                {
                    email = entity.GetAttributeValue<string>("domainname");
                }

                record = new AssignableUserRecord
                {
                    Id = id.ToString(),
                    FirstName = entity.GetAttributeValue<string>("firstname") ?? string.Empty,
                    LastName = entity.GetAttributeValue<string>("lastname") ?? string.Empty,
                    Email = email ?? string.Empty,
                    Team = teamName ?? string.Empty,
                    Role = roleName ?? string.Empty
                };
                users[id] = record;
                return;
            }

            if (!string.IsNullOrWhiteSpace(teamName) && string.IsNullOrWhiteSpace(record.Team))
            {
                record.Team = teamName;
            }

            if (!string.IsNullOrWhiteSpace(roleName) && string.IsNullOrWhiteSpace(record.Role))
            {
                record.Role = roleName;
            }
        }

        private static string GetAliasedString(Entity entity, string aliasName)
        {
            if (entity == null || string.IsNullOrWhiteSpace(aliasName))
            {
                return string.Empty;
            }

            var aliased = entity.GetAttributeValue<AliasedValue>(aliasName);
            return aliased?.Value as string ?? string.Empty;
        }

        private static string GetInput(IPluginExecutionContext context, string key)
            => context.InputParameters.Contains(key) ? context.InputParameters[key]?.ToString() : null;

        private static string BuildResult(bool success, string message, IReadOnlyList<AssignableUserRecord> users)
        {
            var payload = new AssignableUsersResult
            {
                Success = success,
                Message = message ?? string.Empty,
                Users = users ?? Array.Empty<AssignableUserRecord>()
            };
            return JsonSerializer.Serialize(payload, JsonOptions);
        }

        private sealed class AssignableUsersResult
        {
            public bool Success { get; set; }
            public string Message { get; set; }
            public IReadOnlyList<AssignableUserRecord> Users { get; set; }
        }

        private sealed class AssignableUserRecord
        {
            public string Id { get; set; }
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string Email { get; set; }
            public string Team { get; set; }
            public string Role { get; set; }
        }
    }
}
