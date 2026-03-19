# CR Impact Analysis: Add `country` and `listYear` Before 5 SVT Screens

Date: 2026-03-19

## 1) Requirement (as understood)
- User selects `country` and `listYear` on a Canvas page **before** entering the 5 SVT screens.
- For all relevant API calls in those 5 screens (including prefilter/search/filter flows), PCF must send `country` and `listYear` as additional parameters.
- `country` and `listYear` should be treated as **global context**, not grid/table columns.

## 2) Key answer first
- **Table/column schema changes:** `0` mandatory.
- **Prefilter mapping changes (`PrefilterConfigs.ts`):** `0` mandatory.
- **Header filter token format changes (`SearchQuery` / `columnFilter`):** `0` mandatory.
- **Mandatory work is in request context propagation (Canvas -> PCF -> Custom API -> Plugin -> APIM).**

## 3) Current call-path checkpoints (where this CR applies)
- PCF data load path:
  - `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
  - `DetailsListVOA/services/GridDataController.ts`
  - `DetailsListVOA/utils/GridDataParams.ts`
- Table + prefilter parameter merge:
  - `DetailsListVOA/config/TableConfigs.ts`
  - `DetailsListVOA/config/PrefilterConfigs.ts`
- Plugin query forwarding (whitelisted fields):
  - `VOA.SVT.Plugins/Helpers/CustomApiQueryHelper.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`

Important: plugin currently builds APIM query from explicit model fields. If `country`/`listYear` are not added there, frontend changes alone will not reach APIM.

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

## 5) Minimum mandatory file changes

### In this repo (hand-edited)
1. `DetailsListVOA/ControlManifest.Input.xml`
- Add input properties: `country`, `listYear`.

2. `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
- Read `country`/`listYear` from PCF inputs.
- Pass to `loadGridData(...)` args.
- Include in metadata API params.
- Include in request-change key so data reloads when context changes.

3. `DetailsListVOA/services/GridDataController.ts`
- Extend args to accept `country`/`listYear`.
- Pass through to `buildGridApiParams(...)`.

4. `DetailsListVOA/utils/GridDataParams.ts`
- Extend args interface.
- Add non-empty `country`/`listYear` into final API param map.

5. `VOA.SVT.Plugins/Helpers/CustomApiQueryHelper.cs`
- Map incoming custom API params (`country`, `listYear`) to request model.

6. `VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/SalesRecordModels.cs`
- Add request properties.
- Add query parameter emission to APIM query map.

7. `DetailsListVOA/tests/grid-data-params.test.ts`
- Add/adjust assertions to prove `country` and `listYear` are included/omitted correctly.

### Generated artifacts (auto-update expected)
8. `DetailsListVOA/generated/ManifestTypes.d.ts`
9. `DetailsListVOA/generated/ManifestTypes.ts` (if regenerated in your pipeline)

## 6) External changes (outside this repo)
1. Canvas app: add selection UI page for `country` + `listYear`.
2. Canvas app: bind those two values into PCF inputs on each of the 5 screens.
3. Dataverse custom API definition: add request parameter `country` on `voa_GetAllSalesRecord`.
4. Dataverse custom API definition: add request parameter `listYear` on `voa_GetAllSalesRecord`.
5. Dataverse custom API definition: add request parameter `country` on `voa_SvtGetSalesMetadata` (if metadata must be scoped).
6. Dataverse custom API definition: add request parameter `listYear` on `voa_SvtGetSalesMetadata` (if metadata must be scoped).
7. APIM sales endpoint: accept and apply `country` + `listYear`.
8. APIM metadata endpoint: accept and apply `country` + `listYear` (if scoped metadata required).

## 7) Change count summary
- **Mandatory hand-edited files in this repo:** `7`
- **Generated files likely updated:** `2`
- **External platform/config changes:** `8`
- **Table config/column changes:** `0`
- **Prefilter mapper changes:** `0`
- **Header filter token format changes:** `0`

## 8) Optional hardening (recommended, not mandatory)
- Add context-aware storage keys (`country` + `listYear`) for persisted filters/prefilters to avoid carrying old selections across contexts.
- Add an integration test for prefilter screen load with context switch.
- Update docs:
  - `docs/prefilter-api-urls.md`
  - `docs/plugin-calling-guide.md`
  - `docs/svt-screen-configuration.md`

## 9) Open decisions to confirm before implementation
1. Final param names/casing expected by backend: `listYear` vs `listyear`.
2. Allowed values/validation:
- `country`: code (`GB`, `EN`, etc.) or full label.
- `listYear`: `YYYY` only or broader format.
3. Should metadata (billing authority list) be strictly filtered by `country` + `listYear`.
