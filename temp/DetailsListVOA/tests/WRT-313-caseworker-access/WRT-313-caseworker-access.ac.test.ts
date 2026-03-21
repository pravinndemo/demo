import {
  HOME_JOURNEY_SCREEN_LABELS,
  HOME_JOURNEY_TILE_DEFINITIONS,
  HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA,
} from '../../constants/HomeJourney';
import { resolveScreenConfig } from '../../utils/ScreenResolution';

describe('WRT-313 Caseworker Access to SVT AC', () => {
  const requiredCaseworkerScreens = [
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
  ] as const;

  test('AC1: caseworker persona can access Sales Record Search and Caseworker View', () => {
    const caseworkerKeys = HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA.user;
    const requiredKeys = requiredCaseworkerScreens.map((screen) => screen.key);

    expect(caseworkerKeys).toHaveLength(requiredKeys.length);
    expect(new Set(caseworkerKeys)).toEqual(new Set(requiredKeys));
  });

  test('AC1: required caseworker screen labels and home tiles match expected titles', () => {
    const titleByKey = new Map(HOME_JOURNEY_TILE_DEFINITIONS.map((tile) => [tile.key, tile.title]));
    const canvasNameByKey = new Map(HOME_JOURNEY_TILE_DEFINITIONS.map((tile) => [tile.key, tile.canvasScreenName]));

    for (const screen of requiredCaseworkerScreens) {
      expect(titleByKey.get(screen.key)).toBe(screen.title);
      expect(canvasNameByKey.get(screen.key)).toBe(screen.canvasScreenName);
    }

    expect(HOME_JOURNEY_SCREEN_LABELS.salesSearch.tileTitle).toBe('Sales Record Search');
    expect(HOME_JOURNEY_SCREEN_LABELS.caseworkerView.tileTitle).toBe('Caseworker View');
  });

  test('AC1: required caseworker screen names resolve to expected grid source and table config', () => {
    for (const screen of requiredCaseworkerScreens) {
      const resolved = resolveScreenConfig(screen.canvasScreenName, undefined, 'sales');
      expect(resolved.kind).toBe(screen.kind);
      expect(resolved.tableKey).toBe(screen.tableKey);
      expect(resolved.sourceCode).toBe(screen.sourceCode);
    }
  });
});
