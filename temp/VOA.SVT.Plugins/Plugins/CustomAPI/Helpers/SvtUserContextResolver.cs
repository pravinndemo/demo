using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;

namespace VOA.SVT.Plugins.CustomAPI.Helpers
{
    public enum SvtPersona
    {
        None = 0,
        User = 1,
        QA = 2,
        Manager = 3
    }

    public sealed class SvtUserContextResult
    {
        public SvtPersona Persona { get; set; }
        public string ResolutionSource { get; set; }
        public string MatchedTeamName { get; set; }
        public string MatchedRoleName { get; set; }
    }

    internal static class SvtUserContextConfig
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

    public static class SvtUserContextResolver
    {
        public static SvtUserContextResult Resolve(IOrganizationService service, Guid userId, ITracingService trace)
        {
            if (service == null) throw new ArgumentNullException(nameof(service));

            var teamResult = ResolveFromTeams(service, userId, trace);
            if (teamResult.Persona != SvtPersona.None)
            {
                return teamResult;
            }

            var roleResult = ResolveFromRoles(service, userId, trace);
            if (roleResult.Persona != SvtPersona.None)
            {
                return roleResult;
            }

            return new SvtUserContextResult
            {
                Persona = SvtPersona.None,
                ResolutionSource = SvtUserContextConfig.SourceNone,
                MatchedTeamName = string.Empty,
                MatchedRoleName = string.Empty
            };
        }

        private static SvtUserContextResult ResolveFromTeams(IOrganizationService service, Guid userId, ITracingService trace)
        {
            var qe = new QueryExpression("team")
            {
                ColumnSet = new ColumnSet("teamid", "name", "teamtype", "azureactivedirectoryobjectid"),
                NoLock = true
            };

            qe.Criteria.AddCondition("teamtype", ConditionOperator.Equal, SvtUserContextConfig.TeamTypeSecurityGroup);

            var nameFilter = new FilterExpression(LogicalOperator.Or);
            nameFilter.AddCondition("name", ConditionOperator.Equal, SvtUserContextConfig.TeamNameSvtManager);
            nameFilter.AddCondition("name", ConditionOperator.Equal, SvtUserContextConfig.TeamNameSvtQa);
            nameFilter.AddCondition("name", ConditionOperator.Equal, SvtUserContextConfig.TeamNameSvtUser);
            qe.Criteria.AddFilter(nameFilter);

            var link = qe.AddLink("teammembership", "teamid", "teamid", JoinOperator.Inner);
            link.LinkCriteria.AddCondition("systemuserid", ConditionOperator.Equal, userId);

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("ResolveFromTeams: no SVT security-group team memberships found");
                return new SvtUserContextResult { Persona = SvtPersona.None };
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

            if (teamNames.Contains(SvtUserContextConfig.TeamNameSvtManager))
            {
                return new SvtUserContextResult
                {
                    Persona = SvtPersona.Manager,
                    ResolutionSource = SvtUserContextConfig.SourceTeam,
                    MatchedTeamName = SvtUserContextConfig.TeamNameSvtManager,
                    MatchedRoleName = string.Empty
                };
            }

            if (teamNames.Contains(SvtUserContextConfig.TeamNameSvtQa))
            {
                return new SvtUserContextResult
                {
                    Persona = SvtPersona.QA,
                    ResolutionSource = SvtUserContextConfig.SourceTeam,
                    MatchedTeamName = SvtUserContextConfig.TeamNameSvtQa,
                    MatchedRoleName = string.Empty
                };
            }

            if (teamNames.Contains(SvtUserContextConfig.TeamNameSvtUser))
            {
                return new SvtUserContextResult
                {
                    Persona = SvtPersona.User,
                    ResolutionSource = SvtUserContextConfig.SourceTeam,
                    MatchedTeamName = SvtUserContextConfig.TeamNameSvtUser,
                    MatchedRoleName = string.Empty
                };
            }

            return new SvtUserContextResult { Persona = SvtPersona.None };
        }

        private static SvtUserContextResult ResolveFromRoles(IOrganizationService service, Guid userId, ITracingService trace)
        {
            var qe = new QueryExpression("role")
            {
                ColumnSet = new ColumnSet("roleid", "name"),
                NoLock = true
            };

            var link = qe.AddLink("systemuserroles", "roleid", "roleid", JoinOperator.Inner);
            link.LinkCriteria.AddCondition("systemuserid", ConditionOperator.Equal, userId);

            var filter = new FilterExpression(LogicalOperator.Or);
            filter.AddCondition("name", ConditionOperator.Equal, SvtUserContextConfig.RoleNameSvtManager);
            filter.AddCondition("name", ConditionOperator.Equal, SvtUserContextConfig.RoleNameSvtQa);
            filter.AddCondition("name", ConditionOperator.Equal, SvtUserContextConfig.RoleNameSvtUser);
            qe.Criteria.AddFilter(filter);

            var result = service.RetrieveMultiple(qe);
            if (result?.Entities == null || result.Entities.Count == 0)
            {
                trace?.Trace("ResolveFromRoles: no SVT roles found");
                return new SvtUserContextResult { Persona = SvtPersona.None };
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

            if (roleNames.Contains(SvtUserContextConfig.RoleNameSvtManager))
            {
                return new SvtUserContextResult
                {
                    Persona = SvtPersona.Manager,
                    ResolutionSource = SvtUserContextConfig.SourceRole,
                    MatchedTeamName = string.Empty,
                    MatchedRoleName = SvtUserContextConfig.RoleNameSvtManager
                };
            }

            if (roleNames.Contains(SvtUserContextConfig.RoleNameSvtQa))
            {
                return new SvtUserContextResult
                {
                    Persona = SvtPersona.QA,
                    ResolutionSource = SvtUserContextConfig.SourceRole,
                    MatchedTeamName = string.Empty,
                    MatchedRoleName = SvtUserContextConfig.RoleNameSvtQa
                };
            }

            if (roleNames.Contains(SvtUserContextConfig.RoleNameSvtUser))
            {
                return new SvtUserContextResult
                {
                    Persona = SvtPersona.User,
                    ResolutionSource = SvtUserContextConfig.SourceRole,
                    MatchedTeamName = string.Empty,
                    MatchedRoleName = SvtUserContextConfig.RoleNameSvtUser
                };
            }

            return new SvtUserContextResult { Persona = SvtPersona.None };
        }
    }
}
