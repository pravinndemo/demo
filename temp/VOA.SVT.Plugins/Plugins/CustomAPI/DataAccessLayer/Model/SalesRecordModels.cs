using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model
{
    public sealed class SalesRecordSearchRequest
    {
        public string PageNumber { get; set; }
        public string PageSize { get; set; }
        public string Source { get; set; }
        public string SaleId { get; set; }
        public string TaskId { get; set; }
        public string UPRN { get; set; }
        public string Address { get; set; }
        public string BuildingNameOrNumber { get; set; }
        public string Street { get; set; }
        public string Town { get; set; }
        public string Postcode { get; set; }
        public string BillingAuthority { get; set; }
        public string BillingAuthorityReference { get; set; }
        public string TransactionDate { get; set; }
        public string SalesPrice { get; set; }
        public string SalesPriceOperator { get; set; }
        public string Ratio { get; set; }
        public string DwellingType { get; set; }
        public string FlaggedForReview { get; set; }
        public string ReviewFlag { get; set; }
        public string OutlierKeySale { get; set; }
        public string OutlierRatio { get; set; }
        public string OverallFlag { get; set; }
        public string SummaryFlag { get; set; }
        public string TaskStatus { get; set; }
        public string AssignedTo { get; set; }
        public string AssignedFromDate { get; set; }
        public string AssignedToDate { get; set; }
        public string QcAssignedTo { get; set; }
        public string QcAssignedFromDate { get; set; }
        public string QcAssignedToDate { get; set; }
        public string QcCompleteFromDate { get; set; }
        public string QcCompleteToDate { get; set; }
        public string SortField { get; set; }
        public string SortDirection { get; set; }

        public IDictionary<string, string> ToQueryParameters()
        {
            var sortField = NormalizeSortField(SortField);
            var sortDirection = NormalizeSortDirection(SortDirection);
            var parameters = new Dictionary<string, string>
            {
                ["page-number"] = PageNumber,
                ["page-size"] = PageSize,
                ["source"] = Source,
                ["saleId"] = SaleId,
                ["taskId"] = TaskId,
                ["uprn"] = UPRN,
                ["address"] = Address,
                ["buildingNameOrNumber"] = BuildingNameOrNumber,
                ["street"] = Street,
                ["town"] = Town,
                ["postcode"] = Postcode,
                ["billingAuthority"] = BillingAuthority,
                ["billingAuthorityReference"] = BillingAuthorityReference,
                ["transactionDate"] = TransactionDate,
                ["salesPrice"] = SalesPrice,
                ["salesPriceOperator"] = SalesPriceOperator,
                ["ratio"] = Ratio,
                ["dwellingType"] = DwellingType,
                ["flaggedForReview"] = FlaggedForReview,
                ["reviewFlag"] = ReviewFlag,
                ["outlierKeySale"] = OutlierKeySale,
                ["outlierRatio"] = OutlierRatio,
                ["overallFlag"] = OverallFlag,
                ["summaryFlag"] = SummaryFlag,
                ["taskStatus"] = TaskStatus,
                ["assignedTo"] = AssignedTo,
                ["assignedFromDate"] = AssignedFromDate,
                ["assignedToDate"] = AssignedToDate,
                ["qcAssignedTo"] = QcAssignedTo,
                ["qcAssignedFromDate"] = QcAssignedFromDate,
                ["qcAssignedToDate"] = QcAssignedToDate,
                ["qcCompleteFromDate"] = QcCompleteFromDate,
                ["qcCompleteToDate"] = QcCompleteToDate,
                ["sort-field"] = sortField,
                ["sort-direction"] = sortDirection,
            };

            return parameters
                .Where(pair => !string.IsNullOrWhiteSpace(pair.Value))
                .ToDictionary(pair => pair.Key, pair => pair.Value);
        }

        public string ToQueryString()
        {
            var parameters = ToQueryParameters();
            return string.Join("&", parameters.Select(pair =>
                $"{pair.Key}={HttpUtility.UrlEncode(pair.Value)}"));
        }

        private static string NormalizeSortField(string sortField)
        {
            if (string.IsNullOrWhiteSpace(sortField))
            {
                return null;
            }

            var normalized = new string(sortField.Trim().ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
            if (normalized == "taskid")
            {
                return "taskId";
            }
            if (normalized == "saleid")
            {
                return "saleId";
            }
            return sortField.Trim();
        }

        private static string NormalizeSortDirection(string sortDirection)
        {
            if (string.IsNullOrWhiteSpace(sortDirection))
            {
                return null;
            }

            var normalized = sortDirection.Trim().ToLowerInvariant();
            return normalized == "desc" ? "desc" : "asc";
        }
    }

    public sealed class SalesRecordPageInfo
    {
        public int? PageNumber { get; set; }
        public int? PageSize { get; set; }
        public int? TotalRecords { get; set; }
    }

    public sealed class SalesRecordItem
    {
        public string SaleId { get; set; }
        public string TaskId { get; set; }
        public string UPRN { get; set; }
        public string Address { get; set; }
        public string Postcode { get; set; }
        public string BillingAuthority { get; set; }
        public string TransactionDate { get; set; }
        public decimal? SalesPrice { get; set; }
        public decimal? Ratio { get; set; }
        public string DwellingType { get; set; }
        public bool? FlaggedForReview { get; set; }
        public string[] ReviewFlags { get; set; }
        public decimal? OutlierRatio { get; set; }
        public string OverallFlag { get; set; }
        public string[] SummaryFlags { get; set; }
        public string TaskStatus { get; set; }
        public string[] AssignedTo { get; set; }
        public string AssignedDate { get; set; }
        public string TaskCompletedDate { get; set; }
        public string[] QcAssignedTo { get; set; }
        public string QcAssignedDate { get; set; }
        public string QcCompletedDate { get; set; }
        public string Source { get; set; }
    }

    public sealed class SalesRecordResponse
    {
        public SalesRecordPageInfo PageInfo { get; set; }
        public IList<SalesRecordItem> Sales { get; set; }
        public IDictionary<string, object> Filters { get; set; }
    }
}
