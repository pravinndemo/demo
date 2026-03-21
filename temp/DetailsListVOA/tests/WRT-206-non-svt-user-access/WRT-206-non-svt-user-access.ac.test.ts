import fs from 'fs';
import path from 'path';
import {
  HOME_JOURNEY_SCREEN_LABELS,
  HOME_JOURNEY_TILE_DEFINITIONS,
  HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA,
} from '../../constants/HomeJourney';
import { resolveScreenConfig } from '../../utils/ScreenResolution';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-206 Non-SVT User Access AC', () => {
  const managerJourneySource = readRepoFile('DetailsListVOA/components/HomeShell/ManagerJourneyShell.tsx');

  test('AC1: non-SVT persona can access only Sales Record Search workspace', () => {
    const nonSvtKeys = HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA.none;
    expect(nonSvtKeys).toHaveLength(1);
    expect(nonSvtKeys[0]).toBe('salesSearch');
  });

  test('AC1: Sales Record Search tile label and screen metadata remain stable', () => {
    const salesTile = HOME_JOURNEY_TILE_DEFINITIONS.find((tile) => tile.key === 'salesSearch');

    expect(salesTile).toBeDefined();
    expect(salesTile?.title).toBe('Sales Record Search');
    expect(salesTile?.canvasScreenName).toBe('Sales Record Search');
    expect(HOME_JOURNEY_SCREEN_LABELS.salesSearch.tileTitle).toBe('Sales Record Search');
  });

  test('AC1: Sales Record Search resolves to the sales table/grid source', () => {
    const resolved = resolveScreenConfig('Sales Record Search', undefined, 'sales');

    expect(resolved.kind).toBe('salesSearch');
    expect(resolved.tableKey).toBe('sales');
    expect(resolved.sourceCode).toBe('SRS');
  });

  test('AC1: manager journey treats persona none as restricted access, not no-access hard block', () => {
    expect(managerJourneySource).toContain("|| persona === 'none';");
    expect(managerJourneySource).toContain('if (!parsed.hasSvtAccess) {');
    expect(managerJourneySource).toContain("const hasWorkspaceAccessBlock = !userContext.hasSvtAccess && visibleTiles.length === 0;");
    expect(managerJourneySource).toContain('disabled={isTileSelectionDisabled}');
    expect(managerJourneySource).not.toContain("parsed.persona === 'none'");
  });
});

