import {
  isPrefilterUserAutoApplyReady,
  normalizePrefilterSearchBy,
  shouldRemoveStoredPrefilter,
  shouldSkipPrefilterAutoApply,
} from '../utils/PrefilterUtils';
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

  test('shouldSkipPrefilterAutoApply blocks auto-apply during manual apply', () => {
    expect(shouldSkipPrefilterAutoApply(true, false)).toBe(true);
    expect(shouldSkipPrefilterAutoApply(true, true)).toBe(false);
    expect(shouldSkipPrefilterAutoApply(false, false)).toBe(false);
  });

  test('manager assignment waits for caseworker options when restoring named caseworker search', () => {
    expect(isPrefilterUserAutoApplyReady({
      screenKind: 'managerAssign',
      searchBy: 'caseworker',
      selectedUsers: ['Avinaba Hazra'],
      caseworkerOptionsLoading: true,
    })).toBe(false);

    expect(isPrefilterUserAutoApplyReady({
      screenKind: 'managerAssign',
      searchBy: 'caseworker',
      selectedUsers: ['Avinaba Hazra'],
      caseworkerOptionsLoading: false,
      caseworkerOptions: ['Avinaba Hazra'],
    })).toBe(true);
  });

  test('auto-apply does not wait when selected user is already a guid or all', () => {
    expect(isPrefilterUserAutoApplyReady({
      screenKind: 'managerAssign',
      searchBy: 'caseworker',
      selectedUsers: ['__all__'],
      caseworkerOptionsLoading: true,
    })).toBe(true);

    expect(isPrefilterUserAutoApplyReady({
      screenKind: 'caseworkerView',
      searchBy: 'caseworker',
      selectedUsers: ['ABCDEFAB-1234-1234-1234-ABCDEFABCDEF'],
      caseworkerOptionsLoading: true,
    })).toBe(true);
  });

  test('qc assignment waits for qc user options when restoring named qc user search', () => {
    expect(isPrefilterUserAutoApplyReady({
      screenKind: 'qcAssign',
      searchBy: 'qcUser',
      selectedUsers: ['Quality User'],
      qcUserOptionsLoading: true,
    })).toBe(false);

    expect(isPrefilterUserAutoApplyReady({
      screenKind: 'qcAssign',
      searchBy: 'qcUser',
      selectedUsers: ['Quality User'],
      qcUserOptionsLoading: false,
      qcUserOptions: ['Quality User'],
    })).toBe(true);
  });
});
