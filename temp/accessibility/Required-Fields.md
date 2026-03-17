# Accessibility Review: Required Fields

Updated: 2026-03-17

This document records the current implementation status for the required-fields accessibility checklist in the SVT List PCF control.

Current status: Done in PCF for reviewed required-field items

## Scope

- Reviewed required-field labels and key text in `DetailsListVOA/Grid.tsx`.
- Reviewed shared required-field copy in `DetailsListVOA/constants/ScreenText.ts`.
- Reviewed the required-field styling in `DetailsListVOA/css/DetailsListVOA.css`.

## Checklist Status

| Checklist item | Status | Details | Evidence |
| --- | --- | --- | --- |
| Ensure all required fields are denoted | Fixed | Required fields use a visible asterisk through the shared label helper in prefilter and sales-search flows. | `DetailsListVOA/Grid.tsx:354`, `DetailsListVOA/Grid.tsx:5394`, `DetailsListVOA/Grid.tsx:5488`, `DetailsListVOA/Grid.tsx:5582`, `DetailsListVOA/Grid.tsx:5720`, `DetailsListVOA/Grid.tsx:3308`, `DetailsListVOA/Grid.tsx:3329`, `DetailsListVOA/Grid.tsx:3351` |
| Ensure a key is provided when marking fields as required | Fixed | The visible key text is shown for prefilters and now also appears whenever a required sales-search mode is active, including billing authority, sale ID, task ID, and UPRN. | `DetailsListVOA/Grid.tsx:4476`, `DetailsListVOA/Grid.tsx:5251`, `DetailsListVOA/Grid.tsx:5929`, `DetailsListVOA/constants/ScreenText.ts:257`, `DetailsListVOA/constants/ScreenText.ts:399` |

## Issues Fixed In This Pass

| Area | Previous result | Fix applied | Current result |
| --- | --- | --- | --- |
| Sales-search required-field key visibility | The helper text appeared only for the billing-authority search mode | Broadened the visibility condition to all required sales-search modes | Users now see the required-field key whenever required sales-search fields are displayed |

## Notes

- This was a minor visual/content change rather than a structural UI change.
- The visible change is the required-field key text appearing in more sales-search states.

## Regression Coverage

- Updated `DetailsListVOA/tests/grid-usability-contract.test.ts` to lock the broader required-key condition in place.
- Existing `DetailsListVOA/tests/screen-text.test.ts` already verifies the shared required-field key wording.

## Verification

- `npm test -- --runInBand grid-usability-contract.test.ts screen-text.test.ts keyboard-review-gate.test.ts accessibility-review-gate.test.ts headings-review-gate.test.ts focus-borders-review-gate.test.ts contrast-review-gate.test.ts`
- `npm run build`
