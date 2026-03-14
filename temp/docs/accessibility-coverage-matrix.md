# Accessibility Coverage Matrix

This matrix maps the current SVT List repo against the Canvas accessibility checklist you shared.

Scope note:
- This assesses only what is implemented or documented in this repo.
- Canvas-host configuration outside this repo is marked as partial or unverified.

## Overall Assessment

- Current status: Partially compliant
- Compliance call: Not yet fully compliant against the full checklist
- Main reasons:
  - Narrator, Magnifier, and 400% zoom/reflow evidence was not found in repo docs/tests.
  - Canvas screen naming and `AccessibleLabel` usage outside the PCF cannot be fully verified from this repo.

## Coverage Table

| Area | What is covered now | Main gap or limitation | Evidence | Status |
| --- | --- | --- | --- | --- |
| Keyboard navigation | Skip links, visible focus states, labelled regions, pagination labels, sort aria labels, and a focus-trapped assign dialog are implemented. Unavailable actions remain in keyboard flow with `aria-disabled` states and explanatory text. | No full end-to-end proof of Canvas-level tab order across the host app. | `DetailsListVOA/Grid.tsx`, `DetailsListVOA/css/DetailsListVOA.css`, `DetailsListVOA/constants/ScreenText.ts` | Partially compliant |
| Layout and control grouping | Labels are associated to inputs with `Label` + `htmlFor`. Toolbars, groups, regions, and grouped prefilter/date sections are present. Responsive flex/grid layout is implemented. | No explicit repo evidence for white-space review or full reading-order validation in the Canvas host. | `DetailsListVOA/Grid.tsx`, `DetailsListVOA/css/DetailsListVOA.css` | Partially compliant |
| Form inputs | Date pickers expose labels and accessibility strings. Required-field gating exists for prefilter search logic. The prefilter UI now shows visible `*` markers and a required-fields key. Editable date pickers also support manual text entry. | No repository evidence of end-user assistive technology testing for these flows. | `DetailsListVOA/Grid.tsx`, `DetailsListVOA/constants/ScreenText.ts`, `DetailsListVOA/utils/DateInputUtils.ts`, `docs/checklist-manager-assignment.md`, `docs/prefilter-column-sorting-checklist.md` | Compliant in PCF |
| Links | Links use descriptive accessible names. External address links explicitly announce `(opens in new tab)`. Mouse-specific wording like `Click here` was not found. | Internal/external link behavior outside the PCF host is not fully evidenced here. | `DetailsListVOA/grid/GridCell.tsx` | Compliant in PCF |
| Modals / popups | The assign panel is implemented as an accessible dialog with `role="dialog"`, `aria-modal="true"`, and `FocusTrapZone`, which addresses the checklist's stated risk of tab order moving behind the popup. | It is still an overlay rather than a separate screen, so it differs from the recommended Canvas pattern, but the underlying focus-order issue is mitigated. | `DetailsListVOA/Grid.tsx`, Fluent UI `FocusTrapZone` default behavior | Compliant in PCF |
| Navigation | The PCF has a consistent command bar, back action, pagination, and stable control labels. | No evidence of keyboard shortcut guidance. Whole-app consistency depends on the Canvas host app, which is outside this repo. | `DetailsListVOA/Grid.tsx`, `DetailsListVOA/constants/ScreenText.ts` | Partially compliant |
| Screen reader support | The control uses `ariaLabel`, `aria-describedby`, label associations, live regions, status messaging, and contextual button/link names. | No repo evidence of Narrator testing. Canvas-native `AccessibleLabel` coverage cannot be proven from this repo alone. | `DetailsListVOA/Grid.tsx`, `DetailsListVOA/grid/GridCell.tsx`, `DetailsListVOA/constants/ScreenText.ts` | Partially compliant |
| Disabled / greyed out controls | Unavailable actions now stay focusable with `aria-disabled`, screen-reader descriptions, and disabled-look styling. Loading, empty, and error states in selectors are exposed through focusable combo boxes with disabled placeholder options. Auto-calculated fields are rendered as focusable read-only controls. | No repository evidence of assistive technology validation for these unavailable-state patterns. | `DetailsListVOA/Grid.tsx`, `DetailsListVOA/css/DetailsListVOA.css` | Compliant in PCF |
| Screen naming | The repo supports a `canvasScreenName` input and documents recommended canonical names. | This repo cannot confirm whether actual Canvas screens use plain-language names when announced by screen readers. | `DetailsListVOA/ControlManifest.Input.xml`, `docs/svt-screen-configuration.md`, `DetailsListVOA/utils/ScreenResolution.ts` | Partially compliant |
| Zoom and reflow | Responsive breakpoints, wrapping layouts, and single-column collapse behavior are implemented for narrower widths. | No repo evidence of formal 400% zoom testing, Magnifier testing, or a no-horizontal-scroll validation. Some grid content still allows horizontal scrolling. | `DetailsListVOA/css/DetailsListVOA.css`, `DetailsListVOA/Grid.tsx` | Partially compliant |

## Summary Call

If the checklist is the acceptance standard, the current position is:

- Not fully compliant overall
- Partially compliant in several control-level areas
- No remaining clear implementation-level checklist failures were found in the PCF itself, but host-level verification gaps remain.

## Suggested Next Actions

1. Add an accessibility test pass covering keyboard order, Narrator, 400% zoom, and Magnifier.
2. Validate reflow at 400% zoom and confirm where horizontal scrolling is acceptable by exception.
3. Review the Canvas host screens for plain-language screen names and `AccessibleLabel` coverage on native controls.
4. Confirm end-to-end tab order and reading order in the Canvas host, not just inside the PCF.
