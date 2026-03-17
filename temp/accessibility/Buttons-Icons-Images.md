# Accessibility Review: Buttons, Icons and Images

Updated: 2026-03-16

This document records the current implementation status for the "Buttons, icons and images" checklist in the SVT List PCF control.

Current status: Done in PCF

| Checklist item | Status | What was fixed | Evidence |
| --- | --- | --- | --- |
| Ensure all interactive items have a clear and descriptive visible label | Fixed | Back, filter toggle, prefilter toggle, more actions, and close actions now show visible text labels. Expand controls and clickable icon or image cells also show visible labels. | `DetailsListVOA/Grid.tsx:5191`, `DetailsListVOA/Grid.tsx:5213`, `DetailsListVOA/Grid.tsx:5224`, `DetailsListVOA/Grid.tsx:5236`, `DetailsListVOA/Grid.tsx:6250`, `DetailsListVOA/grid/GridCell.tsx:322`, `DetailsListVOA/grid/GridCell.tsx:392` |
| Ensure items are labelled for users where possible and have a descriptive accessible name | Fixed | Icon and image actions now keep `ariaLabel` and `ariaDescription`. Command-bar buttons keep visible text plus accessible names. | `DetailsListVOA/grid/GridCell.tsx:319`, `DetailsListVOA/grid/GridCell.tsx:320`, `DetailsListVOA/Grid.tsx:5193`, `DetailsListVOA/Grid.tsx:5237` |
| Use buttons for navigation, actions, and interactivity versus labels | Fixed | Internal interactive text in grid cells was changed from clickable link styling to real button semantics styled like a link. Expand and collapse is also rendered as a button. | `DetailsListVOA/grid/GridCell.tsx:392`, `DetailsListVOA/grid/GridCell.tsx:425`, `DetailsListVOA/grid/GridCell.tsx:427`, `DetailsListVOA/css/DetailsListVOA.css:1168` |
| Ensure all buttons, images and icons have descriptive text alternatives | Fixed | Image cells now use `alt`. Decorative images use empty alt when the adjacent visible label already provides the meaning. Icon and image action buttons expose descriptive text alternatives. | `DetailsListVOA/grid/GridCell.tsx:374`, `DetailsListVOA/grid/GridCell.tsx:319`, `DetailsListVOA/grid/GridCell.tsx:324` |
| Shared visible copy added for close and overflow actions | Fixed | Added central text strings for `Close` and `More actions` so labels are consistent and testable. | `DetailsListVOA/constants/ScreenText.ts:135`, `DetailsListVOA/constants/ScreenText.ts:140` |
| Regression coverage for these fixes | Fixed | Added tests to enforce visible labels, visible button text in compact layouts, and button semantics for inline grid actions. | `DetailsListVOA/tests/grid-usability-contract.test.ts:64`, `DetailsListVOA/tests/grid-usability-contract.test.ts:160`, `DetailsListVOA/tests/screen-text.test.ts:29` |

## Details

- Command-bar controls no longer fall back to icon-only buttons in compact layouts.
- Internal row actions now use button semantics while preserving the visual link style.
- Expand and collapse controls now expose visible action text instead of only a chevron icon.
- Clickable icon and image cells now show a visible label and keep a descriptive accessible name.
- External address navigation remains a real link because it opens a destination page rather than triggering an in-place action.

## Verification

- `npm test -- --runInBand accessibility-review-gate.test.ts grid-usability-contract.test.ts screen-text.test.ts`
- `npm run build`

Result:

- Targeted Jest checks passed: 29 tests
- Build succeeded
