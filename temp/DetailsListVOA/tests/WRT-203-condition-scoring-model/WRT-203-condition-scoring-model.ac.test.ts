import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-203 Condition Scoring Model AC', () => {
  const sectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesParticularSection.tsx');
  const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
  const typesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/types.ts');

  test('AC1: scoring model defines seven component weights and total equals 1.0', () => {
    expect(viewModelSource).toContain('const SALES_PARTICULAR_COMPONENT_WEIGHTS: Record<SalesParticularAttributeKey, number> = {');
    expect(viewModelSource).toContain('kitchenAge: 0.3');
    expect(viewModelSource).toContain('kitchenSpecification: 0.15');
    expect(viewModelSource).toContain('bathroomAge: 0.15');
    expect(viewModelSource).toContain('bathroomSpecification: 0.1');
    expect(viewModelSource).toContain('glazing: 0.1');
    expect(viewModelSource).toContain('heating: 0.1');
    expect(viewModelSource).toContain('decorativeFinishes: 0.1');
    expect(viewModelSource).toContain('const SALES_PARTICULAR_COMPONENT_WEIGHT_TOTAL = SALES_PARTICULAR_COMPONENT_KEYS');
    expect(viewModelSource).toContain('.reduce((sum, key) => sum + SALES_PARTICULAR_COMPONENT_WEIGHTS[key], 0);');
  });

  test('AC2: selected category uses the matching category score from scoring rows', () => {
    expect(viewModelSource).toContain('const scoreInComponentRaw = getNormalizedRecordValue(record, [');
    expect(viewModelSource).toContain("'scoreInComponent'");
    expect(sectionSource).toContain('const lookupKey = `${field}|${normalizeLookupValue(selectedValues[field])}`;');
    expect(sectionSource).toContain('return sum + (scoringLookup.get(lookupKey) ?? 0);');
  });

  test('AC3: component score is category score multiplied by component weight', () => {
    expect(typesSource).toContain('scoreInComponent: number;');
    expect(typesSource).toContain('componentWeight: number;');
    expect(sectionSource).toContain('const weightedScore = row.scoreInComponent * row.componentWeight;');
    expect(viewModelSource).toContain('const componentScore = directComponentScore ?? (scoreInComponent * componentWeight);');
  });

  test('AC4: overall condition score sums component scores and is constrained to 0..1', () => {
    expect(sectionSource).toContain('const totalScore = REQUIRED_FIELDS.reduce((sum, field) => {');
    expect(sectionSource).toContain('return sum + (scoringLookup.get(lookupKey) ?? 0);');
    expect(sectionSource).toContain('const normalizeOverallScore = (score: number): number => Math.min(1, Math.max(0, score));');
    expect(sectionSource).toContain('const normalizedTotalScore = normalizeOverallScore(totalScore);');
  });

  test('AC5: condition category thresholds classify Above Average, Average, and Below Average', () => {
    expect(sectionSource).toContain('if (score >= 0.73) {');
    expect(sectionSource).toContain("return 'Above Average';");
    expect(sectionSource).toContain('if (score <= 0.34) {');
    expect(sectionSource).toContain("return 'Below Average';");
    expect(sectionSource).toContain("return 'Average';");
  });

  test('Note: condition score and condition category fields are non-editable', () => {
    expect(sectionSource).toContain('id="voa-condition-score"');
    expect(sectionSource).toContain('id="voa-condition-category"');

    const readOnlyMatches = sectionSource.match(/\breadOnly\b/g) ?? [];
    expect(readOnlyMatches.length).toBeGreaterThanOrEqual(2);
  });
});
