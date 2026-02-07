# Task Creation (Manual) - Plugin and APIM URL Examples

This document shows the exact URL shapes and payloads used for manual task creation.

## Placeholders and operators used
- {org} = Dynamics org host (example: contoso.crm.dynamics.com)
- {APIM_BASE_ADDRESS} = voa_CredentialProvider Address (SVTManualTaskCreation)
- {customApiName} default: voa_SvtManualTaskCreation
- saleId format is whatever the upstream system expects (examples use S-1000001)
- Operators: none (this API is a POST with JSON body, no query operators)

## Encoding notes
- Custom API examples show readable values; actual URLs are encoded where applicable by Xrm.WebApi.
- APIM examples show the final encoded values when query strings are used (HttpUtility.UrlEncode).
- For POST-only APIs, values are sent in the JSON body and there is no query-string encoding.

## Dataverse Custom API call (Action)
`voa_SvtManualTaskCreation` is an unbound Custom API Action (POST).

### Request (example)
```text
POST https://{org}.crm.dynamics.com/api/data/v9.2/voa_SvtManualTaskCreation
```
Body (JSON):
```json
{
  "saleId": "S-1000001",
  "sourceType": "M",
  "createdBy": "11111111-1111-1111-1111-111111111111"
}
```

### Parameter notes
- saleId is required.
- sourceType defaults to "M" if omitted.
- createdBy defaults to the initiating user ID if omitted.

## APIM URL formed by the plugin
The plugin builds the full APIM URL from the Address in `SVTManualTaskCreation` and the saleId.
It POSTs JSON to the final URL.

### URL resolution rules (in order)
1) If Address contains `{saleId}`, replace it with saleId.
2) Else if Address contains `{id}`, replace it with saleId.
3) Else if Address ends with `/sales`, append `/{saleId}/task`.
4) Else append `/sales/{saleId}/task`.

### Example outputs
Base Address:
```text
{APIM_BASE_ADDRESS} = https://apim.example.net/svt/sales
```
Final URL:
```text
https://apim.example.net/svt/sales/S-1000001/task
```

Base Address:
```text
{APIM_BASE_ADDRESS} = https://apim.example.net/svt/sales/{saleId}/task
```
Final URL:
```text
https://apim.example.net/svt/sales/S-1000001/task
```

### APIM request body (JSON)
```json
{
  "sourceType": "M",
  "createdBy": "11111111-1111-1111-1111-111111111111"
}
```

## Output
The Custom API returns a JSON string in the `Result` output parameter:
```json
{
  "success": true,
  "message": "Manual task creation succeeded.",
  "payload": "<raw APIM body>"
}
```

## Source code used
- Plugin: `VOA.SVT.Plugins/Plugins/CustomAPI/SvtManualTaskCreation.cs`
- Related contract doc: `docs/svtManualTaskCreation.md`
