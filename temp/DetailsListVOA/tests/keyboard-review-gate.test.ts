import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('keyboard review gate', () => {
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const gridCellSource = readRepoFile('DetailsListVOA/grid/GridCell.tsx');

  test('keeps active custom controls keyboard-operable', () => {
    expect(gridCellSource).toContain('<button');
    expect(gridCellSource).toContain('type="button"');
    expect(gridCellSource).toContain('<Link');
    expect(gridSource).toContain('<FocusTrapZone>');
  });

  test('removes inactive controls from keyboard navigation by using disabled states', () => {
    expect(gridSource).toContain('disabled={unavailable}');
    expect(gridSource).toContain('disabled={assignLoading}');
    expect(gridSource).toContain('disabled');
    expect(gridSource).toContain('disabled={selectionControlsDisabled}');
    expect(gridSource).toContain('disabled={!!assignSearchUnavailableReason}');
    expect(gridSource).not.toContain('aria-disabled={selectionControlsDisabled || undefined}');
    expect(gridSource).not.toContain('aria-disabled={assignSearchUnavailableReason ? true : undefined}');
  });

  test('keeps grouped controls and scroll regions intentionally structured for keyboard flow', () => {
    expect(gridSource).toContain('role="group" aria-labelledby="voa-prefilter-date-range"');
    expect(gridSource).toContain('className="voa-selection-controls" role="group" aria-label={selectionGroupLabel}');
    expect(gridSource).toContain('tabIndex={0}');
    expect(gridSource).toContain('role="region"');
  });

  test('keeps date pickers manually editable with typed input support', () => {
    const allowTextInputMatches = gridSource.match(/allowTextInput/g) ?? [];
    expect(allowTextInputMatches.length).toBeGreaterThanOrEqual(5);
    expect(gridSource).toContain('parseDateFromString={parseDateInput}');
  });
});
