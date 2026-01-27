using Microsoft.Xrm.Sdk;
using System;
using VOA.Common;
using VOA.SVT.Plugins.Helpers;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class SvtGetUserContext : PluginBase
    {
        private static class OutputNames
        {
            public const string Persona = "svtPersona";
            public const string ResolutionSource = "resolutionSource";
            public const string HasAccess = "hasSvtAccess";
            public const string MatchedTeam = "matchedTeamName";
            public const string MatchedRole = "matchedRoleName";
            public const string MatchedRoles = "matchedRoleNames";
        }

        public SvtGetUserContext(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(SvtGetUserContext))
        {
        }

        protected override void ExecuteCdsPlugin(ILocalPluginContext localPluginContext)
        {
            if (localPluginContext == null)
            {
                throw new ArgumentNullException(nameof(localPluginContext));
            }

            var context = localPluginContext.PluginExecutionContext;
            var trace = localPluginContext.TracingService;
            var userId = context.InitiatingUserId;

            trace.Trace("SvtGetUserContext: Start");
            trace.Trace($"SvtGetUserContext: InitiatingUserId={userId}");

            var result = UserContextResolver.Resolve(localPluginContext.SystemUserService, userId, trace);
            WriteOutputs(context, result);

            trace.Trace($"SvtGetUserContext: Resolved {result.Persona} via {result.ResolutionSource}");
        }

        private static void WriteOutputs(IPluginExecutionContext context, UserContextResult result)
        {
            var persona = result?.Persona ?? UserPersona.None;
            var source = result?.ResolutionSource ?? UserContextConfig.SourceNone;
            var matchedRoles = result?.MatchedRoleNames ?? Array.Empty<string>();

            context.OutputParameters[OutputNames.Persona] = persona.ToString();
            context.OutputParameters[OutputNames.ResolutionSource] = source;
            context.OutputParameters[OutputNames.HasAccess] = persona != UserPersona.None;
            context.OutputParameters[OutputNames.MatchedTeam] = result?.MatchedTeamName ?? string.Empty;
            context.OutputParameters[OutputNames.MatchedRole] = result?.MatchedRoleName ?? string.Empty;
            context.OutputParameters[OutputNames.MatchedRoles] = matchedRoles.Count > 0
                ? string.Join(";", matchedRoles)
                : string.Empty;
        }
    }
}
