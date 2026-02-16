# voa_SvtModifyTask Custom API (Modify SVT Task)

## Purpose
`voa_SvtModifyTask` is an **unbound** Dataverse Custom API used to update SVT task status by calling APIM. The plugin enforces **caseworker-only** access (SVT User persona, or Manager/QA with SVT User membership), posts the request to APIM, and returns a single `Result` string on success.

---

## Custom API contract
Recommended setup (adjust names to your prefix):

- Unique name: `voa_SvtModifyTask`
- Is Function: **No** (Action)
- Request parameters:
  - `taskStatus` (String, required)
  - `taskList` (String, required; JSON array string or comma-separated list)
  - `source` (String, optional, defaults to `"VSRT"`)
  - `requestedBy` (String, optional; Dataverse user GUID)
- Response parameters:
  - `Result` (String)

---

## Response format
`Result` is a **string**. On success, it returns the raw APIM response body (typically `succeed` or `success`). On error, the plugin throws an exception and Dataverse returns **HTTP 500**.

---

## Backend plugin behavior
Implemented in `VOA.SVT.Plugins/Plugins/CustomAPI/SvtModifyTask.cs` (class `SvtModifyTask`):
1. Validates **caseworker-only** access via `UserContextResolver` (SVT User persona, or Manager/QA with SVT User membership).
2. Validates `taskStatus` and `taskList`.
3. Reads config from `voa_CredentialProvider` using `SVTModifyTask`.
4. POSTs to APIM with JSON body:
   ```
   { "source": "VSRT", "taskStatus": "<status>", "taskList": ["123","456"], "requestedBy": "<user-guid>" }
   ```
5. Returns `Result` as a string on success; throws on failure.

---

## Power Fx (Canvas app) example
```powerfx
Set(
    varTaskList,
    JSON(["1000765","1000766"], JSONFormat.Compact)
);

Set(
    varModifyRaw,
    IfError(
        voa_SvtModifyTask(
            {
                source: "VSRT",
                taskStatus: "New",
                taskList: varTaskList,
                requestedBy: LookUp(Users, 'Primary Email' = User().Email, systemuserid)
            }
        ),
        { Result: "" }
    )
);

If(
    IsBlank(varModifyRaw.Result),
    Notify("Modify failed (500).", NotificationType.Error),
    Notify("Modify succeeded: " & Text(varModifyRaw.Result), NotificationType.Success)
);
```

---

## Related docs
- `docs/svtTaskAssignment.md` (assignment endpoint).
- `docs/svtManualTaskCreation.md` (manual task creation endpoint).
