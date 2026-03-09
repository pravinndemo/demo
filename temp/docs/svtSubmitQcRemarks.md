# voa_SvtSubmitQcRemarks Custom API (Submit QC Remarks)

## Purpose
`voa_SvtSubmitQcRemarks` is an **unbound** Dataverse Custom API that submits QC review remarks to APIM using a **POST** with task IDs in the JSON body.

---

## Custom API contract
Recommended setup (adjust names to your prefix):

- Unique name: `voa_SvtSubmitQcRemarks`
- Is Function: **No** (Action)
- Request parameters:
  - `taskId` (String, optional; accepts a single ID, comma-separated IDs, or a JSON array string)
  - `taskList` (String, optional; same formats as `taskId`; if both are provided, `taskList` is used)
  - `qcOutcome` (String, required)
  - `qcRemark` (String, optional)
  - `qcReviewedBy` (String, optional; defaults to initiating user ID)
  - At least one of `taskId` or `taskList` is required.
- Response parameters:
  - `Result` (String)

---

## APIM request
The plugin posts directly to the configured `Address` in `SVTTaskAssignment` and includes task IDs in the request body as `taskList`.

### Request body (JSON)
```json
{
  "taskList": ["1000765", "1000766"],
  "qcOutcome": "Passed",
  "qcRemark": "All checks complete.",
  "qcReviewedBy": "11111111-1111-1111-1111-111111111111"
}
```

---

## Response format
`Result` is a **string**. On success, it returns the raw APIM response body (or `"success"` if the body is empty). On error, the plugin throws an exception and Dataverse returns **HTTP 500**.

---

## Backend plugin behavior
Implemented in `VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs` (class `SvtSubmitQcRemarks`):
1. Validates **QA/Manager-only** access via `UserContextResolver`.
2. Parses task IDs from `taskList` or `taskId` (single/comma-separated/JSON array).
3. Validates task IDs and `qcOutcome`.
4. Reads config from `voa_CredentialProvider` using `SVTTaskAssignment`.
5. POSTs to APIM with `taskList` in the JSON payload.
6. Returns `Result` as a string on success; throws on failure.

---

## Power Fx (Canvas app) example
```powerfx
Set(
    varQcSubmitRaw,
    IfError(
        voa_SvtSubmitQcRemarks(
            {
                taskId: "[\"1000765\",\"1000766\"]",
                qcOutcome: "Passed",
                qcRemark: "All checks complete.",
                qcReviewedBy: LookUp(Users, 'Primary Email' = User().Email, systemuserid)
            }
        ),
        { Result: "" }
    )
);

If(
    IsBlank(varQcSubmitRaw.Result),
    Notify("QC submit failed (500).", NotificationType.Error),
    Notify("QC submit succeeded: " & Text(varQcSubmitRaw.Result), NotificationType.Success)
);
```

---

## Related docs
- `docs/svtTaskAssignment.md` (task assignment endpoint).
- `docs/svtModifySvtTask.md` (task status update endpoint).
