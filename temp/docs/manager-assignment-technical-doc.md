# Manager assignment screen (SVT List PCF)

## Purpose and screen detection
The **manager assignment** screen is a specialization of the SVT List PCF grid. The host detects it when the `canvasScreenName` input contains `assignment` **and** `manager`, which toggles manager-specific prefilter behavior and assignment context.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L279-L309】

## Table grid (columns + data source)
### Column profile
The manager assignment screen uses the **manager** column profile. By default, the profile mirrors the sales grid columns and includes fields like `saleid`, `taskid`, `uprn`, `address`, `taskstatus`, `assignedto`, and QC dates.【F:DetailsListVOA/config/ColumnProfiles.ts†L5-L34】【F:DetailsListVOA/config/ColumnProfiles.ts†L36-L46】

### Data loading (Custom API)
Grid data is loaded via a **Dataverse Custom API** (defaults to `voa_GetAllSalesRecord`) and is invoked through the grid data controller, which assembles paging, sorting, and filters into the API request.【F:DetailsListVOA/config/ControlConfig.ts†L1-L12】【F:DetailsListVOA/services/GridDataController.ts†L47-L102】

The manager table configuration reuses the sales parameter mapping and merges manager prefilters into the same API request payload before calling the API.【F:DetailsListVOA/config/TableConfigs.ts†L265-L304】【F:DetailsListVOA/config/TableConfigs.ts†L313-L329】

## Table column filters (header filters)
Column header filters are driven by the **column filter configuration** shared by sales/manager/qa tables. The controls include `textEq`, `textContains`, `textPrefix`, `numeric`, `dateRange`, `singleSelect`, and `multiSelect`, and each field in the grid is mapped to a control type in `SALES_COLUMN_FILTERS`.【F:DetailsListVOA/config/TableConfigs.ts†L7-L58】

Examples of manager column filter mappings:
- `saleid`, `taskid`, `uprn` → `textEq` (exact match).【F:DetailsListVOA/config/TableConfigs.ts†L34-L38】
- `address`, `postcode` → `textContains` / `textPrefix` (partial match).【F:DetailsListVOA/config/TableConfigs.ts†L37-L40】
- `saleprice`, `ratio`, `outlierratio` → `numeric` (range/operator).【F:DetailsListVOA/config/TableConfigs.ts†L41-L49】
- `assigneddate`, `taskcompleteddate`, `qcassigneddate`, `qccompleteddate` → `dateRange`.【F:DetailsListVOA/config/TableConfigs.ts†L52-L57】

When column header filters change, the host normalizes them, persists them, and forwards them to the API request as string or string-array values.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L236-L278】【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L918-L947】

**Updated column filter API format (manager assignment):**
- Use `columnFilter` (lowercase) in the query string.
- Format: `columnFilter=field~operator~value`
- For multi-value filters, values are comma-separated (`,`).

## Manager prefilters (screen-level filters)
Manager assignment screens require **prefilters** before results are shown. The host defers API loading until prefilters are applied, then merges them into the request payload.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L560-L605】【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L894-L972】

The prefilter model includes:
- `searchBy` = `billingAuthority` or `caseworker`
- `billingAuthorities` / `caseworkers` (arrays)
- `workThat` (e.g., `readyToAllocate`, `currentlyAssigned`, `awaitingQc`, etc.)
- `completedFrom` / `completedTo` (date strings)

These values are mapped into API parameters (e.g., `billingAuthority`, `assignedTo`, `taskStatus`, `completedFromDate`, `completedToDate`) before the Custom API call is made.【F:DetailsListVOA/config/PrefilterConfigs.ts†L9-L41】【F:DetailsListVOA/config/PrefilterConfigs.ts†L47-L90】

**Updated manager prefilter API format (manager assignment):**
- `source=MA`
- `searchBy=BA` when search-by is billing authority
- `searchBy=CW` when search-by is caseworker
- `preFilter` values joined with `~`
- `taskStatus` values joined with `~`
- `fromDate` / `toDate` in `dd/MM/yyyy` (only send when provided)

Example:
```
source=MA
searchBy=BA
preFilter=Powys 2 (Radnorshire)~Powys 3 (Breconshire)
taskStatus=Assigned~Assigned QC -Failed
fromDate=02/01/2026
toDate=01/02/2026
```

## Assignment security context (roles + teams)
### User context resolution
SVT uses a **user context resolver** to determine persona (`Manager`, `QA`, or `User`) by checking **security-group teams first** and then **Dataverse roles** if no matching teams are found. The resolver looks for the configured team and role names (SVT Manager/QA/User) and returns the matched persona along with the resolution source and matched team/role names.【F:VOA.SVT.Plugins/Helpers/UserContextResolver.cs†L7-L200】

The `voa_SvtGetUserContext` Custom API exposes this resolution result to Canvas apps, returning output parameters such as `svtPersona`, `hasSvtAccess`, `matchedTeamName`, `matchedRoleName`, and the semicolon-delimited `matchedRoleNames` list.【F:VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetUserContext.cs†L8-L56】

### Assignable users for manager assignment
When the **assignment panel opens**, the PCF calls the **assignable users** Custom API (default `voa_SvtGetAssignableUsers`) with the current `screenName` to determine which users can be assigned. The request is cached per `assignmentContextKey` + API name/type, and the response is normalized into `{ id, firstName, lastName, email, team, role }` for the picker UI.【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L608-L707】【F:DetailsListVOA/config/ControlConfig.ts†L1-L12】

The plugin resolves assignment context from the screen name (manager vs QA), then loads users from **team membership** and **role membership** using the assignment context’s configured team/role names (e.g., SVT User team or role for manager assignment).【F:VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetAssignableUsers.cs†L24-L83】【F:VOA.SVT.Plugins/Helpers/AssignmentContextResolver.cs†L7-L95】

## PCF configuration (inputs + outputs)
### Inputs (app maker/config)
The PCF control exposes inputs for:
- `canvasScreenName` (used to detect manager assignment screens).【F:DetailsListVOA/ControlManifest.Input.xml†L17-L18】【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L279-L309】
- `customApiName` / `customApiType` (search API configuration).【F:DetailsListVOA/ControlManifest.Input.xml†L19-L38】
- `taskAssignmentApiName` (assignment API used when assigning tasks).【F:DetailsListVOA/ControlManifest.Input.xml†L39-L45】
- `viewSaleRecordApiName` (view record API).【F:DetailsListVOA/ControlManifest.Input.xml†L46-L52】
- `pageSize`, `serverDrivenThreshold` (paging).【F:DetailsListVOA/ControlManifest.Input.xml†L54-L64】
- `columnDisplayNames` (JSON mapping of logical name → display name).【F:DetailsListVOA/ControlManifest.Input.xml†L66-L72】
- `columnConfig` (JSON array of column configuration overrides).【F:DetailsListVOA/ControlManifest.Input.xml†L73-L79】
- `searchTrigger` (changes trigger a refresh).【F:DetailsListVOA/ControlManifest.Input.xml†L80-L86】
- `allowColumnReorder` and `perfLogsEnabled`.【F:DetailsListVOA/ControlManifest.Input.xml†L87-L98】

### Outputs (canvas app wiring)
The PCF control outputs the selected IDs, selection counts, action info, and serialized sale details. These are emitted whenever selection or actions change.【F:DetailsListVOA/ControlManifest.Input.xml†L99-L112】【F:DetailsListVOA/index.ts†L67-L123】

## How to update configuration
### Update column names or labels
1. **Preferred:** Use the `columnDisplayNames` input (JSON mapping) to override column headers without code changes.【F:DetailsListVOA/ControlManifest.Input.xml†L66-L72】【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L205-L230】
2. **Code-based defaults:** Update the `manager` column profile in `ColumnProfiles.ts` (the manager profile reuses `SALES_COLUMNS`). Adjust `ColName`, `ColDisplayName`, or widths here if you need defaults to change for all environments.【F:DetailsListVOA/config/ColumnProfiles.ts†L5-L46】
3. **Optional overrides:** Use `columnConfig` input to merge/override columns at runtime (JSON array).【F:DetailsListVOA/ControlManifest.Input.xml†L73-L79】【F:DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx†L205-L230】

### Update column filter controls
1. Edit the `SALES_COLUMN_FILTERS` config to change a column’s filter control type, min length, or option source. This mapping is used for the manager screen as well.【F:DetailsListVOA/config/TableConfigs.ts†L32-L76】【F:DetailsListVOA/config/TableConfigs.ts†L265-L304】
2. If the column name changes, update **both** the column profile (`ColumnProfiles.ts`) and the filter mapping key in `TableConfigs.ts` so the header filter stays wired to the column field.【F:DetailsListVOA/config/ColumnProfiles.ts†L5-L46】【F:DetailsListVOA/config/TableConfigs.ts†L32-L76】

### Update manager prefilter behavior
1. Update `ManagerPrefilterState` and mapping in `PrefilterConfigs.ts` (e.g., new `workThat` options or API parameter names).【F:DetailsListVOA/config/PrefilterConfigs.ts†L9-L90】
2. The manager table config merges these prefilters into the API request, so any new fields must be included in `mapManagerPrefiltersToApi` to be sent to the API.【F:DetailsListVOA/config/TableConfigs.ts†L265-L304】【F:DetailsListVOA/config/PrefilterConfigs.ts†L63-L90】

### Update API names or types
1. Adjust the input values in the app maker (`customApiName`, `customApiType`, `taskAssignmentApiName`, `viewSaleRecordApiName`) if the Dataverse Custom API or APIM proxy names change.【F:DetailsListVOA/ControlManifest.Input.xml†L19-L52】
2. Default values live in `CONTROL_CONFIG` (used when inputs are empty).【F:DetailsListVOA/config/ControlConfig.ts†L1-L12】
