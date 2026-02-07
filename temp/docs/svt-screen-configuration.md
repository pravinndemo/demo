# SVT List PCF Screen Configuration

This document defines what to set for the PCF inputs `tableKey` and `canvasScreenName` on each screen, and which `source` query string value is sent to the sales API.

## Inputs and precedence
The control derives behavior primarily from `canvasScreenName`. Resolution order is:
1. `canvasScreenName` (direct screen-name mapping first, then token matching)
2. `tableKey` (optional fallback when the screen name is not recognized)
3. `CONTROL_CONFIG.tableKey` default

Important: assignment and manager prefilter behavior still depends on `canvasScreenName` tokens, so keep those tokens accurate even if you set `tableKey`.

## Valid `tableKey` values
Use one of the following values:
- `sales`
- `allsales`
- `myassignment`
- `manager`
- `qaassign`
- `qaview`
- `qa` (legacy alias; prefer `qaassign` or `qaview`)

## Per-screen configuration
Use these recommended `canvasScreenName` values so the control can reliably derive the correct behavior.

| Screen | Recommended `canvasScreenName` | `tableKey` (optional fallback) | `source` sent to API |
| --- | --- | --- | --- | --- |
| Sales Record Search | `SalesRecordSearch` | `sales` | `SRS` |
| Manager Assignment | `ManagerAssignment` | `manager` | `MA` |
| Caseworker View | `CaseworkerView` | `myassignment` | `CWV` |
| Quality Control Assignment | `QualityControlAssignment` | `qaassign` | `QCA` |
| Quality Control View | `QualityControlView` | `qaview` | `QCV` |

## Sales Record Search prefilter and validation
On the Sales Record Search screen:
- No records are shown until a valid search is applied.
- `Search by` is limited to: Address, Sale ID, Task ID, UPRN, Billing Authority.
- Address is the default search mode.

Validation rules:
- Sale ID must match `S-` followed by digits (e.g., `S-1000001`).
- Task ID must match `A-` or `M-` followed by digits (e.g., `A-1000001`).
- UPRN accepts digits only (up to 12).
- Billing Authority search requires both Billing Authority and Billing Authority Reference.
- Address search requires either:
  - A valid postcode, or
  - At least two of: Building Name/Number, Street, Town/City.
- Invalid postcode shows: `Please enter a valid postcode`.
- A single non-postcode address criterion shows: `Please provide at least two search criteria.`

## Source code mapping
The control now sends a default `source` parameter on the sales API request based on the screen:
- SalesRecordSearch -> `SRS`
- ManagerAssignment -> `MA`
- CaseworkerView -> `CWV`
- QualityControlAssignment -> `QCA`
- QualityControlView -> `QCV`

## Other backend source codes
- `MAT` -> Manager assignment task (batch task-assignment endpoint).
- `QCAT` -> Quality control assignment task (batch task-assignment endpoint).
- `VSRT` -> Modify SVT Task (backend stored procedure / task update workflow).

## Implementation references
Key implementation points:
- `tableKey` input: `DetailsListVOA/ControlManifest.Input.xml`
- Screen and source resolution: `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
- API parameter assembly: `DetailsListVOA/services/GridDataController.ts`
