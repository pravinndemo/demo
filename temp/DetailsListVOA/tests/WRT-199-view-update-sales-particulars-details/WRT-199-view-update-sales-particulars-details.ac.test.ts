import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-199 View and Update Sales Particulars AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const sectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesParticularSection.tsx');
  const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
  const rowSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/shared/SalesParticularDropdownRow.tsx');
  const cssSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.css');
  const rulesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/rules/ViewSaleActionRules.ts');

  test('AC1: Sales Particulars section is visible under HM Land Registry Price Paid Data and before Sales Verification', () => {
    expect(shellSource).toContain('<LrppdSection');
    expect(shellSource).toContain('<SalesParticularSection model={model.salesParticular} onOpenReference={openReferenceModal} readOnly={readOnly} onDraftChange={setSalesParticularDraft} />');
    expect(shellSource).toContain('<SalesVerificationSection');
    expect(shellSource.indexOf('<LrppdSection')).toBeLessThan(shellSource.indexOf('<SalesParticularSection'));
    expect(shellSource.indexOf('<SalesParticularSection')).toBeLessThan(shellSource.indexOf('<SalesVerificationSection'));
  });

  test('AC2: review status is mandatory and shows exact validation message', () => {
    expect(sectionSource).toContain("label=\"Sales Particulars\"");
    expect(sectionSource).toContain("{ key: 'details-available', text: 'Details available' }");
    expect(sectionSource).toContain("{ key: 'details-not-available', text: 'Details not available' }");
    expect(sectionSource).toContain("{ key: 'not-reviewed', text: 'Not reviewed' }");
    expect(sectionSource).toContain("nextErrors.reviewStatus = 'Enter the sales particulars';");
    expect(sectionSource).toContain('voa-sales-particular-review__error');
    expect(cssSource).toContain('.voa-sales-particular-review__error');
  });

  test('AC3: calculate is disabled for Details not available and Not reviewed', () => {
    expect(sectionSource).toContain('getSalesParticularCalculateActionRule({ readOnly, reviewStatusKey })');
    expect(sectionSource).toContain('const canCalculate = !calculateActionRule.disabled;');
    expect(rulesSource).toContain("reviewStatusKey === 'details-not-available' || reviewStatusKey === 'not-reviewed'");
  });

  test('AC4: dropdown values and scoring are sourced from Dataverse scoring rows, not hardcoded UI constants', () => {
    expect(sectionSource).toContain('const optionsByAttribute = model.optionsByAttribute;');
    expect(sectionSource).toContain('const scoringLookup = React.useMemo(() => buildScoringLookup(model.scoringRows), [model.scoringRows]);');
    expect(sectionSource).toContain('options={toOptions(optionsByAttribute.kitchenAge, kitchenAge)}');
    expect(sectionSource).toContain('options={toOptions(optionsByAttribute.heating, heating)}');
    expect(viewModelSource).toContain('const buildSalesParticularScoringRows = (');
    expect(viewModelSource).toContain("'svtConditionScoringModels'");
    expect(viewModelSource).toContain("heatingelements: 'heating'");
    expect(viewModelSource).toContain('const optionsByAttribute = buildSalesParticularOptions(scoringRows);');
  });

  test('AC5: mandatory field validation messages match specification for Details available', () => {
    expect(sectionSource).toContain("kitchenAge: 'Select the kitchen age'");
    expect(sectionSource).toContain("kitchenSpecification: 'Select the kitchen spec'");
    expect(sectionSource).toContain("bathroomAge: 'Select the bathroom age'");
    expect(sectionSource).toContain("bathroomSpecification: 'Select the bathroom spec'");
    expect(sectionSource).toContain("glazing: 'Select the glazing'");
    expect(sectionSource).toContain("heating: 'Select the heating'");
    expect(sectionSource).toContain("decorativeFinishes: 'Select the decorative finishes'");
    expect(rowSource).toContain('errorMessage?: string;');
    expect(rowSource).toContain('voa-sales-particular-row__error');
    expect(cssSource).toContain('.voa-sales-particular-row__error');
    expect(cssSource).toContain('color: #b91c1c;');
    expect(cssSource).toContain('font-weight: 700;');
  });

  test('AC6: calculate uses additive weighted component score and threshold-based condition category', () => {
    expect(sectionSource).toContain('const toComponentScore = (row: SalesParticularScoringModelRow): number | undefined => {');
    expect(sectionSource).toContain('const weightedScore = row.scoreInComponent * row.componentWeight;');
    expect(sectionSource).toContain('const totalScore = REQUIRED_FIELDS.reduce((sum, field) => {');
    expect(sectionSource).toContain('return sum + (scoringLookup.get(lookupKey) ?? 0);');
    expect(sectionSource).toContain('const normalizedTotalScore = normalizeOverallScore(totalScore);');
    expect(sectionSource).toContain('setConditionScore(toScoreText(normalizedTotalScore));');
    expect(sectionSource).toContain('setConditionCategory(toConditionCategory(normalizedTotalScore));');
    expect(sectionSource).toContain('if (score >= 0.73) {');
    expect(sectionSource).toContain("return 'Above Average';");
    expect(sectionSource).toContain('if (score <= 0.34) {');
    expect(sectionSource).toContain("return 'Below Average';");
    expect(sectionSource).toContain("return 'Average';");
  });
});




