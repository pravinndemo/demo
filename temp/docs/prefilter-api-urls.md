# Prefilter Screens - URL Examples

This document consolidates prefilter-driven URL examples for:
- Manager Assignment (MA)
- Caseworker View (CWV)
- QA Assignment (QCA)
- QA View (QCV)

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
- `preFilter` values use QC user IDs, caseworker IDs, or task caseworker IDs depending on searchBy.
- searchBy codes: `QC`, `CW`, `Tk`.

| Search by | Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- | --- |
| QC | Is assigned to the selected user(s) | Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |
| QC | Has been completed by the selected user(s) | Complete Passed QC | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Complete Passed QC',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Complete+Passed+QC&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| QC | Is assigned to the selected user(s) but is being progressed by the caseworker | Assigned QC Failed | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',taskStatus='Assigned QC Failed')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111%2C22222222-2222-2222-2222-222222222222&taskStatus=Assigned+QC+Failed&sort-field=saleId&sort-direction=asc` |
| CW | Has been complete by the selected caseworker where QC has been requested | QC Requested | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='CW',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='QC Requested')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=CW&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=QC+Requested&sort-field=saleId&sort-direction=asc` |
| CW | Has been complete by the selected caseworker | Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='CW',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=CW&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=Complete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| Tk | Has been complete by a caseworker where QC has been requested | QC Requested | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='Tk',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='QC Requested')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=Tk&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=QC+Requested&sort-field=saleId&sort-direction=asc` |
| Tk | Has been complete by a caseworker | Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='Tk',preFilter='33333333-3333-3333-3333-333333333333,44444444-4444-4444-4444-444444444444',taskStatus='Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=Tk&preFilter=33333333-3333-3333-3333-333333333333%2C44444444-4444-4444-4444-444444444444&taskStatus=Complete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |

## QA View (source=QCV)

| Search by | Work that | taskStatus | Dates | Custom API URL | APIM URL |
| --- | --- | --- | --- | --- | --- |
| QC | Is assigned to me | Reassigned To QC, Assigned To QC | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Reassigned To QC,Assigned To QC')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc` |
| QC | I have completed | Complete Passed QC, Complete | fromDate/toDate | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Complete Passed QC,Complete',fromDate='01/02/2026',toDate='15/02/2026')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Complete+Passed+QC%2CComplete&fromDate=01%2f02%2f2026&toDate=15%2f02%2f2026&sort-field=saleId&sort-direction=asc` |
| QC | Is assigned to me but is being progressed by the caseworker | Assigned QC Failed, Assigned | - | `GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',searchBy='QC',preFilter='00000000-0000-0000-0000-000000000000',taskStatus='Assigned QC Failed,Assigned')` | `{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&searchBy=QC&preFilter=00000000-0000-0000-0000-000000000000&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc` |

## Sales Record Search (SRS)

Sales Record Search does not use prefilters (`searchBy` / `preFilter`). See `docs/sales-record-search-api-urls.md` for search panel examples.
