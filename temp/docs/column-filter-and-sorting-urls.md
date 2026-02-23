# Column Header Filters and Sorting - URL Examples

This document applies to all grid screens that support column header filters:
- Sales Record Search (SRS)
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
| {source} | SRS, MA, CWV, QCA, or QCV |

## Column filter format
SearchQuery format: repeated `columnFilter=<field>~<op>~<value>` joined with `&`.
APIM format: repeated `columnFilter` query params.

Notes:
- TaskId values are sent as typed (no digit-only trimming).
- Text fields use operator `like` (includes `textEq`, `textContains`, and `textPrefix` controls).
- Values inside each token are URL-encoded.

## Combined table (column header filters)
| Field | Control | Operator | Example columnFilter token |
| --- | --- | --- | --- |
| saleId | textEq | like | columnFilter=saleId~like~S-1000001 |
| taskId | textEq | like | columnFilter=taskId~like~A-1000234 |
| uprn | textEq | like | columnFilter=uprn~like~123456789012 |
| address | textContains | like | columnFilter=address~like~12%20High%20Street |
| postCode | textPrefix | like | columnFilter=postCode~like~CF10 |
| billingAuthority | multiSelect | in | columnFilter=billingAuthority~in~Cardiff%2CNewport |
| transactionDate | dateRange | between | columnFilter=transactionDate~between~01%2F02%2F2026~15%2F02%2F2026 |
| salesPrice | numeric | GTE | columnFilter=salesPrice~GTE~250000 |
| ratio | numeric | between | columnFilter=ratio~between~0.8~1.2 |
| dwellingType | multiSelect | in | columnFilter=dwellingType~in~Flat%2CDetached |
| flaggedForReview | singleSelect | eq | columnFilter=flaggedForReview~eq~true |
| reviewFlags | multiSelect | in | columnFilter=reviewFlag~in~Low%2CHigh |
| outlierRatio | numeric | LTE | columnFilter=outlierRatio~LTE~1.5 |
| overallFlag | multiSelect | in | columnFilter=overallFlag~in~Remove%2CExclude |
| summaryFlags | textContains | like | columnFilter=summaryFlags~like~Potential |
| taskStatus | multiSelect | in | columnFilter=taskStatus~in~Assigned%2CComplete |
| assignedTo | singleSelect | eq | columnFilter=assignedTo~eq~11111111-1111-1111-1111-111111111111 |
| assignedDate | dateRange | between | columnFilter=assignedDate~between~01%2F02%2F2026~05%2F02%2F2026 |
| taskCompletedDate | dateRange | between | columnFilter=taskCompletedDate~between~06%2F02%2F2026~10%2F02%2F2026 |
| qcAssignedTo | singleSelect | eq | columnFilter=qcAssignedTo~eq~22222222-2222-2222-2222-222222222222 |
| qcAssignedDate | dateRange | between | columnFilter=qcAssignedDate~between~01%2F02%2F2026~03%2F02%2F2026 |
| qcCompletedDate | dateRange | between | columnFilter=qcCompletedDate~between~04%2F02%2F2026~06%2F02%2F2026 |

## Sorting behavior
- `sort-field` and `sort-direction` are sent as standard query params.
- The SearchQuery sort marker is sent only when the user clicks a column header sort: `columnFilter=<field>~SORT~ASC|DESC`.
- If the user sorts with no header filters, SearchQuery contains only the sort marker.

### Example: user clicks sort on saleId (desc) with no header filters
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',sortField='saleId',sortDirection='desc',SearchQuery='columnFilter=saleId~SORT~DESC')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&sort-field=saleId&sort-direction=desc&columnFilter=saleId~SORT~DESC
```

### Example: header filter + header sort on address (asc)
Custom API:
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',source='{source}',sortField='address',sortDirection='asc',SearchQuery='columnFilter=address~like~High%20Street&columnFilter=address~SORT~ASC')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source={source}&sort-field=address&sort-direction=asc&columnFilter=address~like~High%20Street&columnFilter=address~SORT~ASC
```
