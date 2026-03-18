import fs from 'fs';
import path from 'path';
import { COLUMN_PROFILES, getProfileConfigs } from '../config/ColumnProfiles';
import { ColumnConfig } from '../Component.types';

const IDENTIFIER_COLUMNS_LEFT = ['saleid'];
const IDENTIFIER_COLUMNS_CENTER = ['taskid', 'uprn'];
const NUMERIC_COLUMNS = ['saleprice', 'ratio', 'outlierratio'];
const TAG_COLUMNS_CENTER = ['flaggedforreview'];
const TAG_COLUMNS_LEFT = ['reviewflags', 'overallflag', 'summaryflags', 'taskstatus'];
const TEXT_COLUMNS = ['address', 'postcode', 'billingauthority', 'dwellingtype', 'assignedto', 'qcassignedto'];
const DATE_COLUMNS = ['transactiondate', 'assigneddate', 'taskcompleteddate', 'qcassigneddate', 'qccompleteddate'];
const CURRENCY_COLUMNS = ['saleprice'];
const TABULAR_NUMERAL_COLUMNS = [
  'saleid',
  'taskid',
  'uprn',
  'transactiondate',
  'saleprice',
  'ratio',
  'outlierratio',
  'assigneddate',
  'taskcompleteddate',
  'qcassigneddate',
  'qccompleteddate',
];

const repoRoot = path.resolve(__dirname, '..', '..');

function getCol(cols: ColumnConfig[], name: string): ColumnConfig {
  const col = cols.find((c) => c.ColName.toLowerCase() === name.toLowerCase());
  if (!col) throw new Error(`Column "${name}" not found in profile`);
  return col;
}

describe('SALES_COLUMNS alignment', () => {
  const cols = COLUMN_PROFILES.sales;

  describe('vertical alignment', () => {
    it('every column has ColVerticalAlign = center', () => {
      cols.forEach((col) => {
        expect(col.ColVerticalAlign).toBe('center');
      });
    });
  });

  describe('identifier columns (left horizontal)', () => {
    IDENTIFIER_COLUMNS_LEFT.forEach((name) => {
      it(`${name} -> ColHorizontalAlign = left`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('left');
      });
    });
  });

  describe('identifier columns (center horizontal)', () => {
    IDENTIFIER_COLUMNS_CENTER.forEach((name) => {
      it(`${name} -> ColHorizontalAlign = center`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('center');
      });
    });
  });

  describe('numeric/decimal columns (right horizontal)', () => {
    NUMERIC_COLUMNS.forEach((name) => {
      it(`${name} -> ColHorizontalAlign = right`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('right');
      });
    });
  });

  describe('tag/status columns (center horizontal)', () => {
    TAG_COLUMNS_CENTER.forEach((name) => {
      it(`${name} -> ColHorizontalAlign = center`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('center');
      });
    });
  });

  describe('tag/status columns (left horizontal)', () => {
    TAG_COLUMNS_LEFT.forEach((name) => {
      it(`${name} -> ColHorizontalAlign = left`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('left');
      });
    });
  });

  describe('tag/status columns (tag cell type)', () => {
    [...TAG_COLUMNS_CENTER, ...TAG_COLUMNS_LEFT].forEach((name) => {
      it(`${name} -> ColCellType = tag`, () => {
        expect(getCol(cols, name).ColCellType).toBe('tag');
      });
    });
  });

  describe('text columns (left horizontal)', () => {
    TEXT_COLUMNS.forEach((name) => {
      it(`${name} -> ColHorizontalAlign = left`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('left');
      });
    });
  });

  describe('date columns (left horizontal)', () => {
    DATE_COLUMNS.forEach((name) => {
      it(`${name} -> ColHorizontalAlign = left`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('left');
      });
    });
  });

  describe('completeness', () => {
    it('no column is missing ColHorizontalAlign', () => {
      const missing = cols.filter((c) => !c.ColHorizontalAlign);
      expect(missing.map((c) => c.ColName)).toEqual([]);
    });

    it('no column is missing ColVerticalAlign', () => {
      const missing = cols.filter((c) => !c.ColVerticalAlign);
      expect(missing.map((c) => c.ColName)).toEqual([]);
    });
  });
});

describe('profile delegation', () => {
  const delegated = ['manager', 'qa', 'qaassign', 'qaview', 'sales'];

  delegated.forEach((key) => {
    it(`"${key}" profile resolves to the SALES column set`, () => {
      const resolved = getProfileConfigs(key);
      expect(resolved).toBe(COLUMN_PROFILES.sales);
    });
  });

  it('unknown key falls back to sales profile', () => {
    expect(getProfileConfigs('nonexistent')).toBe(COLUMN_PROFILES.sales);
  });

  it('empty key falls back to sales profile', () => {
    expect(getProfileConfigs('')).toBe(COLUMN_PROFILES.sales);
  });

  it('undefined key falls back to sales profile', () => {
    expect(getProfileConfigs(undefined)).toBe(COLUMN_PROFILES.sales);
  });
});

describe('alignment value contract', () => {
  const VALID_H = ['left', 'center', 'right'];
  const VALID_V = ['center'];

  it('all horizontal align values are in the allowed set', () => {
    const used = COLUMN_PROFILES.sales
      .map((c) => c.ColHorizontalAlign)
      .filter(Boolean) as string[];
    used.forEach((v) => expect(VALID_H).toContain(v));
  });

  it('all vertical align values are in the allowed set', () => {
    const used = COLUMN_PROFILES.sales
      .map((c) => c.ColVerticalAlign)
      .filter(Boolean) as string[];
    used.forEach((v) => expect(VALID_V).toContain(v));
  });
});

describe('currency format (ColFormat)', () => {
  const cols = COLUMN_PROFILES.sales;

  describe('profile config', () => {
    CURRENCY_COLUMNS.forEach((name) => {
      it(`${name} -> ColFormat = currency`, () => {
        expect(getCol(cols, name).ColFormat).toBe('currency');
      });
    });

    it('ratio does NOT have ColFormat', () => {
      expect(getCol(cols, 'ratio').ColFormat).toBeUndefined();
    });

    it('outlierratio does NOT have ColFormat', () => {
      expect(getCol(cols, 'outlierratio').ColFormat).toBeUndefined();
    });
  });

  describe('applyFormat logic', () => {
    function applyFormat(value: string, format?: string): string {
      if (!format || !value) return value;
      if (format.toLowerCase() === 'currency') {
        const num = parseFloat(String(value).replace(/[£,\s]/g, ''));
        if (isNaN(num)) return value;
        const hasDecimals = num % 1 !== 0;
        return '£' + num.toLocaleString('en-GB', {
          minimumFractionDigits: hasDecimals ? 2 : 0,
          maximumFractionDigits: hasDecimals ? 2 : 0,
        });
      }
      return value;
    }

    it('whole number -> pounds prefix with thousands separator, no decimals', () => {
      expect(applyFormat('250000', 'currency')).toBe('£250,000');
    });

    it('fractional value -> pounds prefix with 2 decimal places', () => {
      expect(applyFormat('250000.50', 'currency')).toBe('£250,000.50');
    });

    it('small whole number -> no thousands separator', () => {
      expect(applyFormat('500', 'currency')).toBe('£500');
    });

    it('millions -> correct thousands grouping', () => {
      expect(applyFormat('1500000', 'currency')).toBe('£1,500,000');
    });

    it('value already has pounds sign -> still formats correctly', () => {
      expect(applyFormat('£250,000', 'currency')).toBe('£250,000');
    });

    it('non-numeric value -> returned unchanged', () => {
      expect(applyFormat('N/A', 'currency')).toBe('N/A');
    });

    it('empty string -> returned unchanged', () => {
      expect(applyFormat('', 'currency')).toBe('');
    });

    it('no format -> value returned unchanged', () => {
      expect(applyFormat('250000', undefined)).toBe('250000');
    });

    it('unknown format -> value returned unchanged', () => {
      expect(applyFormat('250000', 'percent')).toBe('250000');
    });
  });
});

describe('tabular numerals contract', () => {
  const gridSource = fs.readFileSync(path.join(repoRoot, 'DetailsListVOA/Grid.tsx'), 'utf8');
  const cssSource = fs.readFileSync(path.join(repoRoot, 'DetailsListVOA/css/DetailsListVOA.css'), 'utf8');

  it('applies tabular numerals to identifier, date, and numeric columns', () => {
    expect(gridSource).toContain('const usesTabularNumerals = [');
    TABULAR_NUMERAL_COLUMNS.forEach((name) => {
      expect(gridSource).toContain(`'${name}'`);
    });
    expect(cssSource).toContain('.voa-col-tabular-cell');
    expect(cssSource).toContain('font-variant-numeric: tabular-nums;');
  });
});
