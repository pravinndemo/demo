import {
  HOME_JOURNEY_SCREEN_LABELS,
  HOME_JOURNEY_TILE_DEFINITIONS,
  HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA,
} from '../../constants/HomeJourney';
import { resolveScreenConfig } from '../../utils/ScreenResolution';

describe('WRT-306 Manager Access to SVT AC', () => {
  const requiredScreens = [
    {
      key: 'salesSearch',
      title: 'Sales Record Search',
      canvasScreenName: 'Sales Record Search',
      kind: 'salesSearch',
      tableKey: 'sales',
      sourceCode: 'SRS',
    },
    {
      key: 'caseworkerView',
      title: 'Caseworker View',
      canvasScreenName: 'Caseworker View',
      kind: 'caseworkerView',
      tableKey: 'myassignment',
      sourceCode: 'CWV',
    },
    {
      key: 'managerAssign',
      title: 'Manager Assignment',
      canvasScreenName: 'Manager Assignment',
      kind: 'managerAssign',
      tableKey: 'manager',
      sourceCode: 'MA',
    },
    {
      key: 'qcAssign',
      title: 'Quality Control Assignment',
      canvasScreenName: 'Quality Control Assignment',
      kind: 'qcAssign',
      tableKey: 'qaassign',
      sourceCode: 'QCA',
    },
    {
      key: 'qcView',
      title: 'Quality Control View',
      canvasScreenName: 'Quality Control View',
      kind: 'qcView',
      tableKey: 'qaview',
      sourceCode: 'QCV',
    },
  ] as const;

  test('AC1: manager persona has access to all required SVT screens', () => {
    const managerKeys = HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA.manager;
    const requiredKeys = requiredScreens.map((screen) => screen.key);

    expect(managerKeys).toHaveLength(requiredKeys.length);
    expect(new Set(managerKeys)).toEqual(new Set(requiredKeys));
  });

  test('AC1: required screen titles are present in home journey labels and tiles', () => {
    const titleByKey = new Map(HOME_JOURNEY_TILE_DEFINITIONS.map((tile) => [tile.key, tile.title]));
    const canvasNameByKey = new Map(HOME_JOURNEY_TILE_DEFINITIONS.map((tile) => [tile.key, tile.canvasScreenName]));

    for (const screen of requiredScreens) {
      expect(titleByKey.get(screen.key)).toBe(screen.title);
      expect(canvasNameByKey.get(screen.key)).toBe(screen.canvasScreenName);
    }

    expect(HOME_JOURNEY_SCREEN_LABELS.salesSearch.tileTitle).toBe('Sales Record Search');
    expect(HOME_JOURNEY_SCREEN_LABELS.caseworkerView.tileTitle).toBe('Caseworker View');
    expect(HOME_JOURNEY_SCREEN_LABELS.managerAssign.tileTitle).toBe('Manager Assignment');
    expect(HOME_JOURNEY_SCREEN_LABELS.qcAssign.tileTitle).toBe('Quality Control Assignment');
    expect(HOME_JOURNEY_SCREEN_LABELS.qcView.tileTitle).toBe('Quality Control View');
  });

  test('AC1: each manager screen resolves to the expected internal grid config', () => {
    for (const screen of requiredScreens) {
      const resolved = resolveScreenConfig(screen.canvasScreenName, undefined, 'sales');
      expect(resolved.kind).toBe(screen.kind);
      expect(resolved.tableKey).toBe(screen.tableKey);
      expect(resolved.sourceCode).toBe(screen.sourceCode);
    }
  });
});
