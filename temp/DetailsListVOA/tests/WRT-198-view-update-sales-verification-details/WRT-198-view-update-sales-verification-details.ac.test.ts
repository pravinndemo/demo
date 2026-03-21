import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-198 View and Update Sales Verification Details AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const sectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationSection.tsx');
  const cssSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.css');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');

  test('AC1: Sales Verification section is present and ordered after Sales Particulars', () => {
    expect(shellSource).toContain('<SalesParticularSection model={model.salesParticular} onOpenReference={openReferenceModal} readOnly={readOnly} onDraftChange={setSalesParticularDraft} />');
    expect(shellSource).toContain('<SalesVerificationSection');
    expect(shellSource.indexOf('<SalesParticularSection')).toBeLessThan(shellSource.indexOf('<SalesVerificationSection'));
    expect(sectionSource).toContain('Sales Verification');
  });

  test('AC2: Is this sale useful uses mandatory Yes/No options with no default', () => {
    expect(sectionSource).toContain("{ key: 'yes', text: 'Yes' }");
    expect(sectionSource).toContain("{ key: 'no', text: 'No' }");
    expect(sectionSource).toContain('placeholder="Select whether the sale is useful"');
    expect(sectionSource).toContain("'Select whether the sale is useful or not'");
  });

  test('AC3: Why not useful is shown only when useful = No and uses required validation', () => {
    expect(sectionSource).toContain("const isNotUseful = isSaleUsefulKey === 'no';");
    expect(sectionSource).toContain('{isNotUseful && (');
    expect(sectionSource).toContain("'Enter why the sale is not useful'");

    const orderedReasons = [
      'Connected parties',
      'Dilapidated property',
      'Exchange of property',
      'Includes other property',
      'Market value but not useful for modelling - Specialist property',
      'Market value but not useful for modelling - Other',
      'Not market value',
      'Reflects development potential',
      'Sale linked to incorrect property',
      'Special purchaser',
      'Tenant purchase',
      'Undivided share',
    ];

    let lastIndex = -1;
    orderedReasons.forEach((reason) => {
      const idx = sectionSource.indexOf(reason);
      expect(idx).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    });
  });

  test('AC4: Additional Notes remains optional with 2000-character limit and remaining counter', () => {
    expect(sectionSource).toContain('const maxNotesLength = 2000;');
    expect(sectionSource).toContain('maxLength={maxNotesLength}');
    expect(sectionSource).toContain('Character(s) remaining: {notesRemaining.toLocaleString(\'en-GB\')}');
  });

  test('AC5: Validation errors are rendered as bold red field-level messages', () => {
    expect(sectionSource).toContain('voa-sales-verification-row__error');
    expect(cssSource).toContain('.voa-sales-verification-row__error');
    expect(cssSource).toContain('color: #b91c1c;');
    expect(cssSource).toContain('font-weight: 700;');
  });

  test('AC6: edit access allows assigned caseworker edits only for Assigned and Assigned QC Failed', () => {
    expect(runtimeSource).toContain("const EDITABLE_CASEWORKER_STATUSES = new Set(['assigned', 'assigned qc failed']);");
    expect(runtimeSource).toContain('private canEditAsAssignedCaseworker(detailsPayload: string): boolean');
    expect(runtimeSource).toContain('return this.isSaleRecordAssignedToCurrentUser(detailsPayload);');
    expect(runtimeSource).toContain('const canEditAsCaseworker = taskExists && this.canEditAsAssignedCaseworker(detailsPayload);');
    expect(runtimeSource).toContain("const persona = normalizeTextValue(root.svtPersona ?? root.persona).toLowerCase();");
    expect(runtimeSource).toContain("if (persona === 'user') {");
    expect(runtimeSource).toContain('if (!this.isManagerAssignmentContext()) {');
  });
});

