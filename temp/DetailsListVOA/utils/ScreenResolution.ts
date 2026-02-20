import { type TableKey } from '../config/TableConfigs';

export type ScreenKind = 'salesSearch' | 'managerAssign' | 'caseworkerView' | 'qcAssign' | 'qcView' | 'unknown';

export interface ResolvedScreenConfig {
  kind: ScreenKind;
  tableKey: TableKey;
  profileKey: string;
  sourceCode: string;
}

interface ScreenConfigDefinition {
  kind: ScreenKind;
  tableKey: TableKey;
}

const KNOWN_TABLE_KEYS: TableKey[] = ['sales', 'allsales', 'myassignment', 'manager', 'qa', 'qaassign', 'qaview'];
const SOURCE_CODES: Record<TableKey, string> = {
  sales: 'SRS',
  allsales: 'SRS',
  myassignment: 'CWV',
  manager: 'MA',
  qa: 'QCV',
  qaassign: 'QCA',
  qaview: 'QCV',
};

const SCREEN_CONFIG_BY_ID: Record<string, ScreenConfigDefinition> = {
  salesrecordsearch: { kind: 'salesSearch', tableKey: 'sales' },
  managerassignment: { kind: 'managerAssign', tableKey: 'manager' },
  caseworkerview: { kind: 'caseworkerView', tableKey: 'myassignment' },
  qualitycontrolassignment: { kind: 'qcAssign', tableKey: 'qaassign' },
  qualitycontrolview: { kind: 'qcView', tableKey: 'qaview' },
};

export const toKnownTableKey = (value?: string): TableKey | undefined => {
  if (!value) return undefined;
  const lower = value.trim().toLowerCase();
  return KNOWN_TABLE_KEYS.includes(lower as TableKey) ? (lower as TableKey) : undefined;
};

export const normalizeTableKey = (value: string): TableKey => toKnownTableKey(value) ?? 'sales';

const normalizeScreenId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const deriveKindFromTableKey = (tableKey: TableKey): ScreenKind => {
  switch (tableKey) {
    case 'manager':
      return 'managerAssign';
    case 'myassignment':
      return 'caseworkerView';
    case 'qaassign':
      return 'qcAssign';
    case 'qaview':
    case 'qa':
      return 'qcView';
    case 'sales':
    case 'allsales':
      return 'salesSearch';
    default:
      return 'unknown';
  }
};

const buildResolvedFromTableKey = (tableKey: TableKey): ResolvedScreenConfig => {
  const kind = deriveKindFromTableKey(tableKey);
  return {
    kind,
    tableKey,
    profileKey: tableKey,
    sourceCode: SOURCE_CODES[tableKey] ?? SOURCE_CODES.sales,
  };
};

const resolveFromScreenName = (canvasScreenName: string): ResolvedScreenConfig | undefined => {
  const normalized = normalizeScreenId(canvasScreenName);
  const direct = SCREEN_CONFIG_BY_ID[normalized];
  if (direct) {
    return buildResolvedFromTableKey(direct.tableKey);
  }

  const screenName = canvasScreenName.toLowerCase();
  if (screenName.includes('assignment') && screenName.includes('manager')) {
    return buildResolvedFromTableKey('manager');
  }
  if (screenName.includes('assignment') && (screenName.includes('qc') || screenName.includes('quality'))) {
    return buildResolvedFromTableKey('qaassign');
  }
  if (screenName.includes('caseworker')) {
    return buildResolvedFromTableKey('myassignment');
  }
  if (screenName.includes('qc') || screenName.includes('quality')) {
    return buildResolvedFromTableKey('qaview');
  }
  if (screenName.includes('sales') || screenName.includes('record search') || screenName.includes('recordsearch')) {
    return buildResolvedFromTableKey('sales');
  }
  return undefined;
};

export const resolveScreenConfig = (
  canvasScreenName: string,
  explicitTableKey: TableKey | undefined,
  fallbackTableKey: TableKey,
): ResolvedScreenConfig => {
  return resolveFromScreenName(canvasScreenName) ?? buildResolvedFromTableKey(explicitTableKey ?? fallbackTableKey);
};
