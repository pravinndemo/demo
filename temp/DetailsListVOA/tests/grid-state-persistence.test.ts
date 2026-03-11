import {
  deserializeColumnFiltersFromStorage,
  parseStoredSortState,
  serializeColumnFiltersForStorage,
  shouldPersistSortState,
} from '../utils/GridStatePersistence';

describe('grid state persistence', () => {
  test('serializes column filters for storage', () => {
    expect(serializeColumnFiltersForStorage({
      address: 'High Street',
      taskstatus: ['Assigned', 'Complete'],
      saleprice: { mode: 'between', min: 100, max: 200 },
    })).toEqual({
      address: ['High Street'],
      taskstatus: ['Assigned', 'Complete'],
      saleprice: ['{"mode":"between","min":100,"max":200}'],
    });
  });

  test('deserializes text, multi-select, numeric, and date filters', () => {
    const restored = deserializeColumnFiltersFromStorage('sales', JSON.stringify({
      address: ['High Street'],
      taskStatus: ['Assigned', 'Complete'],
      salePrice: ['{"mode":"between","min":"100","max":"200"}'],
      assignedDate: ['{"from":"2026-02-01","to":"2026-02-03"}'],
    }));

    expect(restored).toEqual({
      address: 'High Street',
      taskstatus: ['Assigned', 'Complete'],
      saleprice: { mode: 'between', min: 100, max: 200 },
      assigneddate: { from: '2026-02-01', to: '2026-02-03' },
    });
  });

  test('ignores invalid structured filters during restore', () => {
    const restored = deserializeColumnFiltersFromStorage('sales', JSON.stringify({
      salePrice: ['not-json'],
      assignedDate: ['{}'],
      address: ['High Street'],
    }));

    expect(restored).toEqual({
      address: 'High Street',
    });
  });

  test('parses valid stored sort state', () => {
    expect(parseStoredSortState('{"name":"saleId","sortDirection":1}')).toEqual({
      name: 'saleId',
      sortDirection: 1,
    });
  });

  test('rejects invalid stored sort state', () => {
    expect(parseStoredSortState('{"name":"","sortDirection":1}')).toBeUndefined();
    expect(parseStoredSortState('{"name":"saleId","sortDirection":2}')).toBeUndefined();
  });

  test('persists sort only when the user has an active sort', () => {
    expect(shouldPersistSortState({ name: 'saleId', sortDirection: 0 }, true)).toBe(true);
    expect(shouldPersistSortState({ name: 'saleId', sortDirection: 0 }, false)).toBe(false);
    expect(shouldPersistSortState(undefined, true)).toBe(false);
  });
});
