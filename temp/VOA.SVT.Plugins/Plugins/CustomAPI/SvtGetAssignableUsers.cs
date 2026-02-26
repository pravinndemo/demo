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

                if (users.Count > 0)
                {
                    var userIds = users.Keys.ToArray();
                    PopulateUserRoles(localPluginContext.SystemUserService, userIds, users, trace);
                    PopulateUserTeams(localPluginContext.SystemUserService, userIds, users, trace);
                }

                var ordered = users.Values
                    .OrderBy(u => u.FirstName ?? string.Empty)
                    .ThenBy(u => u.LastName ?? string.Empty)
                    .ToList();

                var message = ordered.Count == 0
                    ? $"No users found for assignment context: {assignmentContext}."
                    : "Assignable users retrieved.";
                context.OutputParameters["Result"] = BuildResult(true, message, ordered);
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

        private static void PopulateUserRoles(
            IOrganizationService service,
            Guid[] userIds,
            Dictionary<Guid, AssignableUserRecord> users,
            ITracingService trace)
        {
            if (service == null || userIds == null || userIds.Length == 0)
            {
                return;
            }

            var qe = new QueryExpression("systemuserroles")
            {
                ColumnSet = new ColumnSet("systemuserid", "roleid"),
                NoLock = true
            };
            qe.Criteria.AddCondition("systemuserid", ConditionOperator.In, userIds.Cast<object>().ToArray());

            var roleLink = qe.AddLink("role", "roleid", "roleid", JoinOperator.Inner);
            roleLink.EntityAlias = "role";
            roleLink.Columns = new ColumnSet("name");

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("SvtGetAssignableUsers: no user roles found.");
                return;
            }

            foreach (var entity in result.Entities)
            {
                var userId = entity.GetAttributeValue<Guid>("systemuserid");
                if (!users.TryGetValue(userId, out var record))
                {
                    continue;
                }

                var roleName = GetAliasedString(entity, "role.name");
                record.Roles ??= new List<string>();
                AddUnique(record.Roles, roleName);
                if (!string.IsNullOrWhiteSpace(roleName) && string.IsNullOrWhiteSpace(record.Role))
                {
                    record.Role = roleName.Trim();
                }
            }
        }

        private static void PopulateUserTeams(
            IOrganizationService service,
            Guid[] userIds,
            Dictionary<Guid, AssignableUserRecord> users,
            ITracingService trace)
        {
            if (service == null || userIds == null || userIds.Length == 0)
            {
                return;
            }

            var qe = new QueryExpression("teammembership")
            {
                ColumnSet = new ColumnSet("systemuserid", "teamid"),
                NoLock = true
            };
            qe.Criteria.AddCondition("systemuserid", ConditionOperator.In, userIds.Cast<object>().ToArray());

            var teamLink = qe.AddLink("team", "teamid", "teamid", JoinOperator.Inner);
            teamLink.EntityAlias = "team";
            teamLink.Columns = new ColumnSet("name", "teamtype");
            teamLink.LinkCriteria.AddCondition("teamtype", ConditionOperator.Equal, UserContextConfig.TeamTypeSecurityGroup);

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("SvtGetAssignableUsers: no user teams found.");
                return;
            }

            foreach (var entity in result.Entities)
            {
                var userId = entity.GetAttributeValue<Guid>("systemuserid");
                if (!users.TryGetValue(userId, out var record))
                {
                    continue;
                }

                var teamName = GetAliasedString(entity, "team.name");
                record.Teams ??= new List<string>();
                AddUnique(record.Teams, teamName);
                if (!string.IsNullOrWhiteSpace(teamName) && string.IsNullOrWhiteSpace(record.Team))
                {
                    record.Team = teamName.Trim();
                }
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
                var normalizedTeam = string.IsNullOrWhiteSpace(teamName) ? string.Empty : teamName.Trim();
                var normalizedRole = string.IsNullOrWhiteSpace(roleName) ? string.Empty : roleName.Trim();
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
                    Team = normalizedTeam,
                    Role = normalizedRole,
                    Teams = new List<string>(),
                    Roles = new List<string>()
                };
                AddUnique(record.Teams, normalizedTeam);
                AddUnique(record.Roles, normalizedRole);
                users[id] = record;
                return;
            }

            record.Teams ??= new List<string>();
            record.Roles ??= new List<string>();
            var nextTeam = string.IsNullOrWhiteSpace(teamName) ? string.Empty : teamName.Trim();
            var nextRole = string.IsNullOrWhiteSpace(roleName) ? string.Empty : roleName.Trim();
            AddUnique(record.Teams, nextTeam);
            AddUnique(record.Roles, nextRole);

            if (!string.IsNullOrWhiteSpace(nextTeam) && string.IsNullOrWhiteSpace(record.Team))
            {
                record.Team = nextTeam;
            }

            if (!string.IsNullOrWhiteSpace(nextRole) && string.IsNullOrWhiteSpace(record.Role))
            {
                record.Role = nextRole;
            }
        }

        private static void AddUnique(List<string> list, string value)
        {
            if (list == null || string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            var normalized = value.Trim();
            if (list.Any(v => v.Equals(normalized, StringComparison.OrdinalIgnoreCase)))
            {
                return;
            }

            list.Add(normalized);
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
            public List<string> Teams { get; set; }
            public List<string> Roles { get; set; }
        }
    }
}
