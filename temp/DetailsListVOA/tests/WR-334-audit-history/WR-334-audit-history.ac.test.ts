import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WR-334 Audit History AC', () => {
  const taskSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationTaskSection.tsx');
  const verificationSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationSection.tsx');
  const modalSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/AuditHistoryModal.tsx');
  const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
  const rulesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/rules/ViewSaleActionRules.ts');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
  const saleDetailsRuntimeSource = readRepoFile('DetailsListVOA/services/runtime/sale-details.ts');
  const pluginSource = readRepoFile('VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetAuditLogs.cs');

  test('AC1: Audit History button fetches Sales Log history using auditType SL', () => {
    expect(taskSectionSource).toContain('text="Audit History"');
    expect(runtimeSource).toContain('public async openAuditHistory(): Promise<void>');
    expect(runtimeSource).toContain("await this.handleAuditHistoryOpen('SL');");
    expect(runtimeSource).toContain('{ taskId, auditType },');
  });

  test('AC2: View QC Log fetches QC history using auditType QC', () => {
    expect(verificationSectionSource).toContain('text="View QC Log"');
    expect(runtimeSource).toContain('public async openQcLog(): Promise<void>');
    expect(runtimeSource).toContain("await this.handleAuditHistoryOpen('QC');");
    expect(saleDetailsRuntimeSource).toContain("const scopeKey = auditType === 'QC' ? 'qc' : 'sl';");
  });

  test('AC3: audit modal displays user and change date metadata for each entry', () => {
    expect(modalSource).toContain('<strong>Changed By:</strong>');
    expect(modalSource).toContain('<strong>Changed On:</strong>');
    expect(modalSource).toContain('<strong>Event:</strong>');
  });

  test('AC4: audit entries are ordered with latest dates first, including UK date format handling', () => {
    expect(viewModelSource).toContain('const UK_AUDIT_DATE_TIME_PATTERN');
    expect(viewModelSource).toContain('const parseAuditDateTime = (value: string): number => {');
    expect(viewModelSource).toContain('const parsedChangedOn = parseAuditDateTime(changedOnRaw);');
    expect(viewModelSource).toContain('.sort((left, right) => right.sortValue - left.sortValue)');
  });

  test('AC5: audit field names are normalized to story-aligned labels in the view model', () => {
    expect(viewModelSource).toContain('const AUDIT_FIELD_LABEL_BY_KEY: Record<string, string> = {');
    expect(viewModelSource).toContain("taskstatus: 'Task Status'");
    expect(viewModelSource).toContain("assignedto: 'Assigned to'");
    expect(viewModelSource).toContain("padconfirmation: 'PAD Confirmation'");
    expect(viewModelSource).toContain("salesource: 'Sale Source'");
    expect(viewModelSource).toContain("wlttid: 'WLTT ID'");
    expect(viewModelSource).toContain("lrppdid: 'LRPPD ID'");
    expect(viewModelSource).toContain("hpiadjustedprice: 'HPI adjusted Price'");
    expect(viewModelSource).toContain("conditionscore: 'Condition Score'");
    expect(viewModelSource).toContain("conditioncategory: 'Condition Category'");
    expect(viewModelSource).toContain("issaleuseful: 'Is this Sale Useful?'");
    expect(viewModelSource).toContain("whynotuseful: 'Why is the sale not useful?'");
    expect(viewModelSource).toContain("additionalnotes: 'Additional Notes'");
    expect(viewModelSource).toContain("assignedat: 'Assigned Date'");
    expect(viewModelSource).toContain("qcassignedat: 'QC Assigned Date'");
    expect(viewModelSource).toContain("fieldName: formatValue(toAuditFieldLabel(getValue(change, 'fieldName'))),");
  });
  test('AC6: plugin validates audit type and calls endpoint with taskId + auditType query values', () => {
    expect(pluginSource).toContain('private static string NormalizeAuditType(string value)');
    expect(pluginSource).toContain('return upper == "QC" || upper == "SL" ? upper : null;');
    expect(pluginSource).toContain('query["taskId"] = taskId;');
    expect(pluginSource).toContain('query["auditType"] = auditType;');
    expect(pluginSource).toContain('taskId={HttpUtility.UrlEncode(taskId)}&auditType={HttpUtility.UrlEncode(auditType)}');
  });

  test('AC7: plugin transforms audit response by resolving changedBy and assignee GUID values to names', () => {
    expect(pluginSource).toContain('var userIds = CollectUserIds(payload);');
    expect(pluginSource).toContain('TryReplaceChangedByWithDisplayName(historyItem.ChangedBy, userNames, out var nextChangedBy)');
    expect(pluginSource).toContain('private static bool TryReplaceChangedByWithDisplayName(');
    expect(pluginSource).toContain('private static bool ShouldResolveAssigneeField(string fieldName)');
    expect(pluginSource).toContain('TryReplaceGuidTokensWithNames(change.NewValue, userNames, out var nextNewValue)');
  });

  test('Note: QC log access remains restricted to assigned caseworker, QC users, and managers', () => {
    expect(rulesSource).toContain('if (canProgressTask && readOnly) {');
    expect(rulesSource).toContain("reason: 'QC log is available to the assigned caseworker, QC users, and managers.'");
    expect(runtimeSource).toContain('private hasManagerAccess = false;');
    expect(runtimeSource).toContain('private hasQaAccess = false;');
  });
});

