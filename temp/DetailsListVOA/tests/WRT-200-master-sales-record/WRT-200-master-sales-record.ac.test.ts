import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('WRT-200 Master Sales Record AC', () => {
  const shellSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.tsx');
  const sectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/MasterSaleSection.tsx');
  const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
  const kvpRowSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/shared/KvpRow.tsx');
  const cssSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.css');

  test('AC1: Master Sale section appears under Property Attribute Details', () => {
    expect(shellSource).toContain('<PadSection');
    expect(shellSource).toContain('<MasterSaleSection masterSale={displayMasterSale} />');
    expect(shellSource.indexOf('<PadSection')).toBeLessThan(shellSource.indexOf('<MasterSaleSection masterSale={displayMasterSale} />'));
    expect(sectionSource).toContain('Master Sale Details and Calculated Values');
  });

  test('AC2: Master Sale fields and Repeat Sales labels are rendered with Latest Ratio Range', () => {
    expect(sectionSource).toContain('label="Sale Price"');
    expect(sectionSource).toContain('label="Transaction Date"');
    expect(sectionSource).toContain('label="Model Value"');
    expect(sectionSource).toContain('label="Sale Source"');
    expect(sectionSource).toContain('label="Overall Flag"');
    expect(sectionSource).toContain('label="Ratio"');
    expect(sectionSource).toContain('label="Review Flags"');
    expect(sectionSource).toContain('label="HPI Adjusted Price"');
    expect(sectionSource).toContain('label="Summary Flags"');
    expect(sectionSource).toContain('Repeat Sales');
    expect(sectionSource).toContain('label="Previous Ratio Range"');
    expect(sectionSource).toContain('label="Latest Ratio Range"');
  });

  test('AC3: Ratio help text is exposed as tooltip text on the Ratio label', () => {
    expect(sectionSource).toContain('labelTitle="Ratio = Model Value / HPI Adjusted Price"');
    expect(kvpRowSource).toContain('labelTitle?: string;');
    expect(kvpRowSource).toContain('title={labelTitle}');
  });

  test('AC4: Master sale mapping supports legacy/new key shapes and applies currency/date formatting', () => {
    expect(viewModelSource).toContain("const repeatSaleInfoRecord = getRecordFromKeys(details, ['repeatsSaleInfo', 'repeatSaleInfo']);");
    expect(viewModelSource).toContain("toUkCurrency(getValueFromRecordOrRoot(masterSaleRecord, details, ['salePrice', 'masterSalePrice', 'SalePrice']))");
    expect(viewModelSource).toContain("toUkDate(getValueFromRecordOrRoot(masterSaleRecord, details, ['transactionDate', 'masterSaleTransactionDate', 'TransactionDate']))");
    expect(viewModelSource).toContain("toUkCurrency(getValueFromRecordOrRoot(masterSaleRecord, details, ['modelValue', 'modelvalue', 'masterSaleModelValue', 'ModelValue']))");
    expect(viewModelSource).toContain("toUkCurrency(getValueFromRecordOrRoot(masterSaleRecord, details, ['hpiAdjustedPrice', 'masterSaleHpiAdjustedPrice', 'HpiAdjustedPrice']))");
    expect(viewModelSource).toContain("latestRatioRange: formatValue(getValueFromRecordOrRoot(repeatSaleInfoRecord, details, ['latestRatioRange', 'laterRatioRange', 'LatestRatioRange', 'LaterRatioRange']))");
  });

  test('AC5: Delimited text values are normalized for comma spacing and multiline flag display', () => {
    expect(viewModelSource).toContain(".split(',')");
    expect(viewModelSource).toContain(".split(';')");
    expect(viewModelSource).toContain("return lines.join('\\n');");
    expect(sectionSource).toContain('toMultilineValue(masterSale.reviewFlags)');
    expect(sectionSource).toContain('toMultilineValue(masterSale.summaryFlags)');
    expect(cssSource).toContain('.voa-master-sale-multiline');
    expect(cssSource).toContain('white-space: pre-line;');
  });
});

