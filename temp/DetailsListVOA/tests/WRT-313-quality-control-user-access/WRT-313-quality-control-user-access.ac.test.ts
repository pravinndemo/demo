import {
  HOME_JOURNEY_SCREEN_LABELS,
  HOME_JOURNEY_TILE_DEFINITIONS,
  HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA,
} from '../../constants/HomeJourney';
import { resolveScreenConfig } from '../../utils/ScreenResolution';

describe('WRT-313 Quality Control User Access to SVT AC', () => {
  const requiredManagerScreens = [
    {
      key: 'salesSearch',
      title: 'Sales Record Search',
      canvasScreenName: 'Sales Record Search',
      kind: 'salesSearch',
      tableKey: 'sales',
      sourceCode: 'SRS',
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

  test('AC1: manager access includes Sales Record Search, Quality Control Assignment and Quality Control View', () => {
    const managerKeys = HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA.manager;
    const requiredKeys = requiredManagerScreens.map((screen) => screen.key);

    expect(managerKeys).toEqual(expect.arrayContaining(requiredKeys));
  });

  test('AC1: required manager screen labels and home tiles match expected titles', () => {
    const titleByKey = new Map(HOME_JOURNEY_TILE_DEFINITIONS.map((tile) => [tile.key, tile.title]));
    const canvasNameByKey = new Map(HOME_JOURNEY_TILE_DEFINITIONS.map((tile) => [tile.key, tile.canvasScreenName]));

    for (const screen of requiredManagerScreens) {
      expect(titleByKey.get(screen.key)).toBe(screen.title);
      expect(canvasNameByKey.get(screen.key)).toBe(screen.canvasScreenName);
    }

    expect(HOME_JOURNEY_SCREEN_LABELS.salesSearch.tileTitle).toBe('Sales Record Search');
    expect(HOME_JOURNEY_SCREEN_LABELS.qcAssign.tileTitle).toBe('Quality Control Assignment');
    expect(HOME_JOURNEY_SCREEN_LABELS.qcView.tileTitle).toBe('Quality Control View');
  });

  test('AC1: required manager screen names resolve to expected grid source and table config', () => {
    for (const screen of requiredManagerScreens) {
      const resolved = resolveScreenConfig(screen.canvasScreenName, undefined, 'sales');
      expect(resolved.kind).toBe(screen.kind);
      expect(resolved.tableKey).toBe(screen.tableKey);
      expect(resolved.sourceCode).toBe(screen.sourceCode);
    }
  });
});
