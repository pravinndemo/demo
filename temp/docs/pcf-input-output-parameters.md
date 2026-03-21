# SVT List PCF Input and Output Parameters

Date: 2026-03-20

This document is the single source of truth for `DetailsListVOA` manifest parameters.

## Inputs

| Name | Type | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| `canvasScreenName` | SingleLine.Text | No | `""` | Screen routing context from Canvas app. |
| `tableKey` | SingleLine.Text | No | `""` | Optional table/profile override (`sales`, `manager`, `myassignment`, `qaassign`, `qaview`). |
| `country` | SingleLine.Text | No | `""` | Global country context sent to SVT APIs. |
| `listYear` | SingleLine.Text | No | `""` | Global list-year context sent to SVT APIs. |
| `fxEnvironmentUrl` | SingleLine.Text | No | `""` | Dataverse environment URL used to build Sale Details hereditament links (`Address` in Hereditament and Banding Details). |
| `sharePointOptionsJson` | SingleLine.Text | No | `{}` | Chunked SharePoint options payload for Sales Particulars. |
| `sharePointRecordsJson1` | SingleLine.Text | No | `[]` | Chunk 1 of SharePoint reference records. |
| `sharePointRecordsJson2` | SingleLine.Text | No | `[]` | Chunk 2 of SharePoint reference records. |
| `customApiName` | SingleLine.Text | No | `voa_GetAllSalesRecord` | Grid data Custom API name. |
| `customApiType` | SingleLine.Text | No | `function` | Grid API operation type (`function` or `action`). |
| `metadataApiName` | SingleLine.Text | No | `voa_SvtGetSalesMetadata` | Metadata Custom API name. |
| `metadataApiType` | SingleLine.Text | No | `function` | Metadata API operation type. |
| `userContextApiName` | SingleLine.Text | No | `voa_SvtGetUserContext` | User-context Custom API name. |
| `userContextApiType` | SingleLine.Text | No | `function` | User-context API operation type. |
| `taskAssignmentApiName` | SingleLine.Text | No | `voa_SvtTaskAssignment` | Task assignment Custom API name. |
| `submitQcRemarksApiName` | SingleLine.Text | No | `voa_SvtSubmitQcRemarks` | Submit-QC-remarks Custom API name. |
| `viewSaleRecordApiName` | SingleLine.Text | No | `voa_GetViewSaleRecordById` | View-sale-record Custom API name. |
| `auditLogsApiName` | SingleLine.Text | No | `voa_SvtGetAuditLogs` | Audit history Custom API name. |
| `auditLogsApiType` | SingleLine.Text | No | `function` | Audit logs API operation type. |
| `manualTaskCreationApiName` | SingleLine.Text | No | `voa_SvtManualTaskCreation` | Manual-task-creation Custom API name. |
| `manualTaskCreationApiType` | SingleLine.Text | No | `action` | Manual-task-creation API operation type. |
| `enablePcfViewSalesDetails` | TwoOptions | No | `false` | Enables in-PCF Sale Details rendering (`viewSalePcf`). |
| `pageSize` | Whole.None | No | `500` | Grid page size. |
| `serverDrivenThreshold` | Whole.None | No | `2000` | Record-count threshold to switch to server-driven paging. |
| `columnDisplayNames` | SingleLine.Text | No | `{}` | JSON map of logical name to display name. |
| `columnConfig` | SingleLine.Text | No | `[]` | JSON column override array. |
| `searchTrigger` | SingleLine.Text | No | `""` | External trigger token to refresh search. |
| `allowColumnReorder` | TwoOptions | No | `false` | Enables column drag-reorder. |
| `perfLogsEnabled` | TwoOptions | No | `false` | Enables performance logging in console. |

## Outputs

| Name | Type | Purpose |
| --- | --- | --- |
| `selectedTaskId` | SingleLine.Text | Selected task ID (single selection). |
| `selectedSaleId` | SingleLine.Text | Selected sale ID (single selection). |
| `saleDetails` | SingleLine.Text | Serialized Sale Details JSON payload. |
| `viewSalePending` | TwoOptions | `true` while sale details are loading. |
| `actionType` | SingleLine.Text | Last action (`back`, `viewSale`, `viewSalePcf`, `viewQcLog`, `viewAuditHistory`, etc.). |
| `actionRequestId` | SingleLine.Text | Unique token that changes on each action. |
| `selectedTaskIdsJson` | SingleLine.Text | JSON array of selected task IDs. |
| `selectedSaleIdsJson` | SingleLine.Text | JSON array of selected sale IDs. |
| `selectedCount` | Whole.None | Number of selected rows. |
| `backRequestId` | SingleLine.Text | Request token emitted when Back is triggered. |

## WRT-197 note (Hereditament link)
The Address link in `Hereditament and Banding Details` uses:
- `fxEnvironmentUrl` input
- `suId` from sale details payload

URL pattern:

```text
{fxEnvironmentUrl}/main.aspx?appid=cdb5343c-51c1-ec11-983e-002248438fff&newWindow=true&pagetype=entityrecord&etn=voa_ssu&id={suId}&formid=4176b880-fcc3-4ee7-b915-ab163011bbcb
```
