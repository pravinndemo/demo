import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('accessibility review gate: inactive controls', () => {
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const cssSource = readRepoFile('DetailsListVOA/css/DetailsListVOA.css');

  test('removes inactive action controls from keyboard navigation with true disabled states', () => {
    expect(gridSource).toContain('disabled={unavailable}');
    expect(gridSource).toContain('disabled={assignLoading}');
    expect(gridSource).not.toContain('aria-disabled={unavailable || undefined}');
    expect(gridSource).toContain('voa-focusable-disabled-button');
    expect(gridSource).toContain('voa-focusable-disabled-field');
  });

  test('keeps the calculated to-date field descriptive while removing it from keyboard navigation', () => {
    expect(gridSource).toContain('voa-prefilter-to-date-note');
    expect(gridSource).toContain('disabled');
    expect(gridSource).toContain('calculated automatically');
  });

  test('adds a horizontal overflow cue for wide result tables', () => {
    expect(gridSource).toContain('voa-grid-results--scroll-right');
    expect(gridSource).toContain('voa-grid-results-scroll-hint');
    expect(cssSource).toContain('.voa-grid-results--scroll-right');
  });

  test('styles inactive controls with a disabled appearance', () => {
    expect(cssSource).toContain('.voa-focusable-disabled-button');
    expect(cssSource).toContain('.voa-focusable-disabled-field');
  });

  test('keeps inline prefilter errors near their controls and announces them as assertive live messages', () => {
    expect(gridSource).toContain('prefilter-billing-error');
    expect(gridSource).toContain('prefilter-user-error');
    expect(gridSource).toContain("role=\"alert\"");
    expect(gridSource).toContain("aria-live=\"assertive\"");
    expect(gridSource).toContain("billingAuthorityOptionsError ? 'prefilter-billing-error' : undefined");
    expect(gridSource).toContain("prefilterUserOptionsError ? 'prefilter-user-error' : undefined");
    expect(gridSource).toContain('prefilterFromDateError && (');
  });
});
