import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('grid usability contract', () => {
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const cellSource = readRepoFile('DetailsListVOA/grid/GridCell.tsx');
  const cssSource = readRepoFile('DetailsListVOA/css/DetailsListVOA.css');
  const hostSource = readRepoFile('DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx');
  const semanticUtilSource = readRepoFile('DetailsListVOA/utils/TagSemanticUtils.ts');

  test('keeps the selection column and Sale ID visible during horizontal scrolling so people do not lose row context', () => {
    expect(gridSource).toContain("'voa-grid-shell--selection'");
    expect(cssSource).toContain('.ms-DetailsHeader-cellIsCheck');
    expect(cssSource).toContain('.ms-DetailsRow-cellCheck');
    expect(cssSource).toContain('.voa-col-saleid-header');
    expect(cssSource).toContain('.voa-col-saleid-cell');
    expect(cssSource).toContain('position: sticky;');
    expect(cssSource).toContain('--voa-grid-left-pad: 8px;');
    expect(cssSource).toContain('width: var(--voa-selection-sticky-width);');
    expect(cssSource).toContain('left: calc(var(--voa-selection-sticky-width) + var(--voa-grid-left-pad));');
    expect(cssSource).toContain('.voa-col-saleid-header .ms-DetailsHeader-cellTitle');
    expect(cssSource).toContain('.voa-col-saleid-cell > div');
    expect(cssSource).toContain('padding-left: 12px;');
  });

  test('makes active sort and filter state visually obvious so the current table state is easy to read', () => {
    expect(gridSource).toContain("'voa-col-header--active'");
    expect(gridSource).toContain("'voa-col-header--sorted'");
    expect(gridSource).toContain("'voa-col-header--filtered'");
    expect(cssSource).toContain('.voa-col-header--active');
    expect(cssSource).toContain('.voa-col-header--filtered::after');
  });

  test('shows page-range context and a visible overflow hint so people know where they are in the results', () => {
    expect(gridSource).toContain('const resultsSummaryText = React.useMemo(() => {');
    expect(gridSource).toContain('voa-grid-results__overflow-hint');
    expect(gridSource).toContain('resultsScrollHintText');
    expect(cssSource).toContain('.voa-grid-pagination__summary');
    expect(cssSource).toContain('.voa-grid-results__overflow-hint');
    expect(hostSource).toContain('pageSize,');
  });

  test('commits a clear typed single-select match on dismiss so values do not snap back to the previous selection', () => {
    expect(gridSource).toContain('const commitComboSingleSelectOnDismiss = React.useCallback(');
    expect(gridSource).toContain("consumeComboCancelNextDismiss('searchBy')");
    expect(gridSource).toContain("consumeComboCancelNextDismiss('prefilterSearchBy')");
    expect(gridSource).toContain("consumeComboCancelNextDismiss('prefilterWorkThat')");
    expect(gridSource).toContain('consumeComboCancelNextDismiss(cfg.key)');
  });

  test('keeps exact typed single-select queries active so typing UPRN does not reopen the full option list', () => {
    expect(gridSource).toContain('const normalizeSingleSelectSearchText = (');
    expect(gridSource).toContain('return normalizeComboSearchText(raw);');
    expect(gridSource).not.toContain('trimmedLower === selectedTextLower');
    expect(gridSource).not.toContain("trimmedLower === String(selectedKey).trim().toLowerCase()");
  });

  test('keeps command-bar actions visibly labelled so compact layouts do not fall back to icon-only buttons', () => {
    expect(gridSource).toContain('text={commonText.buttons.back}');
    expect(gridSource).toContain('text={searchPanelToggleText}');
    expect(gridSource).toContain('text={prefilterToggleText}');
    expect(gridSource).toContain('text={commonText.buttons.moreActions}');
    expect(gridSource).toContain('text={commonText.buttons.close}');
    expect(gridSource).not.toContain('text={ultraCompactViewport ? undefined : searchPanelToggleText}');
    expect(gridSource).not.toContain('text={ultraCompactViewport ? undefined : prefilterToggleText}');
  });

  test('keeps the search actions visually grouped with the active field instead of detaching them to the far edge', () => {
    expect(gridSource).toContain('className="voa-search-panel__actions"');
    expect(cssSource).toContain('.voa-search-panel {');
    expect(cssSource).toContain('.voa-search-panel__actions {');
    expect(cssSource).toContain('.voa-search-panel__actions > .ms-Stack > .ms-Stack-inner {');
    expect(cssSource).toContain('align-self: flex-start;');
    expect(cssSource).toContain('padding-top: 24px;');
    expect(cssSource).toContain('padding-left: 0;');
    expect(cssSource).toContain('margin-left: 12px;');
    expect(cssSource).toContain('margin-top: 0;');
    expect(cssSource).toContain('min-width: 140px;');
  });

  test('shows dynamic required markers and a visible unavailable note in sales search so disabled search states are explained', () => {
    expect(gridSource).toContain('const salesSearchShowsRequiredFields = React.useMemo(');
    expect(gridSource).toContain('const [salesSearchTouched, setSalesSearchTouched]');
    expect(gridSource).toContain('const [salesSearchAttempted, setSalesSearchAttempted]');
    expect(gridSource).toContain('const handleSalesSearchUnavailableAttempt = React.useCallback(');
    expect(gridSource).toContain('onUnavailableClick={isSalesSearch ? handleSalesSearchUnavailableAttempt : undefined}');
    expect(gridSource).toContain("['billingAuthority', 'saleId', 'taskId', 'uprn'].includes(filters.searchBy)");
    expect(gridSource).toContain("markSalesSearchFieldTouched('billingAuthority')");
    expect(gridSource).toContain("markSalesSearchFieldTouched('bacode')");
    expect(gridSource).toContain("markSalesSearchFieldTouched('saleId')");
    expect(gridSource).toContain("markSalesSearchFieldTouched('taskId')");
    expect(gridSource).toContain("markSalesSearchFieldTouched('uprn')");
    expect(gridSource).toContain('renderSalesSearchLabel');
    expect(gridSource).toContain('salesSearchText.accessibility.requiredFieldKey');
    expect(gridSource).toContain('className="voa-search-panel__meta"');
    expect(gridSource).toContain('className="voa-search-required-key"');
    expect(gridSource).toContain('className="voa-search-unavailable-note"');
    expect(gridSource).toContain('focusSalesSearchFieldById(fieldId)');
    expect(gridSource).toContain('role="note"');
    expect(gridSource).toContain('role="status" aria-live="polite"');
    expect(cssSource).toContain('.voa-search-panel__meta {');
    expect(cssSource).toContain('.voa-search-required-key,');
    expect(cssSource).toContain('.voa-search-unavailable-note {');
    expect(cssSource).toContain('flex: 1 0 100%;');
  });

  test('lets Canvas own sales-record navigation loading and ignores repeat activations while navigation is pending', () => {
    expect(gridSource).toContain('const viewSaleNavigationLockRef = React.useRef(false);');
    expect(gridSource).toContain('const [viewSaleNavigationPending, setViewSaleNavigationPending] = React.useState(false);');
    expect(gridSource).toContain('if (viewSaleNavigationLockRef.current) {');
    expect(gridSource).toContain('setViewSaleNavigationPending(true);');
    expect(gridSource).toContain('Canvas owns the navigation loader for sales-record transitions.');
    expect(gridSource).toContain('viewSaleNavigationLockRef.current = false;');
    expect(gridSource).toContain('setViewSaleNavigationPending(false);');
    expect(gridSource).toContain("'Opening the sales record. Please wait.'");
    expect(gridSource).toContain('unavailable={viewSaleNavigationPending || disableViewSalesRecordAction || selectedCount !== 1}');
    expect(gridSource).toContain('className="voa-view-sale-pending-note"');
    expect(cssSource).toContain('.voa-view-sale-pending-note {');
  });

  test('gives the search and prefilter areas a visible but restrained shadow so they read as control sections', () => {
    expect(cssSource).toContain('.voa-prefilter-bar {');
    expect(cssSource).toContain('0 6px 12px -8px rgba(11, 12, 12, 0.24);');
    expect(cssSource).toContain('.voa-prefilter-bar--inline {');
    expect(cssSource).toContain('.voa-search-panel {');
    expect(cssSource).toContain('0 6px 12px -8px rgba(11, 12, 12, 0.2);');
  });

  test('renders Flagged for Review as yes/no chips instead of raw booleans so scanning is faster', () => {
    expect(cellSource).toContain('getFlaggedForReviewTagMeta');
    expect(semanticUtilSource).toContain("buildTagMeta(");
    expect(semanticUtilSource).toContain("'Yes'");
    expect(semanticUtilSource).toContain("'No'");
    expect(cssSource).toContain('.voa-review-flag-tag');
  });

  test('abbreviates summary flags but preserves the full values in tooltips so dense flag sets remain readable', () => {
    expect(cellSource).toContain('summaryFlagsTooltip');
    expect(cellSource).toContain('semanticMeta?.titleText');
    expect(semanticUtilSource).toContain('abbreviateSummaryFlagLabel');
    expect(semanticUtilSource).toContain('Summary flag: ${label}');
    expect(cssSource).toContain('.voa-summary-flag-chip');
    expect(cssSource).toContain('text-transform: uppercase;');
  });

  test('uses semantic mapping helpers for task status and summary flags so future values can fall back safely', () => {
    expect(cellSource).toContain('getTaskStatusTagMeta');
    expect(cellSource).toContain('getSummaryFlagTagMeta');
    expect(semanticUtilSource).toContain('getStableFallbackColors');
    expect(cssSource).toContain('.voa-task-status-chip');
    expect(cssSource).toContain('.voa-summary-flag-chip');
  });

  test('uses visible button labels for inline grid actions instead of icon-only or clickable text links without button semantics', () => {
    expect(cellSource).toContain('className="voa-expand-button"');
    expect(cellSource).toContain('className="voa-expand-button__label"');
    expect(cellSource).toContain("'voa-mda-link', 'voa-mda-link-button', linkClassName");
    expect(cellSource).toContain('className="voa-cell-action-button"');
    expect(cellSource).toContain('className="voa-cell-action-button__label"');
    expect(cssSource).toContain('.voa-expand-button {');
    expect(cssSource).toContain('.voa-mda-link-button {');
  });

  test('shows a visible new-tab cue on Dataverse record links that open in a new tab', () => {
    expect(cellSource).toContain('const newTabText = SCREEN_TEXT.common.links.opensInNewTab;');
    expect(cellSource).toContain('{cellText} {newTabText}');
    expect(cellSource).toContain('target="_blank"');
    expect(cellSource).toContain('aria-label={label}');
  });

  test('gives tag cells visible overflow and a small vertical buffer so pill borders do not clip at the row edge', () => {
    expect(cellSource).toContain('const isTagCell =');
    expect(cellSource).toContain("overflow: isTagCell ? 'visible' : undefinedIf(constrainWidth, 'hidden')");
    expect(cellSource).toContain("display: isTagCell ? 'inline-flex' : undefined");
    expect(cellSource).toContain("paddingBottom: undefinedIf(!isBlank && isTagCell, '1px')");
  });

  test('shows compact prefilter selection summaries and reset notices so dependent filter changes are easier to understand', () => {
    expect(gridSource).toContain('prefilterBillingSelectionSummary');
    expect(gridSource).toContain('prefilterUserSelectionSummary');
    expect(gridSource).toContain('SEARCH_BY_RESET_NOTICE');
    expect(gridSource).toContain('PREFILTER_RESET_NOTICE');
    expect(gridSource).toContain('voa-search-reset-note');
    expect(gridSource).toContain('voa-prefilter-reset-note');
    expect(gridSource).toContain('voa-prefilter-selection-summary');
    expect(cssSource).toContain('.voa-search-reset-note');
    expect(cssSource).toContain('.voa-prefilter-reset-note');
    expect(cssSource).toContain('.voa-prefilter-selection-summary');
  });

  test('keeps required markers on the actual required prefilter controls and shows a legend for what the star means', () => {
    expect(gridSource).toContain("requiredFieldKey");
    expect(gridSource).toContain("required: true");
    expect(gridSource).toContain("managerText.prefilter.labels.billingAuthority");
    expect(gridSource).toContain('prefilterUserLabel');
    expect(gridSource).toContain('prefilterText.labels.workThat');
    expect(gridSource).toContain('prefilterText.labels.completedDateRange');
  });

  test('shows a visible UPRN input hint so the digit-only restriction is obvious before typing', () => {
    expect(gridSource).toContain("aria-describedby={buildAriaDescribedBy('voa-sales-uprn-hint')}");
    expect(gridSource).toContain('voa-sales-uprn-hint');
    expect(gridSource).toContain('salesSearchText.hints.uprnInput');
    expect(cssSource).toContain('.voa-search-field-hint');
  });

  test('strengthens selected-row treatment so multi-select actions are easier to verify before acting', () => {
    expect(cssSource).toContain('.ms-DetailsRow.is-selected');
    expect(cssSource).toContain('box-shadow: inset 4px 0 0 #005ea5;');
    expect(cssSource).toContain('--voa-selected-row-bg');
  });
});
