import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-204 Accessing External Maps and Hyperlinks AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const taskSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationTaskSection.tsx');
  const hyperlinkSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/HyperlinksSection.tsx');
  const linkCardSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/shared/ExternalLinkCard.tsx');
  const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
  const constantsSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/constants.ts');
  const manifestSource = readRepoFile('DetailsListVOA/ControlManifest.Input.xml');
  const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
  const indexSource = readRepoFile('DetailsListVOA/index.ts');

  test('AC1: Hyperlinks section appears under Sales Verification Task Details and shows required link titles', () => {
    expect(taskSectionSource).toContain('Sales Verification Task Details');
    expect(shellSource).toContain('<SalesVerificationTaskSection');
    expect(shellSource).toContain('<HyperlinksSection links={model.externalLinks} newTabHintId={NEW_TAB_HINT_ID} />');
    expect(shellSource.indexOf('<SalesVerificationTaskSection')).toBeLessThan(shellSource.indexOf('<HyperlinksSection'));

    expect(viewModelSource).toContain("title: 'VMS'");
    expect(viewModelSource).toContain("title: 'Zoopla'");
    expect(viewModelSource).toContain("title: 'Rightmove'");
    expect(viewModelSource).toContain("title: 'EPC'");
    expect(hyperlinkSectionSource).toContain('Hyperlinks');
  });

  test('AC2: VMS hyperlink uses configurable base URL, coordinates, and zoom level 13', () => {
    expect(manifestSource).toContain('name="vmsBaseUrl"');
    expect(runtimeSource).toContain('getVmsBaseUrl(): string');
    expect(indexSource).toContain('vmsBaseUrl: this.runtime.getVmsBaseUrl()');

    expect(constantsSource).toContain("vmsCenterBase: 'https://geo-dev-vms-4x.voa.ns3n.corp.hmrc.gov.uk/?center='");
    expect(constantsSource).toContain("vmsSpatialReferenceSuffix: ',27700'");
    expect(constantsSource).toContain("vmsZoomLevelSuffix: '&level=13#'");

    expect(viewModelSource).toContain("const configuredVmsBaseUrl = normalizeLinkValue(vmsBaseUrl ?? '');");
    expect(viewModelSource).toContain('const vmsCenterBase = (() => {');
    expect(viewModelSource).toContain("return `${trimmedBase}/?center=`;");
    expect(viewModelSource).toContain("const vmsX = normalizeLinkValue(getValue(links, 'vmsX'));");
    expect(viewModelSource).toContain("const vmsY = normalizeLinkValue(getValue(links, 'vmsY'));");
    expect(viewModelSource).toContain('`${vmsCenterBase}${vmsX},${vmsY}${EXTERNAL_LINK_URL_PARTS.vmsSpatialReferenceSuffix}${EXTERNAL_LINK_URL_PARTS.vmsZoomLevelSuffix}`');
  });

  test('AC3: Zoopla, Rightmove, and EPC hyperlinks use static URL parts and open in a new tab', () => {
    expect(constantsSource).toContain("zooplaBase: 'https://www.zoopla.co.uk/house-prices/'");
    expect(constantsSource).toContain("rightmoveBase: 'https://www.rightmove.co.uk/house-prices/'");
    expect(constantsSource).toContain("rightmoveSuffix: '.html?page=1'");
    expect(constantsSource).toContain("epcBase: 'https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode='");

    expect(viewModelSource).toContain('`${EXTERNAL_LINK_URL_PARTS.zooplaBase}${zooplaRaw}`');
    expect(viewModelSource).toContain('`${EXTERNAL_LINK_URL_PARTS.rightmoveBase}${rightMoveRaw}${EXTERNAL_LINK_URL_PARTS.rightmoveSuffix}`');
    expect(viewModelSource).toContain('`${EXTERNAL_LINK_URL_PARTS.epcBase}${epcRaw}`');

    expect(linkCardSource).toContain('target="_blank"');
    expect(linkCardSource).toContain('rel="noreferrer"');
  });

  test('AC4: missing link data renders disabled state with insufficient-data tooltip/message', () => {
    expect(constantsSource).toContain("EXTERNAL_LINK_DISABLED_REASON = 'Insufficient property data to open link'");
    expect(viewModelSource).toContain('disabledReason: EXTERNAL_LINK_DISABLED_REASON');
    expect(linkCardSource).toContain('className="voa-link-card__button voa-link-card__button--disabled"');
    expect(linkCardSource).toContain('aria-disabled="true"');
    expect(linkCardSource).toContain('title={disabledReason}');
    expect(linkCardSource).toContain('<span>Link unavailable</span>');
  });
});
