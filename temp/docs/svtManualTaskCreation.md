# voa_SvtManualTaskCreation Custom API (Manual Task Creation)

## Purpose
`voa_SvtManualTaskCreation` is an **unbound** Dataverse Custom API used to create a task for a given Sale ID by calling APIM. The plugin enforces **manager-only** access, posts the request to APIM, and returns a single `Result` string for both success and error cases.

---

## Custom API contract
Recommended setup (adjust names to your prefix):

- Unique name: `voa_SvtManualTaskCreation`
- Is Function: **No** (Action)
- Request parameters:
  - `saleId` (String, required)
  - `sourceType` (String, optional, defaults to `"M"`)
  - `createdBy` (String, optional; Dataverse user GUID)
- Response parameters:
  - `Result` (String)

---

## Response format
`Result` is a JSON string shaped as:

```
{
  "success": true | false,
  "message": "human readable message",
  "payload": "raw APIM body as string (may be empty)"
}
```

Notes:
- On success with an empty APIM response body, `message` is set to
  `"Manual task creation succeeded. No response body returned."`.
- On validation/authorization/config failures, `success` is false and `message`
  explains the issue. The plugin always returns a `Result` string.

---

## Backend plugin behavior
Implemented in `VOA.SVT.Plugins/Plugins/CustomAPI/SvtManualTaskCreation.cs`:
1. Validates **manager-only** access via `SvtUserContextResolver`.
2. Validates `saleId` input.
3. Reads config from `voa_CredentialProvider` using `SVTManualTaskCreation`.
4. POSTs to APIM at `/sales/{saleId}/task` with JSON body:
   ```
   { "sourceType": "M", "createdBy": "<user-guid>" }
   ```
5. Returns `Result` as JSON string (success or failure).

---

## Power Fx (Canvas app) example
### Basic call + parse
```powerfx
// Resolve current user's systemuserid (adjust to your Users schema)
Set(
    varCreatedBy,
    LookUp(Users, 'Primary Email' = User().Email, systemuserid)
);

// Call the Custom API (use .Run if it shows as an Action)
Set(
    varCreateRaw,
    IfError(
        voa_SvtManualTaskCreation(
            {
                saleId: txtSaleId.Text,
                sourceType: "M",
                createdBy: varCreatedBy
            }
        ),
        { Result: "" }
    )
);

// Handle success, empty response, and error
If(
    IsBlank(varCreateRaw.Result),
    Notify("No response from service.", NotificationType.Warning),
    With(
        { parsed: ParseJSON(varCreateRaw.Result) },
        If(
            Boolean(parsed.success),
            Notify(Text(parsed.message), NotificationType.Success),
            Notify(Text(parsed.message), NotificationType.Error)
        )
    )
);
```

### Action syntax (if required)
If your API appears as an Action, use:
```
voa_SvtManualTaskCreation.Run({ saleId: ..., sourceType: "M", createdBy: ... })
```

### Empty response handling
If you want to detect an empty APIM body, check:
```
IsBlank(Text(parsed.payload))
```
The plugin already sets a clear `message` when the APIM response body is empty, so you can display `parsed.message` directly.

---

## Related docs
- `docs/svtGetSaleRecords.md` (search + grid data retrieval).
- `docs/svtTaskAssignment.md` (task assignment endpoint).
