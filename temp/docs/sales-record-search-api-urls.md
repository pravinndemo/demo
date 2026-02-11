# Sales Record Search (All Search) - Plugin and APIM URL Examples

This document lists the exact URL shapes produced for Sales Record Search, including every search field option and all column header filter URLs.

## Placeholders and operators used
- {org} = Dynamics org host (example: contoso.crm.dynamics.com)
- {APIM_BASE_ADDRESS} = voa_CredentialProvider Address (SVTGetSalesRecord)
- {customApiName} default: voa_GetAllSalesRecord
- pageNumber is 1-based; examples use pageSize=50
- date format: dd/MM/yyyy
- multi-select field separator (sales search filters): ","
- SearchQuery format: repeated `columnFilter=<field>~<op>~<value>` joined with `&`
- columnFilter separators: condition `~`, value `,` (configurable via `COLUMN_FILTER_CONDITION_SEPARATOR` and `COLUMN_FILTER_VALUE_SEPARATOR` in `DetailsListVOA/config/PrefilterConfigs.ts`)
- Column filter operators:
  - `eq` for singleSelect (flaggedForReview, assignedTo, qcAssignedTo)
  - `like` for text fields (saleId, taskId, uprn, address, postCode, summaryFlags)
  - `in` for multiSelect (billingAuthority, dwellingType, reviewFlag, taskStatus, overallFlag)
  - `GTE` / `LTE` / `between` for numeric (salesPrice, ratio, outlierRatio)
  - `between` for dateRange (transactionDate, assignedDate, taskCompletedDate, qcAssignedDate, qcCompletedDate)

## Encoding notes
- Custom API examples show readable values; actual URLs are encoded where applicable by Xrm.WebApi.
- APIM examples show the final encoded values when query strings are used (HttpUtility.UrlEncode).
- For POST-only APIs, values are sent in the JSON body and there is no query-string encoding.

## Search field examples (source=SRS)

Note: Sales Record Search does not send searchBy or preFilter. It only sends the populated filter fields. sortField/sortDirection are included only if the user has sorted a column.

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

## Column header filters (SearchQuery) - all supported fields

Column filters are sent via SearchQuery as one or more `columnFilter=<field>~<op>~<value>` entries.
Use multiple filters by joining them with `&` inside SearchQuery (Custom API) and as repeated `columnFilter` parameters in the APIM URL.
Values inside each columnFilter token are already encoded (spaces -> %20, comma -> %2C).

The examples below show a single column filter per URL (with `source=SRS` only); in real calls these are appended alongside any search fields.

### saleId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=saleId~eq~S-1000001')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=saleId~eq~S-1000001
```

### taskId (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=taskId~eq~1000234')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=taskId~eq~1000234
```

### uprn (text eq)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=uprn~eq~123456789012')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=uprn~eq~123456789012
```

### address (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=address~like~12HighStreet')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=address~like~12HighStreet
```

### postCode (text prefix)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=postCode~like~CF101AA')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=postCode~like~CF101AA
```

### billingAuthority (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=billingAuthority~in~Cardiff%2CNewport')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=billingAuthority~in~Cardiff%2CNewport
```

### transactionDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026
```

### salesPrice (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=salesPrice~GTE~250000')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=salesPrice~GTE~250000
```

### ratio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=ratio~between~0.8~1.2')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=ratio~between~0.8~1.2
```

### dwellingType (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=dwellingType~in~Flat%2CDetached')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=dwellingType~in~Flat%2CDetached
```

### flaggedForReview (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=flaggedForReview~eq~true')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=flaggedForReview~eq~true
```

### reviewFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=reviewFlag~in~Low%2CHigh')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=reviewFlag~in~Low%2CHigh
```

### outlierRatio (numeric)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=outlierRatio~LTE~1.5')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=outlierRatio~LTE~1.5
```

### overallFlag (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=overallFlag~in~Remove%2CExclude')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=overallFlag~in~Remove%2CExclude
```

### summaryFlags (text contains)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=summaryFlags~like~Potential')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=summaryFlags~like~Potential
```

### taskStatus (multi select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=taskStatus~in~Assigned%2CComplete')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=taskStatus~in~Assigned%2CComplete
```

### assignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111
```

### assignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026
```

### taskCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026
```

### qcAssignedTo (single select)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222
```

### qcAssignedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026
```

### qcCompletedDate (date range)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/voa_GetAllSalesRecord(pageNumber='1',pageSize='50',source='SRS',SearchQuery='columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=SRS&columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026
```

## Source code used
- Sales Record Search source is `SRS` in `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`.
- Search filter mapping is in `DetailsListVOA/config/TableConfigs.ts`.
- APIM query mapping is in `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`.
