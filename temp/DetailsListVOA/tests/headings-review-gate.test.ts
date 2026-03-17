import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('headings review gate', () => {
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const legacyGridSource = readRepoFile('DetailsListVOA/grid/Grid.tsx');
  const spatialBrowserSource = readRepoFile('DetailsListVOA/components/SpatialUnitBrowser/StatutorySpatialUnitBrowser.tsx');

  test('uses a page-level h1 for the active grid title', () => {
    expect(gridSource).toContain('<Text as="h1" variant={ultraCompactViewport ? \'mediumPlus\' : \'large\'} className="voa-command-bar__title">');
    expect(gridSource).not.toContain('<Text as="h2" variant={ultraCompactViewport ? \'mediumPlus\' : \'large\'} className="voa-command-bar__title">');
  });

  test('uses a screen-level h1 for the assign dialog title and an h2 for the user list section', () => {
    expect(gridSource).toContain('<Text as="h1" id="assign-screen-title" variant="xLarge" styles={{ root: { marginLeft: 12, fontWeight: 600 } }}>');
    expect(gridSource).toContain('<Text as="h2" variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>');
  });

  test('keeps the spatial lookup title on a real heading instead of visual text only', () => {
    expect(spatialBrowserSource).toContain('<Text as="h1" variant="xLarge">Statutory Spatial Unit Lookup</Text>');
    expect(spatialBrowserSource).not.toContain('<Text variant="xLarge">Statutory Spatial Unit Lookup</Text>');
  });

  test('keeps the legacy grid copy aligned with the active heading treatment', () => {
    expect(legacyGridSource).toContain('<Text as="h1" id="assign-screen-title" variant="xLarge" styles={{ root: { marginLeft: 12, fontWeight: 600 } }}>');
    expect(legacyGridSource).toContain('<Text as="h2" variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>');
  });
});
