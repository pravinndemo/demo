# DetailsListVOA Control

This project contains a Power Apps Component Framework (PCF) control that renders a grid of records.

## Quick Start

- Build and run locally: `npm start`
- Add the control to a form/app and configure properties:
  - `revalSalesDataset`: Bind to your dataset.
  - `pageSize` (optional): Grid page size (default 10).
  - `columnDisplayNames` (optional): JSON mapping of dataset field → display label.
  - `columnConfig` (optional): JSON array configuring column behavior (width, sorting, cell type, etc.).

## Column Display Name Overrides

Dataset column display names are read-only in the property pane. To override them, use the **Column Display Names** property and provide a JSON object that maps dataset column names to display labels.

Example:

```json
{"JobID":"Job Ref","UARN":"Unique Ref","Address":"Full Address"}
```

The control parses this mapping and applies the custom names to the corresponding columns at runtime. Invalid JSON is ignored and the dataset's default display names are used instead.

## Column Configuration

Additional column behavior can be specified with the **Column Configuration** property. Provide a JSON array describing each column and its settings such as width, cell type, or sorting.

Example:

```json
[
  {
    "ColName": "JobID",
    "ColDisplayName": "Job Reference",
    "ColWidth": 120,
    "ColSortable": true,
    "ColCellType": "text",
    "ColIsBold": true
  }
]
```

Each entry is matched to the dataset column by `ColName`, and supported properties are applied when rendering the grid.

## Screen Profiles

Set `CONTROL_CONFIG.tableKey` to select a profile for each screen without changing code. Profiles specify:

- Which columns behave as lookups (show a dropdown of distinct values in the column menu).
- How to map the current search filters into API query parameters.

Out of the box profiles exist for: `sales`/`allsales`, `myassignment`, `manager`, `qa`.

Implementation details live in `DetailsListVOA/TableConfigs.ts`:

- `TABLE_CONFIGS`: central registry of profiles.
- `lookupFields`: set of normalized field names treated as lookup/choice.
- `buildApiParams`: translates current filter state to query params.

To add or customize a profile:

1) Add a new key in `TABLE_CONFIGS` and provide `lookupFields` + `buildApiParams`.
2) Update `CONTROL_CONFIG.tableKey` to that key.

## Data Loading

The control supports two data-calling modes:

1) Dataverse Custom API (recommended)
   - Set `CONTROL_CONFIG.customApiName` to the name of your unbound Custom API.
   - The control calls `context.webAPI.execute` and passes all built parameters as strings.
   - Your Custom API can call APIM or any backend service and return a payload shaped like `TaskSearchResponse`.

2) Direct HTTP endpoint
   - If `customApiName` is not set, the control builds a URL using `CONTROL_CONFIG.apimEndpoint` and appends the same parameters.

## Filtering and Sorting

- Column header menu supports:
  - Sort Ascending/Descending (with icons).
  - Filter by value:
    - Lookup/choice columns show a dropdown of distinct values.
    - Other columns show a text field.
- Filtering uses case-insensitive "contains" matching.
- Active column filters display a Filter icon in the column header.

## Search Panel

The top panel contains quick filters (e.g., UPRN, Task ID, Address, Postcode, Task Status, Source). You can add more by extending `GridFilterState` and rendering the appropriate input, often using `getDistinctOptions([...])` for lookup fields.

## Extending to Additional Screens

- Create or adjust a profile in `TableConfigs.ts` for each screen.
- Update `CONTROL_CONFIG.tableKey` to select the profile.
- If different screens need different API parameter names, implement a dedicated `buildApiParams` for each profile.

## Notes

- Column and filter matching is case-insensitive and uses "contains" semantics.
- If a dataset column is missing but appears in the Custom API payload, the control will add it at runtime with a generated display name.
- The control shows shimmer and overlay on sort or while loading.

## Deployment

There are two common ways to get this PCF control into a Dataverse environment: a quick developer push for rapid iteration, and packaging it in a solution for ALM/promotions.

### Prerequisites

- Node.js LTS and npm installed.
- Power Platform CLI (`pac`) installed and authenticated to your environment.
- Appropriate permissions in the target Dataverse environment.

If your production API domain is not `api.contoso.gov.uk`, update `DetailsListVOA/ControlManifest.Input.xml` `<external-service-usage>` `<domain>` to your real domain and rebuild, as external service usage makes the control premium.

### Quick Dev Push (for rapid testing)

1. Install dependencies and build:
   - `npm ci`
   - `npm run build`
2. Authenticate to your environment (one-time):
   - `pac auth create --url https://<your-org>.crm.dynamics.com`
3. Push the control to the environment:
   - `pac pcf push --publisher-prefix <prefix>`

This creates or updates an unmanaged, temporary solution in the environment for quick iteration. After pushing, add the control to a form/app in the maker UI.

### Package as a Solution (for ALM)

1. Create a solution workspace (once):
   - `mkdir solution && cd solution`
   - `pac solution init --publisher-name "dsync" --publisher-prefix svt`
2. Add the PCF project reference (point to the `.pcfproj` file):
   - `pac solution add-reference --path ..\\DetailsListVOA.pcfproj`
   - Note: In this repo, the `.pcfproj` is at the repo root, not inside `DetailsListVOA`. If your project structure differs, point `--path` to the folder or `.pcfproj` that contains your PCF project.
3. Build the control and create solution zips:
   - In repo root (clean then build):
     - `npm ci`
     - `npm run rebuild`  (or `npm run clean && npm run build`)
   - Build the Dataverse solution project via MSBuild:
     - From `solution/` run one of (use the exact file name):
       - `msbuild solution.cdsproj /t:Restore,Build /p:Configuration=Release`
       - or `dotnet msbuild solution.cdsproj /t:Restore,Build /p:Configuration=Release`
     - Outputs are written under `solution\bin\<Configuration>` and typically include both `*_unmanaged.zip` and `*_managed.zip`.
   - (Optional) Copy to a stable name/location:
     - Ensure folder: `mkdir .\bin`
     - Copy unmanaged: `copy solution\bin\**\*_unmanaged.zip .\bin\DetailsListVOA_unmanaged.zip`
     - Copy managed: `copy solution\bin\**\*_managed.zip .\bin\DetailsListVOA_managed.zip`
4. Import into your target environment:
   - `pac auth create --url https://<your-org>.crm.dynamics.com`
   - From repo root (after copy): `pac solution import --path .\bin\DetailsListVOA_unmanaged.zip`
   - Or import directly from `solution\bin\<Configuration>\*_unmanaged.zip`

After import, the control appears in maker under code components and can be added to forms/canvas apps.

#### Packing Notes

- If MSBuild is not available, pack using Power Platform CLI SolutionPackager from the solution `src` folder:
  - From `solution/`:
    - `mkdir ..\\bin` (no-op if it exists)
    - `Remove-Item ..\\bin\\DetailsListVOA_*.zip -ErrorAction SilentlyContinue`
    - Unmanaged: `pac solution pack --folder src --zipFile ..\\bin\\DetailsListVOA_unmanaged.zip --packageType Unmanaged`
    - Managed: `pac solution pack --folder src --zipFile ..\\bin\\DetailsListVOA_managed.zip --packageType Managed`
  - Then import from `.\\bin\\DetailsListVOA_unmanaged.zip` (or managed).
  
- Alternatively, use PAC to build and create packages without MSBuild:
  - From `solution/`:
    - Build: `pac solution build --configuration Release`
    - Unmanaged: `pac solution create-package --path solution.cdsproj --packageType Unmanaged --configuration Release --zipFile ..\\bin\\DetailsListVOA_unmanaged.zip`
    - Managed: `pac solution create-package --path solution.cdsproj --packageType Managed --configuration Release --zipFile ..\\bin\\DetailsListVOA_managed.zip`

### Configure In App

Set the following properties in the app/form where the control is used:

- `pageSize`, `columnDisplayNames`, `columnConfig`, `allowColumnReorder`, `perfLogsEnabled`: Tuning options; see sections above.

Set the API and profile defaults in `DetailsListVOA/config/ControlConfig.ts`:

- `customApiName` (optional): Name of an unbound Dataverse Custom API to execute. If set, the control uses `context.webAPI.execute` and passes built query parameters.
- `apimEndpoint` (optional): Fully qualified HTTP URL used when `customApiName` is not provided.
- `apiBaseUrl` (optional): Base URL used for sale details fetch on row invoke.
- `tableKey` (optional): Profile key selecting column/parameter behavior (defaults to `sales`).

### Useful Scripts

- `npm start` — run the PCF test harness locally.
- `npm run build` — build production bundle under `out/controls`.
- `npm run clean` / `npm run rebuild` — clean or full rebuild.

### One-Command PowerShell Automation

Use the helper script to build, pack, and optionally import. Choose one of these invocation styles:

- From PowerShell (recommended):
  - Unmanaged: `& .\\scripts\\pcf-pack.ps1`
  - Managed: `& .\\scripts\\pcf-pack.ps1 -Managed`
  - Import after pack: `& .\\scripts\\pcf-pack.ps1 -EnvUrl https://<your-org>.crm.dynamics.com`
  - If script execution is restricted: `Set-ExecutionPolicy -Scope Process Bypass; & .\\scripts\\pcf-pack.ps1`

- From Command Prompt (cmd):
  - Unmanaged: `.\\scripts\\pcf-pack.cmd`
  - Managed: `.\\scripts\\pcf-pack.cmd -Managed`
  - Import after pack: `.\\scripts\\pcf-pack.cmd -EnvUrl https://<your-org>.crm.dynamics.com`

- From any shell with PowerShell 7:
  - `pwsh -NoProfile -ExecutionPolicy Bypass -File .\\scripts\\pcf-pack.ps1 [args]`

Notes:
- First run will create a `solution/` folder (if missing) and initialize it with publisher `dsync` / prefix `svt`. Override with `-PublisherName` and `-PublisherPrefix`.
- The script adds the project reference to `DetailsListVOA.pcfproj` if not already present, cleans previous zips, and writes outputs to `bin/`.
- By default, the script uses SolutionPackager (pack from `solution/src`). Pass `-UsePacBuild` to use `pac solution build` + `pac solution create-package` instead. Add `-Managed` to also create the managed zip.
- To silence `npm warn Unknown user config "python"` or `"unsafe-perm"`, pass `-FixNpmPythonWarn` and the script will remove these keys from your npm user/global config before running `npm ci`.

### Troubleshooting

- If the control is not visible after `pac pcf push`, clear app designer cache or open a new session.
- If calls to your API fail, verify CORS and that the manifest `<external-service-usage>` domain matches the actual host.
- If using `customApiName`, ensure the Custom API exists, user has privileges, and it returns the expected payload shape.
- If you see `powershell.ps1 : A parameter cannot be found that matches parameter name 'ExecutionPolicy'`, a local script named `powershell.ps1` is shadowing the executable. Use `powershell.exe`/`pwsh` explicitly or invoke the script from PowerShell with `& .\\scripts\\pcf-pack.ps1`, or run `.\\scripts\\pcf-pack.cmd` from cmd.
