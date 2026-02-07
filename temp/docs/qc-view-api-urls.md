# QC View (Quality Control View) - Plugin and APIM URL Examples

This document lists the exact URL shapes produced for Quality Control View, including every "Work that" prefilter option and all column header filter URLs.

## Screen name and source
- Recommended canvasScreenName: `QualityControlView`
- source sent to API: `QCV`

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

## Prefilter options (searchBy=QC, source=QCV)

Note: preFilter is the current QC user id (GUID) resolved from the Dataverse context.

### Work that: Is assigned to me (taskStatus=Reassigned To QC,Assigned To QC)
Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Reassigned To QC,Assigned To QC')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc
```

### Work that: I have completed (taskStatus=Complete Passed QC,Complete, fromDate/toDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc
```

### Work that: Is assigned to me but is being progressed by the caseworker (taskStatus=Assigned QC Failed,Assigned)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Assigned QC Failed,Assigned')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc
```

## Column header filters (SearchQuery) - all supported fields

Column filters are sent via SearchQuery as one or more `columnFilter=<field>~<op>~<value>` entries.
Use multiple filters by joining them with `&` inside SearchQuery (Custom API) and as repeated `columnFilter` parameters in the APIM URL.
Values inside each columnFilter token are already encoded (spaces -> %20, comma -> %2C).

The examples below show a single column filter per URL (with `source=QCV` only); in real calls these are appended alongside any prefilter params.

### saleId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=saleId~eq~S-1000001')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=saleId~eq~S-1000001
```

### taskId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=taskId~eq~1000234')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=taskId~eq~1000234
```

### uprn (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=uprn~eq~123456789012')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=uprn~eq~123456789012
```

### address (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=address~like~12HighStreet')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=address~like~12HighStreet
```

### postCode (text prefix)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=postCode~like~CF101AA')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=postCode~like~CF101AA
```

### billingAuthority (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=billingAuthority~in~Cardiff%2CNewport')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=billingAuthority~in~Cardiff%2CNewport
```

### transactionDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026
```

### salesPrice (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=salesPrice~GTE~250000')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=salesPrice~GTE~250000
```

### ratio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=ratio~between~0.8~1.2')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=ratio~between~0.8~1.2
```

### dwellingType (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=dwellingType~in~Flat%2CDetached')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=dwellingType~in~Flat%2CDetached
```

### flaggedForReview (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=flaggedForReview~eq~true')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=flaggedForReview~eq~true
```

### reviewFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=reviewFlag~in~Low%2CHigh')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=reviewFlag~in~Low%2CHigh
```

### outlierRatio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=outlierRatio~LTE~1.5')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=outlierRatio~LTE~1.5
```

### overallFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=overallFlag~in~Remove%2CExclude')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=overallFlag~in~Remove%2CExclude
```

### summaryFlags (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=summaryFlags~like~Potential')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=summaryFlags~like~Potential
```

### taskStatus (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=taskStatus~in~Assigned%2CComplete')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=taskStatus~in~Assigned%2CComplete
```

### assignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111
```

### assignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026
```

### taskCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026
```

### qcAssignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222
```

### qcAssignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026
```

### qcCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='QCV',SearchQuery='columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026
```

## Source code used
- Quality Control View source is `QCV` in `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`.
- Prefilter mappings are in `DetailsListVOA/config/PrefilterConfigs.ts`.
- APIM query mapping is in `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`.
