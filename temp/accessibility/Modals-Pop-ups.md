# Accessibility Review: Modals / Pop-ups

Updated: 2026-03-17

This document records the current implementation status for the modal and pop-up accessibility checklist in the SVT List PCF control.

Current status: Mitigated in PCF, but not implemented as a separate Power Apps screen

## Scope

- Reviewed the assign modal implementation in `DetailsListVOA/Grid.tsx`.
- Reviewed the overlay styling in `DetailsListVOA/css/DetailsListVOA.css`.
- Reviewed the Fluent `FocusTrapZone` behaviour used by the modal.

## Checklist Status

| Checklist item | Status | Details | Evidence |
| --- | --- | --- | --- |
| Ensure all modal windows have been created as separate windows within Power Apps | Partial | The assign modal is still implemented inside the same PCF screen rather than as a separate Power Apps screen. | `DetailsListVOA/Grid.tsx:6257` |
| Ensure users cannot place keyboard focus behind the modal | Mitigated | The modal uses `role="dialog"`, `aria-modal="true"`, and `FocusTrapZone`, which together keep focus inside the modal while it is open. The overlay also visually covers the full screen. | `DetailsListVOA/Grid.tsx:6258`, `DetailsListVOA/Grid.tsx:6259`, `DetailsListVOA/css/DetailsListVOA.css:1179`, `node_modules/@fluentui/react/lib-commonjs/components/FocusTrapZone/FocusTrapZone.js:11` |

## Audit Wording

Recommended wording for the audit:

`Mitigated in PCF, but not implemented as a separate Power Apps screen.`

## Notes

- From a user-behaviour perspective, the main accessibility risk described in the recommendation is largely controlled because keyboard focus should not move behind the modal.
- From a strict platform-implementation perspective, the control does not meet the exact recommendation to use a separate Power Apps screen for the modal.
- A manual keyboard walkthrough in Edge remains the right final validation step.
