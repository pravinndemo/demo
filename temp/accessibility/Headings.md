# Accessibility Review: Headings

Updated: 2026-03-17

This document records the current implementation status for the heading-structure checklist in the SVT List PCF control.

Current status: Done in PCF for reviewed heading items

## Scope

- Reviewed the active grid screen in `DetailsListVOA/Grid.tsx`.
- Reviewed the statutory spatial unit lookup screen in `DetailsListVOA/components/SpatialUnitBrowser/StatutorySpatialUnitBrowser.tsx`.
- Reviewed the legacy `DetailsListVOA/grid/Grid.tsx` copy and aligned its dialog headings so the repo does not retain stale heading regressions.

## Checklist Status

| Checklist item | Status | Details | Evidence |
| --- | --- | --- | --- |
| Ensure a logical heading structure is used | Fixed | The main grid title is now the page-level heading, the assign modal uses its own screen-level heading, and the assign user list has a lower-level section heading. | `DetailsListVOA/Grid.tsx:5199`, `DetailsListVOA/Grid.tsx:6270`, `DetailsListVOA/Grid.tsx:6327`, `DetailsListVOA/tests/headings-review-gate.test.ts:14` |
| Use only one Heading 1 on each screen that serves as the main heading | Fixed | The active grid screen and the spatial lookup screen now expose their main titles as `h1`. The assign modal also uses a screen-level `h1` because it is presented as a modal screen with `aria-modal="true"`. | `DetailsListVOA/Grid.tsx:5199`, `DetailsListVOA/Grid.tsx:6270`, `DetailsListVOA/components/SpatialUnitBrowser/StatutorySpatialUnitBrowser.tsx:289`, `DetailsListVOA/tests/headings-review-gate.test.ts:19` |
| Headings should not be used only to add visual styling | Fixed | The visually prominent titles that function as headings now use real heading semantics. Non-structural content such as helper text and empty-state copy remains plain text. | `DetailsListVOA/Grid.tsx:5203`, `DetailsListVOA/Grid.tsx:6147`, `DetailsListVOA/components/SpatialUnitBrowser/StatutorySpatialUnitBrowser.tsx:340` |

## Text Sizes Reviewed

| UI text | Size | Source |
| --- | --- | --- |
| Main grid title | `18px` normally via Fluent `large`; `16px` on ultra-compact via Fluent `mediumPlus`; `20px` in compact shell override | `DetailsListVOA/Grid.tsx:5199`, `DetailsListVOA/css/DetailsListVOA.css:436` |
| Assign modal title | `20px` via Fluent `xLarge` | `DetailsListVOA/Grid.tsx:6270` |
| Assign user list section title | `16px` via Fluent `mediumPlus` | `DetailsListVOA/Grid.tsx:6327` |
| Spatial lookup title | `20px` via Fluent `xLarge` | `DetailsListVOA/components/SpatialUnitBrowser/StatutorySpatialUnitBrowser.tsx:289` |
| Labels | `14px` | `DetailsListVOA/css/DetailsListVOA.css:1438`, `DetailsListVOA/css/DetailsListVOA.css:1695` |
| Helper and meta text | `12px` | `DetailsListVOA/css/DetailsListVOA.css:601`, `DetailsListVOA/components/SpatialUnitBrowser/StatutorySpatialUnitBrowser.tsx:340` |
| Inline prefilter input text | `13px` | `DetailsListVOA/css/DetailsListVOA.css:1689` |

## Configurability Notes

- Variant-based Fluent text such as `large`, `mediumPlus`, `small`, `smallPlus`, and `xLarge` is theme-driven.
- The grid accepts `themeJSON` and builds a Fluent theme from it, then applies it with `ThemeProvider`.
- In practice, that means the variant-driven heading and helper-text sizes can be changed if a custom theme is supplied.
- Sizes declared directly in CSS are not externally configurable today; they require a code or stylesheet change.

Evidence:

- `DetailsListVOA/Grid.tsx:125`
- `DetailsListVOA/Grid.tsx:177`
- `DetailsListVOA/Grid.tsx:191`
- `DetailsListVOA/Grid.tsx:5126`
- `DetailsListVOA/css/DetailsListVOA.css:436`
- `DetailsListVOA/css/DetailsListVOA.css:601`
- `DetailsListVOA/css/DetailsListVOA.css:1438`
- `DetailsListVOA/css/DetailsListVOA.css:1689`
- `DetailsListVOA/css/DetailsListVOA.css:1695`

## Issues Fixed In This Pass

| Area | Previous result | Fix applied | Current result |
| --- | --- | --- | --- |
| Main grid title | Rendered as `h2` | Changed to `h1` | Main screen now has a page-level heading |
| Assign modal title | Rendered as `h2` in the active grid and plain `Text` in the legacy grid copy | Changed to `h1` in both places | Modal screen now has a screen-level heading |
| Assign user list title | Visual title only | Changed to `h2` in both grid copies | Section now participates in the heading hierarchy |
| Spatial lookup title | Visual title only | Changed to `h1` | Lookup screen now has a semantic main heading |

## Regression Coverage

- Added `DetailsListVOA/tests/headings-review-gate.test.ts`.
- The test suite checks:
  - the active grid title stays `h1`,
  - the assign modal title stays `h1`,
  - the assign user list title stays `h2`,
  - the spatial lookup title stays `h1`,
  - the legacy grid copy remains aligned.

## Verification

- `npm test -- --runInBand headings-review-gate.test.ts focus-borders-review-gate.test.ts accessibility-review-gate.test.ts contrast-review-gate.test.ts grid-usability-contract.test.ts screen-text.test.ts`
- `npm run build`
