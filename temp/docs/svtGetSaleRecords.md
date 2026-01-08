# svtGetSaleRecords Custom API (SVT List)

## Overview
`svtGetSaleRecords` is an **unbound** Dynamics/Dataverse Custom API invoked by the SVT List PCF control to retrieve sale/task rows for the grid. The control builds a parameter map from the active filters and pagination settings, calls the custom API through `Xrm.WebApi.execute`, and then normalizes the response into the internal `TaskSearchResponse` format for rendering and filtering in the UI.【F:DetailsListVOA/services/CustomApi.ts†L11-L73】【F:DetailsListVOA/services/GridDataController.ts†L62-L123】【F:DetailsListVOA/services/DataService.ts†L73-L188】

The configured custom API name is set in the control configuration and defaults to `svtGetSaleRecords` for this repository’s control build.【F:DetailsListVOA/config/ControlConfig.ts†L1-L4】

---

## Where it is called (entry points)

### Primary grid load (server-driven paging)
The grid controller uses the configured API name (`svtGetSaleRecords`) and sends:
- **Base filter parameters** assembled from the active grid search filters.
- **Prefilter parameters** mapped from PCF input parameters (e.g., billing authorities, caseworkers, work status, assigned dates).
- **Column header filter values** serialized as `columnFilters` when the user applies column filters.
- **Pagination parameters** `pageNumber` (1-based) and `pageSize`.
- Optional **sorting parameters** `sortField` and `sortDirection`.

This all flows through `loadGridData` → `execCustomApi` → `executeUnboundCustomApi` when `customApiName` is configured.【F:DetailsListVOA/services/GridDataController.ts†L30-L123】【F:DetailsListVOA/services/CustomApi.ts†L53-L73】

### Filter option lookups (typeahead/suggest)
The control also calls a companion custom API for filter suggestions, using the name `<customApiName>_FilterOptions` (for this repo: `svtGetSaleRecords_FilterOptions`) with `tableKey`, `field`, and `query` parameters.【F:DetailsListVOA/services/DataService.ts†L201-L228】

---

## Input parameters (request)
The base parameters are built in `buildSalesParams` and emitted via `buildApiParamsFor`. Parameters are **string-valued** when sent to the custom API, consistent with the unbound request metadata built in `buildUnboundCustomApiRequest`.【F:DetailsListVOA/config/TableConfigs.ts†L78-L182】【F:DetailsListVOA/services/CustomApi.ts†L23-L51】

### Pagination
| Parameter | Source | Notes |
| --- | --- | --- |
| `pageNumber` | current page index | 1-based page number (`page + 1`).【F:DetailsListVOA/config/TableConfigs.ts†L83-L88】 |
| `pageSize` | grid page size | Numeric string from grid paging configuration.【F:DetailsListVOA/config/TableConfigs.ts†L83-L88】 |

### Search & filter parameters
Below are the **filter-to-parameter mappings** the control sends to `svtGetSaleRecords`.

> **Top search filters** are sanitized before mapping (trimmed, minimum length enforced, and numeric/date filters validated).【F:DetailsListVOA/Filters.ts†L70-L231】

#### Identity and address filters
- `source` ← `filters.source`
- `saleId` ← `filters.saleId`
- `taskId` ← `filters.taskId`
- `uprn` ← `filters.uprn` (digits-only normalization)
- `address` ← `filters.address`
- `buildingNameOrNumber` ← `filters.buildingNameNumber`
- `street` ← `filters.street`
- `town` ← `filters.townCity`
- `postcode` ← `filters.postcode`
- `billingAuthority` ← `filters.billingAuthority` (comma-joined array, max 3)
- `billingAuthorityReference` ← `filters.bacode`

【F:DetailsListVOA/Filters.ts†L70-L231】【F:DetailsListVOA/config/TableConfigs.ts†L90-L120】

#### Transaction date
- `transactionDate` ← `filters.transactionDate` (uses the provided `from`/`to` value as a single date string; if both present, `from` is used).【F:DetailsListVOA/config/TableConfigs.ts†L120-L141】

#### Sale price
- `salesPrice` ← numeric value from `filters.salePrice` (min or max, depending on mode)
- `salesPriceOperator` ← `GE` (>=) or `LE` (<=)

For `between`, the min value (if present) wins; otherwise the max value is used. The custom API should interpret `salesPrice` + `salesPriceOperator` accordingly.【F:DetailsListVOA/config/TableConfigs.ts†L142-L160】

#### Ratio & outlier ratio
- `ratio` ← numeric value from `filters.ratio` (min/max depending on mode)
- `outlierRatio` ← numeric value from `filters.outlierRatio` (min/max depending on mode)

For `between`, the min value (if present) is used; otherwise the max value is used.【F:DetailsListVOA/config/TableConfigs.ts†L161-L196】

#### Status, flags, and assignments
- `dwellingType` ← `filters.dwellingType` (comma-joined)
- `flaggedForReview` ← `filters.flaggedForReview`
- `reviewFlag` ← `filters.reviewFlags` (comma-joined)
- `outlierKeySale` ← `filters.outlierKeySale` (comma-joined)
- `overallFlag` ← `filters.overallFlag` (comma-joined)
- `summaryFlag` ← `filters.summaryFlag`
- `taskStatus` ← `filters.taskStatus` (comma-joined)
- `assignedTo` ← `filters.assignedTo`
- `assignedFromDate`/`assignedToDate` ← `filters.assignedDate`
- `qcAssignedTo` ← `filters.qcAssignedTo`
- `qcAssignedFromDate`/`qcAssignedToDate` ← `filters.qcAssignedDate`
- `qcCompleteFromDate`/`qcCompleteToDate` ← `filters.qcCompletedDate`

【F:DetailsListVOA/Filters.ts†L148-L231】【F:DetailsListVOA/config/TableConfigs.ts†L165-L212】

### Prefilter parameters from PCF inputs
When defined on the component, the following input parameters are passed along to the API:
- `billingAuthorities` → `billingAuthority`
- `caseworkers` → `assignedTo`
- `workThat` → `taskStatus`
- `fromDate` → `assignedFromDate`
- `toDate` → `assignedToDate`

These can be raw strings or JSON arrays, and are normalized to comma-separated values before being passed to the API.【F:DetailsListVOA/services/GridDataController.ts†L19-L57】

### Column header filters
When column filters are applied in the grid header, they are sent as:
- `columnFilters` → JSON string of `{ [columnName]: value | value[] | object }`

The API can use this to apply precise column-level constraints beyond the top-of-grid filters.【F:DetailsListVOA/services/GridDataController.ts†L69-L102】

---

## Response shape (expected from svtGetSaleRecords)
The control expects **either** a `TaskSearchResponse` payload **or** a `SalesApiResponse` payload. If `sales` or `pageInfo` exist, the response is normalized into `TaskSearchResponse` before being returned to the grid.【F:DetailsListVOA/services/DataService.ts†L146-L164】

### Option A: TaskSearchResponse (already normalized)
```
{
  items: TaskSearchItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  filters?: Record<string, string | string[]>;
}
```

### Option B: SalesApiResponse (normalized by the client)
```
{
  pageInfo?: {
    pageNumber?: number;
    pageSize?: number;
    totalRecords?: number;
  };
  sales?: SalesApiItem[];
  filters?: Record<string, string | string[]>;
}
```

When the `SalesApiResponse` shape is used, each item in `sales` is transformed into the internal `TaskSearchItem` with the following key mappings:
- `saleId` → `saleId`
- `taskId` → `taskId`
- `uprn` → `uprn`
- `address` → `address`
- `postcode` → `postcode`
- `billingAuthority` → `billingAuthority`
- `transactionDate` → `transactionDate`
- `salesPrice` → `salesPrice`
- `ratio` → `ratio`
- `dwellingType` → `dwellingType`
- `flaggedForReview` → `flaggedForReview`
- `reviewFlags` → `reviewFlags`
- `outlierRatio` → `outlierRatio`
- `overallFlag` → `overallFlag`
- `summaryFlags` → `summaryFlags`
- `taskStatus` → `taskStatus`
- `assignedTo` → `assignedTo` (arrays are joined into a display string for `caseAssignedTo`)
- `assignedDate` → `assignedDate`
- `taskCompletedDate` → `taskCompletedDate`
- `qcAssignedTo` → `qcAssignedTo`
- `qcAssignedDate` → `qcAssignedDate`
- `qcCompletedDate` → `qcCompletedDate`
- `source` → `source`

【F:DetailsListVOA/services/DataService.ts†L94-L144】

The `pageInfo` object is mapped to `totalCount`, `page`, and `pageSize` for grid consumption.【F:DetailsListVOA/services/DataService.ts†L146-L162】

---

## Response filters and how they drive the grid
The API can return a `filters` object to pre-populate or synchronize the grid’s column filter state. The client:
1. Lowercases each returned filter key.
2. Accepts arrays, strings (including JSON-encoded arrays/objects), or object shapes.
3. Converts values into column filter values for the grid header controls.

This mapping is handled by `normalizeApiFilters` in the grid host component.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L52-L112】

**Guidance for the API:**
- Use lowercased field names (e.g., `saleid`, `saleprice`, `taskstatus`) to align with the grid’s column keys.
- You may send arrays or JSON strings for multi-select filters; both are accepted.
- When sending numeric/date range filters, supply the value as a JSON object (e.g., `{ "mode": ">=", "min": 100000 }` for numeric) and the UI will parse it.

These response filters will be applied by the client and kept in sync as the user adjusts column filters in the grid header.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L52-L169】
