import * as React from 'react';
import { Selection, SelectionMode, IDetailsList, IObjectWithKey, MessageBarType } from '@fluentui/react';
import { DetailsList as Grid, GridProps } from '../DetailsList';
import { PCFContext } from '../context/PCFContext';
import { ColumnConfig, AssignUser } from '../../Component.types';
import { GridFilterState, createDefaultGridFilters, sanitizeFilters, NumericFilter, DateRangeFilter } from '../../Filters';
import { getProfileConfigs } from '../../config/ColumnProfiles';
import { CONTROL_CONFIG } from '../../config/ControlConfig';
import { getColumnFilterConfigFor, isLookupFieldFor, type TableKey } from '../../config/TableConfigs';
import { type ManagerPrefilterState } from '../../config/PrefilterConfigs';
import { SCREEN_TEXT } from '../../constants/ScreenText';
import { buildColumns } from '../../utils/ColumnsBuilder';
import { ensureSampleColumns, buildSampleEntityRecords } from '../../utils/SampleHelpers';
import { loadGridData } from '../../services/GridDataController';
import { executeUnboundCustomApi, normalizeCustomApiName, resolveCustomApiOperationType } from '../../services/CustomApi';
import { IInputs } from '../../generated/ManifestTypes';
import { logPerf } from '../../utils/Perf';

export interface DetailsListHostProps {
  context: ComponentFramework.Context<IInputs>;
  onRowInvoke?: (args: { taskId?: string; saleId?: string }) => void;
  // Emit IDs on selection (single or multi); arrays support multi-select
  onSelectionChange?: (args: { taskId?: string; saleId?: string; selectedTaskIds?: string[]; selectedSaleIds?: string[] }) => void;
  // Emit count of selected rows (even if IDs are missing)
  onSelectionCountChange?: (count: number) => void;
  // Triggered when the back button is pressed
  onBackRequested?: () => void;
  // When provided, the host renders these items instead of loading via APIM.
  externalItems?: unknown[];
  // Bubble header filter Apply back to parent (used by external item scenarios to call API with extra params)
  onColumnFiltersApply?: (filters: Record<string, string | string[]>) => void;
}

type ColumnFilterValue = string | string[] | NumericFilter | DateRangeFilter;
type FilterOptionsMap = Record<string, string[]>;
interface AssignableUsersResult {
  success?: boolean;
  message?: string;
  users?: AssignUser[];
}

const SSU_APP_ID = 'cdb5343c-51c1-ec11-983e-002248438fff';
const KNOWN_TABLE_KEYS: TableKey[] = ['sales', 'allsales', 'myassignment', 'manager', 'qa', 'qaassign', 'qaview'];
const SOURCE_CODES: Record<TableKey, string> = {
  sales: 'SRS',
  allsales: 'SRS',
  myassignment: 'CW',
  manager: 'MA',
  qa: 'QCV',
  qaassign: 'QCA',
  qaview: 'QCV',
};

export type ScreenKind = 'salesSearch' | 'managerAssign' | 'caseworkerView' | 'qcAssign' | 'qcView' | 'unknown';

interface ResolvedScreenConfig {
  kind: ScreenKind;
  tableKey: TableKey;
  profileKey: string;
  sourceCode: string;
}

interface ScreenConfigDefinition {
  kind: ScreenKind;
  tableKey: TableKey;
}

const SCREEN_CONFIG_BY_ID: Record<string, ScreenConfigDefinition> = {
  salesrecordsearch: { kind: 'salesSearch', tableKey: 'sales' },
  managerassignment: { kind: 'managerAssign', tableKey: 'manager' },
  caseworkerview: { kind: 'caseworkerView', tableKey: 'myassignment' },
  qualitycontrolassignment: { kind: 'qcAssign', tableKey: 'qaassign' },
  qualitycontrolview: { kind: 'qcView', tableKey: 'qaview' },
};

const toKnownTableKey = (value?: string): TableKey | undefined => {
  if (!value) return undefined;
  const lower = value.trim().toLowerCase();
  return KNOWN_TABLE_KEYS.includes(lower as TableKey) ? (lower as TableKey) : undefined;
};

const normalizeTableKey = (value: string): TableKey => toKnownTableKey(value) ?? 'sales';

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

const resolveScreenConfig = (
  canvasScreenName: string,
  explicitTableKey: TableKey | undefined,
  fallbackTableKey: TableKey,
): ResolvedScreenConfig => {
  return resolveFromScreenName(canvasScreenName) ?? buildResolvedFromTableKey(explicitTableKey ?? fallbackTableKey);
};

const normalizeUserId = (value?: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/^[{(]?(.*?)[)}]?$/, '$1');
};

const resolveAssignedByUserId = (context: ComponentFramework.Context<IInputs>): string => {
  const fromContext = (context.userSettings as { userId?: string } | undefined)?.userId;
  if (fromContext) return normalizeUserId(fromContext);
  const xrm = (globalThis as {
    Xrm?: { Utility?: { getGlobalContext?: () => { userSettings?: { userId?: string } } } };
  }).Xrm;
  const fromXrm = xrm?.Utility?.getGlobalContext?.()?.userSettings?.userId;
  return normalizeUserId(fromXrm);
};

const resolveAssignmentScreenName = (raw: string, kind: ScreenKind): string => {
  switch (kind) {
    case 'managerAssign':
      return 'manager assignment';
    case 'qcAssign':
      return 'quality control assignment';
    default: {
      const trimmed = raw.trim();
      return trimmed;
    }
  }
};

const SALES_SEARCH_DEFAULT_FILTERS: GridFilterState = {
  ...createDefaultGridFilters(),
  searchBy: 'address',
};

const isSalesSearchDefaultFilters = (fs: GridFilterState): boolean => {
  if (fs.searchBy !== 'address') return false;
  const billingAuthorityEmpty = !fs.billingAuthority || fs.billingAuthority.length === 0;
  return !fs.saleId
    && !fs.taskId
    && !fs.uprn
    && !fs.address
    && !fs.buildingNameNumber
    && !fs.street
    && !fs.townCity
    && !fs.postcode
    && billingAuthorityEmpty
    && !fs.bacode;
};

const buildSsuUrl = (clientUrl: string, suid: string): string => {
  const baseUrl = clientUrl.replace(/\/$/, '');
  return `${baseUrl}/main.aspx?appid=${SSU_APP_ID}&newwindow=true&pagetype=entityrecord&etn=voa_ssu&id=${encodeURIComponent(suid)}`;
};

const resolveClientUrl = (ctx: ComponentFramework.Context<IInputs>): string => {
  const contextWithPage = ctx as unknown as { page?: { getClientUrl?: () => string } };
  const page = contextWithPage.page;
  if (typeof page?.getClientUrl === 'function') {
    try {
      return page.getClientUrl();
    } catch {
      // Fall back for test harness where getClientUrl may not be available.
    }
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
};

const normalizeSuid = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) return '';
  const lowered = trimmed.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return '';
  const unwrapped = trimmed.replace(/^[{(]?(.*?)[)}]?$/, '$1');
  const isGuid = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(unwrapped);
  return isGuid ? unwrapped : '';
};

const COLUMN_FILTER_FIELD_MAP: Record<string, string> = {
  saleid: 'saleId',
  taskid: 'taskId',
  uprn: 'uprn',
  address: 'address',
  postcode: 'postCode',
  billingauthority: 'billingAuthority',
  transactiondate: 'transactionDate',
  saleprice: 'salesPrice',
  ratio: 'ratio',
  dwellingtype: 'dwellingType',
  flaggedforreview: 'flaggedForReview',
  reviewflags: 'reviewFlag',
  outlierratio: 'outlierRatio',
  overallflag: 'overallFlag',
  summaryflags: 'summaryFlags',
  taskstatus: 'taskStatus',
  assignedto: 'assignedTo',
  assigneddate: 'assignedDate',
  taskcompleteddate: 'taskCompletedDate',
  qcassignedto: 'qcAssignedTo',
  qcassigneddate: 'qcAssignedDate',
  qccompleteddate: 'qcCompletedDate',
};

const normalizeColumnFilterFieldName = (field: string): string => {
  const normalized = field.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return COLUMN_FILTER_FIELD_MAP[normalized] ?? field;
};

const isNumericFilterValue = (val: ColumnFilterValue): val is NumericFilter =>
  !!val && typeof val === 'object' && 'mode' in (val as NumericFilter);

const isDateRangeFilterValue = (val: ColumnFilterValue): val is DateRangeFilter =>
  !!val && typeof val === 'object' && ('from' in (val as DateRangeFilter) || 'to' in (val as DateRangeFilter));

const formatApiDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const ukMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (ukMatch) {
    return trimmed;
  }
  return trimmed;
};

const buildColumnFilterTokens = (
  tableKey: TableKey,
  field: string,
  value: ColumnFilterValue,
): string[] | undefined => {
  const cfg = getColumnFilterConfigFor(tableKey, field);
  if (!cfg) return undefined;
  const apiField = normalizeColumnFilterFieldName(field);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const operator = cfg.control === 'singleSelect' ? 'eq' : 'like';
    return [apiField, operator, trimmed];
  }

  if (Array.isArray(value)) {
    const values = value.map((entry) => String(entry ?? '').trim()).filter((entry) => entry !== '');
    if (values.length === 0) return undefined;
    const operator = 'in';
    return [apiField, operator, values.join(',')];
  }

  if (cfg.control === 'numeric' && isNumericFilterValue(value)) {
    const { mode, min, max } = value;
    if (mode === '>=' && min !== undefined && min !== null) {
      return [apiField, 'GTE', String(min)];
    }
    if (mode === '<=' && max !== undefined && max !== null) {
      return [apiField, 'LTE', String(max)];
    }
    if (mode === 'between') {
      if (min !== undefined && min !== null && max !== undefined && max !== null) {
        return [apiField, 'GTE,LTE', String(min), String(max)];
      }
      if (min !== undefined && min !== null) {
        return [apiField, 'GTE', String(min)];
      }
      if (max !== undefined && max !== null) {
        return [apiField, 'LTE', String(max)];
      }
    }
    return undefined;
  }

  if (cfg.control === 'dateRange' && isDateRangeFilterValue(value)) {
    const from = value.from?.trim();
    const to = value.to?.trim();
    const start = from && from.length > 0 ? from : to;
    const end = to && to.length > 0 ? to : from;
    if (!start || !end) return undefined;
    const formattedStart = formatApiDate(start);
    const formattedEnd = formatApiDate(end);
    if (!formattedStart || !formattedEnd) return undefined;
    return [apiField, 'between', formattedStart, formattedEnd];
  }

  return undefined;
};

const buildColumnFilterQuery = (tableKey: TableKey, filters: Record<string, ColumnFilterValue>): string => {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  const expressions = entries
    .map(([field, value]) => buildColumnFilterTokens(tableKey, field, value))
    .filter((tokens): tokens is string[] => !!tokens && tokens.length > 0)
    .map((tokens) => {
      const encoded = tokens.map((token) => encodeURIComponent(token));
      return `columnFilter=${encoded.join('~')}`;
    });

  return expressions.join('&');
};

const toFilterValueString = (val: ColumnFilterValue | undefined): string => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map((v) => toFilterValueString(v as ColumnFilterValue)).filter((s) => s !== '').join('|');
  if (typeof val === 'object') return JSON.stringify(val);
  return '';
};

const normalizeFilterArray = (val: unknown): string[] =>
  Array.isArray(val)
    ? val.map((v) => toFilterValueString(v as ColumnFilterValue)).filter((s) => s.trim() !== '')
    : [];

const isPlainObject = (val: unknown): val is Record<string, unknown> =>
  !!val && typeof val === 'object' && !Array.isArray(val);

const parseFilterValue = (raw: string): ColumnFilterValue => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
      if (isPlainObject(parsed)) return parsed as ColumnFilterValue;
    } catch {
      // ignore JSON parse issues
    }
  }
  return trimmed;
};

const normalizeApiFilters = (filters?: Record<string, unknown>): Record<string, ColumnFilterValue> | undefined => {
  if (!filters) return undefined;
  const normalized: Record<string, ColumnFilterValue> = {};
  Object.entries(filters).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      const arr = value.map((v) => String(v ?? '')).filter((v) => v.trim() !== '');
      if (arr.length > 0) normalized[lowerKey] = arr;
      return;
    }
    if (typeof value === 'string') {
      const parsed = parseFilterValue(value);
      if (parsed !== '') normalized[lowerKey] = parsed;
      return;
    }
    if (isPlainObject(value)) {
      normalized[lowerKey] = value as ColumnFilterValue;
    }
  });
  return normalized;
};

const normalizeFilterOptions = (filters?: Record<string, string | string[]>): FilterOptionsMap => {
  if (!filters) return {};
  const normalized: FilterOptionsMap = {};
  Object.entries(filters).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      const arr = value.map((v) => String(v ?? '')).filter((v) => v.trim() !== '');
      if (arr.length > 0) normalized[lowerKey] = arr;
      return;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return;
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          const parsed = JSON.parse(trimmed) as unknown;
          if (Array.isArray(parsed)) {
            const arr = parsed.map((v) => String(v ?? '')).filter((v) => v.trim() !== '');
            if (arr.length > 0) normalized[lowerKey] = arr;
            return;
          }
        } catch {
          // fall back to plain string
        }
      }
      normalized[lowerKey] = [trimmed];
    }
  });
  return normalized;
};

const areFiltersEqual = (a: Record<string, ColumnFilterValue>, b: Record<string, ColumnFilterValue>): boolean => {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    const av = a[aKeys[i]];
    const bv = b[bKeys[i]];
    if (Array.isArray(av) || Array.isArray(bv)) {
      const aa = normalizeFilterArray(av);
      const bb = normalizeFilterArray(bv);
      if (aa.length !== bb.length) return false;
      for (let j = 0; j < aa.length; j++) if (aa[j] !== bb[j]) return false;
      continue;
    }
    if (isPlainObject(av) || isPlainObject(bv)) {
      if (JSON.stringify(av ?? {}) !== JSON.stringify(bv ?? {})) return false;
      continue;
    }
    const avText = toFilterValueString(av as ColumnFilterValue).trim();
    const bvText = toFilterValueString(bv as ColumnFilterValue).trim();
    if (avText !== bvText) return false;
  }
  return true;
};

export const DetailsListHost: React.FC<DetailsListHostProps> = ({
  context,
  onRowInvoke,
  onSelectionChange,
  onSelectionCountChange,
  onBackRequested,
  externalItems,
  onColumnFiltersApply,
}) => {
  // Parse basic params
  const pageSize = (context.parameters as unknown as Record<string, { raw?: number }>).pageSize?.raw ?? 500;
  const allocatedHeight = typeof context.mode?.allocatedHeight === 'number' && context.mode.allocatedHeight > 0
    ? context.mode.allocatedHeight
    : undefined;
  const canvasScreenName = (context.parameters as unknown as Record<string, { raw?: string }>).canvasScreenName?.raw ?? '';
  const tableKeyRaw = (context.parameters as unknown as Record<string, { raw?: string }>).tableKey?.raw ?? '';
  const screenName = canvasScreenName.toLowerCase();
  const fallbackTableKey = React.useMemo(
    () => normalizeTableKey((CONTROL_CONFIG.tableKey || 'sales').trim().toLowerCase()),
    [],
  );
  const explicitTableKey = React.useMemo(() => toKnownTableKey(tableKeyRaw), [tableKeyRaw]);
  const resolvedScreenConfig = React.useMemo(
    () => resolveScreenConfig(canvasScreenName, explicitTableKey, fallbackTableKey),
    [canvasScreenName, explicitTableKey, fallbackTableKey],
  );
  const { tableKey, profileKey, sourceCode, kind: screenKind } = resolvedScreenConfig;
  const assignmentScreenName = React.useMemo(
    () => resolveAssignmentScreenName(canvasScreenName, screenKind),
    [canvasScreenName, screenKind],
  );
  const commonText = SCREEN_TEXT.common;
  const managerText = SCREEN_TEXT.managerAssignment;
  const assignTasksText = SCREEN_TEXT.assignTasks;

  // Column display names and configs
  const [columnDisplayNames, setColumnDisplayNames] = React.useState<Record<string, string>>({});
  const [columnConfigs, setColumnConfigs] = React.useState<Record<string, ColumnConfig>>({});

  React.useEffect(() => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).columnDisplayNames?.raw?.trim() ?? '{}';
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      const map: Record<string, string> = {};
      Object.keys(parsed).forEach((k) => (map[k.toLowerCase()] = parsed[k]));
      setColumnDisplayNames(map);
    } catch {
      setColumnDisplayNames({});
    }
  }, [context]);

  React.useEffect(() => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).columnConfig?.raw?.trim() ?? '[]';
    try {
      const fromProfile = getProfileConfigs(profileKey);
      const fromJson = JSON.parse(raw) as ColumnConfig[];
      const merged = [...fromProfile, ...fromJson];
      const map: Record<string, ColumnConfig> = {};
      merged.forEach((c) => {
        const n = c.ColName?.trim().toLowerCase();
        if (n && n !== 'completeddate') map[n] = c;
      });
      // Ensure multi-value flags render as tags by default
      if (!map.summaryflags) {
        map.summaryflags = { ColName: 'summaryflags', ColCellType: 'tag' } as ColumnConfig;
      }
      if (!map.reviewflags) {
        map.reviewflags = { ColName: 'reviewflags', ColCellType: 'tag' } as ColumnConfig;
      }
      if (map.saleid) {
        if (!map.saleid.ColCellType) {
          map.saleid = { ...map.saleid, ColCellType: 'link' } as ColumnConfig;
        }
      } else {
        map.saleid = { ColName: 'saleid', ColCellType: 'link' } as ColumnConfig;
      }
      setColumnConfigs(map);
    } catch {
      setColumnConfigs({});
    }
  }, [context, profileKey]);

  // State
  const [currentPage, setCurrentPage] = React.useState(0);
  const [headerFilters, setHeaderFilters] = React.useState<Record<string, ColumnFilterValue>>({});
  const columnFilterQuery = React.useMemo(
    () => buildColumnFilterQuery(tableKey, headerFilters),
    [headerFilters, tableKey],
  );

  const toApiHeaderFilters = React.useCallback(
    (filters: Record<string, ColumnFilterValue>): Record<string, string | string[]> => {
      const out: Record<string, string | string[]> = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          out[k] = v.map((x) => String(x ?? ''));
        } else if (typeof v === 'string') {
          out[k] = v;
        } else if (v && typeof v === 'object') {
          out[k] = [JSON.stringify(v)];
        }
      });
      return out;
    },
    [],
  );
  const lastAppliedFiltersRef = React.useRef<Record<string, ColumnFilterValue>>({});
  const [clientSort, setClientSort] = React.useState<{ name: string; sortDirection: number } | undefined>({
    name: 'taskid',
    sortDirection: 0,
  });
  const [searchFilters, setSearchFilters] = React.useState<GridFilterState>(SALES_SEARCH_DEFAULT_FILTERS);
  const [prefilters, setPrefilters] = React.useState<ManagerPrefilterState | undefined>(undefined);
  const [prefilterApplied, setPrefilterApplied] = React.useState(false);
  const [searchNonce, setSearchNonce] = React.useState(0);
  const [apiFilterOptions, setApiFilterOptions] = React.useState<FilterOptionsMap>({});
  const [billingAuthorityOptions, setBillingAuthorityOptions] = React.useState<string[]>([]);
  const [billingAuthorityOptionsLoading, setBillingAuthorityOptionsLoading] = React.useState(false);
  const [billingAuthorityOptionsError, setBillingAuthorityOptionsError] = React.useState<string | undefined>(undefined);
  const [caseworkerOptions, setCaseworkerOptions] = React.useState<string[]>([]);
  const [caseworkerOptionsLoading, setCaseworkerOptionsLoading] = React.useState(false);
  const [caseworkerOptionsError, setCaseworkerOptionsError] = React.useState<string | undefined>(undefined);
  const [apimItems, setApimItems] = React.useState<unknown[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [serverDriven, setServerDriven] = React.useState(false);
  const [apimLoading, setApimLoading] = React.useState(false);
  const [hasLoadedApim, setHasLoadedApim] = React.useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = React.useState<string | undefined>(undefined);
  const [assignMessage, setAssignMessage] = React.useState<{ text: string; type: MessageBarType } | undefined>(undefined);
  const [assignUsers, setAssignUsers] = React.useState<AssignUser[]>([]);
  const [assignUsersLoading, setAssignUsersLoading] = React.useState(false);
  const [assignUsersError, setAssignUsersError] = React.useState<string | undefined>(undefined);
  const [assignUsersInfo, setAssignUsersInfo] = React.useState<string | undefined>(undefined);
  const [assignableUsersCache, setAssignableUsersCache] = React.useState<AssignUser[]>([]);
  const [assignPanelOpen, setAssignPanelOpen] = React.useState(false);
  const [assignPendingRefresh, setAssignPendingRefresh] = React.useState(false);
  const assignRefreshResolve = React.useRef<null | ((ok: boolean) => void)>(null);
  const assignUsersLoadKeyRef = React.useRef<string>('');
  const caseworkerOptionsLoadKeyRef = React.useRef<string>('');
  const handleAssignPanelToggle = React.useCallback((isOpen: boolean) => {
    setAssignPanelOpen(isOpen);
    if (isOpen) {
      setAssignUsers([]);
      setAssignUsersError(undefined);
      setAssignUsersInfo(undefined);
      setAssignUsersLoading(true);
    }
  }, []);
  // Defer persistence until after initial hydration to avoid add/remove flicker in localStorage
  const [hydrated, setHydrated] = React.useState(false);
  const allowColumnReorder = (context.parameters as unknown as Record<string, { raw?: string | boolean }>).allowColumnReorder?.raw === true ||
    String((context.parameters as unknown as Record<string, { raw?: string | boolean }>).allowColumnReorder?.raw ?? '').toLowerCase() === 'true';
  const isManagerAssign = screenKind === 'managerAssign';
  const isQcAssign = screenKind === 'qcAssign';
  const isSalesSearch = screenKind === 'salesSearch';
  const isAssignment = isManagerAssign || isQcAssign;
  const assignmentContextKey = isManagerAssign ? 'manager' : isQcAssign ? 'qa' : '';
  const [salesSearchApplied, setSalesSearchApplied] = React.useState(!isSalesSearch);
  const lastSalesModeRef = React.useRef<boolean | undefined>(undefined);
  const lastScreenKindRef = React.useRef<ScreenKind | undefined>(undefined);

  React.useEffect(() => {
    if (lastSalesModeRef.current === isSalesSearch) return;
    lastSalesModeRef.current = isSalesSearch;
    if (isSalesSearch) {
      setSalesSearchApplied(false);
      setSearchFilters(SALES_SEARCH_DEFAULT_FILTERS);
      setCurrentPage(0);
      setHeaderFilters({});
      lastAppliedFiltersRef.current = {};
      setHasLoadedApim(false);
      setApimItems([]);
      setTotalCount(0);
      setServerDriven(false);
      setApiFilterOptions({});
      setLoadErrorMessage(undefined);
      return;
    }
    // Non-sales screens keep their existing defaults.
    setSalesSearchApplied(true);
    setSearchFilters({
      ...createDefaultGridFilters(),
      searchBy: 'taskStatus',
      taskStatus: ['New'],
    });
  }, [isSalesSearch]);

  const parseAssignableUsersResponse = React.useCallback((response?: { Result?: string; result?: string }) => {
    const rawResult = typeof response?.Result === 'string'
      ? response.Result
      : typeof response?.result === 'string'
        ? response.result
        : '';

    const normalizedRaw = rawResult.trim();
    if (!normalizedRaw || normalizedRaw.toLowerCase() === 'null') {
      return { users: [] as AssignUser[], info: assignTasksText.messages.noUsersFound };
    }

    let parsed: AssignableUsersResult | undefined;
    try {
      parsed = JSON.parse(normalizedRaw) as AssignableUsersResult;
    } catch {
      return { users: [] as AssignUser[], error: assignTasksText.messages.assignableUsersParseFailed };
    }

    if (!parsed?.success) {
      return { users: [] as AssignUser[], error: parsed?.message ?? assignTasksText.messages.assignableUsersLoadFailed };
    }

    const users = Array.isArray(parsed.users) ? parsed.users : [];
    if (users.length === 0) {
      const message = parsed?.message?.trim() ? parsed.message : assignTasksText.messages.noUsersFound;
      return { users: [] as AssignUser[], info: message };
    }

    const normalized = users
      .map((u) => ({
        id: String(u?.id ?? ''),
        firstName: String(u?.firstName ?? ''),
        lastName: String(u?.lastName ?? ''),
        email: String(u?.email ?? ''),
        team: String(u?.team ?? ''),
        role: String(u?.role ?? ''),
      }))
      .filter((u) => u.id);

    return { users: normalized };
  }, [assignTasksText.messages]);

  const getUserDisplayName = React.useCallback((user: AssignUser): string => {
    const first = String(user?.firstName ?? '').trim();
    const last = String(user?.lastName ?? '').trim();
    const full = `${first} ${last}`.trim();
    if (full) return full;
    const email = String(user?.email ?? '').trim();
    if (email) return email;
    return String(user?.id ?? '').trim();
  }, []);

  const buildCaseworkerNames = React.useCallback((users: AssignUser[]): string[] => {
    const names = (users ?? [])
      .map((user) => getUserDisplayName(user))
      .filter((name) => !!name);

    const unique = Array.from(new Set(names));
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [getUserDisplayName]);

  const mergeAssignableUsers = React.useCallback((prev: AssignUser[], next: AssignUser[]): AssignUser[] => {
    const map = new Map<string, AssignUser>();
    prev.forEach((u) => {
      const id = String(u.id ?? '').trim().toLowerCase();
      if (id) map.set(id, u);
    });
    next.forEach((u) => {
      const id = String(u.id ?? '').trim().toLowerCase();
      if (id) map.set(id, u);
    });
    return Array.from(map.values());
  }, []);

  const userDisplayNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    assignableUsersCache.forEach((user) => {
      const id = String(user.id ?? '').trim().toLowerCase();
      if (!id) return;
      const name = getUserDisplayName(user);
      if (name) map[id] = name;
    });
    return map;
  }, [assignableUsersCache, getUserDisplayName]);

  // Persist header filters per table for consistent UX across reloads
  const storageKey = React.useMemo(() => `voa-grid-filters:${tableKey}`, [tableKey]);
  const storageKeySort = React.useMemo(() => `voa-grid-sort:${tableKey}`, [tableKey]);
  const storageKeyPage = React.useMemo(() => `voa-grid-page:${tableKey}`, [tableKey]);
  const prefilterStorageKey = React.useMemo(() => `voa-prefilters:${tableKey}:${screenName || 'default'}`, [screenName, tableKey]);
  // Some environments show keys without ':' in DevTools; support both forms for compatibility
  const storageKeyNC = React.useMemo(() => storageKey.replace(':', ''), [storageKey]);
  const storageKeySortNC = React.useMemo(() => storageKeySort.replace(':', ''), [storageKeySort]);
  const storageKeyPageNC = React.useMemo(() => storageKeyPage.replace(':', ''), [storageKeyPage]);

  React.useEffect(() => {
    if (isManagerAssign) {
      setSearchFilters(createDefaultGridFilters());
    }
  }, [isManagerAssign]);
  // Hydrate from localStorage on table change (URL persistence disabled by policy)
  React.useEffect(() => {
    try {
      // Filters (disabled for now to avoid auto-prefill from localStorage)
      const rawLocalFilters = localStorage.getItem(storageKey) ?? localStorage.getItem(storageKeyNC);
      // if (rawLocalFilters) {
      //   // Stored as arrays for every field; coerce to proper types per lookup/text
      //   const parsed = JSON.parse(rawLocalFilters) as Record<string, string[]>;
      //   const normalized: Record<string, ColumnFilterValue> = {};
      //   Object.entries(parsed).forEach(([k, v]) => {
      //     const keyLower = k.toLowerCase();
      //     const isLookup = isLookupFieldFor(String(tableKey), keyLower);
      //     normalized[keyLower] = isLookup ? (Array.isArray(v) ? v : [String(v ?? '')]) : (Array.isArray(v) ? (v[0] ?? '') : String(v ?? ''));
      //   });
      //   lastAppliedFiltersRef.current = normalized;
      //   setHeaderFilters(normalized);
      //   try { onColumnFiltersApply?.(toApiHeaderFilters(normalized)); } catch { /* ignore */ }
      // }
      // Sort
      const rawLocalSort = localStorage.getItem(storageKeySort) ?? localStorage.getItem(storageKeySortNC);
      if (rawLocalSort) {
        try {
          const parsed = JSON.parse(rawLocalSort) as { name?: string; sortDirection?: number };
          if (parsed?.name && (parsed.sortDirection === 0 || parsed.sortDirection === 1)) {
            setClientSort({ name: parsed.name, sortDirection: parsed.sortDirection });
          }
        } catch { /* ignore invalid */ }
      }
      // Page
      const rawLocalPage = localStorage.getItem(storageKeyPage) ?? localStorage.getItem(storageKeyPageNC);
      if (rawLocalPage) {
        const n = Number(rawLocalPage);
        if (!Number.isNaN(n) && n >= 0) setCurrentPage(n);
      }
    } catch {
      // ignore hydrate failures
    }
    // Mark hydration complete so persistence can begin on subsequent changes
    setHydrated(true);
  }, [storageKey, storageKeyNC, storageKeySort, storageKeySortNC, storageKeyPage, storageKeyPageNC]);
  // Persist to localStorage whenever filters/page/sort change
  React.useEffect(() => {
    if (!hydrated) return; // skip initial mount until hydration finishes
    try {
      // localStorage
      if (Object.keys(headerFilters).length === 0) {
        localStorage.removeItem(storageKey); localStorage.removeItem(storageKeyNC);
      } else {
        // Persist as arrays for all fields (non-string values are stringified)
        const arrayStore: Record<string, string[]> = {};
        Object.entries(headerFilters).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            arrayStore[k] = v.map((x) => String(x ?? ''));
          } else if (typeof v === 'string') {
            arrayStore[k] = [v];
          } else {
            arrayStore[k] = [JSON.stringify(v ?? {})];
          }
        });
        const filtersJSON = JSON.stringify(arrayStore);
        localStorage.setItem(storageKey, filtersJSON);
        localStorage.setItem(storageKeyNC, filtersJSON);
      }
      if (clientSort) {
        const sortJSON = JSON.stringify(clientSort);
        localStorage.setItem(storageKeySort, sortJSON);
        localStorage.setItem(storageKeySortNC, sortJSON);
      } else {
        localStorage.removeItem(storageKeySort); localStorage.removeItem(storageKeySortNC);
      }
      localStorage.setItem(storageKeyPage, String(currentPage));
      localStorage.setItem(storageKeyPageNC, String(currentPage));
    } catch {
      // ignore persist failures
    }
  }, [headerFilters, clientSort, currentPage, storageKey, storageKeyNC, storageKeySort, storageKeySortNC, storageKeyPage, storageKeyPageNC, hydrated]);

  // Build columns from defined config only (no auto-add from API fields).
  const datasetColumns = React.useMemo(() => {
    const t0 = performance.now();
    const cols = buildColumns(columnDisplayNames, columnConfigs, undefined);
    const t1 = performance.now();
    logPerf('[Grid Perf] Build columns (ms):', Math.round(t1 - t0), 'count:', cols.length);
    return cols;
  }, [columnConfigs, columnDisplayNames]);

  const clientUrl = resolveClientUrl(context);

  // Records mapping
  const { records, ids } = React.useMemo(() => {
    const t0 = performance.now();
    const recs: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord> = {};
    const all: string[] = [];
    const toText = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '');
    if (hasLoadedApim && apimItems.length > 0) {
      const mapUserIdsToNames = (value: unknown): string[] | undefined => {
        if (!value) return undefined;
        const ids = Array.isArray(value)
          ? value.map((v) => String(v ?? '').trim()).filter((v) => v !== '')
          : typeof value === 'string'
          ? value.split(',').map((v) => v.trim()).filter((v) => v !== '')
          : [];
        if (ids.length === 0) return undefined;
        return ids.map((id) => userDisplayNameMap[id.toLowerCase()] ?? id);
      };
      apimItems.forEach((item, index) => {
        const base: Record<string, unknown> = {};
        const r = base as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & Record<string, unknown>;
        const obj = item as Record<string, unknown>;
        const o = obj as {
          statutorySpatialUnitLabelId?: string;
          statutoryspatialunitlabelid?: string;
          taskId?: string;
          uprn?: unknown;
        };
        const lblId = o.statutorySpatialUnitLabelId ?? o.statutoryspatialunitlabelid;
        const uprnVal = o.uprn;
        const uprnStr = typeof uprnVal === 'string' || typeof uprnVal === 'number' ? String(uprnVal) : '';
        const primaryId = lblId ?? o.taskId;
        const fallbackId = uprnStr ? `${uprnStr}-${index}` : `apim-${index}`;
        const id = primaryId ? `${primaryId}-${index}` : fallbackId;
        r.getRecordId = () => id;
        r.getNamedReference = undefined as unknown as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getNamedReference'];
        r.getValue = ((columnName: string) => r[columnName] ?? '') as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getValue'];
        r.getFormattedValue = ((columnName: string) => toText(r[columnName])) as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getFormattedValue'];
        Object.keys(obj).forEach((k) => (r[k.toLowerCase()] = obj[k]));
        const assignedDisplay = mapUserIdsToNames((r as Record<string, unknown>).assignedto ?? (r as Record<string, unknown>).assignedTo);
        if (assignedDisplay) {
          r.assignedto = assignedDisplay;
          (r as Record<string, unknown>).assignedTo = assignedDisplay;
        }
        const qcAssignedDisplay = mapUserIdsToNames((r as Record<string, unknown>).qcassignedto ?? (r as Record<string, unknown>).qcAssignedTo);
        if (qcAssignedDisplay) {
          r.qcassignedto = qcAssignedDisplay;
          (r as Record<string, unknown>).qcAssignedTo = qcAssignedDisplay;
        }
        // some handy aliases
        r.saleid = r.saleid ?? (r as Record<string, unknown> & { saleId?: unknown }).saleId;
        const suid = normalizeSuid(r.suid);
        r.addressurl = suid && clientUrl ? buildSsuUrl(clientUrl, suid) : '';
        all.push(id);
        recs[id] = r;
      });
    } else {
      ensureSampleColumns(datasetColumns, columnDisplayNames);
      const sample = buildSampleEntityRecords();
      Object.assign(recs, sample.records);
      all.push(...sample.ids);
    }
    const t1 = performance.now();
    logPerf('[Grid Perf] Map records (ms):', Math.round(t1 - t0), 'count:', all.length);
    return { records: recs, ids: all };
  }, [apimItems, clientUrl, columnDisplayNames, datasetColumns, hasLoadedApim, userDisplayNameMap]);

  const disableClientFiltering = hasLoadedApim;

  const filteredIds = React.useMemo(() => {
    if (disableClientFiltering) {
      return ids;
    }
    const t0 = performance.now();
    const ds = datasetColumns;
    const toText = (val: unknown): string => (typeof val === 'string' ? val : typeof val === 'number' || typeof val === 'boolean' ? String(val) : '');
    const entries = Object.entries(headerFilters).filter(([, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.trim() !== '';
      if (v && typeof v === 'object') return JSON.stringify(v) !== '{}';
      return false;
    });
    if (entries.length === 0) return ids;
    const out = ids.filter((id) => {
      const rec = records[id] as unknown as Record<string, unknown>;
      return entries.every(([field, v]) => {
        const value = toText(rec[field]);
        if (Array.isArray(v)) {
          const needles = v
            .map((s) => toFilterValueString(s as ColumnFilterValue).trim().toLowerCase())
            .filter((s) => s !== '');
          if (needles.length === 0) return true;
          return needles.some((n) => value.trim().toLowerCase() === n);
        }
        const needle = toFilterValueString(v as ColumnFilterValue).trim().toLowerCase();
        if (needle === '') return true;
        return value.toLowerCase().includes(needle);
      });
    });
    const t1 = performance.now();
    logPerf('[Grid Perf] Host filter ids (ms):', Math.round(t1 - t0), 'ids:', ids.length, 'filters:', entries.length, 'result:', out.length);
    return out;
  }, [disableClientFiltering, headerFilters, ids, records, datasetColumns]);

  const sortedIds = React.useMemo(() => {
    if (!clientSort || serverDriven) return filteredIds;
    const t0 = performance.now();
    const field = clientSort.name?.toLowerCase?.() ?? '';
    const desc = clientSort.sortDirection === 1;
    const getVal = (id: string): string => {
      const rec = records[id] as unknown as Record<string, unknown>;
      const v = rec[field];
      if (typeof v === 'number') return String(v);
      if (typeof v === 'boolean') return v ? '1' : '0';
      if (typeof v === 'string') return v.toLowerCase();
      return '';
    };
    const arr = filteredIds.slice();
    arr.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp = va.localeCompare(vb, undefined, { numeric: true, sensitivity: 'base' });
      return desc ? -cmp : cmp;
    });
    const t1 = performance.now();
    logPerf('[Grid Perf] Host sort (ms):', Math.round(t1 - t0), 'field:', field, 'desc:', desc, 'count:', arr.length);
    return arr;
  }, [clientSort, filteredIds, records, serverDriven]);

  const start = currentPage * pageSize;
  const pageIds = React.useMemo(() => {
    if (serverDriven) return filteredIds;
    const pageSliceT0 = performance.now();
    const slice = sortedIds.slice(start, start + pageSize);
    const pageSliceT1 = performance.now();
    if (sortedIds.length > 0) {
      logPerf('[Grid Perf] Host page slice (ms):', Math.round(pageSliceT1 - pageSliceT0), 'start:', start, 'size:', pageSize, 'result:', slice.length);
    }
    return slice;
  }, [filteredIds, serverDriven, sortedIds, start, pageSize]);
  const canPrev = currentPage > 0;
  const canNext = serverDriven ? (currentPage + 1) * pageSize < totalCount : start + pageSize < filteredIds.length;
  const totalPages = serverDriven ? Math.ceil(totalCount / pageSize) : Math.ceil(filteredIds.length / pageSize);

  // If externalItems are provided, use them and skip APIM loading
  React.useEffect(() => {
    if (externalItems !== undefined) {
      setApimLoading(false);
      setApimItems(externalItems ?? []);
      setTotalCount((externalItems ?? []).length);
      setServerDriven(false);
      setHasLoadedApim(true);
      setLoadErrorMessage(undefined);
    }
  }, [externalItems]);

  // Initial load and reloads when critical props change (skips when externalItems are supplied)
  const lastRef = React.useRef<{
    table?: string;
    trigger?: string;
    page?: number;
    size?: number;
    sort?: string;
    nonce?: number;
    columnFilters?: string;
  }>({});
  React.useEffect(() => {
    const prevKind = lastScreenKindRef.current;
    const screenKindChanged = prevKind !== screenKind;
    const switchedSalesToManager = screenKindChanged && prevKind === 'salesSearch' && isManagerAssign;
    lastScreenKindRef.current = screenKind;

    if (switchedSalesToManager) {
      // Force a clean slate when moving from Sales Search into Manager Assignment.
      setPrefilters(undefined);
      setPrefilterApplied(false);
      setCurrentPage(0);
      setSearchFilters(createDefaultGridFilters());
      setHeaderFilters({});
      lastAppliedFiltersRef.current = {};
      setHasLoadedApim(false);
      setApimItems([]);
      setTotalCount(0);
      setServerDriven(false);
      setApiFilterOptions({});
      setLoadErrorMessage(undefined);
      selection.setAllSelected(false);
      setSelectedCount(0);
      onSelectionCountChange?.(0);
      onSelectionChange?.({ selectedTaskIds: [], selectedSaleIds: [] });
      try {
        localStorage.removeItem(prefilterStorageKey);
      } catch {
        // ignore storage failures
      }
      return;
    }

    if (externalItems !== undefined) {
      // External data path; do not load from APIM
      return;
    }
    if (isSalesSearch && !salesSearchApplied) {
      setApimLoading(false);
      setHasLoadedApim(false);
      setApimItems([]);
      setTotalCount(0);
      setServerDriven(false);
      setApiFilterOptions({});
      setLoadErrorMessage(undefined);
      return;
    }
    if (isManagerAssign && !prefilterApplied) {
      setApimLoading(false);
      setHasLoadedApim(false);
      setApimItems([]);
      setTotalCount(0);
      setServerDriven(false);
      setApiFilterOptions({});
      setLoadErrorMessage(undefined);
      return;
    }
    const trigger = String((context.parameters as unknown as Record<string, { raw?: string | number }>).searchTrigger?.raw ?? '');
    const sortKey = clientSort ? `${clientSort.name}:${clientSort.sortDirection}` : '';
    const changed = lastRef.current.table !== tableKey
      || lastRef.current.trigger !== trigger
      || lastRef.current.page !== currentPage
      || lastRef.current.size !== pageSize
      || lastRef.current.sort !== sortKey
      || lastRef.current.nonce !== searchNonce
      || lastRef.current.columnFilters !== columnFilterQuery
      || !hasLoadedApim;
    if (!changed) return;
    lastRef.current = {
      table: tableKey,
      trigger,
      page: currentPage,
      size: pageSize,
      sort: sortKey,
      nonce: searchNonce,
      columnFilters: columnFilterQuery,
    };
    setLoadErrorMessage(undefined);
    setApimLoading(true);
    void (async () => {
      const res = await loadGridData(context, {
        tableKey,
        filters: sanitizeFilters(searchFilters),
        source: sourceCode,
        currentPage,
        pageSize,
        clientSort,
        prefilters,
        searchQuery: columnFilterQuery,
      });
      setApimItems(res.items);
      setTotalCount(res.totalCount);
      setServerDriven(res.serverDriven);
      setApimLoading(false);
      setHasLoadedApim(true);
      setLoadErrorMessage(res.errorMessage);
      if (assignPendingRefresh && assignRefreshResolve.current) {
        assignRefreshResolve.current(true);
        assignRefreshResolve.current = null;
        setAssignPendingRefresh(false);
      }
      setApiFilterOptions(normalizeFilterOptions(res.filters));
    })();
  }, [context, tableKey, sourceCode, searchFilters, currentPage, pageSize, clientSort, searchNonce, hasLoadedApim, prefilters, prefilterApplied, isManagerAssign, isSalesSearch, salesSearchApplied, prefilterStorageKey, screenKind, columnFilterQuery]);

  React.useEffect(() => {
    if (!assignPanelOpen || !assignmentContextKey) {
      assignUsersLoadKeyRef.current = '';
      setAssignUsersLoading(false);
      if (!assignPanelOpen) {
        setAssignUsers([]);
        setAssignUsersError(undefined);
        setAssignUsersInfo(undefined);
      }
      return;
    }

    const apiName = resolveAssignableUsersApiName();
    if (!apiName) {
      setAssignUsers([]);
      setAssignUsersError(assignTasksText.messages.assignableUsersApiNotConfigured);
      setAssignUsersInfo(undefined);
      setAssignUsersLoading(false);
      return;
    }

    const customApiType = resolveCustomApiTypeForAssignableUsers();
    const requestKey = `${assignmentContextKey}|${apiName}|${customApiType}|${canvasScreenName}`;
    if (assignUsersLoadKeyRef.current === requestKey) {
      return;
    }
    assignUsersLoadKeyRef.current = requestKey;

    setAssignUsers([]);
    setAssignUsersLoading(true);
    setAssignUsersError(undefined);
    setAssignUsersInfo(undefined);

    void (async () => {
      try {
        const response = await executeUnboundCustomApi<{ Result?: string; result?: string }>(
          context,
          apiName,
          { screenName: canvasScreenName ?? '' },
          { operationType: customApiType },
        );
        const parsed = parseAssignableUsersResponse(response);
        if (assignUsersLoadKeyRef.current !== requestKey) {
          return;
        }

        if (parsed.error) {
          setAssignUsers([]);
          setAssignUsersError(parsed.error);
          setAssignUsersInfo(undefined);
          return;
        }

        if (parsed.info) {
          setAssignUsers([]);
          setAssignUsersError(undefined);
          setAssignUsersInfo(parsed.info);
          return;
        }

        setAssignUsers(parsed.users);
        setAssignableUsersCache((prev) => mergeAssignableUsers(prev, parsed.users));
        setAssignUsersError(undefined);
        setAssignUsersInfo(undefined);
      } catch (err) {
        setAssignUsers([]);
        setAssignUsersError(err instanceof Error ? err.message : assignTasksText.messages.assignableUsersLoadFailed);
        setAssignUsersInfo(undefined);
      } finally {
        if (assignUsersLoadKeyRef.current === requestKey) {
          setAssignUsersLoading(false);
        }
      }
    })();
  }, [assignPanelOpen, assignmentContextKey, assignTasksText.messages, canvasScreenName, context, parseAssignableUsersResponse, mergeAssignableUsers]);

  React.useEffect(() => {
    if (!isManagerAssign) {
      caseworkerOptionsLoadKeyRef.current = '';
      setCaseworkerOptions([]);
      setCaseworkerOptionsLoading(false);
      setCaseworkerOptionsError(undefined);
      return;
    }

    const apiName = resolveAssignableUsersApiName();
    if (!apiName) {
      setCaseworkerOptions([]);
      setCaseworkerOptionsError(managerText.errors.assignableUsersApiNotConfigured);
      setCaseworkerOptionsLoading(false);
      return;
    }

    const customApiType = resolveCustomApiTypeForAssignableUsers();
    const requestKey = `caseworkers|${assignmentContextKey}|${apiName}|${customApiType}|${canvasScreenName}`;
    if (caseworkerOptionsLoadKeyRef.current === requestKey) {
      return;
    }
    caseworkerOptionsLoadKeyRef.current = requestKey;

    setCaseworkerOptions([]);
    setCaseworkerOptionsLoading(true);
    setCaseworkerOptionsError(undefined);

    void (async () => {
      try {
        const response = await executeUnboundCustomApi<{ Result?: string; result?: string }>(
          context,
          apiName,
          { screenName: canvasScreenName ?? '' },
          { operationType: customApiType },
        );

        const parsed = parseAssignableUsersResponse(response);
        if (caseworkerOptionsLoadKeyRef.current !== requestKey) {
          return;
        }

        if (parsed.error) {
          setCaseworkerOptions([]);
          setCaseworkerOptionsError(parsed.error);
          return;
        }

        if (parsed.info) {
          setCaseworkerOptions([]);
          setCaseworkerOptionsError(undefined);
          return;
        }

        setCaseworkerOptions(buildCaseworkerNames(parsed.users));
        setAssignableUsersCache((prev) => mergeAssignableUsers(prev, parsed.users));
        setCaseworkerOptionsError(undefined);
      } catch (err) {
        setCaseworkerOptions([]);
        setCaseworkerOptionsError(err instanceof Error ? err.message : managerText.errors.caseworkersLoadFailed);
      } finally {
        if (caseworkerOptionsLoadKeyRef.current === requestKey) {
          setCaseworkerOptionsLoading(false);
        }
      }
    })();
  }, [
    assignmentContextKey,
    buildCaseworkerNames,
    canvasScreenName,
    context,
    isManagerAssign,
    managerText.errors,
    parseAssignableUsersResponse,
    mergeAssignableUsers,
  ]);

  // Handlers
  const [selectedCount, setSelectedCount] = React.useState(0);
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  const onSelectionCountChangeRef = React.useRef(onSelectionCountChange);
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  React.useEffect(() => {
    onSelectionCountChangeRef.current = onSelectionCountChange;
  }, [onSelectionCountChange]);
  const selectionRef = React.useRef<Selection<IObjectWithKey>>();
  const selection = (selectionRef.current ??= new Selection<IObjectWithKey>({
    getKey: (item: IObjectWithKey) =>
      (item as unknown as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord).getRecordId(),
    onSelectionChanged: () => {
      const selection = selectionRef.current;
      if (!selection) return;
      setSelectedCount((sel) => {
        const next = selection.getSelectedCount();
        onSelectionCountChangeRef.current?.(next);
        return next !== sel ? next : sel;
      });
      // Emit selected Task/Sale IDs to parent without fetching details
      try {
        const selected = selection.getSelection();
        const makeIds = (o: unknown) => {
          const r = o as { taskid?: string; taskId?: string; saleid?: string; saleId?: string };
          return { taskId: r.taskid ?? r.taskId, saleId: r.saleid ?? r.saleId };
        };
        const pairs = (selected ?? [])
          .map(makeIds)
          .filter((p) => [p.taskId, p.saleId].some((v) => !!v));
        const taskIds = pairs.map(p => p.taskId).filter((v): v is string => !!v);
        const saleIds = pairs.map(p => p.saleId).filter((v): v is string => !!v);
        const first = pairs[0] ?? { taskId: undefined, saleId: undefined };
        onSelectionChangeRef.current?.({ taskId: first.taskId, saleId: first.saleId, selectedTaskIds: taskIds, selectedSaleIds: saleIds });
      } catch {
        // ignore selection mapping errors
      }
    },
  }));
  const componentRef = React.createRef<IDetailsList>();

  const onNavigate = (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord): void => {
    if (!item) return;
    // Records are normalized to lower‑case keys during mapping; prefer lower‑case, fall back to camelCase
    const rec = item as unknown as { taskid?: string; taskId?: string; saleid?: string; saleId?: string };
    const taskId = rec.taskid ?? rec.taskId;
    const saleId = rec.saleid ?? rec.saleId;
    // Emit only. Navigation is handled in Canvas via PCF OnChange.
    onRowInvoke?.({ taskId, saleId });
  };

  const onSort = (name: string, desc: boolean): void => {
    setClientSort({ name, sortDirection: desc ? 1 : 0 });
  };

  const resolveAssignmentApiName = (): string => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).taskAssignmentApiName?.raw;
    const fromContext = normalizeCustomApiName(typeof raw === 'string' ? raw : undefined);
    const fallback = normalizeCustomApiName(CONTROL_CONFIG.taskAssignmentApiName);
    return fromContext || fallback || '';
  };

  const resolveCustomApiTypeForAssign = (): number => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).customApiType?.raw;
    const fromContext = typeof raw === 'string' ? raw : undefined;
    return resolveCustomApiOperationType(fromContext ?? CONTROL_CONFIG.customApiType);
  };

  const resolveAssignableUsersApiName = (): string => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).assignableUsersApiName?.raw;
    const fromContext = normalizeCustomApiName(typeof raw === 'string' ? raw : undefined);
    const fallback = normalizeCustomApiName(CONTROL_CONFIG.assignableUsersApiName);
    return fromContext || fallback || '';
  };

  const resolveCustomApiTypeForAssignableUsers = (): number => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).assignableUsersApiType?.raw;
    const fromContext = typeof raw === 'string' ? raw : undefined;
    const fallback = CONTROL_CONFIG.assignableUsersApiType ?? CONTROL_CONFIG.customApiType;
    return resolveCustomApiOperationType(fromContext ?? fallback);
  };

  const resolveMetadataApiName = (): string => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).metadataApiName?.raw;
    const fromContext = normalizeCustomApiName(typeof raw === 'string' ? raw : undefined);
    const fallback = normalizeCustomApiName(CONTROL_CONFIG.metadataApiName);
    return fromContext || fallback || '';
  };

  const resolveMetadataApiType = (): number => {
    const raw = (context.parameters as unknown as Record<string, { raw?: string }>).metadataApiType?.raw;
    const fromContext = typeof raw === 'string' ? raw : undefined;
    const fallback = CONTROL_CONFIG.metadataApiType ?? CONTROL_CONFIG.customApiType;
    return resolveCustomApiOperationType(fromContext ?? fallback);
  };

  const metadataApiName = resolveMetadataApiName();
  const metadataApiType = resolveMetadataApiType();

  React.useEffect(() => {
    const shouldLoad = isManagerAssign || isSalesSearch;
    if (!shouldLoad) {
      setBillingAuthorityOptions([]);
      setBillingAuthorityOptionsError(undefined);
      setBillingAuthorityOptionsLoading(false);
      return;
    }

    if (!metadataApiName) {
      setBillingAuthorityOptions([]);
      setBillingAuthorityOptionsError(commonText.messages.metadataApiNotConfigured);
      setBillingAuthorityOptionsLoading(false);
      return;
    }

    let active = true;
    setBillingAuthorityOptionsLoading(true);
    setBillingAuthorityOptionsError(undefined);

    void (async () => {
      try {
        const rawPayload = await executeUnboundCustomApi<unknown>(
          context,
          metadataApiName,
          {},
          { operationType: metadataApiType },
        );

        let payload: unknown = rawPayload;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload) as unknown;
          } catch {
            // ignore parse failures
          }
        }
        if (payload && typeof payload === 'object') {
          const record = payload as Record<string, unknown>;
          const raw = record.Result ?? record.result;
          if (typeof raw === 'string') {
            try {
              payload = JSON.parse(raw) as unknown;
            } catch {
              // ignore parse failures
            }
          }
        }

        const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : undefined;
        const list = Array.isArray(record?.billingAuthority)
          ? record?.billingAuthority
          : Array.isArray(record?.billingAuthorities)
            ? record?.billingAuthorities
            : [];

        const normalized = Array.isArray(list)
          ? list
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
          : [];

        if (!active) return;

        setBillingAuthorityOptions(normalized);
        if (!record || (!Array.isArray(record?.billingAuthority) && !Array.isArray(record?.billingAuthorities))) {
          setBillingAuthorityOptionsError(commonText.messages.billingAuthoritiesMissing);
        }
      } catch {
        if (!active) return;
        setBillingAuthorityOptions([]);
        setBillingAuthorityOptionsError(commonText.messages.billingAuthoritiesLoadFailed);
      } finally {
        if (active) {
          setBillingAuthorityOptionsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [commonText.messages, context, isManagerAssign, isSalesSearch, metadataApiName, metadataApiType]);

  const assignTasksToUser = async (user: { id: string; firstName: string; lastName: string }): Promise<boolean> => {
    try {
      const selected = selection.getSelection() as Record<string, unknown>[];
      if (selected.length === 0) {
        setAssignMessage({ text: assignTasksText.messages.selectTasksWarning, type: MessageBarType.warning });
        return false;
      }
      const assignmentConfig = CONTROL_CONFIG.taskAssignment ?? { maxBatchSize: 500, allowedStatuses: [] as string[] };
      const maxBatchSize = assignmentConfig.maxBatchSize ?? 500;
      if (selected.length > maxBatchSize) {
        const template = assignTasksText.messages.tooManyTasks;
        const message = template.replace(/\{max\}/g, String(maxBatchSize));
        setAssignMessage({ text: message, type: MessageBarType.warning });
        return false;
      }
      const apiName = resolveAssignmentApiName();
      if (!apiName) {
        setAssignMessage({ text: assignTasksText.messages.apiNotConfigured, type: MessageBarType.error });
        return false;
      }
      const customApiType = resolveCustomApiTypeForAssign();
      const assignedBy = resolveAssignedByUserId(context);
      const assignedDate = new Date().toISOString();
      const toNumericTaskId = (value: unknown): string => {
        const raw = typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
        if (!raw) return '';
        const digitsOnly = raw.replace(/\D/g, '');
        return digitsOnly || raw;
      };
      const allowedStatuses = (assignmentConfig.allowedStatuses ?? []).map((s) => s.toLowerCase());
      for (const rec of selected) {
        const statusRaw = (rec.taskstatus ?? rec.taskStatus ?? '') as string;
        const normalized = String(statusRaw ?? '').trim().toLowerCase();
        if (allowedStatuses.length > 0 && normalized && !allowedStatuses.includes(normalized)) {
          const message = assignTasksText.messages.invalidStatus;
          setAssignMessage({ text: message, type: MessageBarType.error });
          return false;
        }
      }
      const taskIds = selected
        .map((rec) => toNumericTaskId(rec.taskid ?? rec.taskId ?? ''))
        .map((value) => value.trim())
        .filter((value) => value !== '');
      const uniqueTaskIds = Array.from(new Set(taskIds));
      if (uniqueTaskIds.length === 0) {
        setAssignMessage({ text: assignTasksText.messages.noValidTaskIds, type: MessageBarType.error });
        return false;
      }
      const parseAssignmentResult = (payload: unknown): { success?: boolean; message?: string; payload?: string } | null => {
        if (!payload) return null;
        if (typeof payload === 'string') {
          try {
            return JSON.parse(payload) as { success?: boolean; message?: string; payload?: string };
          } catch {
            return { message: payload };
          }
        }
        if (typeof payload === 'object') {
          const record = payload as Record<string, unknown>;
          const raw = record.Result ?? record.result;
          if (typeof raw === 'string') {
            try {
              return JSON.parse(raw) as { success?: boolean; message?: string; payload?: string };
            } catch {
              return { message: raw };
            }
          }
          if (typeof record.success === 'boolean') {
            return record as { success?: boolean; message?: string; payload?: string };
          }
        }
        return null;
      };

      const response = await executeUnboundCustomApi<Record<string, unknown>>(
        context,
        apiName,
        {
          assignedToUserId: user.id,
          taskId: JSON.stringify(uniqueTaskIds),
          assignedByUserId: assignedBy,
          date: assignedDate,
          screenName: assignmentScreenName || screenName,
        },
        { operationType: customApiType },
      );
      const parsed = parseAssignmentResult(response);
      if (parsed?.success === false) {
        const fallback = assignTasksText.messages.alreadyAssigned;
        const message = parsed.message?.trim()
          ?? parsed.payload?.trim()
          ?? fallback;
        setAssignMessage({ text: message, type: MessageBarType.error });
        return false;
      }
      const successMessage = parsed?.message?.trim() ?? assignTasksText.messages.assignedSuccess;
      setAssignMessage({ text: successMessage, type: MessageBarType.success });
      selection.setAllSelected(false);
      setSelectedCount(0);
      onSelectionCountChange?.(0);
      onSelectionChange?.({ selectedTaskIds: [], selectedSaleIds: [] });
      setAssignPendingRefresh(true);
      setSearchNonce((n) => n + 1);
      return await new Promise<boolean>((resolve) => {
        assignRefreshResolve.current = resolve;
      });
    } catch (err) {
      setAssignMessage({
        text: assignTasksText.messages.alreadyAssigned,
        type: MessageBarType.error,
      });
      if (assignRefreshResolve.current) {
        assignRefreshResolve.current(false);
        assignRefreshResolve.current = null;
        setAssignPendingRefresh(false);
      }
      return false;
    }
  };

  const props: GridProps = {
    showSearchPanel: !isManagerAssign,
    screenKind,
    tableKey,
    datasetColumns,
    columnConfigs,
    billingAuthorityOptions,
    billingAuthorityOptionsLoading,
    billingAuthorityOptionsError,
    caseworkerOptions,
    caseworkerOptionsLoading,
    caseworkerOptionsError,
    records,
    sortedRecordIds: pageIds,
    shimmer: apimLoading,
    itemsLoading: apimLoading,
    selectionType: SelectionMode.multiple,
    selection,
    onNavigate,
    onSort,
    sorting: (clientSort ? [{ name: clientSort.name, sortDirection: clientSort.sortDirection }] : []) as unknown as ComponentFramework.PropertyHelper.DataSetApi.SortStatus[],
    componentRef,
    resources: context.resources,
    columnDatasetNotDefined: false,
    onSearch: (fs) => {
      const sanitized = sanitizeFilters(fs);
      setSearchFilters(sanitized);
      setCurrentPage(0);
      if (isSalesSearch) {
        const isDefault = isSalesSearchDefaultFilters(sanitized);
        setSalesSearchApplied(!isDefault);
        if (isDefault) {
          setHasLoadedApim(false);
          setApimItems([]);
          setTotalCount(0);
          setServerDriven(false);
          setApiFilterOptions({});
          setLoadErrorMessage(undefined);
          return;
        }
      }
      setSearchNonce((n) => n + 1);
    },
    onNextPage: () => {
      if (canNext) setCurrentPage((p) => p + 1);
    },
    onPrevPage: () => {
      if (canPrev) setCurrentPage((p) => p - 1);
    },
    onSetPage: (p) => {
      if (p >= 0 && p !== currentPage) setCurrentPage(p);
    },
    currentPage,
    totalPages,
    canNext,
    canPrev,
    searchFilters,
    showResults: (!isManagerAssign || prefilterApplied) && (!isSalesSearch || salesSearchApplied),
    selectedCount,
    allowColumnReorder,
    statusMessage: assignMessage,
    errorMessage: loadErrorMessage,
    assignUsers,
    assignUsersLoading,
    assignUsersError,
    assignUsersInfo,
    onAssignPanelToggle: handleAssignPanelToggle,
    onAssignTasks: assignTasksToUser,
    onLoadFilterOptions: (field, query) => {
      const key = String(field ?? '').toLowerCase();
      const options = apiFilterOptions[key] ?? [];
      if (!query || query.trim().length === 0) return Promise.resolve(options);
      const q = query.trim().toLowerCase();
      return Promise.resolve(options.filter((opt) => opt.toLowerCase().includes(q)));
    },
    onColumnFiltersChange: (f) => {
      const normalized: Record<string, ColumnFilterValue> = {};
      Object.entries(f).forEach(([k, v]) => (normalized[k.toLowerCase()] = v as ColumnFilterValue));
      // No-op if unchanged to avoid duplicate apply calls
      const prev = lastAppliedFiltersRef.current;
      const same = areFiltersEqual(prev, normalized);
      if (!same) {
        lastAppliedFiltersRef.current = normalized;
        setHeaderFilters(normalized);
        // Persist immediately to localStorage as arrays
        try {
          if (Object.keys(normalized).length === 0) {
            localStorage.removeItem(storageKey); localStorage.removeItem(storageKeyNC);
          } else {
            const arrayStore: Record<string, string[]> = {};
            Object.entries(normalized).forEach(([k, v]) => {
              if (Array.isArray(v)) {
                arrayStore[k] = v.map((x) => String(x ?? ''));
              } else if (typeof v === 'string') {
                arrayStore[k] = [v];
              } else {
                arrayStore[k] = [JSON.stringify(v ?? {})];
              }
            });
            const filtersJSON = JSON.stringify(arrayStore);
            localStorage.setItem(storageKey, filtersJSON);
            localStorage.setItem(storageKeyNC, filtersJSON);
          }
        } catch {
          // ignore storage failures
        }
        setCurrentPage(0);
        try { onColumnFiltersApply?.(toApiHeaderFilters(normalized)); } catch { void 0; }
      }
    },
    columnFilters: headerFilters,
    disableClientFiltering,
    taskCount: serverDriven ? totalCount : filteredIds.length,
    canvasScreenName,
    prefilterApplied,
    onPrefilterApply: (next) => {
      setPrefilters(next);
      setPrefilterApplied(true);
      setCurrentPage(0);
      setSearchFilters(createDefaultGridFilters());
      setClientSort({ name: 'saleid', sortDirection: 0 });
      setHeaderFilters({});
      lastAppliedFiltersRef.current = {};
      selection.setAllSelected(false);
      setSelectedCount(0);
      onSelectionCountChange?.(0);
      onSelectionChange?.({ selectedTaskIds: [], selectedSaleIds: [] });
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(storageKeyNC);
      } catch {
        // ignore storage failures
      }
      setSearchNonce((n) => n + 1);
    },
    onPrefilterClear: () => {
      setPrefilters(undefined);
      setPrefilterApplied(false);
      setCurrentPage(0);
      setSearchFilters(createDefaultGridFilters());
      setClientSort({ name: 'saleid', sortDirection: 0 });
      setHeaderFilters({});
      lastAppliedFiltersRef.current = {};
      selection.setAllSelected(false);
      setSelectedCount(0);
      onSelectionCountChange?.(0);
      onSelectionChange?.({ selectedTaskIds: [], selectedSaleIds: [] });
      setApimItems([]);
      setTotalCount(0);
      setServerDriven(false);
      setHasLoadedApim(false);
      setApiFilterOptions({});
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(storageKeyNC);
      } catch {
        // ignore storage failures
      }
    },
    rowInvokeEnabled: false,
  };

  return <Grid {...(props as unknown as GridProps)} height={allocatedHeight} onBackRequested={onBackRequested} />;
};

DetailsListHost.displayName = 'DetailsListHost';
