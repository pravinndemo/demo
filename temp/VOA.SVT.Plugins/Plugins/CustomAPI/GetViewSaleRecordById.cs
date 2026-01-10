using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Extensions;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using VOA.Common;
using VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model;
using VOA.SVT.Plugins.Helpers;

namespace VOA.SVT.Plugins.CustomAPI
{
    public class GetViewSaleRecordById : PluginBase
    {
        /// <summary>
        /// Name of the API configuration returned by voa_CredentialProvider
        /// </summary>
        private const string CONFIGURATION_NAME = "SVTGetViewSaleRecordById";

        public GetViewSaleRecordById(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(GetViewSaleRecordById))
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
            var saleId = context.InputParameters.Contains("saleId")
                ? context.InputParameters["saleId"]?.ToString()
                : null;

            if (string.IsNullOrWhiteSpace(saleId))
            {
                throw new InvalidPluginExecutionException("saleId is required.");
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
                throw new InvalidPluginExecutionException("SVTGetViewSaleRecordById configuration missing Address.");
            }

            localPluginContext.TracingService.Trace("SVT GetViewSaleRecordById started.");

            // 2) OAuth token (if needed)
            localPluginContext.TracingService.Trace("Generating authentication token...");
            var auth = new Authentication(localPluginContext, apiConfig);
            var authResult = auth.GenerateAuthentication();

            // 3) Build full URL (base Address + path from Custom API inputs)
            var fullUrl = BuildUrl(apiConfig.Address, saleId);

            localPluginContext.TracingService.Trace($"Calling APIM URL: {Truncate(fullUrl, 300)}");

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

                using (var request = new HttpRequestMessage(HttpMethod.Get, fullUrl))
                {
                    HttpResponseMessage response = null;
                    string body = string.Empty;

                    try
                    {
                        // Sync plugin: avoid deadlocks by using GetAwaiter().GetResult()
                        response = httpClient.SendAsync(request).GetAwaiter().GetResult();
                        body = response.Content?.ReadAsStringAsync().GetAwaiter().GetResult() ?? string.Empty;

                        if (!response.IsSuccessStatusCode)
                        {
                            localPluginContext.TracingService.Trace(
                                $"APIM call failed. Status={(int)response.StatusCode} {response.ReasonPhrase}. BodySnippet={Truncate(body, 500)}");

                            context.OutputParameters["Result"] = BuildFailureSamplePayload(
                                saleId,
                                $"APIM call failed ({(int)response.StatusCode} {response.ReasonPhrase}).");
                            localPluginContext.TracingService.Trace("Returning sample payload due to APIM failure.");
                            return;
                        }

                        // Trace minimal response snippet (avoid PII / noisy logs)
                        localPluginContext.TracingService.Trace($"APIM response snippet: {Truncate(body, 200)}");

                        // Return raw JSON back via Custom API output parameter (Result)
                        context.OutputParameters["Result"] = body;
                        localPluginContext.TracingService.Trace("SVT GetViewSaleRecordById completed successfully.");
                    }
                    catch (Exception ex)
                    {
                        localPluginContext.TracingService.Trace($"APIM call exception: {ex}");
                        context.OutputParameters["Result"] = BuildFailureSamplePayload(
                            saleId,
                            "APIM call exception.");
                        localPluginContext.TracingService.Trace("Returning sample payload due to APIM exception.");
                    }
                    finally
                    {
                        response?.Dispose();
                    }
                }
            }
        }

        private static string BuildUrl(string baseAddress, string saleId)
        {
            if (string.IsNullOrWhiteSpace(baseAddress))
            {
                return baseAddress;
            }

            var trimmed = baseAddress.TrimEnd('/');

            if (trimmed.Contains("{saleId}", StringComparison.Ordinal))
            {
                return trimmed.Replace("{saleId}", saleId);
            }

            if (trimmed.Contains("{id}", StringComparison.Ordinal))
            {
                return trimmed.Replace("{id}", saleId);
            }

            if (trimmed.EndsWith("/sales", StringComparison.OrdinalIgnoreCase))
            {
                return $"{trimmed}/{saleId}";
            }

            return $"{trimmed}/sales/{saleId}";
        }

        private static string Truncate(string s, int maxLen)
            => string.IsNullOrEmpty(s) ? s : (s.Length > maxLen ? s.Substring(0, maxLen) : s);

        private static string BuildFailureSamplePayload(string saleId, string message)
        {
            var safeId = saleId ?? string.Empty;
            var safeMessage = (message ?? string.Empty).Replace("\"", "'");
            return "{" +
                   "\"error\":\"" + safeMessage + "\"," +
                   "\"taskDetails\":{" +
                   "\"saleId\":\"" + safeId + "\"," +
                   "\"taskId\":\"T-101987654\"," +
                   "\"taskStatus\":\"InProgress\"," +
                   "\"assignedTo\":\"05b749d9-f8cb-47ea-8487-5e891176e36d\"" +
                   "}," +
                   "\"createdBy\":\"5b003c7b-ba0f-4df9-9419-a4a06832071d\"," +
                   "\"links\":{}," +
                   "\"epc\":\"POSTCODE123\"," +
                   "\"zoopla\":\"POSTCODE123\"," +
                   "\"rightMove\":\"POSTCODE123\"," +
                   "\"vms\":{\"X\":\"ABC1230976\",\"Y\":\"ABC1230976\"}," +
                   "\"bandingInfo\":{" +
                   "\"address\":\"10 Example Street, Worthing, BN11 1AA\"," +
                   "\"band\":\"C\"," +
                   "\"bandingEffectiveDate\":\"2022-04-01T00:00:00Z\"," +
                   "\"billingAuthority\":\"Adur & Worthing Councils\"," +
                   "\"composite\":false" +
                   "}," +
                   "\"propertyAttributes\":{" +
                   "\"padStatus\":\"Active\"," +
                   "\"effectiveDate\":\"2023-07-01T00:00:00Z\"," +
                   "\"effectiveTo\":null," +
                   "\"status\":\"Verified\"," +
                   "\"dwellingGroup\":\"House\"," +
                   "\"dwellingType\":\"Detached\"," +
                   "\"dwellingArea\":\"120 sqm\"," +
                   "\"ageCode\":\"Post-1990\"," +
                   "\"heating\":\"Gas Central\"," +
                   "\"mainroomCount\":2," +
                   "\"bedroomCount\":3," +
                   "\"bathroomCount\":2," +
                   "\"floorCount\":2" +
                   "}," +
                   "\"floorLevel\":\"Ground+First\"," +
                   "\"parkingCode\":\"Driveway\"," +
                   "\"conservatoryArea\":\"12 sqm\"," +
                   "\"conservatoryType\":\"UPVC\"," +
                   "\"reasonCode\":\"PAD01\"," +
                   "\"valueSignificantCodes\":3," +
                   "\"sourceCodes\":\"SRV, LNDREG\"," +
                   "\"plotSize\":350," +
                   "\"padConfirmation\":\"Confirmed by survey\"," +
                   "\"hereditamentId\":\"5e6cc9c5-9ffe-8e43-b18e-29eb0ce3cba7\"," +
                   "\"masterSale\":{" +
                   "\"salePrice\":425000.00," +
                   "\"transactionDate\":\"2025-03-15T00:00:00Z\"," +
                   "\"ratio\":0.95," +
                   "\"saleSource\":\"Land Registry\"," +
                   "\"hpiAdjustedPrice\":438750.00," +
                   "\"reviewFlags\":false," +
                   "\"overallFlag\":\"Green\"," +
                   "\"summaryFlags\":\"Clean\"," +
                   "\"modelvalue\":440000.12" +
                   "}," +
                   "\"repeatSaleInfo\":{" +
                   "\"previousRatioRange\":0.88," +
                   "\"laterRatioRange\":1.02" +
                   "}," +
                   "\"welshLandTax\":[" +
                   "{" +
                   "\"wlttId\":\"152345\"," +
                   "\"transactionPrice\":425000.00," +
                   "\"transactionPremium\":null," +
                   "\"transactionDate\":\"2025-03-15T00:00:00Z\"," +
                   "\"groundRent\":149281.00," +
                   "\"vendors\":\"AXELROD CAPITAL LIMITED\"," +
                   "\"vendees\":\"SWEENEY CALLUM JAMES\"," +
                   "\"vendorAgents\":\"INSIGHT LAW\"," +
                   "\"vendeeAgents\":\"GATEWAY 2 CONVEYANCING LIMIT\"," +
                   "\"typeOfProperty\":\"R\"," +
                   "\"tenureType\":\"FP\"," +
                   "\"leaseFrom\":null," +
                   "\"leaseTerm\":null" +
                   "}," +
                   "{" +
                   "\"wlttId\":\"152355\"," +
                   "\"transactionPrice\":425000.00," +
                   "\"transactionPremium\":null," +
                   "\"transactionDate\":\"2025-03-15T00:00:00Z\"," +
                   "\"groundRent\":149281.00," +
                   "\"vendors\":\"AXELROD CAPITAL LIMITED\"," +
                   "\"vendees\":\"SWEENEY CALLUM JAMES\"," +
                   "\"vendorAgents\":\"INSIGHT LAW\"," +
                   "\"vendeeAgents\":\"GATEWAY 2 CONVEYANCING LIMIT\"," +
                   "\"typeOfProperty\":\"R\"," +
                   "\"tenureType\":\"FP\"," +
                   "\"leaseFrom\":null," +
                   "\"leaseTerm\":null" +
                   "}" +
                   "]," +
                   "\"landRegistryData\":[" +
                   "{" +
                   "\"lrppdId\":\"162340\"," +
                   "\"address\":\"10 Example Street, Worthing, BN11 1AA\"," +
                   "\"transactionPrice\":425000.00," +
                   "\"typeOfProperty\":\"Detached\"," +
                   "\"tenureType\":\"Freehold\"," +
                   "\"oldNew\":\"Old\"," +
                   "\"transactionDate\":\"2025-03-15T00:00:00Z\"," +
                   "\"pricePaidCategory\":\"A\"" +
                   "}," +
                   "{" +
                   "\"lrppdId\":\"162342\"," +
                   "\"address\":\"13 Example Street, Worthing, IG2 6FL\"," +
                   "\"transactionPrice\":590000.00," +
                   "\"typeOfProperty\":\"Detached\"," +
                   "\"tenureType\":\"Freehold\"," +
                   "\"oldNew\":\"Old\"," +
                   "\"transactionDate\":\"2025-03-15T00:00:00Z\"," +
                   "\"pricePaidCategory\":\"A\"" +
                   "}" +
                   "]," +
                   "\"salesParticularInfo\":{" +
                   "\"salesParticular\":\"Detached house with driveway and conservatory\"," +
                   "\"linkParticulars\":\"https://example.com/property-details/ABC123\"," +
                   "\"kitchenAge\":\"5 years\"," +
                   "\"kitchenSpecification\":\"Modern fitted, granite worktops\"," +
                   "\"bathroomAge\":\"3 years\"," +
                   "\"bathroomSpecification\":\"Contemporary, walk-in shower\"," +
                   "\"glazing\":\"Double\"," +
                   "\"heating\":\"Gas Central\"," +
                   "\"decorativeFinishes\":\"High-end finishes\"," +
                   "\"conditionScore\":\"8\"," +
                   "\"conditionCategory\":\"Good\"," +
                   "\"particularNotes\":\"Recently renovated. No signs of damp.\"" +
                   "}," +
                   "\"salesVerificationInfo\":{" +
                   "\"isSaleUseful\":\"Yes\"," +
                   "\"whyNotUseful\":null," +
                   "\"additionalNotes\":\"Comparable within 0.5 miles and 6 months; aligns with market trends.\"" +
                   "}" +
                   "}";
        }
    }
}
