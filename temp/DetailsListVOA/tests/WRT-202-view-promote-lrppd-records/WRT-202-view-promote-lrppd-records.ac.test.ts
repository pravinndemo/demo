import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-202 HM LRPPD View and Promote AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const wlttSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/WlttSection.tsx');
  const lrppdSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/LrppdSection.tsx');
  const navigatorSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/shared/RecordNavigator.tsx');
  const verificationSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/SalesVerificationSection.tsx');
  const mergeSource = readRepoFile('DetailsListVOA/services/runtime/sale-details.ts');

  test('AC1: HM LRPPD section is shown after WLTT section', () => {
    expect(shellSource).toContain('<WlttSection');
    expect(shellSource).toContain('<LrppdSection');
    expect(shellSource.indexOf('<WlttSection')).toBeLessThan(shellSource.indexOf('<LrppdSection'));
    expect(lrppdSectionSource).toContain('HM Land Registry Price Paid Data');
    expect(wlttSectionSource).toContain('Stamp Duty Land Tax / Welsh Land Transaction Tax');
  });

  test('AC2: HM LRPPD section exposes required fields and multi-record navigation count', () => {
    expect(lrppdSectionSource).toContain('label="ID"');
    expect(lrppdSectionSource).toContain('label="Address"');
    expect(lrppdSectionSource).toContain('label="Transaction Price"');
    expect(lrppdSectionSource).toContain('label="Type of Property"');
    expect(lrppdSectionSource).toContain('label="Tenure Type"');
    expect(lrppdSectionSource).toContain('label="Price Paid Category"');
    expect(lrppdSectionSource).toContain('label="Old/New"');
    expect(lrppdSectionSource).toContain('label="Transaction Date"');
    expect(navigatorSource).toContain('Record count ${total > 0 ? currentIndex + 1 : 0} of ${total}');
  });

  test('AC3: HM LRPPD current-master indicator and promote action update Sales Summary in-shell', () => {
    expect(lrppdSectionSource).toContain('Current Master Record');
    expect(lrppdSectionSource).toContain('Promote Sale to Master');
    expect(shellSource).toContain("source: 'LRPPD'");
    expect(shellSource).toContain('salePrice: record.transactionPrice');
    expect(shellSource).toContain('transactionDate: record.transactionDate');
    expect(shellSource).toContain('hpiAdjustedPrice: record.hpiAdjustedPrice');
    expect(shellSource).toContain('ratio: record.ratio');
    expect(shellSource).toContain('saleSource: promotedMasterRecord.source');
    expect(shellSource).toContain('LR PPD Record is Promoted to Master');
  });

  test('AC4: promoted HM LRPPD master is persisted only in submit payload merge path', () => {
    expect(shellSource).toContain('promotedMasterRecord={promotedMasterRecord}');
    expect(verificationSectionSource).toContain('promotedMasterRecord,');
    expect(mergeSource).toContain('const promotedMasterRecord = payload.promotedMasterRecord;');
    expect(mergeSource).toContain("const source = normalizePromotedMasterSource(promotedMasterRecord.source);");
    expect(mergeSource).toContain('next.lrpddId = promotedId;');
    expect(mergeSource).toContain('next.lrppdId = promotedId;');
  });
});
