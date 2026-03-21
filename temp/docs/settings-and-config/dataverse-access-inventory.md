# Dataverse Access Inventory (SVT PCF)

## Purpose
This document lists what the SVT PCF currently calls in Dataverse so security roles can be configured with the minimum required access.

## How the PCF accesses Dataverse
1. The PCF does not use direct `retrieveMultipleRecords`/`createRecord`/`updateRecord` calls.
2. The PCF uses `context.webAPI.execute(...)` to invoke unbound Custom APIs.
3. Several Custom API plugins then call external SVT APIs via APIM.
4. A subset of plugins also query Dataverse security tables (users/teams/roles) for persona and assignable-user resolution.

## Custom APIs currently invoked by the PCF (default names)
These are configurable via PCF input properties, but these are the current defaults.

- `voa_GetAllSalesRecord`
  - Used for grid search/list loading.
- `voa_GetViewSaleRecordById`
  - Used for View Sales Record detail payload.
- `voa_SvtGetSalesMetadata`
  - Used for metadata/filter options.
- `voa_SvtGetUserContext`
  - Used to resolve persona/access context.
- `voa_SvtGetAssignableUsers`
  - Used to load assignable users/caseworker lists.
- `voa_SvtTaskAssignment`
  - Used for assignment actions.
- `voa_SvtSubmitQcRemarks`
  - Used for QC pass/remarks submit.
- `voa_SvtGetAuditLogs`
  - Used to load audit/QC history.
- `voa_SvtManualTaskCreation`
  - Used for manual task creation.

## Dataverse tables/entities queried directly in plugin code
The following Dataverse entities are explicitly queried via `QueryExpression`/`AddLink` in this repository:

- `systemuser`
  - Read in assignable-users and audit-log user name resolution.
- `team`
  - Read in user-context and assignable-users flows.
- `role`
  - Read in user-context and assignable-users flows.
- `teammembership`
  - Read to map users to teams.
- `systemuserroles`
  - Read to map users to roles.

Notes:
- No direct Dataverse table `Create`/`Update`/`Delete` operations were found in the current Custom API plugin implementations in this repo.
- Most business updates are forwarded to external SVT APIs through APIM from plugin code.

## Additional Dataverse message dependency
- `voa_CredentialProvider` (OrganizationRequest)
  - Used by several plugins to resolve endpoint/secret configuration before calling external APIs.
  - This is an action/message dependency rather than a table name in this codebase.

## Security role checklist (practical)
For users who run the PCF:

- Allow execute access to the SVT Custom APIs listed above.
- Ensure access to call `voa_CredentialProvider` where required by those APIs.

For plugin runtime/service context (depending on your plugin registration/user context):

- Read access for:
  - `systemuser`
  - `team`
  - `role`
  - `teammembership`
  - `systemuserroles`

## Source pointers
- PCF API defaults:
  - `DetailsListVOA/config/ControlConfig.ts`
- PCF API wiring:
  - `DetailsListVOA/services/DetailsListRuntimeController.ts`
  - `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
  - `DetailsListVOA/services/CustomApi.ts`
- Plugin entity queries:
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetAssignableUsers.cs`
  - `VOA.SVT.Plugins/Helpers/UserContextResolver.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetAuditLogs.cs`
