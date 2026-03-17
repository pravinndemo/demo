# Accessibility Review: Keyboard

Updated: 2026-03-17

This document records the current implementation status for the keyboard-access checklist in the SVT List PCF control.

Current status: Done in PCF for reviewed keyboard items

## Scope

- Reviewed the active grid in `DetailsListVOA/Grid.tsx`.
- Reviewed custom interactive cells in `DetailsListVOA/grid/GridCell.tsx`.
- Checked keyboard access, inactive-state tab stops, grouping, tab flow, and date input support.

## Checklist Status

| Checklist item | Status | Details | Evidence |
| --- | --- | --- | --- |
| Check all interactive elements can be accessed via keyboard control | Fixed | Custom interactive cells use real buttons or links, and the assign screen traps focus correctly while open. | `DetailsListVOA/grid/GridCell.tsx:390`, `DetailsListVOA/grid/GridCell.tsx:427`, `DetailsListVOA/grid/GridCell.tsx:445`, `DetailsListVOA/Grid.tsx:6261`, `DetailsListVOA/tests/keyboard-review-gate.test.ts:13` |
| Check all inactive controls and content are not reachable via keyboard control | Fixed | Unavailable action buttons now use disabled states, assign-user radios disable while assigning, the calculated to-date field is disabled, the bulk-selection count field disables when inactive, and the assign search box disables while unavailable. | `DetailsListVOA/Grid.tsx:337`, `DetailsListVOA/Grid.tsx:4216`, `DetailsListVOA/Grid.tsx:5759`, `DetailsListVOA/Grid.tsx:5968`, `DetailsListVOA/Grid.tsx:6286`, `DetailsListVOA/tests/keyboard-review-gate.test.ts:19` |
| Check for a logical tabbing order | Fixed for reviewed paths | No positive `tabIndex` ordering hack is used. The main custom tab stop in the results area is the scroll region, which is intentional so keyboard users can access horizontal overflow. Pagination and shell wrappers are excluded from tab order where they are only structural. | `DetailsListVOA/Grid.tsx:5136`, `DetailsListVOA/Grid.tsx:6106`, `DetailsListVOA/Grid.tsx:6109`, `DetailsListVOA/Grid.tsx:6178`, `DetailsListVOA/tests/keyboard-review-gate.test.ts:29` |
| Ensure containers are used for grouped controls | Fixed | Grouped controls are explicitly wrapped and labelled, including the prefilter date range and bulk selection controls. | `DetailsListVOA/Grid.tsx:5728`, `DetailsListVOA/Grid.tsx:5950`, `DetailsListVOA/tests/keyboard-review-gate.test.ts:29` |
| Ensure an interactive form field is provided alongside a date picker | Fixed | All reviewed date pickers allow typed input and use custom parsing. | `DetailsListVOA/Grid.tsx:3493`, `DetailsListVOA/Grid.tsx:3506`, `DetailsListVOA/Grid.tsx:5026`, `DetailsListVOA/Grid.tsx:5041`, `DetailsListVOA/Grid.tsx:5736`, `DetailsListVOA/tests/keyboard-review-gate.test.ts:36` |

## Issues Fixed In This Pass

| Area | Previous result | Fix applied | Current result |
| --- | --- | --- | --- |
| Shared unavailable action buttons | Stayed in tab order with `aria-disabled` only | Switched to real disabled state in the shared button wrapper | Inactive action buttons are no longer tab stops |
| Assign-user radios during assign loading | Remained potentially reachable while inactive | Added `disabled={assignLoading}` | Loading-state radios are removed from keyboard interaction |
| Calculated to-date field | Read-only and marked unavailable, but still tabbable | Switched to disabled field | Informational field is no longer in the tab order |
| Bulk selection count field with no rows | Read-only and marked unavailable, but still tabbable | Switched to disabled field | Inactive selection input is no longer tabbable |
| Assign search during loading/unavailable state | Marked unavailable but still focusable | Switched to disabled search box | Inactive search field is no longer tabbable |

## Notes

- The results scroll region intentionally remains a tab stop so keyboard users can reach horizontally scrollable content.
- This review is code-level. A manual tab walkthrough in Edge remains the right final validation step for actual rendered order and behaviour.

## Regression Coverage

- Added `DetailsListVOA/tests/keyboard-review-gate.test.ts`.
- Updated `DetailsListVOA/tests/accessibility-review-gate.test.ts` to assert inactive controls now use non-focusable inactive states.

## Verification

- `npm test -- --runInBand keyboard-review-gate.test.ts accessibility-review-gate.test.ts headings-review-gate.test.ts focus-borders-review-gate.test.ts contrast-review-gate.test.ts grid-usability-contract.test.ts screen-text.test.ts`
- `npm run build`
