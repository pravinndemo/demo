import { type DateRangeFilter, type NumericFilter } from '../Filters';
import { getColumnFilterConfigFor, isLookupFieldFor } from '../config/TableConfigs';
import { type ClientSortState } from './GridDataParams';

export type ColumnFilterValue = string | string[] | NumericFilter | DateRangeFilter;

type PersistedColumnFilters = Record<string, string[]>;

const normalizeStoredStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean' ? String(entry).trim() : ''))
      .filter((entry) => entry !== '');
  }

  const single = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value).trim()
    : '';
  return single ? [single] : [];
};

const parseStoredJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const restoreNumericFilter = (raw: string): NumericFilter | undefined => {
  const parsed = parseStoredJson(raw);
  if (!parsed || typeof parsed !== 'object') return undefined;

  const candidate = parsed as Partial<NumericFilter>;
  const mode = candidate.mode;
  if (mode !== '>=' && mode !== '<=' && mode !== 'between') return undefined;

  const min = toNumber(candidate.min);
  const max = toNumber(candidate.max);
  if (mode === 'between') {
    if (min === undefined && max === undefined) return undefined;
    return { mode, min, max };
  }
  if (mode === '>=') {
    return min === undefined ? undefined : { mode, min };
  }
  return max === undefined ? undefined : { mode, max };
};

const restoreDateRangeFilter = (raw: string): DateRangeFilter | undefined => {
  const parsed = parseStoredJson(raw);
  if (!parsed || typeof parsed !== 'object') return undefined;

  const candidate = parsed as Partial<DateRangeFilter>;
  const from = typeof candidate.from === 'string' && candidate.from.trim() ? candidate.from.trim() : undefined;
  const to = typeof candidate.to === 'string' && candidate.to.trim() ? candidate.to.trim() : undefined;
  return from || to ? { from, to } : undefined;
};

export const serializeColumnFiltersForStorage = (
  filters: Record<string, ColumnFilterValue>,
): PersistedColumnFilters => {
  const out: PersistedColumnFilters = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      const values = normalizeStoredStrings(value);
      if (values.length > 0) out[key] = values;
      return;
    }

    if (typeof value === 'string') {
      if (value !== '') out[key] = [value];
      return;
    }

    out[key] = [JSON.stringify(value)];
  });

  return out;
};

export const deserializeColumnFiltersFromStorage = (
  tableKey: string,
  raw: string | PersistedColumnFilters | null | undefined,
): Record<string, ColumnFilterValue> => {
  if (!raw) return {};

  let parsedStore: unknown = raw;
  if (typeof raw === 'string') {
    parsedStore = parseStoredJson(raw);
  }
  if (!parsedStore || typeof parsedStore !== 'object') return {};

  const out: Record<string, ColumnFilterValue> = {};
  Object.entries(parsedStore as Record<string, unknown>).forEach(([key, value]) => {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const storedValues = normalizeStoredStrings(value);
    const cfg = getColumnFilterConfigFor(tableKey, normalizedKey);

    if (cfg?.control === 'multiSelect') {
      if (storedValues.length > 0) out[normalizedKey] = storedValues;
      return;
    }

    if (cfg?.control === 'numeric') {
      const restored = storedValues[0] ? restoreNumericFilter(storedValues[0]) : undefined;
      if (restored) out[normalizedKey] = restored;
      return;
    }

    if (cfg?.control === 'dateRange') {
      const restored = storedValues[0] ? restoreDateRangeFilter(storedValues[0]) : undefined;
      if (restored) out[normalizedKey] = restored;
      return;
    }

    if (storedValues.length === 0) return;

    if (cfg?.control === 'singleSelect'
      || cfg?.control === 'textEq'
      || cfg?.control === 'textContains'
      || cfg?.control === 'textPrefix') {
      out[normalizedKey] = storedValues[0];
      return;
    }

    out[normalizedKey] = isLookupFieldFor(tableKey, normalizedKey) ? storedValues : storedValues[0];
  });

  return out;
};

export const parseStoredSortState = (raw: string | null | undefined): ClientSortState | undefined => {
  if (!raw) return undefined;

  const parsed = parseStoredJson(raw);
  if (!parsed || typeof parsed !== 'object') return undefined;

  const candidate = parsed as Partial<ClientSortState>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const sortDirection = candidate.sortDirection;
  if (!name || (sortDirection !== 0 && sortDirection !== 1)) return undefined;
  return { name, sortDirection };
};

export const shouldPersistSortState = (
  clientSort: ClientSortState | undefined,
  userSortActive: boolean,
): clientSort is ClientSortState =>
  !!clientSort && !!clientSort.name?.trim() && userSortActive && (clientSort.sortDirection === 0 || clientSort.sortDirection === 1);
