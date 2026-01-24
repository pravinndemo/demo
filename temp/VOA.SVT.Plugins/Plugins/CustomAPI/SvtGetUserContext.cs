using Microsoft.Xrm.Sdk;
using System;
using VOA.Common;
using VOA.SVT.Plugins.CustomAPI.Helpers;

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

            var result = SvtUserContextResolver.Resolve(localPluginContext.SystemUserService, userId, trace);
            WriteOutputs(context, result);

            trace.Trace($"SvtGetUserContext: Resolved {result.Persona} via {result.ResolutionSource}");
        }

        private static void WriteOutputs(IPluginExecutionContext context, SvtUserContextResult result)
        {
            var persona = result?.Persona ?? SvtPersona.None;
            var source = result?.ResolutionSource ?? SvtUserContextConfig.SourceNone;

            context.OutputParameters[OutputNames.Persona] = persona.ToString();
            context.OutputParameters[OutputNames.ResolutionSource] = source;
            context.OutputParameters[OutputNames.HasAccess] = persona != SvtPersona.None;
            context.OutputParameters[OutputNames.MatchedTeam] = result?.MatchedTeamName ?? string.Empty;
            context.OutputParameters[OutputNames.MatchedRole] = result?.MatchedRoleName ?? string.Empty;
        }
    }
}
