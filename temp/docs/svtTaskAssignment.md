# voa_SvtTaskAssignment Custom API (Task Assignment)

## Purpose
`voa_SvtTaskAssignment` is an **unbound** Dataverse Custom API used by the SVT List PCF control to **assign tasks** to a selected user in the assignment view. The PCF collects selected rows, builds per-task payloads, and calls the API via `Xrm.WebApi.execute`.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L625-L692】【F:DetailsListVOA/services/CustomApi.ts†L23-L73】

The API name is configured in the control config and defaults to `voa_SvtTaskAssignment` for this repo build (overridable via PCF input parameters).【F:DetailsListVOA/config/ControlConfig.ts†L1-L8】【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L625-L635】

---

## Client-side flow (PCF)
1. **User opens the assignment panel** and selects tasks.
2. `assignTasksToUser` resolves the API name and custom API type.
3. For each selected task, the PCF calls the Custom API with assignment parameters.
4. On success, the selection is cleared and the grid is refreshed.

Relevant implementation:
- `assignTasksToUser` (builds payloads and calls API).【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L637-L692】
- `resolveAssignmentApiName` / `resolveCustomApiTypeForAssign` (config + input parameter).【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L625-L635】

---

## Request parameters
The Custom API is called with the following parameters (per selected task):

| Parameter | Type | Notes |
| --- | --- | --- |
| `assignedToUserId` | string | Selected assignee’s Dataverse user ID. | 
| `taskStatus` | string | Manager assignment: `New` for first-time assignment, `NULL` for reassignment. QC assignment: `QC Requested` for first-time assignment, `NULL` for reassignment. (PCF blocks mixed New + non-New and mixed QC Requested + non-QC Requested selections.) |
| `saleId` | string | Sale ID from the selected record. |
| `taskId` | string | Task ID from the selected record. **Required** by plugin. |
| `assignedByUserId` | string | Current user ID (from context). |
| `date` | string (ISO) | Assignment timestamp in ISO format. |
| `screenName` | string | Canvas screen name used to resolve assignment context (manager vs QA). |

The PCF populates these values in `assignTasksToUser` prior to the API call (including the `screenName` derived from the Canvas screen input).【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L312-L319】【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L813-L834】

---

## URL examples
This section consolidates the URL shapes and payloads for task assignment.

### Placeholders
- {org} = Dynamics org host (example: contoso.crm.dynamics.com)
- {APIM_BASE_ADDRESS} = voa_CredentialProvider Address (SVTTaskAssignment)
- {customApiName} default: voa_SvtTaskAssignment
- Operators: none (this API is a POST with JSON body, no query operators)

### Encoding notes
- Custom API examples show readable values; actual URLs are encoded where applicable by Xrm.WebApi.
- APIM examples show the final encoded values when query strings are used (HttpUtility.UrlEncode).
- For POST-only APIs, values are sent in the JSON body and there is no query-string encoding.

### Dataverse Custom API call (Action)
`voa_SvtTaskAssignment` is an unbound Custom API Action (POST).

Request (example):
```text
POST https://{org}.crm.dynamics.com/api/data/v9.2/voa_SvtTaskAssignment
```
Body (JSON):
```json
{
  "assignedToUserId": "22222222-2222-2222-2222-222222222222",
  "taskId": "[\"1000234\",\"1000235\"]",
  "assignedByUserId": "11111111-1111-1111-1111-111111111111",
  "taskStatus": "New",
  "screenName": "manager assignment"
}
```

Parameter notes:
- assignedToUserId and taskId are required by the plugin.
- taskId is passed as a JSON array string by the PCF (the plugin also accepts a comma-separated string or a single value).
- The plugin maps taskId to taskList in the APIM payload.
- screenName (or canvasScreenName) is used for authorization and source mapping.
- QC assignment screenName sent by the PCF is `quality control assignment`.
- Manager assignment taskStatus rules: if all selected tasks are `New`, send `taskStatus = "New"`. If the tasks are already assigned (status not `New`), send `taskStatus = "NULL"`.
- QC assignment taskStatus rules: if all selected tasks are `QC Requested`, send `taskStatus = "QC Requested"`. If the tasks are already assigned (status not `QC Requested`), send `taskStatus = "NULL"`.

### APIM URL formed by the plugin
The plugin POSTs to the Address from `SVTTaskAssignment` with a JSON body (no query string).

Example APIM URL:
```text
{APIM_BASE_ADDRESS} = https://apim.example.net/svt/assignments
```

APIM request body (Manager assignment):
```json
{
  "source": "MAT",
  "assignedTo": "22222222-2222-2222-2222-222222222222",
  "taskList": ["1000234", "1000235"],
  "requestedBy": "11111111-1111-1111-1111-111111111111",
  "taskStatus": "New",
  "saleId": "",
  "date": ""
}
```

APIM request body (QC assignment):
```json
{
  "source": "QCAT",
  "assignedTo": "22222222-2222-2222-2222-222222222222",
  "taskList": ["1000234", "1000235"],
  "requestedBy": "11111111-1111-1111-1111-111111111111",
  "taskStatus": "QC Requested",
  "saleId": "",
  "date": ""
}
```

Source mapping (plugin):
- Manager assignment -> MAT
- QC assignment -> QCAT
- QC view -> QCV
- Caseworker screens -> CWV
- Sales record search -> SRS

---
## Backend plugin flow (Dataverse → APIM)
The plugin `SvtTaskAssignment`:
0. Resolves the **user persona** (manager/QA/user) and assignment context from `screenName` / `canvasScreenName`.
1. Reads the API configuration from `voa_CredentialProvider` (`SVTTaskAssignment`).
2. Denies access if the user persona is not allowed for the assignment context.
3. Validates that `assignedToUserId` and `taskId` are present.
4. Posts the assignment payload to APIM as JSON.
5. Returns a `Result` JSON string indicating success or failure.

APIM payload notes:
- The plugin maps the incoming `taskId` values into `taskList` in the APIM JSON body.
- Source codes are derived from screen name for assignment calls:
  - Manager assignment -> `MAT`
  - QC assignment -> `QCAT`
  - Caseworker screens -> `CWV`
  - Sales record search -> `SRS`

Relevant files:
- `VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs` (context resolution, authorization, payload, error handling).【F:VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs†L12-L172】
- `VOA.SVT.Plugins/Helpers/UserContextResolver.cs` (persona resolution via teams/roles).【F:VOA.SVT.Plugins/Helpers/UserContextResolver.cs†L7-L200】
- `VOA.SVT.Plugins/Helpers/AssignmentContextResolver.cs` (manager vs QA screen matching and authorization rules).【F:VOA.SVT.Plugins/Helpers/AssignmentContextResolver.cs†L7-L57】

---

## Output
The plugin returns a JSON string in the `Result` output parameter, generated by `BuildResult` with:
- `success` (boolean)
- `message` (string)
- `payload` (string)

The plugin sets the `Result` string for both success and failure cases.【F:VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs†L118-L162】

---

## Authorization notes (roles + teams)
`voa_SvtTaskAssignment` uses **assignment context** + **user persona** to protect assignment operations. The plugin resolves persona by checking SVT security-group team membership first and then falling back to SVT Dataverse roles if needed. Manager assignment is restricted to **SVT Managers**, while QA assignment allows **Managers or QA** personas.【F:VOA.SVT.Plugins/Helpers/UserContextResolver.cs†L45-L200】【F:VOA.SVT.Plugins/Helpers/AssignmentContextResolver.cs†L27-L57】【F:VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs†L28-L51】

---

## Related docs
- `docs/svtGetSaleRecords.md` (search + grid data retrieval).
- `docs/svtGetViewSaleRecordById.md` (sale details retrieval).
- `docs/svtManualTaskCreation.md` (manual task creation endpoint).
- `docs/svtGetUserContext.md` (user persona/roles context for Canvas apps).
