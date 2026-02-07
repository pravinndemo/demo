# Caseworker View (My Allocated Sales) - Plugin and APIM URL Examples

This document lists the exact URL shapes produced for Caseworker View, including every "Work that" prefilter option and all column header filter URLs.

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

## Prefilter options (searchBy=CW, source=CWV)

Note: RequestedBy is the current caseworker user id (GUID) resolved from the Dataverse context. When RequestedBy is set, preFilter is not sent for Caseworker View.

### Work that: Is assigned to me (taskStatus=Assigned QC Failed,Assigned)
Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='CWV',searchBy='CW',RequestedBy='00000000-0000-0000-0000-000000000000',taskStatus='Assigned QC Failed,Assigned')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&searchBy=CW&RequestedBy=00000000-0000-0000-0000-000000000000&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc
```

### Work that: I have completed (taskStatus=Complete Passed QC,Complete, fromDate/toDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='CWV',searchBy='CW',RequestedBy='00000000-0000-0000-0000-000000000000',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&searchBy=CW&RequestedBy=00000000-0000-0000-0000-000000000000&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc
```

### Work that: Is assigned to me but is awaiting or undergoing QC (taskStatus=QC Requested,Reassigned To QC,Assigned To QC)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='CWV',searchBy='CW',RequestedBy='00000000-0000-0000-0000-000000000000',taskStatus='QC Requested,Reassigned To QC,Assigned To QC')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&searchBy=CW&RequestedBy=00000000-0000-0000-0000-000000000000&taskStatus=QC+Requested%2CReassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc
```

## Column header filters (SearchQuery) - all supported fields

Column filters are sent via SearchQuery as one or more `columnFilter=<field>~<op>~<value>` entries.
Use multiple filters by joining them with `&` inside SearchQuery (Custom API) and as repeated `columnFilter` parameters in the APIM URL.
Values inside each columnFilter token are already encoded (spaces -> %20, comma -> %2C).

The examples below show a single column filter per URL (with `source=CWV` only); in real calls these are appended alongside any prefilter params.

### saleId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=saleId~eq~S-1000001')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=saleId~eq~S-1000001
```

### taskId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=taskId~eq~1000234')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=taskId~eq~1000234
```

### uprn (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=uprn~eq~123456789012')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=uprn~eq~123456789012
```

### address (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=address~like~12HighStreet')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=address~like~12HighStreet
```

### postCode (text prefix)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=postCode~like~CF101AA')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=postCode~like~CF101AA
```

### billingAuthority (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=billingAuthority~in~Cardiff%2CNewport')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=billingAuthority~in~Cardiff%2CNewport
```

### transactionDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026
```

### salesPrice (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=salesPrice~GTE~250000')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=salesPrice~GTE~250000
```

### ratio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=ratio~between~0.8~1.2')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=ratio~between~0.8~1.2
```

### dwellingType (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=dwellingType~in~Flat%2CDetached')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=dwellingType~in~Flat%2CDetached
```

### flaggedForReview (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=flaggedForReview~eq~true')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=flaggedForReview~eq~true
```

### reviewFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=reviewFlag~in~Low%2CHigh')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=reviewFlag~in~Low%2CHigh
```

### outlierRatio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=outlierRatio~LTE~1.5')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=outlierRatio~LTE~1.5
```

### overallFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=overallFlag~in~Remove%2CExclude')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=overallFlag~in~Remove%2CExclude
```

### summaryFlags (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=summaryFlags~like~Potential')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=summaryFlags~like~Potential
```

### taskStatus (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=taskStatus~in~Assigned%2CComplete')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=taskStatus~in~Assigned%2CComplete
```

### assignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111
```

### assignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026
```

### taskCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026
```

### qcAssignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222
```

### qcAssignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026
```

### qcCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='CWV',SearchQuery='columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026
```

## Source code used
- Caseworker View source is `CWV` in `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`.
- Prefilter mappings are in `DetailsListVOA/config/PrefilterConfigs.ts`.
- APIM query mapping is in `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`.
