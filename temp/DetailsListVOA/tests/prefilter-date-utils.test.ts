import { computeCompletedToDateIso, getPrefilterFromDateError } from '../utils/PrefilterDateUtils';

describe('prefilter date utils', () => {
  const today = new Date(2026, 1, 24);

  test('computeCompletedToDateIso returns +14 days when within range', () => {
    const from = new Date(2026, 1, 1);
    expect(computeCompletedToDateIso(from, today)).toBe('2026-02-15');
  });

  test('computeCompletedToDateIso clamps to today when +14 exceeds today', () => {
    const from = new Date(2026, 1, 20);
    expect(computeCompletedToDateIso(from, today)).toBe('2026-02-24');
  });

  test('computeCompletedToDateIso returns today when from date is today', () => {
    const from = new Date(2026, 1, 24);
    expect(computeCompletedToDateIso(from, today)).toBe('2026-02-24');
  });

  test('computeCompletedToDateIso returns undefined when from date is missing', () => {
    expect(computeCompletedToDateIso(undefined, today)).toBeUndefined();
  });

  test('getPrefilterFromDateError flags future dates', () => {
    expect(getPrefilterFromDateError('2026-02-25', today)).toBe('Start date cannot be in the future');
  });

  test('getPrefilterFromDateError ignores today or past dates', () => {
    expect(getPrefilterFromDateError('2026-02-24', today)).toBeUndefined();
    expect(getPrefilterFromDateError('2026-02-01', today)).toBeUndefined();
  });
});
