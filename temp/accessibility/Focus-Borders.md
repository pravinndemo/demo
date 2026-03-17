# Accessibility Review: Focus Borders

Updated: 2026-03-16

This document records the current implementation status for the focus-border checklist in the SVT List PCF control.

Current status: Done in PCF for reviewed focus items

## Scope

- Reviewed repo-controlled focus styling in `DetailsListVOA/css/DetailsListVOA.css` and repo-owned inline focus styles in `DetailsListVOA/Grid.tsx`.
- Checked custom buttons, link-style buttons, grid rows and headers, skip links, and the contextual filter-menu highlight state.
- Includes Fluent controls used by this PCF where the repo keeps the default Fluent focus treatment intact.

## Checklist Status

| Checklist item | Status | Details | Evidence |
| --- | --- | --- | --- |
| Ensure all interactive components have a visible focus border | Fixed | Custom interactive elements in this PCF use visible focus treatment, and no repo override removes the default Fluent focus indicator from standard controls such as buttons, text fields, combo boxes, date pickers, and search boxes. | `DetailsListVOA/css/DetailsListVOA.css:183`, `DetailsListVOA/css/DetailsListVOA.css:193`, `DetailsListVOA/css/DetailsListVOA.css:674`, `DetailsListVOA/css/DetailsListVOA.css:715`, `DetailsListVOA/css/DetailsListVOA.css:1159`, `DetailsListVOA/grid/GridCell.tsx:425`, `DetailsListVOA/tests/focus-borders-review-gate.test.ts:14` |
| Ensure all focus borders use a solid line and fully encompass the component | Fixed | Custom focus indicators are solid outlines. Grid header and row focus uses an inset outline so the full component remains enclosed, while buttons and link-style buttons use a full external outline. | `DetailsListVOA/css/DetailsListVOA.css:189`, `DetailsListVOA/css/DetailsListVOA.css:197`, `DetailsListVOA/css/DetailsListVOA.css:675`, `DetailsListVOA/css/DetailsListVOA.css:716`, `DetailsListVOA/css/DetailsListVOA.css:1160`, `DetailsListVOA/tests/focus-borders-review-gate.test.ts:23` |
| Use a border thickness that is easily visible and keep it consistent, ideally at least `2px` | Fixed | The remaining `1px` exact-match filter-menu highlight was upgraded to a `2px` solid outline with a matching inset offset. Repo-owned custom focus paths now use a consistent `2px` outline treatment. | `DetailsListVOA/Grid.tsx:4860`, `DetailsListVOA/Grid.tsx:4861`, `DetailsListVOA/tests/focus-borders-review-gate.test.ts:35` |

## Issues Fixed In This Pass

| Area | Previous result | Fix applied | Current result |
| --- | --- | --- | --- |
| Exact-match filter-menu option highlight | Used a `1px` outline with `-1px` offset | Updated to `2px solid` with `-2px` offset | Meets the stated minimum visible thickness and stays fully inset within the menu option |

## Focus Treatments Reviewed

| Component or state | Focus treatment | Result |
| --- | --- | --- |
| Skip links | `outline: 2px solid #1d70b8` with `outline-offset: 2px` | Pass |
| Grid header cells | `outline: 2px solid #1d70b8` with `outline-offset: -2px` | Pass |
| Grid rows | `outline: 2px solid #1d70b8` with `outline-offset: -2px` | Pass |
| Back button | `outline: 2px solid #1d70b8` with `outline-offset: 2px` | Pass |
| Expand/collapse button | `outline: 2px solid #1d70b8` with `outline-offset: 2px` | Pass |
| Link-style button | Inherits `.voa-mda-link:focus` `2px` outline while keeping button semantics | Pass |
| Exact-match filter-menu option | `outline: 2px solid ${highlightBorder}` with `outlineOffset: '-2px'` | Pass |

## Regression Coverage

- Added `DetailsListVOA/tests/focus-borders-review-gate.test.ts`.
- The test suite checks:
  - visible `2px` focus outlines for repo-owned custom interactive elements,
  - inset full-outline treatment for focused grid rows and headers,
  - link-style button semantics with the shared focus class,
  - `2px` focus treatment for the filter-menu exact-match highlight path.

## Verification

- `npm test -- --runInBand focus-borders-review-gate.test.ts accessibility-review-gate.test.ts contrast-review-gate.test.ts grid-usability-contract.test.ts screen-text.test.ts`
- `npm run build`
