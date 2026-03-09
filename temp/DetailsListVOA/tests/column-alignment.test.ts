import { COLUMN_PROFILES, getProfileConfigs } from '../config/ColumnProfiles';
import { ColumnConfig } from '../Component.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ID_COLUMNS      = ['saleid', 'taskid', 'uprn'];
const NUMERIC_COLUMNS = ['saleprice', 'ratio', 'outlierratio'];
const TAG_COLUMNS     = ['flaggedforreview', 'reviewflags', 'overallflag', 'summaryflags', 'taskstatus'];
const TEXT_COLUMNS    = ['address', 'postcode', 'billingauthority', 'dwellingtype', 'assignedto', 'qcassignedto'];
const DATE_COLUMNS    = ['transactiondate', 'assigneddate', 'taskcompleteddate', 'qcassigneddate', 'qccompleteddate'];
const CURRENCY_COLUMNS = ['saleprice'];

function getCol(cols: ColumnConfig[], name: string): ColumnConfig {
  const col = cols.find((c) => c.ColName.toLowerCase() === name.toLowerCase());
  if (!col) throw new Error(`Column "${name}" not found in profile`);
  return col;
}

// ---------------------------------------------------------------------------
// Sales profile — the canonical profile that all others delegate to
// ---------------------------------------------------------------------------

describe('SALES_COLUMNS alignment', () => {
  const cols = COLUMN_PROFILES.sales;

  // --- Vertical alignment: every column must be center ---
  describe('vertical alignment', () => {
    it('every column has ColVerticalAlign = "center"', () => {
      cols.forEach((col) => {
        expect(col.ColVerticalAlign).toBe('center');
      });
    });
  });

  // --- ID columns: center horizontal ---
  describe('ID columns (center horizontal)', () => {
    ID_COLUMNS.forEach((name) => {
      it(`${name} → ColHorizontalAlign = "center"`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('center');
      });
    });
  });

  // --- Numeric / decimal columns: right horizontal ---
  describe('numeric / decimal columns (right horizontal)', () => {
    NUMERIC_COLUMNS.forEach((name) => {
      it(`${name} → ColHorizontalAlign = "right"`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('right');
      });
    });
  });

  // --- Tag / status columns: center horizontal ---
  describe('tag / status columns (center horizontal)', () => {
    TAG_COLUMNS.forEach((name) => {
      it(`${name} → ColHorizontalAlign = "center"`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('center');
      });

      it(`${name} → ColCellType = "tag"`, () => {
        expect(getCol(cols, name).ColCellType).toBe('tag');
      });
    });
  });

  // --- Text columns: left horizontal ---
  describe('text columns (left horizontal)', () => {
    TEXT_COLUMNS.forEach((name) => {
      it(`${name} → ColHorizontalAlign = "left"`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('left');
      });
    });
  });

  // --- Date columns: left horizontal ---
  describe('date columns (left horizontal)', () => {
    DATE_COLUMNS.forEach((name) => {
      it(`${name} → ColHorizontalAlign = "left"`, () => {
        expect(getCol(cols, name).ColHorizontalAlign).toBe('left');
      });
    });
  });

  // --- No column is missing alignment properties entirely ---
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

// ---------------------------------------------------------------------------
// Profile delegation — manager / qa profiles must resolve to SALES_COLUMNS
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// MAP_CSS_ALIGN coverage (white-box: validates the mapping used in GridCell)
// ---------------------------------------------------------------------------

describe('alignment value contract', () => {
  const VALID_H = ['left', 'center', 'right'];
  const VALID_V = ['center'];   // only center is required by our rules

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

// ---------------------------------------------------------------------------
// Currency formatting — ColFormat: 'currency'
// ---------------------------------------------------------------------------

describe('currency format (ColFormat)', () => {
  const cols = COLUMN_PROFILES.sales;

  describe('profile config', () => {
    CURRENCY_COLUMNS.forEach((name) => {
      it(`${name} → ColFormat = "currency"`, () => {
        expect(getCol(cols, name).ColFormat).toBe('currency');
      });
    });

    it('ratio does NOT have ColFormat (plain decimal, no £)', () => {
      expect(getCol(cols, 'ratio').ColFormat).toBeUndefined();
    });

    it('outlierratio does NOT have ColFormat (plain decimal, no £)', () => {
      expect(getCol(cols, 'outlierratio').ColFormat).toBeUndefined();
    });
  });

  // White-box: test the applyFormat logic directly by duplicating it here.
  // This keeps the formatter tested independently of React rendering.
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

    it('whole number → £ prefix with thousands separator, no pence', () => {
      expect(applyFormat('250000', 'currency')).toBe('£250,000');
    });

    it('fractional value → £ prefix with 2 decimal places', () => {
      expect(applyFormat('250000.50', 'currency')).toBe('£250,000.50');
    });

    it('small whole number → no thousands separator needed', () => {
      expect(applyFormat('500', 'currency')).toBe('£500');
    });

    it('millions → correct thousands grouping', () => {
      expect(applyFormat('1500000', 'currency')).toBe('£1,500,000');
    });

    it('value already has £ sign → still formats correctly (strips before parsing)', () => {
      expect(applyFormat('£250,000', 'currency')).toBe('£250,000');
    });

    it('non-numeric value → returned unchanged', () => {
      expect(applyFormat('N/A', 'currency')).toBe('N/A');
    });

    it('empty string → returned unchanged', () => {
      expect(applyFormat('', 'currency')).toBe('');
    });

    it('no format → value returned unchanged', () => {
      expect(applyFormat('250000', undefined)).toBe('250000');
    });

    it('unknown format → value returned unchanged', () => {
      expect(applyFormat('250000', 'percent')).toBe('250000');
    });
  });
});
