# Plugin Calling Guide - SVT List PCF (Latest)

Last updated: 2026-03-17

This guide is the current source of truth for:
- PCF -> Dataverse Custom API calls
- Dataverse plugin -> APIM/external calls
- Which calls are active in the 5-screen PCF today

## 1) Runtime Call Chain

```text
DetailsListHost / index.ts (PCF)
  -> executeUnboundCustomApi (CustomApi.ts)
  -> Dataverse unbound Custom API
  -> C# plugin (VOA.SVT.Plugins/Plugins/CustomAPI/*.cs)
  -> APIM/external endpoint (if that plugin uses HTTP)
```

All calls are sent through `executeUnboundCustomApi`, which:
- Builds unbound request metadata dynamically
- Sends all input parameters as `Edm.String`
- Uses operation type `1=function (GET)` or `0=action (POST at Dataverse layer)`

## 2) API Name and Type Resolution

Defaults from `DetailsListVOA/config/ControlConfig.ts`:
- `customApiName = voa_GetAllSalesRecord`
- `customApiType = function`
- `metadataApiName = voa_SvtGetSalesMetadata`
- `viewSaleRecordApiName = voa_GetViewSaleRecordById`
- `taskAssignmentApiName = voa_SvtTaskAssignment`
- `submitQcRemarksApiName = voa_SvtSubmitQcRemarks`
- `assignableUsersApiName = voa_SvtGetAssignableUsers`
- `assignableUsersApiType = function`

Operation type mapping:
- `function` -> `operationType=1`
- `action` -> `operationType=0`

## 3) Active PCF Call Inventory (5-Screen UI)

| Flow | API name (default) | Dataverse op type | Active screens | Plugin class | Outbound call from plugin |
| --- | --- | --- | --- | --- | --- |
| Grid data load | `voa_GetAllSalesRecord` | Function | MA, CWV, QCA, QCV, SRS | `GetAllSalesRecord` | `GET {SVTGetSalesRecord.Address}?...query...` |
| Billing authority metadata | `voa_SvtGetSalesMetadata` | Function | MA, SRS | `SvtGetSalesMetadata` | `GET {SVTGetSalesMetadata.Address}` |
| View sale record | `voa_GetViewSaleRecordById` | Function | MA, CWV, QCA, QCV, SRS | `GetViewSaleRecordById` | `GET {SVTGetSalesRecord.Address}/sales/{saleId}` (or template replacement) |
| Assignable users (panel/prefilter/cache) | `voa_SvtGetAssignableUsers` | Function | Context-dependent on all screens | `SvtGetAssignableUsers` | No APIM call (Dataverse team/role queries only) |
| Task assignment | `voa_SvtTaskAssignment` | Action | MA, QCA | `SvtTaskAssignment` | `POST {SVTTaskAssignment.Address}` JSON payload |
| Submit QC remarks / mark passed QC | `voa_SvtSubmitQcRemarks` | Action | QCV | `SvtSubmitQcRemarks` | `POST {SVTTaskAssignment.Address}` JSON payload |

## 4) Screen-by-Screen Call Tracking

| Screen | Always/typical calls | Conditional calls |
| --- | --- | --- |
| Manager Assignment (`MA`) | `voa_GetAllSalesRecord`, `voa_SvtGetSalesMetadata` | `voa_SvtGetAssignableUsers`, `voa_SvtTaskAssignment`, `voa_GetViewSaleRecordById`, assignable-users cache |
| Caseworker View (`CWV`) | `voa_GetAllSalesRecord` | `voa_SvtGetAssignableUsers` (may fallback if context unknown), `voa_GetViewSaleRecordById`, assignable-users cache |
| QA Assignment (`QCA`) | `voa_GetAllSalesRecord` | `voa_SvtGetAssignableUsers`, `voa_SvtTaskAssignment`, `voa_GetViewSaleRecordById`, assignable-users cache |
| QA View (`QCV`) | `voa_GetAllSalesRecord` | `voa_SvtSubmitQcRemarks`, `voa_GetViewSaleRecordById`, assignable-users cache |
| Sales Record Search (`SRS`) | `voa_GetAllSalesRecord`, `voa_SvtGetSalesMetadata` | `voa_GetViewSaleRecordById`, assignable-users cache (when assignment fields are GUIDs) |

## 5) Grid Query Construction (Latest Behavior)

Primary builders:
- PCF side: `buildGridApiParams` + `buildApiParamsFor` + prefilter mappers
- Plugin side: `CustomApiQueryHelper.BuildSearchQuery` -> `SalesRecordSearchRequest.ToQueryString`

Key behaviors:
- PCF sends paging/sort with camel case (`pageNumber`, `pageSize`, `sortField`, `sortDirection`).
- Plugin converts to APIM keys:
  - `page-number`, `page-size`, `sort-field`, `sort-direction`
- PCF sends column header filters in `SearchQuery` as repeated `columnFilter=...` tokens.
- Plugin appends `SearchQuery` onto generated query string.
- If `RequestedBy` is present, plugin suppresses `searchBy` and `preFilter` before APIM call.
  - This affects Caseworker View and QA View data calls.

## 6) Assignment and QC Action Payloads

### `voa_SvtTaskAssignment` (PCF -> plugin)
Current PCF payload keys:
- `assignedToUserId`
- `taskId` (JSON array string; IDs normalized to numeric when possible)
- `assignedByUserId`
- `screenName` (canonicalized to `manager assignment` / `quality control assignment` on assignment screens)
- `taskStatus` (optional; resolved by selected statuses)

Plugin outbound payload (`POST {SVTTaskAssignment.Address}`):
- `source` (`MAT` / `QCAT` based on screen context)
- `assignedTo`
- `taskList`
- `requestedBy`
- `taskStatus`
- `saleId`
- `date`

### `voa_SvtSubmitQcRemarks` (PCF -> plugin)
Current PCF payload keys:
- `taskId` (JSON array string; numeric normalization applied)
- `qcOutcome`
- `qcRemark`
- `qcReviewedBy`

Plugin outbound payload (`POST {SVTTaskAssignment.Address}`):
- `taskId` (array)
- `qcOutcome`
- `qcRemark`
- `qcReviewedBy`

## 7) Full Plugin Inventory in Repo

| Custom API | Plugin class | Used by current 5-screen PCF | Credential provider config | Outbound method + URL shape |
| --- | --- | --- | --- | --- |
| `voa_GetAllSalesRecord` | `GetAllSalesRecord` | Yes | `SVTGetSalesRecord` | `GET {Address}?{query}` |
| `voa_GetViewSaleRecordById` | `GetViewSaleRecordById` | Yes | `SVTGetSalesRecord` | `GET {Address}/sales/{saleId}` or placeholder replacement |
| `voa_SvtGetSalesMetadata` | `SvtGetSalesMetadata` | Yes | `SVTGetSalesMetadata` | `GET {Address}` |
| `voa_SvtGetAssignableUsers` | `SvtGetAssignableUsers` | Yes | N/A | No APIM call |
| `voa_SvtTaskAssignment` | `SvtTaskAssignment` | Yes | `SVTTaskAssignment` | `POST {Address}` |
| `voa_SvtSubmitQcRemarks` | `SvtSubmitQcRemarks` | Yes | `SVTTaskAssignment` | `POST {Address}` |
| `voa_SvtGetUserContext` | `SvtGetUserContext` | No (directly) | N/A | No APIM call |
| `voa_SvtModifyTask` | `SvtModifyTask` | No | `SVTTaskAssignment` | `POST {Address}` |
| `voa_SvtSubmitSalesVerification` | `SvtSubmitSalesVerification` | No | `SVTGetSalesRecord` | `PUT {Address}/sales/{saleId}` or placeholder replacement |
| `voa_SvtManualTaskCreation` | `SvtManualTaskCreation` | No | `SVTGetSalesRecord` | `POST {Address}/sales/{saleId}/task` or placeholder replacement |
| `voa_SvtGetAuditLogs` | `SvtGetAuditLogs` | No | `SVTAuditLogs` | `GET {Address}?taskId={id}&auditType={QC|SL}` |

## 8) Response Envelope Notes

- Most APIs return data in `OutputParameters["Result"]` as JSON string.
- PCF unwrapping logic checks both `Result` and `result`.
- `voa_SvtGetUserContext` is different: outputs are typed fields (`svtPersona`, `hasSvtAccess`, etc.), not `Result` JSON.

## 9) Non-Active Helper Flow

`DataService.fetchFilterOptions` can call:
- `operationName = {customApiName}_FilterOptions`
- params: `tableKey`, `field`, `query`

This helper exists in code but is not used by the current `DetailsListHost` screen flow.
