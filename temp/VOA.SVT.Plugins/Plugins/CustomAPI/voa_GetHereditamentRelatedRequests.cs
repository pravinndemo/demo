using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using VOA.Common;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class voa_GetHereditamentRelatedRequests : PluginBase
    {
        public voa_GetHereditamentRelatedRequests(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(voa_GetHereditamentRelatedRequests))
        {
            // No configuration in use by this plugin.
        }

        protected override void ExecuteCdsPlugin(ILocalPluginContext localPluginContext)
        {
            if (localPluginContext == null)
            {
                throw new ArgumentNullException(nameof(localPluginContext));
            }

            var context = localPluginContext.PluginExecutionContext;
            var service = localPluginContext.CurrentUserService;
            var tracing = localPluginContext.TracingService;

            try
            {
                tracing?.Trace($"{nameof(ExecuteCdsPlugin)} start");

                if (!context.InputParameters.Contains("hereditamentId") || !(context.InputParameters["hereditamentId"] is Guid ssuId))
                {
                    throw new InvalidPluginExecutionException("hereditamentId is required.");
                }

                tracing?.Trace($"HereditamentId: {ssuId}");

                var hereditamentRelatedActiveRequest = IsActiveRequestPresent(ssuId, service, tracing);
                context.OutputParameters["hereditamentActiveRequest"] = hereditamentRelatedActiveRequest;

                tracing?.Trace($"{nameof(ExecuteCdsPlugin)} done. ActiveRequest={hereditamentRelatedActiveRequest}");
            }
            catch (Exception ex)
            {
                tracing?.Trace($"Exception in voa_GetHereditamentRelatedRequests: {ex}");
                if (ex is InvalidPluginExecutionException)
                {
                    throw;
                }

                throw new InvalidPluginExecutionException("Unable to get hereditament related requests.");
            }
        }

        private static bool IsActiveRequestPresent(Guid ssuId, IOrganizationService service, ITracingService tracing)
        {
            var fetchXml = string.Format(@"
<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' top='1'>
    <entity name='voa_requestlineitem'>
        <attribute name='voa_requestlineitemid'/>
        <filter type='and'>
            <condition attribute='statecode' operator='eq' value='0'/>
            <condition attribute='voa_statutoryspatialunitid' operator='eq' value='{0}'/>
        </filter>
    </entity>
</fetch>", ssuId);

            tracing?.Trace($"FetchXML: {fetchXml}");
            var result = service.RetrieveMultiple(new FetchExpression(fetchXml));
            return result?.Entities != null && result.Entities.Count > 0;
        }
    }
}
