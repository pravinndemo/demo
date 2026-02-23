import { normalizePrefilterSearchBy, shouldRemoveStoredPrefilter } from '../utils/PrefilterUtils';
import { MANAGER_PREFILTER_DEFAULT, QC_PREFILTER_DEFAULT } from '../config/PrefilterConfigs';

describe('prefilter utils', () => {
  test('caseworker view forces caseworker searchBy', () => {
    const result = normalizePrefilterSearchBy('billingAuthority', 'caseworkerView');
    expect(result).toBe('caseworker');
  });

  test('qc view forces qcUser searchBy', () => {
    const result = normalizePrefilterSearchBy('task', 'qcView');
    expect(result).toBe('qcUser');
  });

  test('qc assignment uses default when invalid', () => {
    const result = normalizePrefilterSearchBy('invalid', 'qcAssign');
    expect(result).toBe(QC_PREFILTER_DEFAULT.searchBy);
  });

  test('qc assignment allows valid key', () => {
    const result = normalizePrefilterSearchBy('caseworker', 'qcAssign');
    expect(result).toBe('caseworker');
  });

  test('manager assignment uses default when invalid', () => {
    const result = normalizePrefilterSearchBy('invalid', 'managerAssign');
    expect(result).toBe(MANAGER_PREFILTER_DEFAULT.searchBy);
  });

  test('shouldRemoveStoredPrefilter only clears on explicit clear', () => {
    expect(shouldRemoveStoredPrefilter(true, false, false)).toBe(false);
    expect(shouldRemoveStoredPrefilter(true, false, true)).toBe(true);
    expect(shouldRemoveStoredPrefilter(false, false, true)).toBe(false);
    expect(shouldRemoveStoredPrefilter(true, true, true)).toBe(false);
  });
});
