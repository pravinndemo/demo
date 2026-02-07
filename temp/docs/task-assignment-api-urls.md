# Task Assignment - Plugin and APIM URL Examples

This document shows the exact URL shapes and payloads used for task assignment.

## Placeholders and operators used
- {org} = Dynamics org host (example: contoso.crm.dynamics.com)
- {APIM_BASE_ADDRESS} = voa_CredentialProvider Address (SVTTaskAssignment)
- {customApiName} default: voa_SvtTaskAssignment
- Operators: none (this API is a POST with JSON body, no query operators)

## Encoding notes
- Custom API examples show readable values; actual URLs are encoded where applicable by Xrm.WebApi.
- APIM examples show the final encoded values when query strings are used (HttpUtility.UrlEncode).
- For POST-only APIs, values are sent in the JSON body and there is no query-string encoding.

## Dataverse Custom API call (Action)
`voa_SvtTaskAssignment` is an unbound Custom API Action (POST).

### Request (example)
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

### Parameter notes
- assignedToUserId and taskId are required by the plugin.
- taskId is passed as a JSON array string by the PCF (the plugin also accepts a comma-separated string or a single value).
- The plugin maps `taskId` to `taskList` in the APIM payload.
- screenName (or canvasScreenName) is used for authorization and source mapping.
- QC assignment screenName sent by the PCF is `quality control assignment`.
- Manager assignment taskStatus rules:
  - If all selected tasks are `New`, send `taskStatus = "New"`.
  - If the tasks are already assigned (status not `New`), send `taskStatus = "NULL"`.
- QC assignment taskStatus rules:
  - If all selected tasks are `QC Requested`, send `taskStatus = "QC Requested"`.
  - If the tasks are already assigned (status not `QC Requested`), send `taskStatus = "NULL"`.

## APIM URL formed by the plugin
The plugin POSTs to the Address from `SVTTaskAssignment` with a JSON body (no query string).

### Example APIM URL
```text
{APIM_BASE_ADDRESS} = https://apim.example.net/svt/assignments
```

### APIM request body (Manager assignment)
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

### APIM request body (QC assignment)
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

### Source mapping (plugin)
The plugin derives the `source` value from `screenName` (or assignment context):
- Manager assignment -> MAT
- QC assignment -> QCAT
- QC view -> QCV
- Caseworker screens -> CWV
- Sales record search -> SRS

## Output
The Custom API returns a JSON string in the `Result` output parameter:
```json
{
  "success": true,
  "message": "Assignment succeeded.",
  "payload": "<raw APIM body>"
}
```

## Source code used
- Plugin: `VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs`
- Related contract doc: `docs/svtTaskAssignment.md`
