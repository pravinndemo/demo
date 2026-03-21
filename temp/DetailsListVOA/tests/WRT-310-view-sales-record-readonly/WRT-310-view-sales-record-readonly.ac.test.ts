import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-310 View Sales Record via Manager Assignment AC', () => {
  const hostSource = readRepoFile('DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const salesVerificationSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationSection.tsx');
  const salesParticularSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesParticularSection.tsx');
  const taskSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationTaskSection.tsx');
  const rulesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/rules/ViewSaleActionRules.ts');
  const padSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/PadSection.tsx');
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');

  test('AC1: manager assignment view still exposes the View Sales Record action for a selected row', () => {
    expect(gridSource).toContain('text={commonText.tableActions.viewSalesRecord}');
    expect(gridSource).toContain('unavailable={viewSaleNavigationPending || disableViewSalesRecordAction || selectedCount !== 1}');
    expect(gridSource).toContain("'Select exactly one row to view its sales record.'");
  });

  test('AC2: row invoke includes screen context so runtime can apply manager-specific access rules', () => {
    expect(hostSource).toContain('onRowInvoke?: (args: { taskId?: string; saleId?: string; screenKind?: string; tableKey?: string })');
    expect(hostSource).toContain('return onRowInvoke?.({ taskId, saleId, screenKind, tableKey });');
    expect(runtimeSource).toContain('public async handleRowInvoke(args: { taskId?: string; saleId?: string; screenKind?: string; tableKey?: string }): Promise<void>');
    expect(runtimeSource).toContain('this.selectedScreenKind = normalizeTextValue(args?.screenKind);');
    expect(runtimeSource).toContain('this.selectedTableKey = normalizeTextValue(args?.tableKey);');
  });

  test('AC3: manager assignment stays read-only and only shows assign-to-yourself hint when task exists and record is unassigned', () => {
    expect(runtimeSource).toContain('private resolveSaleDetailsAccess(detailsPayload: string): { readOnly: boolean; reason?: string }');
    expect(runtimeSource).toContain('if (!this.isManagerAssignmentContext()) {');
    expect(runtimeSource).toContain('const taskExists = this.hasTaskIdInSaleRecord(detailsPayload);');
    expect(runtimeSource).toContain('const isUnassigned = this.isSaleRecordUnassigned(detailsPayload);');
    expect(runtimeSource).toContain('reason: taskExists && isUnassigned');
    expect(runtimeSource).toContain('private hasTaskIdInSaleRecord(detailsPayload: string): boolean');
    expect(runtimeSource).toContain('private isSaleRecordUnassigned(detailsPayload: string): boolean');
    expect(runtimeSource).toContain("'This task is unassigned. Manager Assignment is view-only. Assign it to yourself to take ownership.'");
    expect(runtimeSource).toContain('const access = this.resolveSaleDetailsAccess(detailsPayload);');
    expect(runtimeSource).toContain('this.saleDetailsReadOnly = access.readOnly;');
  });

  test('AC4: sale details shell shows the hint only when runtime supplies a read-only reason and passes persona permissions', () => {
    expect(shellSource).toContain('{readOnly && readOnlyReason && (');
    expect(shellSource).toContain('{readOnlyReason}');
    expect(shellSource).toContain('canCreateTask={canCreateManualTask}');
    expect(shellSource).toContain('canModifyTask={canModifyTask}');
    expect(shellSource).toContain('canProgressTask={canProgressTask}');
    expect(shellSource).toContain('<SalesParticularSection model={model.salesParticular} onOpenReference={openReferenceModal} readOnly={readOnly} onDraftChange={setSalesParticularDraft} />');
    expect(shellSource).toContain('onOpenQcLog={openQcAuditHistory}');
  });

  test('AC5: editable controls route through centralized action rules and stay disabled for read-only/non-caseworker', () => {
    expect(salesVerificationSectionSource).toContain('getSalesVerificationEditRule({ busy, readOnly, canProgressTask })');
    expect(salesVerificationSectionSource).toContain('const editingDisabled = salesVerificationEditRule.disabled;');
    expect(taskSectionSource).toContain('getCreateTaskActionRule({');
    expect(taskSectionSource).toContain('const createTaskDisabled = createTaskActionRule.disabled;');
    expect(salesParticularSectionSource).toContain('getSalesParticularCalculateActionRule({ readOnly, reviewStatusKey })');
    expect(rulesSource).toContain("reason: 'Modify task is available only to caseworker role/team.'");
    expect(padSectionSource).toContain('disabled={readOnly}');
  });
});
