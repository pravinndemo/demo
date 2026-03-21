import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-197 View Hereditament and Banding Details AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const bandingSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/BandingSection.tsx');
  const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
  const manifestSource = readRepoFile('DetailsListVOA/ControlManifest.Input.xml');

  test('AC1: sale details shows Hereditament and Banding Details below Hyperlinks', () => {
    expect(shellSource).toContain('<HyperlinksSection links={model.externalLinks} newTabHintId={NEW_TAB_HINT_ID} />');
    expect(shellSource).toContain('<BandingSection');
    expect(shellSource.indexOf('<HyperlinksSection')).toBeLessThan(shellSource.indexOf('<BandingSection'));
    expect(shellSource).toContain('address={model.address}');
    expect(shellSource).toContain('bandingEffectiveDate={model.bandingEffectiveDate}');
  });

  test('AC2: section title and read-only field labels are present in two-column layout', () => {
    expect(bandingSectionSource).toContain('Hereditament and Banding Details');
    expect(bandingSectionSource).toContain('<div className="voa-banding-layout">');
    expect(bandingSectionSource).toContain('<div className="voa-banding-layout__column">');
    expect(bandingSectionSource).toContain('label="Address"');
    expect(bandingSectionSource).toContain('label="Billing Authority"');
    expect(bandingSectionSource).toContain('label="Band"');
    expect(bandingSectionSource).toContain('label="Banding Effective Date"');
    expect(bandingSectionSource).toContain('label="Composite"');
  });

  test('AC3: Address hyperlink uses FxEnvironmentURL + suId and opens in new tab', () => {
    expect(viewModelSource).toContain('const suId = normalizeSuid(firstNonEmpty(');
    expect(viewModelSource).toContain("getValue(propertyAndBandingDetails, 'suId')");
    expect(viewModelSource).toContain("getValue(propertyAndBandingDetails, 'hereditamentId')");
    expect(viewModelSource).toContain('buildHereditamentUrl(fxEnvironmentUrl ?? \'\', suId)');

    expect(bandingSectionSource).toContain('target="_blank"');
    expect(bandingSectionSource).toContain('rel="noreferrer"');

    expect(manifestSource).toContain('name="fxEnvironmentUrl"');
  });

  test('AC4: banding effective date is formatted to DD/MM/YYYY', () => {
    expect(viewModelSource).toContain("const bandingEffectiveDate = formatValue(toUkDate(getValue(propertyAndBandingDetails, 'bandingEffectiveDate')));");
  });
});
