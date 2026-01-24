using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;

namespace VOA.SVT.Plugins.Helpers
{
    public enum UserPersona
    {
        None = 0,
        User = 1,
        QA = 2,
        Manager = 3
    }

    public sealed class UserContextResult
    {
        public UserPersona Persona { get; set; }
        public string ResolutionSource { get; set; }
        public string MatchedTeamName { get; set; }
        public string MatchedRoleName { get; set; }
    }

    internal static class UserContextConfig
    {
        public const string TeamNameSvtManager = "SVT Manager Team";
        public const string TeamNameSvtQa = "SVT QA Team";
        public const string TeamNameSvtUser = "SVT User Team";

        public const string RoleNameSvtManager = "VOA SVT Manager";
        public const string RoleNameSvtQa = "VOA SVT QA";
        public const string RoleNameSvtUser = "VOA SVT User";

        public const int TeamTypeSecurityGroup = 2;

        public const string SourceTeam = "Team";
        public const string SourceRole = "Role";
        public const string SourceNone = "None";
    }

    public static class UserContextResolver
    {
        public static UserContextResult Resolve(IOrganizationService service, Guid userId, ITracingService trace)
        {
            if (service == null) throw new ArgumentNullException(nameof(service));

            var teamResult = ResolveFromTeams(service, userId, trace);
            if (teamResult.Persona != UserPersona.None)
            {
                return teamResult;
            }

            var roleResult = ResolveFromRoles(service, userId, trace);
            if (roleResult.Persona != UserPersona.None)
            {
                return roleResult;
            }

            return new UserContextResult
            {
                Persona = UserPersona.None,
                ResolutionSource = UserContextConfig.SourceNone,
                MatchedTeamName = string.Empty,
                MatchedRoleName = string.Empty
            };
        }

        private static UserContextResult ResolveFromTeams(IOrganizationService service, Guid userId, ITracingService trace)
        {
            var qe = new QueryExpression("team")
            {
                ColumnSet = new ColumnSet("teamid", "name", "teamtype", "azureactivedirectoryobjectid"),
                NoLock = true
            };

            qe.Criteria.AddCondition("teamtype", ConditionOperator.Equal, UserContextConfig.TeamTypeSecurityGroup);

            var nameFilter = new FilterExpression(LogicalOperator.Or);
            nameFilter.AddCondition("name", ConditionOperator.Equal, UserContextConfig.TeamNameSvtManager);
            nameFilter.AddCondition("name", ConditionOperator.Equal, UserContextConfig.TeamNameSvtQa);
            nameFilter.AddCondition("name", ConditionOperator.Equal, UserContextConfig.TeamNameSvtUser);
            qe.Criteria.AddFilter(nameFilter);

            var link = qe.AddLink("teammembership", "teamid", "teamid", JoinOperator.Inner);
            link.LinkCriteria.AddCondition("systemuserid", ConditionOperator.Equal, userId);

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("ResolveFromTeams: no SVT security-group team memberships found");
                return new UserContextResult { Persona = UserPersona.None };
            }

            var teamNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var entity in result.Entities)
            {
                var name = entity.GetAttributeValue<string>("name");
                if (!string.IsNullOrWhiteSpace(name))
                {
                    teamNames.Add(name);
                }
            }

            if (teamNames.Contains(UserContextConfig.TeamNameSvtManager))
            {
                return new UserContextResult
                {
                    Persona = UserPersona.Manager,
                    ResolutionSource = UserContextConfig.SourceTeam,
                    MatchedTeamName = UserContextConfig.TeamNameSvtManager,
                    MatchedRoleName = string.Empty
                };
            }

            if (teamNames.Contains(UserContextConfig.TeamNameSvtQa))
            {
                return new UserContextResult
                {
                    Persona = UserPersona.QA,
                    ResolutionSource = UserContextConfig.SourceTeam,
                    MatchedTeamName = UserContextConfig.TeamNameSvtQa,
                    MatchedRoleName = string.Empty
                };
            }

            if (teamNames.Contains(UserContextConfig.TeamNameSvtUser))
            {
                return new UserContextResult
                {
                    Persona = UserPersona.User,
                    ResolutionSource = UserContextConfig.SourceTeam,
                    MatchedTeamName = UserContextConfig.TeamNameSvtUser,
                    MatchedRoleName = string.Empty
                };
            }

            return new UserContextResult { Persona = UserPersona.None };
        }

        private static UserContextResult ResolveFromRoles(IOrganizationService service, Guid userId, ITracingService trace)
        {
            var qe = new QueryExpression("role")
            {
                ColumnSet = new ColumnSet("roleid", "name"),
                NoLock = true
            };

            var link = qe.AddLink("systemuserroles", "roleid", "roleid", JoinOperator.Inner);
            link.LinkCriteria.AddCondition("systemuserid", ConditionOperator.Equal, userId);

            var filter = new FilterExpression(LogicalOperator.Or);
            filter.AddCondition("name", ConditionOperator.Equal, UserContextConfig.RoleNameSvtManager);
            filter.AddCondition("name", ConditionOperator.Equal, UserContextConfig.RoleNameSvtQa);
            filter.AddCondition("name", ConditionOperator.Equal, UserContextConfig.RoleNameSvtUser);
            qe.Criteria.AddFilter(filter);

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("ResolveFromRoles: no SVT roles found");
                return new UserContextResult { Persona = UserPersona.None };
            }

            var roleNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var entity in result.Entities)
            {
                var name = entity.GetAttributeValue<string>("name");
                if (!string.IsNullOrWhiteSpace(name))
                {
                    roleNames.Add(name);
                }
            }

            if (roleNames.Contains(UserContextConfig.RoleNameSvtManager))
            {
                return new UserContextResult
                {
                    Persona = UserPersona.Manager,
                    ResolutionSource = UserContextConfig.SourceRole,
                    MatchedTeamName = string.Empty,
                    MatchedRoleName = UserContextConfig.RoleNameSvtManager
                };
            }

            if (roleNames.Contains(UserContextConfig.RoleNameSvtQa))
            {
                return new UserContextResult
                {
                    Persona = UserPersona.QA,
                    ResolutionSource = UserContextConfig.SourceRole,
                    MatchedTeamName = string.Empty,
                    MatchedRoleName = UserContextConfig.RoleNameSvtQa
                };
            }

            if (roleNames.Contains(UserContextConfig.RoleNameSvtUser))
            {
                return new UserContextResult
                {
                    Persona = UserPersona.User,
                    ResolutionSource = UserContextConfig.SourceRole,
                    MatchedTeamName = string.Empty,
                    MatchedRoleName = UserContextConfig.RoleNameSvtUser
                };
            }

            return new UserContextResult { Persona = UserPersona.None };
        }
    }
}
