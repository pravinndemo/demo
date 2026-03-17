import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('focus borders review gate', () => {
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const gridCellSource = readRepoFile('DetailsListVOA/grid/GridCell.tsx');
  const cssSource = readRepoFile('DetailsListVOA/css/DetailsListVOA.css');

  test('keeps repo-owned custom interactive elements on visible 2px solid focus outlines', () => {
    expect(cssSource).toContain('.voa-skip-links a:focus');
    expect(cssSource).toContain('.voa-back-button:focus');
    expect(cssSource).toContain('.voa-expand-button:focus');
    expect(cssSource).toContain('.voa-mda-link:focus');
    const customFocusOutlines = cssSource.match(/outline: 2px solid #1d70b8;/g) ?? [];
    expect(customFocusOutlines.length).toBeGreaterThanOrEqual(5);
  });

  test('keeps grid header and row focus indicators as inset outlines that fully encompass the component', () => {
    expect(cssSource).toContain('.PowerCATFluentDetailsList .ms-DetailsHeader-cell:focus,');
    expect(cssSource).toContain('.PowerCATFluentDetailsList .ms-DetailsRow:focus-within {');
    expect(cssSource).toContain('outline-offset: -2px;');
  });

  test('keeps link-style buttons on real button semantics while inheriting the visible focus outline class', () => {
    expect(gridCellSource).toContain("const buttonClassName = ['voa-mda-link', 'voa-mda-link-button', linkClassName].filter(Boolean).join(' ');");
    expect(gridCellSource).toContain('<button type="button" onClick={onClick} aria-label={label} className={buttonClassName}>');
  });

  test('uses a 2px focus outline for exact-match highlighted filter menu options', () => {
    expect(gridSource).toContain("outline: `2px solid ${highlightBorder}`");
    expect(gridSource).toContain("outlineOffset: '-2px'");
    expect(gridSource).not.toContain("outline: `1px solid ${highlightBorder}`");
  });
});
