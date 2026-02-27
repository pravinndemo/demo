import { toSortableDateKey } from '../utils/DateSortUtils';

describe('date sort utils', () => {
  test('normalizes ISO dates to sortable key', () => {
    expect(toSortableDateKey('2022-07-01')).toBe('20220701');
    expect(toSortableDateKey('2022-07-01T00:00:00Z')).toBe('20220701');
    expect(toSortableDateKey('2022-07-01 12:30:00')).toBe('20220701');
  });

  test('normalizes UK dates with slashes to sortable key', () => {
    expect(toSortableDateKey('01/07/2022')).toBe('20220701');
    expect(toSortableDateKey('1/7/2022')).toBe('20220701');
    expect(toSortableDateKey('01/07/2022 08:00')).toBe('20220701');
  });

  test('normalizes UK dates with dashes to sortable key', () => {
    expect(toSortableDateKey('01-07-2022')).toBe('20220701');
    expect(toSortableDateKey('1-7-2022')).toBe('20220701');
    expect(toSortableDateKey('01-07-2022T08:00:00Z')).toBe('20220701');
  });

  test('returns empty string for blank input', () => {
    expect(toSortableDateKey('')).toBe('');
    expect(toSortableDateKey('   ')).toBe('');
  });
});
