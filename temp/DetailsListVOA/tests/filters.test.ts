import { isValidUkPostcode, normalizeUkPostcode, sanitizeFilters, type GridFilterState } from '../Filters';

const baseFilters = (overrides: Partial<GridFilterState>): GridFilterState => ({
  searchBy: 'saleId',
  ...overrides,
});

describe('Filters', () => {
  test('normalizeUkPostcode uppercases and trims', () => {
    expect(normalizeUkPostcode(' cf10 1aa ')).toBe('CF10 1AA');
  });

  test('isValidUkPostcode supports full and partial when allowed', () => {
    expect(isValidUkPostcode('CF10 1AA', false)).toBe(true);
    expect(isValidUkPostcode('CF10', false)).toBe(false);
    expect(isValidUkPostcode('CF10', true)).toBe(true);
  });

  test('sanitizeFilters trims and normalizes scalar fields', () => {
    const sanitized = sanitizeFilters(baseFilters({
      uprn: '12-34',
      taskId: '  A-100 ',
      saleId: ' S-1 ',
      postcode: 'cf10 1aa',
      address: ' 123 ',
      buildingNameNumber: ' 10 ',
      street: ' ',
      townCity: ' Town ',
      manualCheck: 'yes',
      source: ' SRS ',
      assignedTo: ' user ',
      qcAssignedTo: ' ',
      bacode: ' BA1 ',
    }));

    expect(sanitized.uprn).toBe('1234');
    expect(sanitized.taskId).toBe('A-100');
    expect(sanitized.saleId).toBe('S-1');
    expect(sanitized.postcode).toBe('CF10 1AA');
    expect(sanitized.address).toBe('123');
    expect(sanitized.buildingNameNumber).toBe('10');
    expect(sanitized.street).toBeUndefined();
    expect(sanitized.townCity).toBe('Town');
    expect(sanitized.manualCheck).toBe('yes');
    expect(sanitized.source).toBe('SRS');
    expect(sanitized.assignedTo).toBe('user');
    expect(sanitized.qcAssignedTo).toBeUndefined();
    expect(sanitized.bacode).toBe('BA1');
  });

  test('sanitizeFilters handles billingAuthority and summaryFlag', () => {
    const sanitized = sanitizeFilters(baseFilters({
      billingAuthority: [' Cardiff ', '', 'Newport', 'Bridgend', 'Extra'],
      summaryFlag: 'ab',
    }));

    expect(sanitized.billingAuthority).toEqual(['Cardiff', 'Newport', 'Bridgend']);
    expect(sanitized.summaryFlag).toBeUndefined();
  });

  test('sanitizeFilters handles dates and numeric ranges', () => {
    const sanitized = sanitizeFilters(baseFilters({
      transactionDate: { from: '2026-02-01', to: ' ' },
      salePrice: { mode: '>=', min: 100 },
      ratio: { mode: 'between' },
      outlierRatio: { mode: '<=', max: 2 },
      assignedDate: { from: '2026-02-01', to: '' },
      qcAssignedDate: { from: '', to: '' },
      qcCompletedDate: { from: '2026-02-02' },
    }));

    expect(sanitized.transactionDate?.from).toBe('2026-02-01');
    expect(sanitized.transactionDate?.to).toBeUndefined();
    expect(sanitized.salePrice).toEqual({ mode: '>=', min: 100, max: undefined });
    expect(sanitized.ratio).toBeUndefined();
    expect(sanitized.outlierRatio).toEqual({ mode: '<=', min: undefined, max: 2 });
    expect(sanitized.assignedDate).toEqual({ from: '2026-02-01', to: '' });
    expect(sanitized.qcAssignedDate).toBeUndefined();
    expect(sanitized.qcCompletedDate).toEqual({ from: '2026-02-02', to: undefined });
  });

  test('sanitizeFilters trims multi-select fields', () => {
    const sanitized = sanitizeFilters(baseFilters({
      dwellingType: [' Flat ', ''],
      reviewFlags: ['Low', ''],
      outlierKeySale: ['Key', ''],
      overallFlag: ['Remove', ''],
      taskStatus: ['Assigned', ''],
    }));

    expect(sanitized.dwellingType).toEqual(['Flat']);
    expect(sanitized.reviewFlags).toEqual(['Low']);
    expect(sanitized.outlierKeySale).toEqual(['Key']);
    expect(sanitized.overallFlag).toEqual(['Remove']);
    expect(sanitized.taskStatus).toEqual(['Assigned']);
  });
});
