# QA View - Prefilter, Table Filter, and Sort URLs

| Placeholder | Value |
| --- | --- |
| {org} | Dynamics org host (example: contoso.crm.dynamics.com) |
| {APIM_BASE_ADDRESS} | voa_CredentialProvider Address (SVTGetSalesRecord) |
| {customApiName} | voa_GetAllSalesRecord |
| {source} | QCV |
| Date format | dd/MM/yyyy |
| pageNumber/pageSize | 1 / 50 |
| preFilter separator | , |
| taskStatus separator | , |
| columnFilter separators | condition ~, value , |

| Note | Detail |
| --- | --- |
| preFilter values | preFilter is the current QC user id (GUID) resolved from Dataverse. |
| URL encoding | APIM query params are URL-encoded. |
| Multiple column filters | Use repeated columnFilter params in APIM or &-joined columnFilter entries inside SearchQuery. |

## Prefilter URLs

| Search by | Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- | --- |
| QC | Is assigned to me | Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='{source}',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |
| QC | I have completed | Complete Passed QC, Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='{source}',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| QC | Is assigned to me but is being progressed by the caseworker | Assigned QC Failed, Assigned | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='{source}',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Assigned QC Failed,Assigned')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc` |

## Table Filter URLs

| Field | Operator | Custom API URL | APIM URL |
| --- | --- | --- | --- |
| saleId | eq | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=saleId~eq~S-1000001')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=saleId~eq~S-1000001` |
| taskId | eq | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=taskId~eq~1000234')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=taskId~eq~1000234` |
| uprn | eq | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=uprn~eq~123456789012')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=uprn~eq~123456789012` |
| address | like | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=address~like~12HighStreet')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=address~like~12HighStreet` |
| postCode | like | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=postCode~like~CF101AA')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=postCode~like~CF101AA` |
| billingAuthority | in | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=billingAuthority~in~Cardiff%2CNewport')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=billingAuthority~in~Cardiff%2CNewport` |
| transactionDate | between | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026` |
| salesPrice | GTE | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=salesPrice~GTE~250000')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=salesPrice~GTE~250000` |
| ratio | between | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=ratio~between~0.8~1.2')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=ratio~between~0.8~1.2` |
| dwellingType | in | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=dwellingType~in~Flat%2CDetached')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=dwellingType~in~Flat%2CDetached` |
| flaggedForReview | eq | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=flaggedForReview~eq~true')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=flaggedForReview~eq~true` |
| reviewFlag | in | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=reviewFlag~in~Low%2CHigh')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=reviewFlag~in~Low%2CHigh` |
| outlierRatio | LTE | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=outlierRatio~LTE~1.5')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=outlierRatio~LTE~1.5` |
| overallFlag | in | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=overallFlag~in~Remove%2CExclude')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=overallFlag~in~Remove%2CExclude` |
| summaryFlags | like | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=summaryFlags~like~Potential')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=summaryFlags~like~Potential` |
| taskStatus | in | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=taskStatus~in~Assigned%2CComplete')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=taskStatus~in~Assigned%2CComplete` |
| assignedTo | eq | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111` |
| assignedDate | between | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026` |
| taskCompletedDate | between | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026` |
| qcAssignedTo | eq | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222` |
| qcAssignedDate | between | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026` |
| qcCompletedDate | between | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',SearchQuery='columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026` |

## Sort URLs

| Sort field | Direction | Custom API URL | APIM URL |
| --- | --- | --- | --- |
| saleId | asc | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',sortField='saleId',sortDirection='asc')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&sort-field=saleId&sort-direction=asc` |
| transactionDate | desc | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',sortField='transactionDate',sortDirection='desc')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&sort-field=transactionDate&sort-direction=desc` |
