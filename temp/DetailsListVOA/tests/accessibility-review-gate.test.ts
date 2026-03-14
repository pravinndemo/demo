import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('accessibility review gate: unavailable controls', () => {
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const cssSource = readRepoFile('DetailsListVOA/css/DetailsListVOA.css');

  test('keeps the active grid free of hard-disabled focusable controls', () => {
    expect(gridSource).not.toMatch(/\sdisabled=\{/);
    expect(gridSource).toMatch(/aria-disabled=\{unavailable \|\| undefined\}/);
    expect(gridSource).toContain('voa-focusable-disabled-button');
    expect(gridSource).toContain('voa-focusable-disabled-field');
  });

  test('keeps the calculated to-date field focusable and descriptive', () => {
    expect(gridSource).toContain('voa-prefilter-to-date-note');
    expect(gridSource).toContain('readOnly');
    expect(gridSource).toContain('calculated automatically');
  });

  test('adds a horizontal overflow cue for wide result tables', () => {
    expect(gridSource).toContain('voa-grid-results--scroll-right');
    expect(gridSource).toContain('voa-grid-results-scroll-hint');
    expect(cssSource).toContain('.voa-grid-results--scroll-right');
  });

  test('styles focusable unavailable controls with a disabled appearance', () => {
    expect(cssSource).toContain('.voa-focusable-disabled-button');
    expect(cssSource).toContain('.voa-focusable-disabled-field');
  });
});
