import * as React from 'react';
import { Selection, SelectionMode, IDetailsList, IObjectWithKey, MessageBarType } from '@fluentui/react';
import { DetailsList as Grid, GridProps } from '../DetailsList';
import { PCFContext } from '../context/PCFContext';
import { ColumnConfig } from '../../Component.types';
import { GridFilterState, createDefaultGridFilters, sanitizeFilters, NumericFilter, DateRangeFilter } from '../../Filters';
import { getProfileConfigs } from '../../config/ColumnProfiles';
import { CONTROL_CONFIG } from '../../config/ControlConfig';
import { isLookupFieldFor } from '../../config/TableConfigs';
import { type ManagerPrefilterState } from '../../config/PrefilterConfigs';
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
  // When provided, the host renders these items instead of loading via APIM.
  externalItems?: unknown[];
  // Bubble header filter Apply back to parent (used by external item scenarios to call API with extra params)
  onColumnFiltersApply?: (filters: Record<string, string | string[]>) => void;
}

type ColumnFilterValue = string | string[] | NumericFilter | DateRangeFilter;
type FilterOptionsMap = Record<string, string[]>;

const SSU_APP_ID = 'cdb5343c-51c1-ec11-983e-002248438fff';

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
  externalItems,
  onColumnFiltersApply,
}) => {
  // Parse basic params
  const pageSize = (context.parameters as unknown as Record<string, { raw?: number }>).pageSize?.raw ?? 10;
  const tableKey = (CONTROL_CONFIG.tableKey || 'sales').trim().toLowerCase();

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
      const fromProfile = getProfileConfigs();
      const fromJson = JSON.parse(raw) as ColumnConfig[];
      const merged = [...fromProfile, ...fromJson];
      const map: Record<string, ColumnConfig> = {};
      merged.forEach((c) => {
        const n = c.ColName?.trim().toLowerCase();
        if (n) map[n] = c;
      });
      // Ensure multi-value flags render as tags by default
      if (!map.summaryflags) {
        map.summaryflags = { ColName: 'summaryflags', ColCellType: 'tag' } as ColumnConfig;
      }
      if (!map.reviewflags) {
        map.reviewflags = { ColName: 'reviewflags', ColCellType: 'tag' } as ColumnConfig;
      }
      if (map.taskid) {
        if (!map.taskid.ColCellType) {
          map.taskid = { ...map.taskid, ColCellType: 'link' } as ColumnConfig;
        }
      } else {
        map.taskid = { ColName: 'taskid', ColCellType: 'link' } as ColumnConfig;
      }
      setColumnConfigs(map);
    } catch {
      setColumnConfigs({});
    }
  }, [context]);

  // State
  const [currentPage, setCurrentPage] = React.useState(0);
  const [headerFilters, setHeaderFilters] = React.useState<Record<string, ColumnFilterValue>>({});

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
  const [searchFilters, setSearchFilters] = React.useState<GridFilterState>({
    ...createDefaultGridFilters(),
    searchBy: 'taskStatus',
    taskStatus: ['New'],
  });
  const [prefilters, setPrefilters] = React.useState<ManagerPrefilterState | undefined>(undefined);
  const [prefilterApplied, setPrefilterApplied] = React.useState(false);
  const [searchNonce, setSearchNonce] = React.useState(0);
  const [apiFilterOptions, setApiFilterOptions] = React.useState<FilterOptionsMap>({});
  const [apimItems, setApimItems] = React.useState<unknown[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [serverDriven, setServerDriven] = React.useState(false);
  const [apimLoading, setApimLoading] = React.useState(false);
  const [hasLoadedApim, setHasLoadedApim] = React.useState(false);
  const [assignMessage, setAssignMessage] = React.useState<{ text: string; type: MessageBarType } | undefined>(undefined);
  const [assignPendingRefresh, setAssignPendingRefresh] = React.useState(false);
  const assignRefreshResolve = React.useRef<null | ((ok: boolean) => void)>(null);
  // Defer persistence until after initial hydration to avoid add/remove flicker in localStorage
  const [hydrated, setHydrated] = React.useState(false);
  const allowColumnReorder = (context.parameters as unknown as Record<string, { raw?: string | boolean }>).allowColumnReorder?.raw === true ||
    String((context.parameters as unknown as Record<string, { raw?: string | boolean }>).allowColumnReorder?.raw ?? '').toLowerCase() === 'true';
  const canvasScreenName = (context.parameters as unknown as Record<string, { raw?: string }>).canvasScreenName?.raw ?? '';
  const screenName = canvasScreenName.toLowerCase();
  const isManagerAssign = screenName.includes('assignment') && screenName.includes('manager');

  // Persist header filters per table for consistent UX across reloads
  const storageKey = React.useMemo(() => `voa-grid-filters:${tableKey}`, [tableKey]);
  const storageKeySort = React.useMemo(() => `voa-grid-sort:${tableKey}`, [tableKey]);
  const storageKeyPage = React.useMemo(() => `voa-grid-page:${tableKey}`, [tableKey]);
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
        // some handy aliases
        r.saleid = r.saleid ?? (r as Record<string, unknown> & { saleId?: unknown }).saleId;
        const suidValue = r.suid;
        const suid = typeof suidValue === 'string'
          ? suidValue
          : typeof suidValue === 'number'
            ? String(suidValue)
            : '';
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
  }, [apimItems, clientUrl, columnDisplayNames, datasetColumns, hasLoadedApim]);

  const filteredIds = React.useMemo(() => {
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
  }, [headerFilters, ids, records, datasetColumns]);

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
    }
  }, [externalItems]);

  // Initial load and reloads when critical props change (skips when externalItems are supplied)
  const lastRef = React.useRef<{ table?: string; trigger?: string; page?: number; size?: number; sort?: string; nonce?: number }>({});
  React.useEffect(() => {
    if (externalItems !== undefined) {
      // External data path; do not load from APIM
      return;
    }
    if (isManagerAssign && !prefilterApplied) {
      setApimLoading(false);
      setHasLoadedApim(false);
      setApimItems([]);
      setTotalCount(0);
      setServerDriven(false);
      setApiFilterOptions({});
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
      || !hasLoadedApim;
    if (!changed) return;
    lastRef.current = { table: tableKey, trigger, page: currentPage, size: pageSize, sort: sortKey, nonce: searchNonce };
    setApimLoading(true);
    void (async () => {
      const res = await loadGridData(context, {
        tableKey,
        filters: sanitizeFilters(searchFilters),
        currentPage,
        pageSize,
        clientSort,
        prefilters,
      });
      setApimItems(res.items);
      setTotalCount(res.totalCount);
      setServerDriven(res.serverDriven);
      setApimLoading(false);
      setHasLoadedApim(true);
      if (assignPendingRefresh && assignRefreshResolve.current) {
        assignRefreshResolve.current(true);
        assignRefreshResolve.current = null;
        setAssignPendingRefresh(false);
      }
      setApiFilterOptions(normalizeFilterOptions(res.filters));
    })();
  }, [context, tableKey, searchFilters, currentPage, pageSize, clientSort, searchNonce, hasLoadedApim, prefilters, prefilterApplied, isManagerAssign]);

  // Handlers
  const [selectedCount, setSelectedCount] = React.useState(0);
  const selection: Selection<IObjectWithKey> = new Selection<IObjectWithKey>({
    getKey: (item: IObjectWithKey) => (item as unknown as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord).getRecordId(),
    onSelectionChanged: () => {
      setSelectedCount((sel) => {
        const next = selection.getSelectedCount();
        onSelectionCountChange?.(next);
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
        onSelectionChange?.({ taskId: first.taskId, saleId: first.saleId, selectedTaskIds: taskIds, selectedSaleIds: saleIds });
      } catch {
        // ignore selection mapping errors
      }
    },
  });
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

  const assignTasksToUser = async (user: { id: string; firstName: string; lastName: string }): Promise<boolean> => {
    try {
      const selected = selection.getSelection() as Record<string, unknown>[];
      if (selected.length === 0) {
        setAssignMessage({ text: 'Please select one or more tasks to assign.', type: MessageBarType.warning });
        return false;
      }
      const apiName = resolveAssignmentApiName();
      if (!apiName) {
        setAssignMessage({ text: 'Task assignment API name is not configured.', type: MessageBarType.error });
        return false;
      }
      const customApiType = resolveCustomApiTypeForAssign();
      const assignedBy = (context.userSettings as { userId?: string } | undefined)?.userId ?? '';
      const assignedDate = new Date().toISOString();
      for (const rec of selected) {
        const saleId = (rec.saleid ?? rec.saleId ?? '') as string;
        const taskId = (rec.taskid ?? rec.taskId ?? '') as string;
        const taskStatus = (rec.taskstatus ?? rec.taskStatus ?? '') as string;
        await executeUnboundCustomApi<Record<string, unknown>>(
          context,
          apiName,
          {
            assignedToUserId: user.id,
            taskStatus,
            saleId,
            taskId,
            assignedByUserId: assignedBy,
            date: assignedDate,
          },
          { operationType: customApiType },
        );
      }
      setAssignMessage({ text: 'The selected tasks have been assigned successfully.', type: MessageBarType.success });
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
        text: 'One or more of the selected tasks has already been assigned. Please refresh the page and try again.',
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
    showSearchPanel: false,
    tableKey,
    datasetColumns,
    columnConfigs,
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
      setSearchFilters(sanitizeFilters(fs));
      setCurrentPage(0);
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
    showResults: !isManagerAssign || prefilterApplied,
    selectedCount,
    allowColumnReorder,
    statusMessage: assignMessage,
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
  };

  return <Grid {...(props as unknown as GridProps)} />;
};

DetailsListHost.displayName = 'DetailsListHost';
