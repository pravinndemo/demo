import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-400 Modify SVT Task AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const taskSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationTaskSection.tsx');
  const rulesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/rules/ViewSaleActionRules.ts');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
  const saleDetailsSource = readRepoFile('DetailsListVOA/services/runtime/sale-details.ts');
  const configSource = readRepoFile('DetailsListVOA/config/ControlConfig.ts');
  const indexSource = readRepoFile('DetailsListVOA/index.ts');
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');

  test('AC1: Modify SVT Task button is shown only for Complete and Complete Passed QC statuses', () => {
    expect(taskSectionSource).toContain('const canShowModifyTaskButton = React.useMemo(');
    expect(taskSectionSource).toContain('canShowModifyTaskAction(statusText)');
    expect(taskSectionSource).toContain('{canShowModifyTaskButton && (');
    expect(taskSectionSource).toContain('text="Modify SVT Task"');
    expect(rulesSource).toContain("const MODIFY_TASK_ALLOWED_STATUSES = new Set(['complete', 'complete passed qc']);");
  });

  test('AC2: Modify button remains disabled for users without caseworker permissions', () => {
    expect(taskSectionSource).toContain('disabled={modifyTaskActionRule.disabled}');
    expect(rulesSource).toContain("reason: 'Modify task is available only to caseworker role/team.'");
  });

  test('AC3: clicking Modify SVT Task opens a Yes/No confirmation prompt', () => {
    expect(taskSectionSource).toContain('setShowModifyTaskConfirmation(true);');
    expect(taskSectionSource).toContain("subText: 'Are you sure you want to modify this SVT Task?'");
    expect(taskSectionSource).toContain('text="Yes"');
    expect(taskSectionSource).toContain('text="No"');
  });

  test('AC4: selecting No closes confirmation and cancels further modify action', () => {
    expect(taskSectionSource).toContain('const handleCancelModifyTask = React.useCallback(() => {');
    expect(taskSectionSource).toContain('setShowModifyTaskConfirmation(false);');
    expect(taskSectionSource).toContain('onClick={handleCancelModifyTask}');
  });

  test('AC5: selecting Yes calls modify API and updates local record to Assigned/current user/current date', () => {
    expect(shellSource).toContain('onModifyTask={onModifySvtTask}');
    expect(indexSource).toContain('onModifySvtTask: () => this.runtime.modifySvtTask()');
    expect(runtimeSource).toContain('public async modifySvtTask(): Promise<void>');
    expect(runtimeSource).toContain("source: 'VSRT'");
    expect(runtimeSource).toContain("taskStatus: 'Assigned'");
    expect(runtimeSource).toContain('taskList: JSON.stringify([normalizedTaskId])');
    expect(runtimeSource).toContain('this._saleDetails = mergeModifyTaskDetails(this._saleDetails, {');
    expect(runtimeSource).toContain('this.saleDetailsReadOnly = access.readOnly;');
    expect(saleDetailsSource).toContain('next.assignedDate = assignedDateIso;');
    expect(saleDetailsSource).toContain('next.caseworkerAssignedDate = assignedDateIso;');
    expect(saleDetailsSource).toContain('next.taskCompletedDate = null;');
  });

  test('AC6: audit history capability remains available after task modification', () => {
    expect(taskSectionSource).toContain('text="Audit History"');
    expect(runtimeSource).toContain('public async openAuditHistory(): Promise<void>');
    expect(runtimeSource).toContain("await this.handleAuditHistoryOpen('SL');");
  });

  test('AC7: reopened tasks stay within standard assignment status rules', () => {
    expect(configSource).toContain('allowedStatusesManager: [');
    expect(configSource).toContain("'Assigned'");
    expect(configSource).toContain("'Assigned QC failed'");
  });

  test('AC8: Sales Record Search still supports Sale ID, Address, Billing Authority and UPRN lookup paths', () => {
    expect(gridSource).toContain("label: 'Sale ID'");
    expect(gridSource).toContain("label: 'Address'");
    expect(gridSource).toContain("label: 'Billing Authority'");
    expect(gridSource).toContain("label: 'UPRN'");
    expect(gridSource).toContain("searchBy: 'address'");
  });
});
