# Prefilter Screens and Sales Record Search - URL Examples

This document consolidates URL examples for:
- Manager Assignment (MA)
- Caseworker View (CWV)
- QA Assignment (QCA)
- QA View (QCV)
- Sales Record Search (SRS)

## Placeholders
| Placeholder | Value |
| --- | --- |
| {org} | Dynamics org host (example: contoso.crm.dynamics.com) |
| {APIM_BASE_ADDRESS} | voa_CredentialProvider Address (SVTGetSalesRecord) |
| {customApiName} | voa_GetAllSalesRecord |
| pageNumber/pageSize | 1 / 50 |
| Date format | dd/MM/yyyy |
| preFilter separator | , |
| taskStatus separator | , |

Notes:
- `sort-field` and `sort-direction` are sent for prefilter screens (default `saleId` asc after apply/clear).
- `columnFilter` is only sent when the user uses column header filters or header sorting. See `docs/column-filter-and-sorting-urls.md`.

## Manager Assignment (source=MA)

### Search by Billing Authority (searchBy=BA)
| Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- |
| Is ready to allocate | New | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='BA',preFilter='Cardiff,Newport',taskStatus='New')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=BA&preFilter=Cardiff%2CNewport&taskStatus=New&sort-field=saleId&sort-direction=asc` |
| Is currently assigned | Assigned QC Failed, Assigned | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='BA',preFilter='Cardiff,Newport',taskStatus='Assigned QC Failed,Assigned')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=BA&preFilter=Cardiff%2CNewport&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc` |
| Has been complete | Complete Passed QC, Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='BA',preFilter='Cardiff,Newport',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=BA&preFilter=Cardiff%2CNewport&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| Is awaiting or undergoing QC | QC Requested, Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='BA',preFilter='Cardiff,Newport',taskStatus='QC Requested,Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=BA&preFilter=Cardiff%2CNewport&taskStatus=QC+Requested%2CReassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |

### Search by Caseworker (searchBy=CW)
| Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- |
| Is assigned to the selected user(s) | Assigned QC Failed, Assigned | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='CW',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Assigned QC Failed,Assigned')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=CW&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc` |
| Has been complete by the selected user(s) | Complete Passed QC, Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='CW',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=CW&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| Is assigned to the selected user(s) but is awaiting or undergoing QC | QC Requested, Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='CW',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='QC Requested,Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=CW&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=QC+Requested%2CReassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |

## Caseworker View (source=CWV)

Notes:
- `RequestedBy` is the current caseworker user id (GUID) when available.
- `searchBy=CW` is sent when the prefilter is applied; `preFilter` is only sent if caseworker values are selected.

| Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- |
| Is assigned to me | Assigned QC Failed, Assigned | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='CWV',RequestedBy='00000000-0000-0000-0000-000000000000',searchBy='CW',taskStatus='Assigned QC Failed,Assigned')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&RequestedBy=00000000-0000-0000-0000-000000000000&searchBy=CW&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc` |
| I have completed | Complete Passed QC, Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='CWV',RequestedBy='00000000-0000-0000-0000-000000000000',searchBy='CW',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&RequestedBy=00000000-0000-0000-0000-000000000000&searchBy=CW&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| Is assigned to me but is awaiting or undergoing QC | QC Requested, Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='CWV',RequestedBy='00000000-0000-0000-0000-000000000000',searchBy='CW',taskStatus='QC Requested,Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&RequestedBy=00000000-0000-0000-0000-000000000000&searchBy=CW&taskStatus=QC+Requested%2CReassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |

## QA Assignment (source=QCA)

Notes:
- `preFilter` values use QC user IDs (searchBy=`QC`) or caseworker IDs (searchBy=`CW`). For searchBy=`Tk`, `preFilter` is omitted.
- searchBy codes: `QC`, `CW`, `Tk`.

| Search by | Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- | --- |
| QC | Is assigned to the selected user(s) | Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |
| QC | Has been completed by the selected user(s) | Complete Passed QC | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Complete Passed QC',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Complete+Passed+QC&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| QC | Is assigned to the selected user(s) but is being progressed by the caseworker | Assigned QC Failed | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Assigned QC Failed')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Assigned+QC+Failed&sort-field=saleId&sort-direction=asc` |
| CW | Has been complete by the selected caseworker where QC has been requested | QC Requested | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='CW',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='QC Requested')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=CW&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=QC+Requested&sort-field=saleId&sort-direction=asc` |
| CW | Has been complete by the selected caseworker | Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='CW',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=CW&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=Complete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| Tk | Has been complete by a caseworker where QC has been requested | QC Requested | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='Tk',taskStatus='QC Requested')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=Tk&taskStatus=QC+Requested&sort-field=saleId&sort-direction=asc` |
| Tk | Has been complete by a caseworker | Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='Tk',taskStatus='Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=Tk&taskStatus=Complete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |

## QA View (source=QCV)

| Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- |
| Is assigned to me | Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',RequestedBy='00000000-0000-0000-0000-000000000000',taskStatus='Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&RequestedBy=00000000-0000-0000-0000-000000000000&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |
| I have completed | Complete Passed QC, Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',RequestedBy='00000000-0000-0000-0000-000000000000',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&RequestedBy=00000000-0000-0000-0000-000000000000&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| Is assigned to me but is being progressed by the caseworker | Assigned QC Failed, Assigned | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',RequestedBy='00000000-0000-0000-0000-000000000000',taskStatus='Assigned QC Failed,Assigned')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&RequestedBy=00000000-0000-0000-0000-000000000000&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc` |

## Sales Record Search (SRS)

> NOTE: Column header filters and sorting are consolidated in `docs/column-filter-and-sorting-urls.md`.
> TaskId values are sent as typed (no digit-only trimming).
> The examples below may be outdated.

Sales Record Search does not use prefilters (`searchBy` / `preFilter`). It only sends the populated filter fields. sortField/sortDirection are included only if the user has sorted a column.

### Placeholders and operators used
- {org} = Dynamics org host (example: contoso.crm.dynamics.com)
- {APIM_BASE_ADDRESS} = voa_CredentialProvider Address (SVTGetSalesRecord)
- {customApiName} default: voa_GetAllSalesRecord
- pageNumber is 1-based; examples use pageSize=50
- date format: dd/MM/yyyy
- multi-select field separator (sales search filters): ","
- SearchQuery format: repeated `columnFilter=<field>~<op>~<value>` joined with `&`
- columnFilter separators: condition `~`, value `,` (configurable via `COLUMN_FILTER_CONDITION_SEPARATOR` and `COLUMN_FILTER_VALUE_SEPARATOR` in `DetailsListVOA/config/PrefilterConfigs.ts`)
- Column filter operators: `eq` for singleSelect (flaggedForReview, assignedTo, qcAssignedTo); `like` for text fields (saleId, taskId, uprn, address, postCode, summaryFlags); `in` for multiSelect (billingAuthority, dwellingType, reviewFlag, taskStatus, overallFlag); `GTE` / `LTE` / `between` for numeric (salesPrice, ratio, outlierRatio); `between` for dateRange (transactionDate, assignedDate, taskCompletedDate, qcAssignedDate, qcCompletedDate)

### Encoding notes
- Custom API examples show readable values; actual URLs are encoded where applicable by Xrm.WebApi.
- APIM examples show the final encoded values when query strings are used (HttpUtility.UrlEncode).
- For POST-only APIs, values are sent in the JSON body and there is no query-string encoding.

### Search field examples (source=SRS)

### Sale ID (saleId)
Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',saleId='S-1000001')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&saleId=S-1000001
```

### Task ID (taskId)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',taskId='1000234')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&taskId=1000234
```

### UPRN (uprn)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',uprn='123456789012')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&uprn=123456789012
```

### Address (address)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',address='12 High Street')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&address=12+High+Street
```

### Building Name/Number (buildingNameOrNumber)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',buildingNameOrNumber='Building 5')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&buildingNameOrNumber=Building+5
```

### Street (street)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',street='High Street')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&street=High+Street
```

### Town/City (town)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',town='Cardiff')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&town=Cardiff
```

### Postcode (postcode)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',postcode='CF10 1AA')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&postcode=CF10+1AA
```

### Billing Authority (billingAuthority)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',billingAuthority='Cardiff,Newport')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&billingAuthority=Cardiff%2cNewport
```

### Billing Authority Reference (billingAuthorityReference)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',billingAuthorityReference='BA-123')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&billingAuthorityReference=BA-123
```

### Transaction Date (transactionDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',transactionDate='01/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&transactionDate=01%2f02%2f2026
```

### Sales Price (salesPrice + salesPriceOperator)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',salesPrice='250000',salesPriceOperator='GE')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&salesPrice=250000&salesPriceOperator=GE
```

### Ratio (ratio)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',ratio='0.8')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&ratio=0.8
```

### Dwelling Type (dwellingType)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',dwellingType='Flat,Detached')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&dwellingType=Flat%2cDetached
```

### Flagged For Review (flaggedForReview)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',flaggedForReview='true')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&flaggedForReview=true
```

### Review Flags (reviewFlag)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',reviewFlag='Low,High')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&reviewFlag=Low%2cHigh
```

### Outlier Key Sale (outlierKeySale)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',outlierKeySale='KeySale1,KeySale2')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&outlierKeySale=KeySale1%2cKeySale2
```

### Outlier Ratio (outlierRatio)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',outlierRatio='1.5')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&outlierRatio=1.5
```

### Overall Flag (overallFlag)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',overallFlag='Investigate can use,Remove')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&overallFlag=Investigate+can+use%2cRemove
```

### Summary Flag (summaryFlag)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',summaryFlag='Potential issue')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&summaryFlag=Potential+issue
```

### Task Status (taskStatus)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',taskStatus='Assigned QC Failed,Assigned')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&taskStatus=Assigned+QC+Failed%2cAssigned
```

### Assigned To (assignedTo)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',assignedTo='11111111-1111-1111-1111-111111111111')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&assignedTo=11111111-1111-1111-1111-111111111111
```

### Assigned Date (assignedFromDate + assignedToDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',assignedFromDate='01/02/2026',assignedToDate='05/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&assignedFromDate=01%2f02%2f2026&assignedToDate=05%2f02%2f2026
```

### QC Assigned To (qcAssignedTo)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',qcAssignedTo='22222222-2222-2222-2222-222222222222')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&qcAssignedTo=22222222-2222-2222-2222-222222222222
```

### QC Assigned Date (qcAssignedFromDate + qcAssignedToDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',qcAssignedFromDate='01/02/2026',qcAssignedToDate='03/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&qcAssignedFromDate=01%2f02%2f2026&qcAssignedToDate=03%2f02%2f2026
```

### QC Completed Date (qcCompleteFromDate + qcCompleteToDate)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',qcCompleteFromDate='04/02/2026',qcCompleteToDate='06/02/2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&qcCompleteFromDate=04%2f02%2f2026&qcCompleteToDate=06%2f02%2f2026
```

### Column header filters (SearchQuery)
Column filters are sent via SearchQuery as one or more `columnFilter=<field>~<op>~<value>` entries. For examples and supported fields, see `docs/column-filter-and-sorting-urls.md`.

### Source code used
- Sales Record Search source is `SRS` in `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`.
- Search filter mapping is in `DetailsListVOA/config/TableConfigs.ts`.
- APIM query mapping is in `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`.
