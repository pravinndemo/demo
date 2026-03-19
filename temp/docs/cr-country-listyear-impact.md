# CR Impact Analysis: Add `country` and `listYear` for All APIM Calls (5-Screen Flow)

Date: 2026-03-19

## 1) Requirement (as understood)
- User selects `country` and `listYear` on a Canvas page **before** entering the 5 SVT screens.
- For **all APIs that reach APIM** in those 5 screens, PCF must send `country` and `listYear` as additional parameters.
- `country` and `listYear` should be treated as **global context**, not grid/table columns.
- `country` values are business values like `England` or `Welsh`; `listYear` is a year value (for example `2026`).

## 2) Key answer first
- **Table/column schema changes:** `0` mandatory.
- **Prefilter mapping changes (`PrefilterConfigs.ts`):** `0` mandatory.
- **Header filter token format changes (`SearchQuery` / `columnFilter`):** `0` mandatory.
- **Mandatory work is request context propagation across all APIM-bound flows (Canvas -> PCF -> Custom API -> Plugin -> APIM).**

## 3) Current call-path checkpoints (where this CR applies)
- PCF data load path:
  - `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
  - `DetailsListVOA/services/GridDataController.ts`
  - `DetailsListVOA/utils/GridDataParams.ts`
- PCF non-grid APIM paths:
  - `DetailsListVOA/index.ts` (view sale details API call)
  - `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx` (task assignment and submit QC remarks API calls)
- Table + prefilter parameter merge:
  - `DetailsListVOA/config/TableConfigs.ts`
  - `DetailsListVOA/config/PrefilterConfigs.ts`
- Plugin query forwarding (whitelisted fields):
  - `VOA.SVT.Plugins/Helpers/CustomApiQueryHelper.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`
- Plugin non-grid APIM payload/path builders:
  - `VOA.SVT.Plugins/Plugins/CustomAPI/GetViewSaleRecordById.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs`

Important:
- Grid + metadata calls: plugin currently builds APIM query from explicit model fields. If `country`/`listYear` are not added there, frontend changes alone will not reach APIM.
- Assignment/QC/view-sale calls: plugin payload/path builders also need explicit updates, otherwise the values will not be forwarded.

## 4) Impact by area

### A) Table changes
Mandatory changes: **None**
- No change needed in:
  - `DetailsListVOA/config/TableConfigs.ts`
  - `DetailsListVOA/config/ColumnProfiles.ts`
  - `DetailsListVOA/Grid.tsx` column definitions
- Reason: `country`/`listYear` are request-scope filters, not displayed grid columns.

### B) Prefilter calls
Mandatory behavior:
- When prefilter is applied in Manager / Caseworker / QC Assign / QC View, existing prefilter params continue as-is.
- Add `country` + `listYear` to the same API request.

Mandatory code touchpoints:
- `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
- `DetailsListVOA/services/GridDataController.ts`
- `DetailsListVOA/utils/GridDataParams.ts`

No mandatory changes:
- `DetailsListVOA/config/PrefilterConfigs.ts` (existing `searchBy/preFilter/taskStatus/fromDate/toDate` mapping remains valid)

### C) Filter calls (search + header filters + sort)
Mandatory behavior:
- Sales search filters, column header filters (`SearchQuery`), and sort calls must all include `country` + `listYear`.
- Because all these use the same load path, central injection in `buildGridApiParams` is sufficient.

No mandatory changes:
- `DetailsListVOA/utils/ColumnFilterQuery.ts`
- Header filter operator/token logic

### D) Metadata/pre-filter option call
Recommended as mandatory for consistent UX:
- Billing authority metadata call should include `country` + `listYear` so options match selected context.
- Touchpoint: `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx` metadata API execution.

### E) Non-grid APIM calls (now in scope)
Mandatory behavior:
- Include `country` + `listYear` in these APIM-bound flows used by the 5 screens:
  - View sale details (`voa_GetViewSaleRecordById`)
  - Task assignment (`voa_SvtTaskAssignment`)
  - Submit QC remarks (`voa_SvtSubmitQcRemarks`)

Mandatory touchpoints:
- PCF:
  - `DetailsListVOA/index.ts`
  - `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
- Plugins:
  - `VOA.SVT.Plugins/Plugins/CustomAPI/GetViewSaleRecordById.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs`

## 5) Minimum mandatory file changes

### In this repo (hand-edited)
1. `DetailsListVOA/ControlManifest.Input.xml`
- Add input properties: `country`, `listYear`.

2. `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
- Read `country`/`listYear` from PCF inputs.
- Pass to `loadGridData(...)` args.
- Include in metadata API params.
- Include in request-change key so data reloads when context changes.
- Include in task assignment and submit-QC API payloads.

3. `DetailsListVOA/services/GridDataController.ts`
- Extend args to accept `country`/`listYear`.
- Pass through to `buildGridApiParams(...)`.

4. `DetailsListVOA/utils/GridDataParams.ts`
- Extend args interface.
- Add non-empty `country`/`listYear` into final API param map.

5. `DetailsListVOA/index.ts`
- Include `country` and `listYear` when calling `viewSaleRecordApiName`.

6. `VOA.SVT.Plugins/Helpers/CustomApiQueryHelper.cs`
- Map incoming custom API params (`country`, `listYear`) to request model.

7. `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`
- Add request properties.
- Add query parameter emission to APIM query map.

8. `VOA.SVT.Plugins/Plugins/CustomAPI/GetViewSaleRecordById.cs`
- Accept `country`/`listYear` inputs and forward to APIM (likely as query string on sale details URL).

9. `VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs`
- Accept `country`/`listYear` inputs and include them in APIM JSON payload.

10. `VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs`
- Accept `country`/`listYear` inputs and include them in APIM JSON payload.

11. `DetailsListVOA/tests/grid-data-params.test.ts`
- Add/adjust assertions to prove `country` and `listYear` are included/omitted correctly.

### Generated artifacts (auto-update expected)
12. `DetailsListVOA/generated/ManifestTypes.d.ts`
13. `DetailsListVOA/generated/ManifestTypes.ts` (if regenerated in your pipeline)

## 6) External changes (outside this repo)
1. Canvas app: add selection UI page for `country` + `listYear`.
2. Canvas app: bind those two values into PCF inputs on each of the 5 screens.
3. Dataverse custom API definition: add request params on `voa_GetAllSalesRecord` (`country`, `listYear`).
4. Dataverse custom API definition: add request params on `voa_SvtGetSalesMetadata` (`country`, `listYear`).
5. Dataverse custom API definition: add request params on `voa_GetViewSaleRecordById` (`country`, `listYear`).
6. Dataverse custom API definition: add request params on `voa_SvtTaskAssignment` (`country`, `listYear`).
7. Dataverse custom API definition: add request params on `voa_SvtSubmitQcRemarks` (`country`, `listYear`).
8. APIM sales endpoint: accept and apply `country` + `listYear`.
9. APIM metadata endpoint: accept and apply `country` + `listYear`.
10. APIM view sale endpoint: accept and apply `country` + `listYear`.
11. APIM task assignment endpoint: accept and apply `country` + `listYear`.
12. APIM submit-QC endpoint: accept and apply `country` + `listYear`.

## 7) Change count summary
- **Mandatory hand-edited files in this repo:** `11`
- **Generated files likely updated:** `2`
- **External platform/config changes:** `12`
- **Table config/column changes:** `0`
- **Prefilter mapper changes:** `0`
- **Header filter token format changes:** `0`

## 8) Optional hardening (recommended, not mandatory)
- Add context-aware storage keys (`country` + `listYear`) for persisted filters/prefilters to avoid carrying old selections across contexts.
- Add integration tests for prefilter screen load plus context switch.
- Update docs:
  - `docs/prefilter-api-urls.md`
  - `docs/plugin-calling-guide.md`
  - `docs/svt-screen-configuration.md`

## 9) Open decisions to confirm before implementation
1. Final country value contract: `England/Welsh` exact text, or normalized internal codes.
2. `listYear` format contract: string vs number, and accepted range (for example `2020-2035`).
3. For view-sale endpoint, confirm whether APIM expects these as query params or inside path/body.
