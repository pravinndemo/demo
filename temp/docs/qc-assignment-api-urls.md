# QC Assignment - Plugin and APIM URL Examples

This document lists the exact URL shapes produced for QC Assignment, including every "Work that" prefilter option and all column header filter URLs.

## Screen name and source
- Recommended canvasScreenName: `QualityControlAssignment`
- Task assignment screenName (sent to voa_SvtTaskAssignment): `quality control assignment`
- source sent to API: `QCA`

## Placeholders and operators used
- {org} = Dynamics org host (example: contoso.crm.dynamics.com)
- {APIM_BASE_ADDRESS} = voa_CredentialProvider Address (SVTGetSalesRecord)
- {customApiName} default: voa_GetAllSalesRecord
- pageNumber is 1-based; examples use pageSize=50
- date format: dd/MM/yyyy
- preFilter separator: "," (configurable via `PREFILTER_VALUE_SEPARATOR` in `DetailsListVOA/config/PrefilterConfigs.ts`)
- taskStatus separator: "," (configurable via `TASKSTATUS_VALUE_SEPARATOR` in `DetailsListVOA/config/PrefilterConfigs.ts`)
- multi-select field separator (sales search filters): ","
- SearchQuery format: repeated `columnFilter=<field>~<op>~<value>` joined with `&`
- columnFilter separators: condition `~`, value `,` (configurable via `COLUMN_FILTER_CONDITION_SEPARATOR` and `COLUMN_FILTER_VALUE_SEPARATOR` in `DetailsListVOA/config/PrefilterConfigs.ts`)
- Column filter operators:
  - `eq` for singleSelect and exact text fields (saleId, taskId, uprn)
  - `like` for text contains/prefix (address, postCode, summaryFlags)
  - `in` for multiSelect (billingAuthority, dwellingType, reviewFlag, taskStatus, overallFlag)
  - `GTE` / `LTE` / `between` for numeric (salesPrice, ratio, outlierRatio)
  - `between` for dateRange (transactionDate, assignedDate, taskCompletedDate, qcAssignedDate, qcCompletedDate)

## Encoding notes
- Custom API examples show readable values; actual URLs are encoded where applicable by Xrm.WebApi.
- APIM examples show the final encoded values when query strings are used (HttpUtility.UrlEncode).
- For POST-only APIs, values are sent in the JSON body and there is no query-string encoding.

## Search by QC User (searchBy=QC, source=QCA)

Note: preFilter values are QC user IDs when available; if IDs are not resolved, the selected display names are sent.

### Work that: Is assigned to the selected user(s) (taskStatus=Reassigned To QC,Assigned To QC)
Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Reassigned To QC,Assigned To QC')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc
```

### Work that: Has been completed by the selected user(s) (taskStatus=Complete Passed QC, fromDate/toDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Complete Passed QC',fromDate='01/02/2026',toDate='15/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Complete+Passed+QC&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc
```

### Work that: Is assigned to the selected user(s) but is being progressed by the caseworker (taskStatus=Assigned QC Failed)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Assigned QC Failed')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Assigned+QC+Failed&sort-field=saleId&sort-direction=asc
```

## Search by Caseworker (searchBy=CW, source=QCA)

Note: preFilter values are caseworker IDs when available; if IDs are not resolved, the selected display names are sent.

### Work that: Has been complete by the selected caseworker where QC has been requested (taskStatus=QC Requested)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='CW',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='QC Requested')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=CW&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=QC+Requested&sort-field=saleId&sort-direction=asc
```

### Work that: Has been complete by the selected caseworker (taskStatus=Complete, fromDate/toDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='CW',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='Complete',fromDate='01/02/2026',toDate='15/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=CW&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=Complete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc
```

## Search by Task (searchBy=TK, source=QCA)

Note: preFilter values are the full list of caseworker IDs resolved from the assignable users API for the Task path.

### Work that: Has been complete by a caseworker where QC has been requested (taskStatus=QC Requested)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='TK',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='QC Requested')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=TK&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=QC+Requested&sort-field=saleId&sort-direction=asc
```

### Work that: Has been complete by a caseworker (taskStatus=Complete, fromDate/toDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='TK',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='Complete',fromDate='01/02/2026',toDate='15/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=TK&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=Complete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc
```

## Column header filters (SearchQuery) - all supported fields

Column filters are sent via SearchQuery as one or more `columnFilter=<field>~<op>~<value>` entries.
Use multiple filters by joining them with `&` inside SearchQuery (Custom API) and as repeated `columnFilter` parameters in the APIM URL.
Values inside each columnFilter token are already encoded (spaces -> %20, comma -> %2C).

The examples below show a single column filter per URL (with `source=QCA` only); in real calls these are appended alongside any prefilter params.

### saleId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=saleId~eq~S-1000001')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=saleId~eq~S-1000001
```

### taskId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=taskId~eq~1000234')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=taskId~eq~1000234
```

### uprn (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=uprn~eq~123456789012')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=uprn~eq~123456789012
```

### address (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=address~like~12HighStreet')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=address~like~12HighStreet
```

### postCode (text prefix)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=postCode~like~CF101AA')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=postCode~like~CF101AA
```

### billingAuthority (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=billingAuthority~in~Cardiff%2CNewport')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=billingAuthority~in~Cardiff%2CNewport
```

### transactionDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026
```

### salesPrice (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=salesPrice~GTE~250000')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=salesPrice~GTE~250000
```

### ratio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=ratio~between~0.8~1.2')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=ratio~between~0.8~1.2
```

### dwellingType (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=dwellingType~in~Flat%2CDetached')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=dwellingType~in~Flat%2CDetached
```

### flaggedForReview (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=flaggedForReview~eq~true')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=flaggedForReview~eq~true
```

### reviewFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=reviewFlag~in~Low%2CHigh')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=reviewFlag~in~Low%2CHigh
```

### outlierRatio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=outlierRatio~LTE~1.5')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=outlierRatio~LTE~1.5
```

### overallFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=overallFlag~in~Remove%2CExclude')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=overallFlag~in~Remove%2CExclude
```

### summaryFlags (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=summaryFlags~like~Potential')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=summaryFlags~like~Potential
```

### taskStatus (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=taskStatus~in~Assigned%2CComplete')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=taskStatus~in~Assigned%2CComplete
```

### assignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111
```

### assignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026
```

### taskCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026
```

### qcAssignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222
```

### qcAssignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026
```

### qcCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCA',SearchQuery='columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026
```

## Source code used
- QC Assignment source is `QCA` in `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`.
- Prefilter mappings are in `DetailsListVOA/config/PrefilterConfigs.ts`.
- APIM query mapping is in `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`.
