import { filterItemsByColumnFilters } from '../utils/GridColumnFilters';

const getFilterableText = (raw: unknown): string => {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : ''))
      .filter((s) => s !== '')
      .join(', ');
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return raw.toString();
  }
  return '';
};

describe('grid column filter engine', () => {
  test('textEq uses contains match to align with API', () => {
    const items = [
      { taskid: 'S-1001', saleid: 'S-1001' },
      { taskid: 'A-2000', saleid: 'S-2000' },
    ];
    const result = filterItemsByColumnFilters(
      items,
      { taskid: 'S-100' },
      'sales',
      getFilterableText,
    );

    expect(result).toHaveLength(1);
    expect(result[0].taskid).toBe('S-1001');
  });

  test('returns all items when no active column filters', () => {
    const items = [
      { taskid: 'S-1001' },
      { taskid: 'A-2000' },
    ];
    const result = filterItemsByColumnFilters(
      items,
      {},
      'sales',
      getFilterableText,
    );

    expect(result).toHaveLength(2);
  });
});
