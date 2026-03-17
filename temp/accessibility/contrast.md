# Accessibility Review: Contrast

Updated: 2026-03-16

This document records the current implementation status for the contrast checklist in the SVT List PCF control.

Current status: Done in PCF for reviewed contrast items

## Scope

- Reviewed repo-controlled contrast values in `DetailsListVOA/css/DetailsListVOA.css` and theme usage in `DetailsListVOA/Grid.tsx`.
- Checked custom focus indicators, interactive control borders, unavailable states, warning and information panels, placeholder text, link text, and active pagination states.
- Excludes decorative shadows, translucent overlays used only as visual polish, and Canvas host styling outside this repo.

## Checklist Status

| Checklist item | Status | Details | Evidence |
| --- | --- | --- | --- |
| Ensure all graphics and user interface components pass a minimum contrast ratio of `3:1` against the relevant background | Fixed | Focus outlines, custom button borders, warning accent borders, unavailable-state borders, and pagination button boundaries now clear the `3:1` threshold. | `DetailsListVOA/css/DetailsListVOA.css:189`, `DetailsListVOA/css/DetailsListVOA.css:665`, `DetailsListVOA/css/DetailsListVOA.css:703`, `DetailsListVOA/css/DetailsListVOA.css:1509`, `DetailsListVOA/css/DetailsListVOA.css:1928`, `DetailsListVOA/css/DetailsListVOA.css:1956`, `DetailsListVOA/css/DetailsListVOA.css:1975`, `DetailsListVOA/Grid.tsx:808`, `DetailsListVOA/tests/contrast-review-gate.test.ts:45` |
| Ensure all text passes a minimum contrast ratio of `4.5:1` against the relevant background | Fixed | Reviewed custom body text, link text, note text, unavailable-state text, and placeholder text. No failing repo-controlled text pair remains in the reviewed set. | `DetailsListVOA/css/DetailsListVOA.css:599`, `DetailsListVOA/css/DetailsListVOA.css:1151`, `DetailsListVOA/css/DetailsListVOA.css:1480`, `DetailsListVOA/css/DetailsListVOA.css:1500`, `DetailsListVOA/css/DetailsListVOA.css:1929`, `DetailsListVOA/css/DetailsListVOA.css:1957`, `DetailsListVOA/css/DetailsListVOA.css:1982`, `DetailsListVOA/tests/contrast-review-gate.test.ts:55`, `DetailsListVOA/tests/contrast-review-gate.test.ts:89` |
| Ensure all large text and bold or larger text passes a minimum contrast ratio of `3:1` | Fixed | No large-text contrast failure was found in the reviewed custom styles. Key headings and active pagination text exceed the `3:1` threshold. | `DetailsListVOA/css/DetailsListVOA.css:585`, `DetailsListVOA/css/DetailsListVOA.css:901`, `DetailsListVOA/Grid.tsx:820`, `DetailsListVOA/tests/contrast-review-gate.test.ts:74` |

## Issues Fixed In This Pass

| Area | Previous result | Fix applied | Current ratio |
| --- | --- | --- | --- |
| Focus outlines on white backgrounds | Failed at `1.64:1` with `#ffbf47` on `#ffffff` | Replaced custom yellow outlines with `#1d70b8` | `5.17:1` |
| Focus outline on skip-link dark background | Not consistently compliant with the previous white-background treatment | Standardized on `#1d70b8` | `3.79:1` against `#0b0c0c` |
| Focusable unavailable button text | Failed at `2.18:1` with `#a6a6a6` on `#f3f2f1` | Updated text/icon color to `#5d656e` | `5.29:1` |
| Focusable unavailable field text | Failed at `4.08:1` with `#6f777b` on `#f3f2f1` | Updated field/icon color to `#5d656e` | `5.29:1` |
| Focusable unavailable borders | Failed at `1.50:1` with `#c8c8c8` on `#f3f2f1` | Updated border color to `#737b84` | `3.84:1` |
| Custom button borders on white | Failed at `2.08:1` with `#b1b4b6` on `#ffffff` | Updated custom button borders to `#737b84` | `4.29:1` |
| Warning note accent border | Failed at `2.58:1` with `#f47738` on `#fff4ef` | Updated accent border to `#bc5f2c` | `4.04:1` |
| Pagination button boundary | Failed when using a very light border token | Switched to `theme.semanticColors.inputBorder` | Token contrast now clears `3:1` on white |

## Reviewed Contrast Ratios

| UI/text element | Foreground | Background | Ratio | Result |
| --- | --- | --- | --- | --- |
| Focus outline | `#1d70b8` | `#ffffff` | `5.17:1` | Pass |
| Focus outline on skip-link background | `#1d70b8` | `#0b0c0c` | `3.79:1` | Pass |
| Unavailable button text | `#5d656e` | `#f3f2f1` | `5.29:1` | Pass |
| Unavailable field text | `#5d656e` | `#f3f2f1` | `5.29:1` | Pass |
| Unavailable border | `#737b84` | `#f3f2f1` | `3.84:1` | Pass |
| Custom button border | `#737b84` | `#ffffff` | `4.29:1` | Pass |
| Warning accent border | `#bc5f2c` | `#fff4ef` | `4.04:1` | Pass |
| Placeholder text | `#605e5c` | `#ffffff` | `6.46:1` | Pass |
| Active pagination text | `#ffffff` | `#3B79B7` | `4.56:1` | Pass |
| Primary action text on hover | `#1d70b8` | `#e8f1fb` | `4.53:1` | Pass |
| Body and meta text | `#5d656e` | `#ffffff` | `5.91:1` | Pass |
| Heading text | `#212a35` | `#ffffff` | `14.51:1` | Pass |

## Regression Coverage

- Added `DetailsListVOA/tests/contrast-review-gate.test.ts`.
- The test suite checks:
  - focus-outline contrast,
  - unavailable-state text and border contrast,
  - custom button border contrast,
  - warning accent border contrast,
  - placeholder text token contrast,
  - pagination boundary token choice.

## Verification

- `npm test -- --runInBand contrast-review-gate.test.ts accessibility-review-gate.test.ts grid-usability-contract.test.ts screen-text.test.ts`
- `npm run build`

Result:

- Contrast and accessibility Jest checks passed
- Build succeeded
