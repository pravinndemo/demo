# voa_SvtSubmitQcRemarks Custom API (Submit QC Remarks)

## Purpose
`voa_SvtSubmitQcRemarks` is an **unbound** Dataverse Custom API that submits QC review remarks to APIM using a **POST** to `/{taskId}/qc-remarks`.

---

## Custom API contract
Recommended setup (adjust names to your prefix):

- Unique name: `voa_SvtSubmitQcRemarks`
- Is Function: **No** (Action)
- Request parameters:
  - `taskId` (String, required)
  - `qcOutcome` (String, required)
  - `qcRemark` (String, optional)
  - `qcReviewedBy` (String, optional; defaults to initiating user ID)
- Response parameters:
  - `Result` (String)

---

## APIM request
The plugin builds the final APIM URL from the Address in `SVTTaskAssignment` and the `taskId`.

### URL resolution rules (in order)
1) If Address contains `{taskId}`, replace it with `taskId`.
2) Else if Address contains `{id}`, replace it with `taskId`.
3) Else append `/{taskId}/qc-remarks`.

### Request body (JSON)
```json
{
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
2. Validates `taskId` and `qcOutcome`.
3. Reads config from `voa_CredentialProvider` using `SVTTaskAssignment`.
4. POSTs to APIM at `/{taskId}/qc-remarks`.
5. Returns `Result` as a string on success; throws on failure.

---

## Power Fx (Canvas app) example
```powerfx
Set(
    varQcSubmitRaw,
    IfError(
        voa_SvtSubmitQcRemarks(
            {
                taskId: "1000765",
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
