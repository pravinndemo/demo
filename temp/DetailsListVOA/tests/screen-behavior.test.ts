import { type GridFilterState } from '../Filters';
import {
  isPrefilterScreenKind,
  isSalesSearchDefaultFilters,
  buildPrefilterStorageKey,
  resolveAssignmentScreenName,
  shouldShowResults,
  shouldResetPrefiltersOnScreenChange,
} from '../utils/ScreenBehavior';

const makeFilters = (overrides: Partial<GridFilterState>): GridFilterState => ({
  searchBy: 'address',
  ...overrides,
});

describe('screen behavior', () => {
  test('resolveAssignmentScreenName returns canonical names', () => {
    expect(resolveAssignmentScreenName('Any', 'managerAssign')).toBe('manager assignment');
    expect(resolveAssignmentScreenName('Any', 'qcAssign')).toBe('quality control assignment');
  });

  test('resolveAssignmentScreenName trims for non-assignment screens', () => {
    expect(resolveAssignmentScreenName('  Sales Screen  ', 'salesSearch')).toBe('Sales Screen');
  });

  test('isSalesSearchDefaultFilters detects empty search state', () => {
    expect(isSalesSearchDefaultFilters(makeFilters({}))).toBe(true);
  });

  test('isSalesSearchDefaultFilters returns false when searchBy is not address', () => {
    expect(isSalesSearchDefaultFilters(makeFilters({ searchBy: 'saleId' }))).toBe(false);
  });

  test('isSalesSearchDefaultFilters returns false when any criteria is set', () => {
    expect(isSalesSearchDefaultFilters(makeFilters({ postcode: 'CF10 1AA' }))).toBe(false);
    expect(isSalesSearchDefaultFilters(makeFilters({ billingAuthority: ['Cardiff'] }))).toBe(false);
  });

  test('isPrefilterScreenKind identifies prefilter screens', () => {
    expect(isPrefilterScreenKind('managerAssign')).toBe(true);
    expect(isPrefilterScreenKind('caseworkerView')).toBe(true);
    expect(isPrefilterScreenKind('qcAssign')).toBe(true);
    expect(isPrefilterScreenKind('qcView')).toBe(true);
    expect(isPrefilterScreenKind('salesSearch')).toBe(false);
    expect(isPrefilterScreenKind('unknown')).toBe(false);
  });

  test('shouldShowResults enforces per-screen gating', () => {
    expect(shouldShowResults('managerAssign', false, true)).toBe(false);
    expect(shouldShowResults('managerAssign', true, true)).toBe(true);

    expect(shouldShowResults('qcAssign', false, true)).toBe(false);
    expect(shouldShowResults('qcAssign', true, true)).toBe(true);

    expect(shouldShowResults('salesSearch', true, false)).toBe(false);
    expect(shouldShowResults('salesSearch', true, true)).toBe(true);

    expect(shouldShowResults('caseworkerView', false, true)).toBe(false);
    expect(shouldShowResults('caseworkerView', true, true)).toBe(true);

    expect(shouldShowResults('qcView', false, true)).toBe(false);
    expect(shouldShowResults('qcView', true, true)).toBe(true);
  });

  test('shouldResetPrefiltersOnScreenChange respects stored prefilters', () => {
    expect(shouldResetPrefiltersOnScreenChange('salesSearch', 'managerAssign', true)).toBe(false);
    expect(shouldResetPrefiltersOnScreenChange('salesSearch', 'managerAssign', false)).toBe(true);
  });

  test('shouldResetPrefiltersOnScreenChange ignores non-prefilter screens', () => {
    expect(shouldResetPrefiltersOnScreenChange('managerAssign', 'salesSearch', false)).toBe(false);
    expect(shouldResetPrefiltersOnScreenChange('salesSearch', 'unknown', false)).toBe(false);
  });

  test('buildPrefilterStorageKey is stable per screen kind', () => {
    expect(buildPrefilterStorageKey('qaassign', 'qcAssign')).toBe('voa-prefilters:qaassign:qcAssign');
    expect(buildPrefilterStorageKey('qaview', 'qcView')).toBe('voa-prefilters:qaview:qcView');
  });
});
