using Microsoft.Xrm.Sdk;
using System;
using System.Collections.Generic;
using VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model;

namespace VOA.SVT.Plugins.CustomAPI.Helpers
{
    public static class CustomApiQueryHelper
    {
        public static string BuildSearchQuery(ParameterCollection inputParameters)
        {
            var explicitQuery = GetString(inputParameters, "SearchQuery");
            var request = BuildRequestFromInputs(inputParameters);
            var queryFromInputs = request.ToQueryString();

            if (string.IsNullOrWhiteSpace(explicitQuery))
            {
                return queryFromInputs;
            }

            var normalizedExplicit = NormalizeQueryString(explicitQuery);
            if (string.IsNullOrWhiteSpace(queryFromInputs))
            {
                return normalizedExplicit;
            }

            return $"{queryFromInputs}&{normalizedExplicit}";
        }

        public static SalesRecordSearchRequest BuildRequestFromInputs(ParameterCollection inputParameters)
        {
            return new SalesRecordSearchRequest
            {
                PageNumber = GetString(inputParameters, "pageNumber"),
                PageSize = GetString(inputParameters, "pageSize"),
                Source = GetString(inputParameters, "source"),
                SaleId = GetString(inputParameters, "saleId"),
                TaskId = GetString(inputParameters, "taskId"),
                UPRN = GetString(inputParameters, "uprn"),
                Address = GetString(inputParameters, "address"),
                BuildingNameOrNumber = GetString(inputParameters, "buildingNameOrNumber"),
                Street = GetString(inputParameters, "street"),
                Town = GetString(inputParameters, "town"),
                Postcode = GetString(inputParameters, "postcode"),
                BillingAuthority = GetString(inputParameters, "billingAuthority"),
                BillingAuthorityReference = GetString(inputParameters, "billingAuthorityReference"),
                TransactionDate = GetString(inputParameters, "transactionDate"),
                SalesPrice = GetString(inputParameters, "salesPrice"),
                SalesPriceOperator = GetString(inputParameters, "salesPriceOperator"),
                Ratio = GetString(inputParameters, "ratio"),
                DwellingType = GetString(inputParameters, "dwellingType"),
                FlaggedForReview = GetString(inputParameters, "flaggedForReview"),
                ReviewFlag = GetString(inputParameters, "reviewFlag"),
                OutlierKeySale = GetString(inputParameters, "outlierKeySale"),
                OutlierRatio = GetString(inputParameters, "outlierRatio"),
                OverallFlag = GetString(inputParameters, "overallFlag"),
                SummaryFlag = GetString(inputParameters, "summaryFlag"),
                TaskStatus = GetString(inputParameters, "taskStatus"),
                AssignedTo = GetString(inputParameters, "assignedTo"),
                AssignedFromDate = GetString(inputParameters, "assignedFromDate"),
                AssignedToDate = GetString(inputParameters, "assignedToDate"),
                QcAssignedTo = GetString(inputParameters, "qcAssignedTo"),
                QcAssignedFromDate = GetString(inputParameters, "qcAssignedFromDate"),
                QcAssignedToDate = GetString(inputParameters, "qcAssignedToDate"),
                QcCompleteFromDate = GetString(inputParameters, "qcCompleteFromDate"),
                QcCompleteToDate = GetString(inputParameters, "qcCompleteToDate"),
            };
        }

        private static string NormalizeQueryString(string query)
        {
            var trimmed = query?.Trim() ?? string.Empty;
            if (trimmed.StartsWith("?", StringComparison.Ordinal))
            {
                return trimmed.Substring(1);
            }
            return trimmed;
        }

        private static string GetString(ParameterCollection inputParameters, string key)
        {
            if (inputParameters == null || !inputParameters.Contains(key))
            {
                return null;
            }

            var value = inputParameters[key];
            return value == null ? null : value.ToString();
        }
    }
}
