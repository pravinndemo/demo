# Prefilter → API Field Name Map (By Screen)

This document lists **prefilter display names**, **internal keys**, and the **parameter names** used for Custom API and APIM calls, grouped by screen.

Notes:
- Prefilter parameter names are constant across screens: `searchBy`, `preFilter`, `taskStatus`, `fromDate`, `toDate`.
- Value separators: comma (`,`) for both `preFilter` and `taskStatus`.
- Dates are formatted as `dd/MM/yyyy` when sent to the API.
- Column header filters use `columnFilter` query params. For string fields, the operator is currently `like` unless the control is `singleSelect` (then `eq`).
- In the current build, these fields use `like`: `saleid`, `taskid`, `uprn`, `address`, `postcode`.
- If “All” is selected, `preFilter=ALL`.

**Manager Assignment / Manager Dashboard (tableKey: `manager`)**

| Prefilter Display Name | Internal Key Name | Custom API Param Name | APIM Param Name | Value / Operator |
|---|---|---|---|---|
| Search By | searchBy | searchBy | searchBy | `BA` for Billing Authority, `CW` for Caseworker |
| Billing Authority | billingAuthorities | preFilter | preFilter | Comma list or `ALL` (only when Search By = Billing Authority) |
| Caseworker | caseworkers | preFilter | preFilter | Comma list or `ALL` (only when Search By = Caseworker) |
| Work That | workThat | taskStatus | taskStatus | See mapping below |
| Completed From | completedFrom | fromDate | fromDate | `dd/MM/yyyy` (only for completed work) |
| Completed To | completedTo | toDate | toDate | `dd/MM/yyyy` (only for completed work) |

Work That → taskStatus mapping (Manager):
- `readyToAllocate` → `New`
- `currentlyAssigned` → `Assigned QC Failed,Assigned`
- `hasBeenComplete` → `Complete Passed QC,Complete`
- `awaitingQc` → `QC Requested,Reassigned To QC,Assigned To QC`
- `assignedToSelected` → `Assigned QC Failed,Assigned`
- `assignedAwaitingQc` → `QC Requested,Reassigned To QC,Assigned To QC`
- `completedBySelected` → `Complete Passed QC,Complete`

Completed dates are sent only when `workThat` is `hasBeenComplete` or `completedBySelected`.

URL examples (Manager):

Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='MA',searchBy='BA',preFilter='Cardiff',taskStatus='Assigned QC Failed,Assigned')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=MA&searchBy=BA&preFilter=Cardiff&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc
```

**Caseworker View / My Assignment (tableKey: `myassignment`)**

| Prefilter Display Name | Internal Key Name | Custom API Param Name | APIM Param Name | Value / Operator |
|---|---|---|---|---|
| Search By | searchBy | searchBy | searchBy | `CW` |
| Caseworker | caseworkers | preFilter | preFilter | Comma list or `ALL` |
| Work That | workThat | taskStatus | taskStatus | See mapping below |
| Completed From | completedFrom | fromDate | fromDate | `dd/MM/yyyy` (only for completed work) |
| Completed To | completedTo | toDate | toDate | `dd/MM/yyyy` (only for completed work) |

Work That → taskStatus mapping (Caseworker):
- `assignedToSelected` → `Assigned QC Failed,Assigned`
- `completedBySelected` → `Complete Passed QC,Complete`
- `assignedAwaitingQc` → `QC Requested,Reassigned To QC,Assigned To QC`

Completed dates are sent only when `workThat` is `completedBySelected`.

Note: In Caseworker View, `RequestedBy` is set (current user). The plugin omits `searchBy` and `preFilter` when `RequestedBy` is present; `taskStatus/fromDate/toDate` still apply.

URL examples (Caseworker View):

Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='CWV',RequestedBy='00000000-0000-0000-0000-000000000000',taskStatus='Assigned QC Failed,Assigned')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=CWV&RequestedBy=00000000-0000-0000-0000-000000000000&taskStatus=Assigned+QC+Failed%2CAssigned&sort-field=saleId&sort-direction=asc
```

**QC Assignment (tableKey: `qaassign`)**

| Prefilter Display Name | Internal Key Name | Custom API Param Name | APIM Param Name | Value / Operator |
|---|---|---|---|---|
| Search By | searchBy | searchBy | searchBy | `QC` (QC User), `CW` (Caseworker), `TK` (Task) |
| QC User / Caseworker | caseworkers | preFilter | preFilter | Comma list or `ALL` (not used when Search By = Task) |
| Work That | workThat | taskStatus | taskStatus | See mapping below |
| Completed From | completedFrom | fromDate | fromDate | `dd/MM/yyyy` (only for completed work) |
| Completed To | completedTo | toDate | toDate | `dd/MM/yyyy` (only for completed work) |

Work That → taskStatus mapping (QC Assignment):
- `qcAssignedToSelected` → `Reassigned To QC,Assigned To QC`
- `qcCompletedBySelected` → `Complete Passed QC`
- `qcAssignedInProgress` → `Assigned QC Failed`
- `caseworkerCompletedQcRequested` → `QC Requested`
- `taskCompletedQcRequested` → `QC Requested`
- `caseworkerCompleted` → `Complete`
- `taskCompleted` → `Complete`

Completed dates are sent only when `workThat` is `qcCompletedBySelected`, `caseworkerCompleted`, or `taskCompleted`.

URL examples (QC Assignment):

Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCA',searchBy='QC',preFilter='11111111-1111-1111-1111-111111111111',taskStatus='Assigned QC Failed')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCA&searchBy=QC&preFilter=11111111-1111-1111-1111-111111111111&taskStatus=Assigned+QC+Failed&sort-field=saleId&sort-direction=asc
```

**QC View / QA Dashboard (tableKey: `qaview`, `qa`)**

| Prefilter Display Name | Internal Key Name | Custom API Param Name | APIM Param Name | Value / Operator |
|---|---|---|---|---|
| Search By | searchBy | searchBy | searchBy | `QC` (QC User), `CW` (Caseworker), `TK` (Task) |
| QC User / Caseworker | caseworkers | preFilter | preFilter | Comma list or `ALL` (not used when Search By = Task) |
| Work That | workThat | taskStatus | taskStatus | See mapping below |
| Completed From | completedFrom | fromDate | fromDate | `dd/MM/yyyy` (only for completed work) |
| Completed To | completedTo | toDate | toDate | `dd/MM/yyyy` (only for completed work) |

Work That → taskStatus mapping (QC View):
- `qcAssignedToSelected` → `Reassigned To QC,Assigned To QC`
- `qcCompletedBySelected` → `Complete Passed QC,Complete`
- `qcAssignedInProgress` → `Assigned QC Failed,Assigned`

Completed dates are sent only when `workThat` is `qcCompletedBySelected`.

URL examples (QC View):

Custom API (function):
```text
GET https://{org}.crm.dynamics.com/api/data/v9.2/{customApiName}(pageNumber='1',pageSize='50',sortField='saleId',sortDirection='asc',source='QCV',searchBy='QC',preFilter='22222222-2222-2222-2222-222222222222',taskStatus='Reassigned To QC,Assigned To QC')
```
APIM:
```text
{APIM_BASE_ADDRESS}?page-number=1&page-size=50&source=QCV&searchBy=QC&preFilter=22222222-2222-2222-2222-222222222222&taskStatus=Reassigned+To+QC%2CAssigned+To+QC&sort-field=saleId&sort-direction=asc
```
