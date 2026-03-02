# Deployment Notes: Prefilter Clear Search (Manager/QC Assignment)

Date: 2026-02-28

## Summary

This change fixes the Clear Search behavior on the Manager Assignment and QC Assignment prefilter screens so that `Work that` is not auto-selected after clearing. Users now see the placeholder and must choose a `Work that` option before Search is enabled.

## What Changed

1. **Auto-select `Work that` only for screens with an explicit default**  
   Auto-selection now runs only on `caseworkerView` and `qcView`.  
   Manager Assignment and QC Assignment no longer auto-select the first `Work that` option after clearing.

2. **Force ComboBox selection to clear when empty**  
   The `Work that` ComboBox now explicitly uses `null` when no value is selected to ensure the UI clears properly.

## Files Updated

- `DetailsListVOA/Grid.tsx`

## Expected Behavior After Deployment

- **Manager Assignment + QC Assignment**
  - Clear Search resets `Work that` to empty.
  - The `Work that` placeholder is shown.
  - Search stays disabled until a `Work that` option is selected.

- **Caseworker View + QC View**
  - Auto-selection still occurs based on those screen defaults.

## Verification Steps

1. Open **Manager Assignment** (and separately **QC Assignment**).
2. Select any Search criteria and click **Search**.
3. Click **Clear Search**.
4. Confirm:
   - `Work that` is empty and shows the placeholder.
   - Search remains disabled until a `Work that` option is selected.

## Deployment Notes

- **No schema changes**.
- **No API or plugin changes**.
- **PCF/UI update only**.

Deploy using the normal SVT solution pipeline and standard steps in `docs/deployment.md`.

## Rollback

Revert the change in `DetailsListVOA/Grid.tsx`, rebuild the PCF control, and redeploy the SVT solution.
