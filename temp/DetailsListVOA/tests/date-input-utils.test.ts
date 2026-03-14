import { parseDateInput } from '../utils/DateInputUtils';

describe('date input utils', () => {
  test('parses UK slash dates', () => {
    expect(parseDateInput('01/02/2026')).toEqual(new Date(2026, 1, 1));
    expect(parseDateInput('1/2/2026')).toEqual(new Date(2026, 1, 1));
  });

  test('parses dash-separated dates', () => {
    expect(parseDateInput('01-02-2026')).toEqual(new Date(2026, 1, 1));
    expect(parseDateInput('2026-02-01')).toEqual(new Date(2026, 1, 1));
  });

  test('returns null for invalid dates', () => {
    expect(parseDateInput('31/02/2026')).toBeNull();
    expect(parseDateInput('2026-13-01')).toBeNull();
    expect(parseDateInput('not-a-date')).toBeNull();
    expect(parseDateInput('')).toBeNull();
  });
});
