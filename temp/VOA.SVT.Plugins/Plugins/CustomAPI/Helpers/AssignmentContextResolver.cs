using System;
using System.Collections.Generic;
using System.Linq;

namespace VOA.SVT.Plugins.CustomAPI.Helpers
{
    public enum AssignmentContext
    {
        Unknown = 0,
        Manager = 1,
        Qa = 2
    }

    internal static class AssignmentContextConfig
    {
        public static readonly string[] ManagerScreenTokens = { "assignment", "manager" };
        public static readonly string[] QaScreenTokens = { "qc", "quality" };
    }

    public static class AssignmentContextResolver
    {
        public static AssignmentContext Resolve(string screenName)
        {
            if (string.IsNullOrWhiteSpace(screenName))
            {
                return AssignmentContext.Unknown;
            }

            var lower = screenName.ToLowerInvariant();
            if (AssignmentContextConfig.ManagerScreenTokens.All(t => lower.Contains(t)))
            {
                return AssignmentContext.Manager;
            }

            if (lower.Contains("assignment") && AssignmentContextConfig.QaScreenTokens.Any(t => lower.Contains(t)))
            {
                return AssignmentContext.Qa;
            }

            return AssignmentContext.Unknown;
        }

        public static bool IsAuthorized(SvtPersona persona, AssignmentContext assignmentContext)
        {
            switch (assignmentContext)
            {
                case AssignmentContext.Manager:
                    return persona == SvtPersona.Manager;
                case AssignmentContext.Qa:
                    return persona == SvtPersona.Manager || persona == SvtPersona.QA;
                default:
                    return false;
            }
        }
    }

    internal static class AssignableUserConfig
    {
        public static IReadOnlyList<string> GetTeamNames(AssignmentContext context)
        {
            switch (context)
            {
                case AssignmentContext.Manager:
                    return new[] { SvtUserContextConfig.TeamNameSvtUser };
                case AssignmentContext.Qa:
                    return new[] { SvtUserContextConfig.TeamNameSvtQa };
                default:
                    return Array.Empty<string>();
            }
        }

        public static IReadOnlyList<string> GetRoleNames(AssignmentContext context)
        {
            switch (context)
            {
                case AssignmentContext.Manager:
                    return new[] { SvtUserContextConfig.RoleNameSvtUser };
                case AssignmentContext.Qa:
                    return new[] { SvtUserContextConfig.RoleNameSvtUser };
                default:
                    return Array.Empty<string>();
            }
        }
    }
}
