# voa_SvtSubmitSalesVerification Custom API (Submit Sales Verification)

## Purpose
`voa_SvtSubmitSalesVerification` is an **unbound** Dataverse Custom API that submits sales verification details to APIM using a **PUT** to `/sales/{id}`. The plugin can accept either a full JSON payload (`saleSubmitPayload` or `payload`) or individual fields that it assembles into the required request body.

---

## Custom API contract
Recommended setup (adjust names to your prefix):

- Unique name: `voa_SvtSubmitSalesVerification`
- Is Function: **No** (Action)
- Request parameters:
  - `saleId` (String, required)
  - `saleSubmitPayload` (String, optional JSON; when provided, the plugin forwards it as-is)
  - `payload` (String, optional JSON; legacy alias for `saleSubmitPayload`)
  - `saleSubmitRemarks` (String, optional; overrides `salesVerificationDetails.remarks`)
  - `taskId` (String, optional)
  - `taskStatus` (String, optional)
  - `salesSource` (String, optional)
  - `wltId` (String, optional)
  - `lrpddId` (String, optional)
  - `salesParticular` (String, optional)
  - `linkParticulars` (String, optional)
  - `kitchenAge` (String, optional)
  - `kitchenSpecification` (String, optional)
  - `bathroomAge` (String, optional)
  - `bathroomSpecification` (String, optional)
  - `glazing` (String, optional)
  - `heating` (String, optional)
  - `decorativeFinishes` (String, optional)
  - `conditionScore` (String, optional)
  - `conditionCategory` (String, optional)
  - `particularNotes` (String, optional)
  - `isSaleUseful` (String, optional)
  - `whyNotUseful` (String, optional)
  - `additionalNotes` (String, optional)
  - `remarks` (String, optional)
- Response parameters:
  - `Result` (String)

---

## Request body
If `saleSubmitPayload` (or `payload`) is provided, it is used directly. If `saleSubmitRemarks` is also provided, the plugin attempts to set `salesVerificationDetails.remarks` to that value. Otherwise the plugin builds:

```
{
  "salesVerificationTaskDetails": {
    "taskId": "...",
    "taskStatus": "...",
    "salesSource": "...",
    "wltId": "...",
    "lrpddId": "..."
  },
  "salesParticularDetails": {
    "salesParticular": "...",
    "linkParticulars": "...",
    "kitchenAge": "...",
    "kitchenSpecification": "...",
    "bathroomAge": "...",
    "bathroomSpecification": "...",
    "glazing": "...",
    "heating": "...",
    "decorativeFinishes": "...",
    "conditionScore": "...",
    "conditionCategory": "...",
    "particularNotes": "..."
  },
  "salesVerificationDetails": {
    "isSaleUseful": "...",
    "whyNotUseful": null,
    "additionalNotes": "...",
    "remarks": "..."
  }
}
```

---

## Response format
`Result` is a **string**. On success, it returns the raw APIM response body (typically `succeed` or `success`). On error, the plugin throws an exception and Dataverse returns **HTTP 500**.

---

## Backend plugin behavior
Implemented in `VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitSalesVerification.cs` (class `SvtSubmitSalesVerification`):
1. Validates **caseworker-only** access via `UserContextResolver` (SVT User persona, or Manager/QA with SVT User membership).
2. Validates `saleId`.
3. Reads config from `voa_CredentialProvider` using `SVTSubmitSalesVerification`.
4. Builds the APIM URL and executes **PUT**.
5. Returns `Result` as a string on success; throws on failure.

---

## Power Fx (Canvas app) example
### Full payload
```powerfx
Set(
    varPayload,
    JSON(
        {
            salesVerificationTaskDetails: {
                taskId: "A-1000765",
                taskStatus: "New",
                salesSource: "LRPPD",
                wltId: "1000765",
                lrpddId: "111765"
            },
            salesParticularDetails: {
                salesParticular: "DetailsAvailable",
                linkParticulars: "property-details",
                kitchenAge: "5 years",
                kitchenSpecification: "Modern",
                bathroomAge: "3 years",
                bathroomSpecification: "walk-in shower",
                glazing: "Double",
                heating: "Central Heating",
                decorativeFinishes: "High-end finishes",
                conditionScore: "8",
                conditionCategory: "Good",
                particularNotes: "Recently renovated kitchen and bathroom."
            },
            salesVerificationDetails: {
                isSaleUseful: "Yes",
                whyNotUseful: Blank(),
                additionalNotes: "Comparable property for valuation purposes.",
                remarks: "Comparable property for valuation purposes."
            }
        },
        JSONFormat.Compact
    )
);

Set(
    varSubmitRaw,
    IfError(
        voa_SvtSubmitSalesVerification(
            {
                saleId: "S-1000001",
                payload: varPayload
            }
        ),
        { Result: "" }
    )
);

If(
    IsBlank(varSubmitRaw.Result),
    Notify("Submit failed (500).", NotificationType.Error),
    Notify("Submit succeeded: " & Text(varSubmitRaw.Result), NotificationType.Success)
);
```

---

## Related docs
- `docs/svtGetViewSaleRecordById.md` (sale details retrieval).
- `docs/svtManualTaskCreation.md` (manual task creation endpoint).
- `docs/svtTaskAssignment.md` (assignment endpoint).
