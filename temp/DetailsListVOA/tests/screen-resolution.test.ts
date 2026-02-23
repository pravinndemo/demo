import { resolveScreenConfig } from '../utils/ScreenResolution';
import { buildPrefilterStorageKey } from '../utils/ScreenBehavior';

describe('resolveScreenConfig', () => {
  test('resolves direct screen names to expected configs', () => {
    const cases = [
      { name: 'SalesRecordSearch', kind: 'salesSearch', tableKey: 'sales', source: 'SRS' },
      { name: 'ManagerAssignment', kind: 'managerAssign', tableKey: 'manager', source: 'MA' },
      { name: 'CaseworkerView', kind: 'caseworkerView', tableKey: 'myassignment', source: 'CWV' },
      { name: 'QualityControlAssignment', kind: 'qcAssign', tableKey: 'qaassign', source: 'QCA' },
      { name: 'QualityControlView', kind: 'qcView', tableKey: 'qaview', source: 'QCV' },
    ];

    for (const c of cases) {
      const resolved = resolveScreenConfig(c.name, undefined, 'sales');
      expect(resolved.kind).toBe(c.kind);
      expect(resolved.tableKey).toBe(c.tableKey);
      expect(resolved.sourceCode).toBe(c.source);
    }
  });

  test('uses token matching for assignment screens', () => {
    const resolved = resolveScreenConfig('SVT Manager Assignment Screen', undefined, 'sales');
    expect(resolved.kind).toBe('managerAssign');
    expect(resolved.tableKey).toBe('manager');
    expect(resolved.sourceCode).toBe('MA');
  });

  test('falls back to explicit tableKey when screen name is unknown', () => {
    const resolved = resolveScreenConfig('Unknown Screen', 'qaassign', 'sales');
    expect(resolved.kind).toBe('qcAssign');
    expect(resolved.tableKey).toBe('qaassign');
    expect(resolved.sourceCode).toBe('QCA');
  });

  test('prefilter storage key is stable across screen name variants', () => {
    const a = resolveScreenConfig('Quality Control Assignment', undefined, 'sales');
    const b = resolveScreenConfig('QC Assignment Screen', undefined, 'sales');

    const keyA = buildPrefilterStorageKey(a.tableKey, a.kind);
    const keyB = buildPrefilterStorageKey(b.tableKey, b.kind);

    expect(keyA).toBe(keyB);
  });
});
