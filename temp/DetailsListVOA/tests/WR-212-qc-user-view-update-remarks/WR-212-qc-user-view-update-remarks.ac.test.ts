import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WR-212 QC user can view sale record and update QC remarks AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const sectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationSection.tsx');
  const rulesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/rules/ViewSaleActionRules.ts');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
  const saleDetailsSource = readRepoFile('DetailsListVOA/services/runtime/sale-details.ts');

  test('AC1: sale details remain read-only while a dedicated QC section is conditionally shown for QC assignment', () => {
    expect(runtimeSource).toContain('private resolveQcSectionAccess(detailsPayload: string): { canSubmit: boolean; showSection: boolean }');
    expect(runtimeSource).toContain('if (!this.hasQaAccess) {');
    expect(runtimeSource).toContain("return { canSubmit: false, showSection: true };");
    expect(runtimeSource).toContain('const assignedToCurrentQcUser = this.isSaleRecordQcAssignedToCurrentUser(detailsPayload);');
    expect(runtimeSource).toContain("return { canSubmit: false, showSection: false };");
    expect(sectionSource).toContain('{showQcSection && (');
  });

  test('AC2: QC section shows undertaken-by, outcome pass/fail, and remarks with character counter', () => {
    expect(sectionSource).toContain('Quality Control');
    expect(sectionSource).toContain('QC undertaken by');
    expect(sectionSource).toContain('QC outcome');
    expect(sectionSource).toContain('QC remarks');
    expect(sectionSource).toContain("{ key: 'pass', text: 'Pass' }");
    expect(sectionSource).toContain("{ key: 'fail', text: 'Fail' }");
    expect(sectionSource).toContain('const qcRemarksMaxLength = 2000;');
    expect(sectionSource).toContain("Character(s) remaining: {qcRemarksRemaining.toLocaleString('en-GB')}");
  });

  test('AC3: submitting QC outcome calls submit QC API then writes reviewer, outcome, remarks, and timestamp', () => {
    expect(sectionSource).toContain('onSubmitQcOutcome?: (payload: QcOutcomeActionPayload) => void | Promise<void>;');
    expect(runtimeSource).toContain('public async submitQcOutcome(payload: QcOutcomeActionPayload): Promise<void> {');
    expect(runtimeSource).toContain("'submitQcRemarksApiName'");
    expect(runtimeSource).toContain("parseApiMutationResult(response, 'Submit QC outcome failed.')");
    expect(runtimeSource).toContain('this._saleDetails = mergeQcOutcomeDetails(this._saleDetails, payload);');
    expect(saleDetailsSource).toContain('export const mergeQcOutcomeDetails = (');
    expect(saleDetailsSource).toContain('qcOutcome,');
    expect(saleDetailsSource).toContain('qcRemark,');
    expect(saleDetailsSource).toContain('qcReviewedBy,');
    expect(saleDetailsSource).toContain('qcReviewedOn,');
  });

  test('AC4: QC fail requires remarks and maps task status to Assigned QC Failed; pass maps to Complete Passed QC', () => {
    expect(rulesSource).toContain('export const getSubmitQcOutcomeActionRule = ({');
    expect(rulesSource).toContain("reason: 'Please provide QC remarks before submitting',");
    expect(sectionSource).toContain("const qcRemarksRequiredMessage = 'Please provide QC remarks before submitting';");
    expect(saleDetailsSource).toContain("const nextTaskStatus = qcOutcome === 'Fail' ? 'Assigned QC Failed' : 'Complete Passed QC';");
    expect(sectionSource).toContain("return 'Submit Reassigned QC Outcome';");
  });

  test('AC5: QC section contract is wired through shell/controller for assigned QC visibility and editability', () => {
    expect(shellSource).toContain('canSubmitQcOutcome={canSubmitQcOutcome}');
    expect(shellSource).toContain('showQcSection={showQcSection}');
    expect(shellSource).toContain('qcAssignedTo={model.qcAssignedTo}');
    expect(runtimeSource).toContain("const EDITABLE_QC_STATUSES = new Set(['assigned to qc', 'reassigned to qc']);");
    expect(runtimeSource).toContain('private extractQcAssignedToCandidates(detailsPayload: string): string[] {');
  });
});

