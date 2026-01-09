# svtGetSaleRecords Custom API (SVT List)

## Purpose
`svtGetSaleRecords` is an **unbound** Dataverse Custom API used by the SVT List PCF control to load grid rows. The control assembles the current search filters, column header filters, sorting, and paging into a request, executes the API through `Xrm.WebApi.execute`, then normalizes the response into the grid’s `TaskSearchResponse` format for rendering and filter synchronization.【F:DetailsListVOA/services/CustomApi.ts†L11-L73】【F:DetailsListVOA/services/GridDataController.ts†L62-L123】【F:DetailsListVOA/services/DataService.ts†L73-L188】

The API name is configured in the control config and defaults to `svtGetSaleRecords` for this repo build.【F:DetailsListVOA/config/ControlConfig.ts†L1-L4】

---

## Method used to call the API (detailed flow)
The control calls the API using **`Xrm.WebApi.execute` with an unbound request**. That request is built by `buildUnboundCustomApiRequest` and passed through `executeUnboundCustomApi`.

### Detailed method flow
1. **Collect UI state**
   - The grid host collects search filters, column filters, sorting, and paging from the UI.
   - Prefilters from PCF input parameters (if configured) are merged into the same parameter set.

2. **Build request parameters**
   - `loadGridData` generates the base parameter map using `buildApiParamsFor` (table config).【F:DetailsListVOA/services/GridDataController.ts†L62-L123】【F:DetailsListVOA/config/TableConfigs.ts†L78-L212】
   - Each parameter is stringified, because unbound custom API parameters are sent as strings in the metadata built by `buildUnboundCustomApiRequest`.【F:DetailsListVOA/services/CustomApi.ts†L23-L51】

3. **Create the unbound API request**
   - `executeUnboundCustomApi` calls `buildUnboundCustomApiRequest` to create the request object:
     - `getMetadata()` specifies **`boundParameter: null`** (unbound), **`parameterTypes`**, and **`operationName`** (the custom API name).
     - The request object includes the parameter map built in step 2.

4. **Execute via `Xrm.WebApi.execute`**
   - The request object is passed to `Xrm.WebApi.execute` and the response is read as JSON.
   - The response is then normalized in `DataService` to the internal `TaskSearchResponse` shape.

Key method chain:
- `GridDataController.loadGridData` → `GridDataController.execCustomApi`
- `CustomApi.executeUnboundCustomApi` → `CustomApi.buildUnboundCustomApiRequest` → `Xrm.WebApi.execute`

【F:DetailsListVOA/services/GridDataController.ts†L62-L123】【F:DetailsListVOA/services/CustomApi.ts†L23-L73】

---

## How parameters are passed
All parameters are sent as **string values** in the unbound custom API request. The control builds the parameter object using table config mappings and current UI filter state.

### Pagination and sorting
| Parameter | How it’s set | Notes |
| --- | --- | --- |
| `pageNumber` | `page + 1` | 1-based page index. 【F:DetailsListVOA/config/TableConfigs.ts†L83-L88】 |
| `pageSize` | grid page size | Stringified number. 【F:DetailsListVOA/config/TableConfigs.ts†L83-L88】 |
| `sortField` | current sort column | Optional. 【F:DetailsListVOA/services/GridDataController.ts†L69-L102】 |
| `sortDirection` | `asc` / `desc` | Optional. 【F:DetailsListVOA/services/GridDataController.ts†L69-L102】 |

### Top-of-grid filters
The main search filters are sanitized and mapped into API parameters before being passed to the API (trimmed, validated, or normalized).【F:DetailsListVOA/Filters.ts†L70-L231】

Examples of mappings:
- `saleId`, `taskId`, `uprn`, `address`, `postcode`, `billingAuthority`, etc.
- Range filters like `salesPrice`, `ratio`, `outlierRatio` emit a value plus operator (`GE`/`LE`) where applicable.

The actual parameter names are defined in `buildSalesParams` and returned by `buildApiParamsFor`.【F:DetailsListVOA/config/TableConfigs.ts†L78-L212】

### Prefilter parameters from PCF inputs
If the component is configured with prefilters (input parameters on the PCF control), those values are normalized and passed through:
- `billingAuthorities` → `billingAuthority`
- `caseworkers` → `assignedTo`
- `workThat` → `taskStatus`
- `fromDate` → `assignedFromDate`
- `toDate` → `assignedToDate`

Raw strings or JSON arrays are normalized to comma-separated values before being sent to the API.【F:DetailsListVOA/services/GridDataController.ts†L19-L57】

### Column header filters
When column filters are applied in the grid header, they are sent as:
- `columnFilters` → JSON string of `{ [columnName]: value | value[] | object }`

This lets the API apply precise column-level constraints beyond top-of-grid filters.【F:DetailsListVOA/services/GridDataController.ts†L69-L102】

---

## How the response is mapped
The control accepts two response shapes and normalizes them into `TaskSearchResponse`.

### Accepted response shapes
**Option A: TaskSearchResponse (already normalized)**
```
{
  items: TaskSearchItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  filters?: Record<string, string | string[]>;
}
```

**Option B: SalesApiResponse (normalized by the client)**
```
{
  pageInfo?: {
    pageNumber?: number;
    pageSize?: number;
    totalRecords?: number;
  };
  sales?: SalesApiItem[];
  filters?: Record<string, string | string[]>;
}
```

If `sales` or `pageInfo` exist, the control maps them into `TaskSearchResponse` before returning to the grid.【F:DetailsListVOA/services/DataService.ts†L146-L164】

### When the API returns a JSON string payload
The Dataverse Custom API plugin returns the APIM response in the `Result` output parameter (as a JSON string). The PCF control detects `Result`/`result`, parses the JSON, and then applies the mapping rules above.【F:DetailsListVOA/services/DataService.ts†L168-L186】【F:VOA.SVT.Plugins/Plugins/CustomAPI/GetAllSalesRecord.cs†L116-L118】

### Item field mapping
When the API returns `sales`, each item is mapped into the internal `TaskSearchItem`. The mapping is one-to-one (e.g., `saleId` → `saleId`, `taskStatus` → `taskStatus`, etc.).【F:DetailsListVOA/services/DataService.ts†L94-L144】

### Page info mapping
`pageInfo.totalRecords`, `pageInfo.pageNumber`, and `pageInfo.pageSize` are mapped to `totalCount`, `page`, and `pageSize` for the grid.【F:DetailsListVOA/services/DataService.ts†L146-L162】

---

## How response filters map to column header filters
The API can return a `filters` object that directly seeds or syncs the grid’s column header filters. The grid host:
1. Lowercases each filter key.
2. Accepts arrays, strings (including JSON-encoded arrays/objects), or object values.
3. Converts those values into the grid’s column filter state used by header filter controls.

This normalization happens in `normalizeApiFilters` inside the grid host component.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L52-L112】

### Practical guidance for API responses
- Prefer **lowercased** field names (e.g., `saleid`, `saleprice`, `taskstatus`) to match column keys.
- For multi-select columns, return arrays or JSON strings of arrays.
- For numeric/date range filters, return a JSON object (example: `{ "mode": ">=", "min": 100000 }`) so the UI can parse it into header filter state.

These response filters are applied to the grid and stay synchronized as users refine column header filters.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L52-L169】

---

## Using `svtGetSaleRecords` in a Canvas app
Canvas apps can call the Custom API directly and parse the `Result` string returned by the plugin.

### Example Power Fx flow
1. **Call the API** (adjust parameters to suit your filters):
   ```
   Set(
     salesResponse,
     svtGetSaleRecords({
       pageNumber: "1",
       pageSize: "25",
       sortField: "saleId",
       sortDirection: "asc"
     })
   )
   ```
2. **Parse the JSON string** from `Result`:
   ```
   Set(parsedSales, ParseJSON(salesResponse.Result))
   ```
3. **Bind to a gallery or data table**:
   ```
   ClearCollect(
     SalesItems,
     ForAll(parsedSales.sales, {
       SaleId: Text(ThisRecord.saleId),
       Address: Text(ThisRecord.address),
       Postcode: Text(ThisRecord.postcode),
       SalesPrice: Value(ThisRecord.salesPrice)
     })
   )
   ```

### Notes
- `Result` is a string because the plugin forwards the raw APIM response back to Dataverse. If you update the plugin to return structured output parameters later, you can skip `ParseJSON`.【F:VOA.SVT.Plugins/Plugins/CustomAPI/GetAllSalesRecord.cs†L116-L118】
- The response schema matches the `SalesApiResponse` format (with `sales` and `pageInfo`) described above, so you can read `parsedSales.pageInfo.totalRecords` for pagination if needed.【F:DetailsListVOA/services/DataService.ts†L146-L164】
