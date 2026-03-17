# Accessibility Review: Error / Status Messages

Updated: 2026-03-16

This document records the current implementation status for the error and status messaging checklist in the SVT List PCF control.

Current status: Done in PCF

## Checklist Status

| Checklist item | Status | What is implemented now | Evidence |
| --- | --- | --- | --- |
| Ensure error / status messages are displayed as labels on the page near the relevant section | Fixed | The control uses inline `MessageBar` components inside the PCF instead of relying on a Power Apps host banner. Field-level validation is shown directly on inputs via `TextField.errorMessage`. Prefilter option-load and date errors are shown directly below the affected controls. Assign-panel messages are rendered inside the assign panel near the relevant controls. | `DetailsListVOA/Grid.tsx:5165`, `DetailsListVOA/Grid.tsx:5175`, `DetailsListVOA/Grid.tsx:5459`, `DetailsListVOA/Grid.tsx:5560`, `DetailsListVOA/Grid.tsx:5738`, `DetailsListVOA/Grid.tsx:6284`, `DetailsListVOA/Grid.tsx:6293`, `DetailsListVOA/components/SpatialUnitBrowser/StatutorySpatialUnitBrowser.tsx:321` |
| Ensure error / status messages are read out via screen readers | Fixed | Top-level and assign-panel messages use Fluent `MessageBar`, which announces errors as `alert` / assertive and informational messages as `status` / polite. Field-level `TextField.errorMessage` is rendered as `role="alert"`. The remaining free-standing prefilter errors now also use `role="alert"` with `aria-live="assertive"`. Non-blocking status notes use polite live regions. | `node_modules/@fluentui/react/lib-commonjs/components/MessageBar/MessageBar.base.js:76`, `node_modules/@fluentui/react/lib-commonjs/components/TextField/TextField.base.js:218`, `DetailsListVOA/Grid.tsx:5145`, `DetailsListVOA/Grid.tsx:5151`, `DetailsListVOA/Grid.tsx:5203`, `DetailsListVOA/Grid.tsx:5459`, `DetailsListVOA/Grid.tsx:5560`, `DetailsListVOA/Grid.tsx:5738`, `DetailsListVOA/Grid.tsx:5913`, `DetailsListVOA/Grid.tsx:6118` |

## Fixes Applied In This Pass

| Area | Change |
| --- | --- |
| Prefilter billing-authority load failure | Added an inline error label below the combo box and linked it with `aria-describedby`. The message now announces with `role="alert"` and `aria-live="assertive"`. |
| Prefilter user-options load failure | Kept the inline message below the combo box and upgraded it to an assertive live message. |
| Prefilter from-date validation | Kept the inline date error near the field and upgraded it to an assertive live message. |
| Regression coverage | Added a gate test to ensure these inline prefilter errors remain live-announced and tied to their relevant controls. |

## Messaging Pattern Summary

- Blocking or error states:
  - Use inline `MessageBar` or inline error text near the relevant control.
  - Use `role="alert"` and assertive announcement where immediate attention is required.
- Informational and progress states:
  - Use `role="status"` with `aria-live="polite"` for non-blocking updates such as view transitions and result summaries.
- Input validation:
  - Use `TextField.errorMessage` where available so the message is both visually adjacent and screen-reader announced.

## Verification

- `npm test -- --runInBand accessibility-review-gate.test.ts grid-usability-contract.test.ts screen-text.test.ts`
- `npm run build`

Result:

- Accessibility Jest checks passed
- Build succeeded
