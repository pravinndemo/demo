# voa_GetViewSaleRecordById Custom API (Sale Details)

## Purpose
`voa_GetViewSaleRecordById` is an **unbound** Dataverse Custom API used by the SVT List PCF control to fetch **sale details** when a user selects a row. The control calls the API via `Xrm.WebApi.execute`, parses the `Result` payload, and emits `saleDetails` as a JSON string output for Canvas apps to consume.【F:DetailsListVOA/index.ts†L43-L128】【F:DetailsListVOA/services/CustomApi.ts†L23-L73】【F:DetailsListVOA/ControlManifest.Input.xml†L50-L120】

The API name is configured in the control config and defaults to `voa_GetViewSaleRecordById` for this repo build (overridable via PCF input parameters).【F:DetailsListVOA/config/ControlConfig.ts†L1-L8】【F:DetailsListVOA/index.ts†L130-L144】

---

## Client-side flow (PCF)
1. **User selects a row** in the grid.
2. `DetailsListVOA.onTaskClick` resolves the API name and executes the unbound Custom API with the `saleId` parameter.
3. The response is unwrapped from `Result` (if present) and serialized into the `saleDetails` output.
4. If `saleId` is missing or an error occurs, the PCF emits an **empty sale record** object to keep bindings stable.

Relevant implementation:
- `DetailsListVOA.onTaskClick` (row click → API call).【F:DetailsListVOA/index.ts†L88-L128】
- `resolveViewSaleRecordApiName` (config + input parameter).【F:DetailsListVOA/index.ts†L130-L144】
- `unwrapCustomApiPayload` and `getEmptySaleRecord` (response handling).【F:DetailsListVOA/index.ts†L155-L190】

---

## Request parameters
The Custom API is called with a **single required parameter**:

| Parameter | Type | Notes |
| --- | --- | --- |
| `saleId` | string | User-friendly Sale ID (e.g., `S-1000001`). Required in the plugin. 【F:DetailsListVOA/index.ts†L103-L114】【F:VOA.SVT.Plugins/Plugins/CustomAPI/GetViewSaleRecordById.cs†L24-L37】 |

---

## Backend plugin flow (Dataverse → APIM)
The plugin `GetViewSaleRecordById`:
1. Reads the API configuration from `voa_CredentialProvider` (`SVTGetViewSaleRecordById`).
2. Builds the APIM URL by inserting `saleId` into the configured address.
3. Executes an HTTP GET and returns the raw JSON in `Result`.
4. On failure, returns a **sample payload** in `Result` to keep the client stable.

Relevant files:
- `VOA.SVT.Plugins/Plugins/CustomAPI/GetViewSaleRecordById.cs` (core flow + URL builder + fallback payload).【F:VOA.SVT.Plugins/Plugins/CustomAPI/GetViewSaleRecordById.cs†L12-L180】

---

## Output (`saleDetails`)
The PCF outputs **`saleDetails`** as a JSON string. This is declared as an output property in the PCF manifest and surfaced to Canvas apps or other hosts.【F:DetailsListVOA/ControlManifest.Input.xml†L118-L120】

The output is:
- The parsed `Result` JSON (when the API succeeds).
- A fallback empty sale record object (when `saleId` is missing or an error occurs).【F:DetailsListVOA/index.ts†L96-L125】【F:DetailsListVOA/index.ts†L176-L190】

---

## Canvas app usage (example)
When you bind to `saleDetails`, parse it once:
```
Set(parsedSale, ParseJSON(DetailsListVOA.saleDetails));
```
Then read values with `Text()`, `Value()`, or `Boolean()` in Power Fx. This pattern is documented in the main sales record API doc for reuse.【F:docs/svtGetSaleRecords.md†L166-L200】

---

## Related docs
- `docs/svtGetSaleRecords.md` (search + grid data retrieval).
- `docs/svtTaskAssignment.md` (assignment custom API).
- `docs/svtManualTaskCreation.md` (manual task creation endpoint).
