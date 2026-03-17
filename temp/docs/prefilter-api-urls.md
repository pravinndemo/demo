# SVT List 5-Screen API URL Tracker (Latest)

Last updated: 2026-03-17

This is the central tracker for:
- PCF -> Dataverse Custom API URL patterns
- Plugin -> APIM URL/payload patterns
- All active call paths used by the 5 SVT screens:
  - Manager Assignment (MA)
  - Caseworker View (CWV)
  - QA Assignment (QCA)
  - QA View (QCV)
  - Sales Record Search (SRS)

## Placeholders
| Placeholder | Meaning |
| --- | --- |
| `{org}` | Dataverse org host (example: `contoso.crm.dynamics.com`) |
| `{APIM_SALES_URL}` | `voa_CredentialProvider` Address for `SVTGetSalesRecord` |
| `{APIM_METADATA_URL}` | `voa_CredentialProvider` Address for `SVTGetSalesMetadata` |
| `{APIM_TASK_URL}` | `voa_CredentialProvider` Address for `SVTTaskAssignment` |
| `{customApiName}` | Grid API (default: `voa_GetAllSalesRecord`) |
| `{metadataApiName}` | Metadata API (default: `voa_SvtGetSalesMetadata`) |
| `{assignableUsersApiName}` | Assignable users API (default: `voa_SvtGetAssignableUsers`) |
| `{taskAssignmentApiName}` | Assignment API (default: `voa_SvtTaskAssignment`) |
| `{submitQcRemarksApiName}` | QC remarks API (default: `voa_SvtSubmitQcRemarks`) |
| `{viewSaleRecordApiName}` | View-sale API (default: `voa_GetViewSaleRecordById`) |

Notes:
- Prefilter date values are sent as `dd/MM/yyyy`.
- Grid pagination is 1-based (`pageNumber=1` means first page).
- Column header filters/sort are sent through `SearchQuery` as repeated `columnFilter=...` tokens.

## Screen -> Source Mapping (Data Call)
| Screen | `source` sent by PCF |
| --- | --- |
| Manager Assignment | `MA` |
| Caseworker View | `CWV` |
| QA Assignment | `QCA` |
| QA View | `QCV` |
| Sales Record Search | `SRS` |

## 1) Primary Grid Data Call Per Screen

### Manager Assignment (`source=MA`)
Custom API (PCF -> plugin):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(
  pageNumber='1',
  pageSize='50',
  source='MA',
  searchBy='BA|CW',
  preFilter='{csv values}',
  taskStatus='{csv statuses}',
  fromDate='01/02/2026',
  toDate='15/02/2026',
  sortField='saleId',
  sortDirection='asc',
  SearchQuery='columnFilter=...'
)
```

APIM (plugin -> APIM):
```text
{APIM_SALES_URL}?page-number=1&page-size=50&source=MA&searchBy=BA|CW&preFilter={url-encoded csv}
&taskStatus={url-encoded csv}&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026
&sort-field=saleId&sort-direction=asc&columnFilter=...
```

### Caseworker View (`source=CWV`)
Custom API (PCF sends `RequestedBy` and may also send prefilter fields):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(
  pageNumber='1',
  pageSize='50',
  source='CWV',
  RequestedBy='{current-user-guid-lowercase}',
  searchBy='CW',
  preFilter='{csv caseworker ids}',
  taskStatus='{csv statuses}',
  fromDate='01/02/2026',
  toDate='15/02/2026',
  sortField='saleId',
  sortDirection='asc',
  SearchQuery='columnFilter=...'
)
```

APIM (effective URL from plugin):
```text
{APIM_SALES_URL}?page-number=1&page-size=50&source=CWV&RequestedBy={guid-lowercase}
&taskStatus={url-encoded csv}&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026
&sort-field=saleId&sort-direction=asc&columnFilter=...
```

Important:
- When `RequestedBy` is present, plugin query building suppresses `searchBy` and `preFilter` before calling APIM.

### QA Assignment (`source=QCA`)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(
  pageNumber='1',
  pageSize='50',
  source='QCA',
  searchBy='QC|CW|Tk',
  preFilter='{csv ids when searchBy is QC or CW}',
  taskStatus='{csv statuses}',
  fromDate='01/02/2026',
  toDate='15/02/2026',
  sortField='saleId',
  sortDirection='asc',
  SearchQuery='columnFilter=...'
)
```

APIM:
```text
{APIM_SALES_URL}?page-number=1&page-size=50&source=QCA&searchBy=QC|CW|Tk
&preFilter={optional url-encoded csv}&taskStatus={url-encoded csv}
&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc&columnFilter=...
```

### QA View (`source=QCV`)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(
  pageNumber='1',
  pageSize='50',
  source='QCV',
  RequestedBy='{current-user-guid-lowercase}',
  taskStatus='{csv statuses}',
  fromDate='01/02/2026',
  toDate='15/02/2026',
  sortField='saleId',
  sortDirection='asc',
  SearchQuery='columnFilter=...'
)
```

APIM:
```text
{APIM_SALES_URL}?page-number=1&page-size=50&source=QCV&RequestedBy={guid-lowercase}
&taskStatus={url-encoded csv}&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026
&sort-field=saleId&sort-direction=asc&columnFilter=...
```

### Sales Record Search (`source=SRS`)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(
  pageNumber='1',
  pageSize='50',
  source='SRS',
  saleId='S-1000001',
  taskId='1000234',
  uprn='123456789012',
  address='12 High Street',
  buildingNameOrNumber='Building 5',
  street='High Street',
  town='Cardiff',
  postcode='CF10 1AA',
  billingAuthority='Cardiff,Newport',
  billingAuthorityReference='BA-123',
  transactionDate='01/02/2026',
  salesPrice='250000',
  salesPriceOperator='GE|LE',
  ratio='1.05',
  dwellingType='Detached,Semi Detached',
  flaggedForReview='true|false',
  reviewFlag='Flag1,Flag2',
  outlierKeySale='Y',
  outlierRatio='1.2',
  overallFlag='Investigate can use',
  summaryFlag='Needs review',
  taskStatus='Assigned,QC Requested',
  assignedTo='user@contoso.com',
  assignedFromDate='01/02/2026',
  assignedToDate='15/02/2026',
  qcAssignedTo='qa@contoso.com',
  qcAssignedFromDate='01/02/2026',
  qcAssignedToDate='15/02/2026',
  qcCompleteFromDate='01/02/2026',
  qcCompleteToDate='15/02/2026',
  sortField='saleId',
  sortDirection='asc',
  SearchQuery='columnFilter=...'
)
```

APIM:
```text
{APIM_SALES_URL}?page-number=1&page-size=50&source=SRS&...mapped query params...
&sort-field=saleId&sort-direction=asc&columnFilter=...
```

## 2) Additional Calls Tracked (Beyond Grid Data)

| Flow | Screens | PCF -> Custom API | Plugin -> APIM |
| --- | --- | --- | --- |
| Billing authority metadata load | Manager Assignment, Sales Record Search | `GET /api/data/v9.2/{metadataApiName}()` | `GET {APIM_METADATA_URL}` (query optional) |
| Assignable users for assignment panel | Manager Assignment, QA Assignment | `GET /api/data/v9.2/{assignableUsersApiName}(screenName='manager assignment|quality control assignment')` | No APIM call. Dataverse team/role query only. |
| Assignable users for prefilter dropdowns | Manager Assignment, QA Assignment, Caseworker View | Same API as above (`screenName` from assignment context) | No APIM call. |
| Assignable users cache for GUID display-name mapping | Any screen when `assignedTo`/`qcAssignedTo` values are GUIDs | `GET /api/data/v9.2/{assignableUsersApiName}(screenName='quality control assignment')` | No APIM call. |
| Task assignment | Manager Assignment, QA Assignment | `POST /api/data/v9.2/{taskAssignmentApiName}` with `assignedToUserId`, `taskId` (JSON array string), `assignedByUserId`, `screenName`, optional `taskStatus` | `POST {APIM_TASK_URL}` with JSON payload `{ source, assignedTo, taskList, requestedBy, taskStatus, saleId, date }` |
| Mark Passed QC / submit QC remarks | QA View | `POST /api/data/v9.2/{submitQcRemarksApiName}` with `taskId` (JSON array string), `qcOutcome`, `qcRemark`, `qcReviewedBy` | `POST {APIM_TASK_URL}` with JSON payload `{ taskId, qcOutcome, qcRemark, qcReviewedBy }` |
| View sale details on row open | All 5 screens | `GET /api/data/v9.2/{viewSaleRecordApiName}(saleId='{saleId}')` | `GET {APIM_SALES_URL}/sales/{saleId}` (or Address template replacement) |

## 3) Prefilter/SearchBy Codes and TaskStatus Mapping

### SearchBy code mapping
| Screen | UI SearchBy | API `searchBy` |
| --- | --- | --- |
| Manager Assignment | Billing Authority | `BA` |
| Manager Assignment | Caseworker | `CW` |
| Caseworker View | Caseworker | `CW` (suppressed at APIM stage when `RequestedBy` is present) |
| QA Assignment | QC User | `QC` |
| QA Assignment | Caseworker | `CW` |
| QA Assignment | Task | `Tk` |
| QA View | QC User/Task/Caseworker | No `searchBy` currently sent by prefilter mapper |
| Sales Record Search | N/A | No prefilter `searchBy` |

### Work-that to `taskStatus`
| Screen | Work-that key | `taskStatus` sent |
| --- | --- | --- |
| Manager/Caseworker | `readyToAllocate` | `New` |
| Manager/Caseworker | `currentlyAssigned` / `assignedToSelected` | `Assigned QC Failed,Assigned` |
| Manager/Caseworker | `awaitingQc` / `assignedAwaitingQc` | `QC Requested,Reassigned To QC,Assigned To QC` |
| Manager/Caseworker | `hasBeenComplete` / `completedBySelected` | `Complete Passed QC,Complete` |
| QA Assignment | `qcAssignedToSelected` | `Reassigned To QC,Assigned To QC` |
| QA Assignment | `qcCompletedBySelected` | `Complete Passed QC` |
| QA Assignment | `qcAssignedInProgress` | `Assigned QC Failed` |
| QA Assignment | `caseworkerCompletedQcRequested` / `taskCompletedQcRequested` | `QC Requested` |
| QA Assignment | `caseworkerCompleted` / `taskCompleted` | `Complete` |
| QA View | `qcAssignedToSelected` | `Reassigned To QC,Assigned To QC` |
| QA View | `qcCompletedBySelected` | `Complete Passed QC,Complete` |
| QA View | `qcAssignedInProgress` | `Assigned QC Failed,Assigned` |

## 4) Calls Not Triggered by Current 5-Screen PCF UI
- `voa_SvtGetUserContext`
- `voa_SvtModifyTask`
- `voa_SvtSubmitSalesVerification`
- `voa_SvtManualTaskCreation`
- `voa_SvtGetAuditLogs`
- `{customApiName}_FilterOptions` (helper exists, not used by current `DetailsListHost` flow)
