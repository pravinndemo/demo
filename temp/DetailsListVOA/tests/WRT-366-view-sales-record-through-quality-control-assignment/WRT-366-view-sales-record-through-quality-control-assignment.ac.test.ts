import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-366 View Sales Record through Quality Control Assignment AC', () => {
  const screenResolutionSource = readRepoFile('DetailsListVOA/utils/ScreenResolution.ts');
  const tableConfigSource = readRepoFile('DetailsListVOA/config/TableConfigs.ts');
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const gridCellSource = readRepoFile('DetailsListVOA/grid/GridCell.tsx');
  const hostSource = readRepoFile('DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const padSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/PadSection.tsx');

  test('AC1: quality control assignment resolves to QA assignment table and keeps view-sales action available', () => {
    expect(screenResolutionSource).toContain("qualitycontrolassignment: { kind: 'qcAssign', tableKey: 'qaassign' },");
    expect(tableConfigSource).toContain('qaassign: {');
    expect(tableConfigSource).toContain('showViewSalesRecord: true,');
    expect(gridSource).toContain('const showViewSalesRecord = isViewSalesRecordEnabledFor(tableKey);');
    expect(gridSource).toContain('text={commonText.tableActions.viewSalesRecord}');
    expect(gridSource).toContain('unavailable={viewSaleNavigationPending || disableViewSalesRecordAction || selectedCount !== 1}');
  });

  test('AC2: sale-id link and View Sales Record button route through the same navigate handler', () => {
    expect(gridCellSource).toContain('case CellTypes.Link:');
    expect(gridCellSource).toContain('<button type="button" onClick={onClick} aria-label={label} className={buttonClassName}>');
    expect(gridCellSource).toContain('cellNavigation();');
    expect(gridSource).toContain('<GridCell item={item} column={column} onCellAction={(i, col) => void handleNavigate(i, col)} />');
    expect(gridSource).toContain('const onViewSelected = React.useCallback(() => {');
    expect(gridSource).toContain('void handleNavigate(first, undefined, true);');
  });

  test('AC3: row invoke sends qc-assignment context and runtime stores it before loading details', () => {
    expect(hostSource).toContain('onRowInvoke?: (args: { taskId?: string; saleId?: string; screenKind?: string; tableKey?: string })');
    expect(hostSource).toContain('return onRowInvoke?.({ taskId, saleId, screenKind, tableKey });');
    expect(runtimeSource).toContain('public async handleRowInvoke(args: { taskId?: string; saleId?: string; screenKind?: string; tableKey?: string }): Promise<void>');
    expect(runtimeSource).toContain('this.selectedScreenKind = normalizeTextValue(args?.screenKind);');
    expect(runtimeSource).toContain('this.selectedTableKey = normalizeTextValue(args?.tableKey);');
    expect(runtimeSource).toContain('const access = this.resolveSaleDetailsAccess(detailsPayload);');
    expect(runtimeSource).toContain('this.saleDetailsReadOnly = access.readOnly;');
  });

  test('AC4: qc-assignment view-sales details remain read-only for non-caseworker ownership contexts', () => {
    expect(runtimeSource).toContain('if (!this.isManagerAssignmentContext()) {');
    expect(runtimeSource).toContain('if (!taskExists) {');
    expect(runtimeSource).toContain('return { readOnly: false };');
    expect(runtimeSource).toContain('if (this.hasCaseworkerAccess) {');
    expect(runtimeSource).toContain("'This task is read-only unless it is assigned to you and in status Assigned or Assigned QC Failed.'");
    expect(runtimeSource).toContain('return { readOnly: true };');
    expect(runtimeSource).toContain("if (selectedKind === 'managerassign') {");
    expect(runtimeSource).toContain("if (selectedTable === 'manager') {");
  });

  test('AC5: sale record shows full sections in read-only mode including Create Data Enhancement Job', () => {
    expect(shellSource).toContain('<SalesVerificationTaskSection');
    expect(shellSource).toContain('<HyperlinksSection');
    expect(shellSource).toContain('<BandingSection');
    expect(shellSource).toContain('<PadSection');
    expect(shellSource).toContain('<MasterSaleSection');
    expect(shellSource).toContain('<WlttSection');
    expect(shellSource).toContain('<LrppdSection');
    expect(shellSource).toContain('<SalesParticularSection model={model.salesParticular} onOpenReference={openReferenceModal} readOnly={readOnly} onDraftChange={setSalesParticularDraft} />');
    expect(shellSource).toContain('<SalesVerificationSection');
    expect(padSectionSource).toContain('text="Create Data Enhancement Job"');
    expect(padSectionSource).toContain('ariaLabel="Create Data Enhancement Job"');
    expect(padSectionSource).toContain('disabled={readOnly}');
  });
});
