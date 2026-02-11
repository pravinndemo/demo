# Column → API Field Name Map (Sales Grid)

This document lists the **current** column display names, internal keys, and the **field name tokens** used for **sorting** and **column filters**.

Scope:
- Columns from `DetailsListVOA/config/ColumnProfiles.ts` (SALES_COLUMNS).
- **Sorting** uses `sortField` (Custom API) and `sort-field` (APIM). Values are shown below.
- **Column header filters** use `SearchQuery` (Custom API) and `columnFilter` (APIM). Field tokens are shown below.

Notes:
- Sorting normalization only applies to `saleid` and `taskid`.
- For all other columns, the sort value is the **internal key name** as-is (lower-case).
- Sort parameter names are constant: `sortField` (Custom API) and `sort-field` (APIM).
- Filter parameter names are constant: `SearchQuery` (Custom API) and `columnFilter` (APIM).
- `Summary Flag` uses the internal key `summaryflags`; filter config now includes `summaryflags`.

| Column Display Name | Internal Key Name | Sort Param (Custom API) | Sort Name (Custom API) | Sort Param (APIM) | Sort Name (APIM) | Filter Param (Custom API) | Filter Name (Custom API) | Filter Param (APIM) | Filter Name (APIM) | Filter Operator(s) |
|---|---|---|---|---|---|---|---|---|---|---|
| Sale ID | saleid | sortField | saleId | sort-field | saleId | SearchQuery | saleId | columnFilter | saleId | `like` |
| Task ID | taskid | sortField | taskId | sort-field | taskId | SearchQuery | taskId | columnFilter | taskId | `like` |
| UPRN | uprn | sortField | uprn | sort-field | uprn | SearchQuery | uprn | columnFilter | uprn | `like` |
| Address | address | sortField | address | sort-field | address | SearchQuery | address | columnFilter | address | `like` |
| Postcode | postcode | sortField | postcode | sort-field | postcode | SearchQuery | postCode | columnFilter | postCode | `like` |
| Billing Authority | billingauthority | sortField | billingauthority | sort-field | billingauthority | SearchQuery | billingAuthority | columnFilter | billingAuthority | `in` |
| Transaction Date | transactiondate | sortField | transactiondate | sort-field | transactiondate | SearchQuery | transactionDate | columnFilter | transactionDate | `between` |
| Sale Price | saleprice | sortField | saleprice | sort-field | saleprice | SearchQuery | salesPrice | columnFilter | salesPrice | `GTE`, `LTE`, `between` |
| Ratio | ratio | sortField | ratio | sort-field | ratio | SearchQuery | ratio | columnFilter | ratio | `GTE`, `LTE`, `between` |
| Dwelling Type | dwellingtype | sortField | dwellingtype | sort-field | dwellingtype | SearchQuery | dwellingType | columnFilter | dwellingType | `in` |
| Flagged For Review | flaggedforreview | sortField | flaggedforreview | sort-field | flaggedforreview | SearchQuery | flaggedForReview | columnFilter | flaggedForReview | `eq` |
| Review Flags | reviewflags | sortField | reviewflags | sort-field | reviewflags | SearchQuery | reviewFlag | columnFilter | reviewFlag | `in` |
| Outlier Ratio | outlierratio | sortField | outlierratio | sort-field | outlierratio | SearchQuery | outlierRatio | columnFilter | outlierRatio | `GTE`, `LTE`, `between` |
| Overall Flag | overallflag | sortField | overallflag | sort-field | overallflag | SearchQuery | overallFlag | columnFilter | overallFlag | `in` |
| Summary Flag | summaryflags | sortField | summaryflags | sort-field | summaryflags | SearchQuery | summaryFlags | columnFilter | summaryFlags | `like` |
| Task Status | taskstatus | sortField | taskstatus | sort-field | taskstatus | SearchQuery | taskStatus | columnFilter | taskStatus | `in` |
| Assigned To | assignedto | sortField | assignedto | sort-field | assignedto | SearchQuery | assignedTo | columnFilter | assignedTo | `eq` |
| Assigned Date | assigneddate | sortField | assigneddate | sort-field | assigneddate | SearchQuery | assignedDate | columnFilter | assignedDate | `between` |
| Task Completed Date | taskcompleteddate | sortField | taskcompleteddate | sort-field | taskcompleteddate | SearchQuery | taskCompletedDate | columnFilter | taskCompletedDate | `between` |
| QC Assigned To | qcassignedto | sortField | qcassignedto | sort-field | qcassignedto | SearchQuery | qcAssignedTo | columnFilter | qcAssignedTo | `eq` |
| QC Assigned Date | qcassigneddate | sortField | qcassigneddate | sort-field | qcassigneddate | SearchQuery | qcAssignedDate | columnFilter | qcAssignedDate | `between` |
| QC Completed Date | qccompleteddate | sortField | qccompleteddate | sort-field | qccompleteddate | SearchQuery | qcCompletedDate | columnFilter | qcCompletedDate | `between` |

**APIM Sort-Field vs Filter-Field Differences (current)**

The entries below show where the **current** `sort-field` value differs from the **current** `columnFilter` field token.

| Internal Key | sort-field (APIM) | columnFilter field (APIM) |
|---|---|---|
| postcode | postcode | postCode |
| billingauthority | billingauthority | billingAuthority |
| transactiondate | transactiondate | transactionDate |
| saleprice | saleprice | salesPrice |
| dwellingtype | dwellingtype | dwellingType |
| flaggedforreview | flaggedforreview | flaggedForReview |
| reviewflags | reviewflags | reviewFlag |
| outlierratio | outlierratio | outlierRatio |
| overallflag | overallflag | overallFlag |
| summaryflags | summaryflags | summaryFlags |
| taskstatus | taskstatus | taskStatus |
| assignedto | assignedto | assignedTo |
| assigneddate | assigneddate | assignedDate |
| taskcompleteddate | taskcompleteddate | taskCompletedDate |
| qcassignedto | qcassignedto | qcAssignedTo |
| qcassigneddate | qcassigneddate | qcAssignedDate |
| qccompleteddate | qccompleteddate | qcCompletedDate |
