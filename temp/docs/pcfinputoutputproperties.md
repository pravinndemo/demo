# PCF Input/Output Properties and Expected Values

Date: 2026-03-21
Control: `DetailsListVOA`

This document lists every manifest property from `DetailsListVOA/ControlManifest.Input.xml` and the expected value for each one.

## Input properties

| Property | Type | Default | Expected values |
| --- | --- | --- | --- |
| `canvasScreenName` | `SingleLine.Text` | `""` | Recommended: `SalesRecordSearch`, `ManagerAssignment`, `CaseworkerView`, `QualityControlAssignment`, `QualityControlView`. |
| `tableKey` | `SingleLine.Text` | `""` | One of: `sales`, `allsales`, `myassignment`, `manager`, `qaassign`, `qaview`, `qa` (legacy alias). |
| `country` | `SingleLine.Text` | `""` | Country context string. Example: `England`, `Welsh`. |
| `listYear` | `SingleLine.Text` | `""` | List year string. Example: `2026`. |
| `fxEnvironmentUrl` | `SingleLine.Text` | `""` | Full Dataverse environment URL. Example: `https://org.crm11.dynamics.com`. |
| `vmsBaseUrl` | `SingleLine.Text` | `""` | Full VMS base URL. Example: `https://geo-dev-vms-4x.voa.ns3n.corp.hmrc.gov.uk`. |
| `sharePointOptionsJson` | `SingleLine.Text` | `{}` | Compact JSON object of option arrays. Example keys: `age_kitchen`, `spec_kitchen`, `age_bath`, `spec_bath`, `decorative_finishes`. |
| `sharePointRecordsJson1` | `SingleLine.Text` | `[]` | Compact JSON array of SharePoint records chunk 1. |
| `sharePointRecordsJson2` | `SingleLine.Text` | `[]` | Compact JSON array of SharePoint records chunk 2. |
| `customApiName` | `SingleLine.Text` | `voa_GetAllSalesRecord` | Unbound Dataverse Custom API name for grid/search. |
| `customApiType` | `SingleLine.Text` | `function` | `function` or `action` (`action` maps to Dataverse operation type `0`; anything else behaves as `function`). |
| `metadataApiName` | `SingleLine.Text` | `voa_SvtGetSalesMetadata` | Unbound Custom API name for metadata. |
| `metadataApiType` | `SingleLine.Text` | `function` | `function` or `action`. |
| `userContextApiName` | `SingleLine.Text` | `voa_SvtGetUserContext` | Unbound Custom API name for user context/persona. |
| `userContextApiType` | `SingleLine.Text` | `function` | `function` or `action`. |
| `taskAssignmentApiName` | `SingleLine.Text` | `voa_SvtTaskAssignment` | Unbound Custom API name for task assignment. |
| `submitQcRemarksApiName` | `SingleLine.Text` | `voa_SvtSubmitQcRemarks` | Unbound Custom API name for QC submit. |
| `viewSaleRecordApiName` | `SingleLine.Text` | `voa_GetViewSaleRecordById` | Unbound Custom API name for sale details fetch. |
| `auditLogsApiName` | `SingleLine.Text` | `voa_SvtGetAuditLogs` | Unbound Custom API name for audit/QC history. |
| `auditLogsApiType` | `SingleLine.Text` | `function` | `function` or `action`. |
| `manualTaskCreationApiName` | `SingleLine.Text` | `voa_SvtManualTaskCreation` | Unbound Custom API name for manual task creation. |
| `manualTaskCreationApiType` | `SingleLine.Text` | `action` | Expected: `action` (manual task creation API is implemented as action/POST). |
| `modifyTaskApiName` | `SingleLine.Text` | `voa_SvtModifyTask` | Unbound Custom API name for modify task. |
| `modifyTaskApiType` | `SingleLine.Text` | `action` | Expected: `action` (modify task API is implemented as action/POST). |
| `enablePcfViewSalesDetails` | `TwoOptions` | `false` | Boolean flag. Accepted truthy values include `true`, `1`, `yes`; falsy include `false`, `0`, `no`. |
| `pageSize` | `Whole.None` | `500` | Positive integer page size. |
| `serverDrivenThreshold` | `Whole.None` | `2000` | Integer threshold used to switch to server-driven paging. |
| `columnDisplayNames` | `SingleLine.Text` | `{}` | JSON object mapping logical column name to display text. Example: `{"saleid":"Sale ID"}`. |
| `columnConfig` | `SingleLine.Text` | `[]` | JSON array of column overrides. Each item should include `ColName`; optional fields include `ColDisplayName`, `ColWidth`, `ColSortable`, `ColFormat`, etc. |
| `searchTrigger` | `SingleLine.Text` | `""` | Any changing token/string/number; value change triggers refresh logic. |
| `allowColumnReorder` | `TwoOptions` | `false` | Boolean flag. Reorder is enabled when value is boolean `true` or string `"true"`. |
| `perfLogsEnabled` | `TwoOptions` | `false` | Boolean flag. Perf logs enabled when value is boolean `true` or string `"true"`. |

## Output properties

| Property | Type | Expected values |
| --- | --- | --- |
| `selectedTaskId` | `SingleLine.Text` | Selected row task id. Usually task format like `A-1000001`/`M-1000001` or backend task id text. |
| `selectedSaleId` | `SingleLine.Text` | Selected row sale id. Usually format like `S-1000001`. |
| `saleDetails` | `SingleLine.Text` | Serialized JSON string from view-sale payload (or merged details state). |
| `viewSalePending` | `TwoOptions` | `true` while sale details request is in-flight; `false` after completion. |
| `actionType` | `SingleLine.Text` | One of: `back`, `viewSale`, `viewSalePcf`, `completeSalesVerificationTask`, `submitSalesVerificationTaskForQc`, `submitQcOutcome`, `viewQcLog`, `viewAuditHistory`. |
| `actionRequestId` | `SingleLine.Text` | Action event token in format `<sequence>-<timestamp>`. Changes on each emitted action. |
| `selectedTaskIdsJson` | `SingleLine.Text` | JSON array string of selected task IDs. Example: `["A-1000001","A-1000002"]`. |
| `selectedSaleIdsJson` | `SingleLine.Text` | JSON array string of selected sale IDs. Example: `["S-1000001","S-1000002"]`. |
| `selectedCount` | `Whole.None` | Non-negative integer count of selected rows. |
| `backRequestId` | `SingleLine.Text` | Action token used for host change detection; currently updated whenever an action is emitted (including `back`). |

## Notes

- All properties above come from `DetailsListVOA/ControlManifest.Input.xml`.
- API type handling is implemented in `DetailsListVOA/services/CustomApi.ts` (`action` => operation type `0`, otherwise `function` => `1`).
- Screen-name and `tableKey` expectations are aligned with `docs/svt-screen-configuration.md`.
- SharePoint chunk expectations are aligned with `docs/sharepoint-chunked-catalog-setup.md`.
