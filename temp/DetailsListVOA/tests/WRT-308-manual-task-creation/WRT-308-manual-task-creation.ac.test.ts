import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-308 Manual Task Creation AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const sectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationTaskSection.tsx');
  const rulesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/rules/ViewSaleActionRules.ts');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
  const actionsSource = readRepoFile('DetailsListVOA/services/runtime/actions.ts');
  const indexSource = readRepoFile('DetailsListVOA/index.ts');
  const configSource = readRepoFile('DetailsListVOA/config/ControlConfig.ts');

  test('AC1: clicking Create Task from Sales Record details routes to manual task creation and auto-assignment context', () => {
    expect(shellSource).toContain('onCreateTask={onCreateManualTask');
    expect(shellSource).toContain('canCreateTask={canCreateManualTask}');
    expect(indexSource).toContain('onCreateManualTask: (saleId) => this.runtime.createManualTask(saleId)');
    expect(runtimeSource).toContain("sourceType: 'M'");
    expect(runtimeSource).toContain('createdBy: resolveCurrentUserId(this._context)');
    expect(runtimeSource).toContain('assignedTo: resolveCurrentUserDisplayName(this._context)');
    expect(configSource).toContain("manualTaskCreationApiName: 'voa_SvtManualTaskCreation'");
  });

  test('AC2: Create Task is disabled when a task ID already exists and for non-manager persona', () => {
    expect(sectionSource).toContain('getCreateTaskActionRule({');
    expect(sectionSource).toContain('const createTaskDisabled = createTaskActionRule.disabled;');
    expect(rulesSource).toContain('export const getCreateTaskActionRule = ({');
    expect(rulesSource).toContain("reason: 'A task ID already exists for this sale record.'");
    expect(rulesSource).toContain("reason: 'Create task is available only to manager role/team.'");
    expect(runtimeSource).toContain('const existingTaskId = resolveCurrentTaskIdFromDetails(this._saleDetails, this.selectedTaskId);');
    expect(runtimeSource).toContain("if (!this.hasManagerAccess) {");
    expect(runtimeSource).toContain("throw new Error('Manual task creation is restricted to manager role/team.');");
  });

  test('AC3: manual task IDs use the M- prefix path', () => {
    expect(runtimeSource).toContain("sourceType: 'M'");
    expect(actionsSource).toContain('/\\bM-\\d+\\b/i');
    expect(sectionSource).toContain("text={createTaskBusy ? 'Creating Task...' : 'Create Task'}");
  });
});
