import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-201 WLTT View and Promote AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const wlttSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/WlttSection.tsx');
  const navigatorSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/shared/RecordNavigator.tsx');
  const verificationSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationSection.tsx');
  const mergeSource = readRepoFile('DetailsListVOA/services/runtime/sale-details.ts');

  test('AC1: WLTT section is shown after Master Sale Details and Calculated Values', () => {
    expect(shellSource).toContain('<MasterSaleSection masterSale={displayMasterSale} />');
    expect(shellSource).toContain('<WlttSection');
    expect(shellSource.indexOf('<MasterSaleSection')).toBeLessThan(shellSource.indexOf('<WlttSection'));
    expect(wlttSectionSource).toContain('Stamp Duty Land Tax / Welsh Land Transaction Tax');
  });

  test('AC2: WLTT section exposes required fields and multi-record navigation count', () => {
    expect(wlttSectionSource).toContain('label="ID"');
    expect(wlttSectionSource).toContain('label="Transaction Price"');
    expect(wlttSectionSource).toContain('label="Transaction Premium"');
    expect(wlttSectionSource).toContain('label="Transaction Date"');
    expect(wlttSectionSource).toContain('label="Ground Rent"');
    expect(wlttSectionSource).toContain('label="Vendor(s)"');
    expect(wlttSectionSource).toContain('label="Vendee(s)"');
    expect(wlttSectionSource).toContain('label="Vendor Agent(s)"');
    expect(wlttSectionSource).toContain('label="Vendee Agent(s)"');
    expect(wlttSectionSource).toContain('label="Type of Property"');
    expect(wlttSectionSource).toContain('label="Tenure Type"');
    expect(wlttSectionSource).toContain('label="Lease From"');
    expect(wlttSectionSource).toContain('label="Lease Term"');
    expect(navigatorSource).toContain('Record count ${total > 0 ? currentIndex + 1 : 0} of ${total}');
  });

  test('AC3: WLTT current-master indicator and promote action update Sales Summary in-shell', () => {
    expect(wlttSectionSource).toContain('Current Master Record');
    expect(wlttSectionSource).toContain('Promote Sale to Master');
    expect(shellSource).toContain("source: 'WLTT'");
    expect(shellSource).toContain('salePrice: record.transactionPrice');
    expect(shellSource).toContain('transactionDate: record.transactionDate');
    expect(shellSource).toContain('hpiAdjustedPrice: record.hpiAdjustedPrice');
    expect(shellSource).toContain('ratio: record.ratio');
    expect(shellSource).toContain('saleSource: promotedMasterRecord.source');
    expect(shellSource).toContain('WLTT Record is Promoted to Master');
  });

  test('AC4: promoted WLTT master is persisted only in submit payload merge path', () => {
    expect(shellSource).toContain('promotedMasterRecord={promotedMasterRecord}');
    expect(verificationSectionSource).toContain('promotedMasterRecord,');
    expect(mergeSource).toContain('const promotedMasterRecord = payload.promotedMasterRecord;');
    expect(mergeSource).toContain("const source = normalizePromotedMasterSource(promotedMasterRecord.source);");
    expect(mergeSource).toContain('next.wltId = promotedId;');
    expect(mergeSource).toContain('next.wlttId = promotedId;');
  });
});
