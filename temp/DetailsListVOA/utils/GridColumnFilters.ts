import { type NumericFilter, type DateRangeFilter } from '../Filters';
import { getColumnFilterConfigFor } from '../config/TableConfigs';

export type ColumnFilterValue = string | string[] | NumericFilter | DateRangeFilter;

const nowMs = (): number => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

const isActiveFilterValue = (value: ColumnFilterValue): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim() !== '';
  if ((value as NumericFilter).mode !== undefined) {
    const num = value as NumericFilter;
    if (num.mode === 'between') return num.min !== undefined || num.max !== undefined;
    if (num.mode === '>=') return num.min !== undefined;
    if (num.mode === '<=') return num.max !== undefined;
    return false;
  }
  if ((value as DateRangeFilter).from !== undefined || (value as DateRangeFilter).to !== undefined) {
    return true;
  }
  return false;
};

export const getActiveColumnFilters = (
  filters: Record<string, ColumnFilterValue>,
): [string, ColumnFilterValue][] => Object.entries(filters).filter(([, value]) => value !== undefined && isActiveFilterValue(value));

export const filterItemsByColumnFilters = <T>(
  items: T[],
  filters: Record<string, ColumnFilterValue>,
  tableKey: string,
  getFilterableText: (raw: unknown) => string,
  getFieldValue: (item: T, field: string) => unknown,
): T[] => {
  const t0 = nowMs();
  const filterEntries = getActiveColumnFilters(filters);
  if (filterEntries.length === 0) {
    const t1 = nowMs();
    console.log('[Grid Perf] Client filteredItems (no filters) (ms):', Math.round(t1 - t0), 'items:', items.length);
    return items;
  }
  const out = items.filter((item) => {
    return filterEntries.every(([fieldName, filterValue]) => {
      const cfg = getColumnFilterConfigFor(tableKey, fieldName);
      const raw = getFieldValue(item, fieldName);
      const textVal = getFilterableText(raw).trim();
      if (cfg) {
        switch (cfg.control) {
          case 'textEq':
            return typeof filterValue === 'string'
              ? textVal.toLowerCase().includes(filterValue.trim().toLowerCase())
              : true;
          case 'textPrefix':
            return typeof filterValue === 'string'
              ? textVal.toLowerCase().startsWith(filterValue.trim().toLowerCase())
              : true;
          case 'textContains':
            return typeof filterValue === 'string'
              ? textVal.toLowerCase().includes(filterValue.trim().toLowerCase())
              : true;
          case 'singleSelect':
            return typeof filterValue === 'string'
              ? textVal.toLowerCase() === filterValue.trim().toLowerCase()
              : true;
          case 'multiSelect': {
            const needles = Array.isArray(filterValue)
              ? filterValue.map((v) => String(v).trim().toLowerCase())
              : [];
            if (needles.length === 0) return true;
            if (Array.isArray(raw)) {
              const hay = raw
                .map((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v).trim().toLowerCase() : ''))
                .filter((s) => s !== '');
              return needles.some((n) => hay.includes(n));
            }
            return needles.some((n) => textVal.toLowerCase() === n);
          }
          case 'numeric': {
            const numFilter = filterValue as NumericFilter;
            const numericRaw = typeof raw === 'number' ? raw : Number(textVal);
            if (Number.isNaN(numericRaw)) return false;
            if (numFilter.mode === 'between') {
              const minOk = numFilter.min !== undefined ? numericRaw >= numFilter.min : true;
              const maxOk = numFilter.max !== undefined ? numericRaw <= numFilter.max : true;
              return minOk && maxOk;
            }
            if (numFilter.mode === '>=') return numFilter.min !== undefined ? numericRaw >= numFilter.min : true;
            if (numFilter.mode === '<=') return numFilter.max !== undefined ? numericRaw <= numFilter.max : true;
            return true;
          }
          case 'dateRange': {
            const dr = filterValue as DateRangeFilter;
            const rawDate = textVal;
            const rawTime = Date.parse(rawDate);
            if (Number.isNaN(rawTime)) return false;
            const fromTime = dr.from ? Date.parse(dr.from) : undefined;
            const toTime = dr.to ? Date.parse(dr.to) : undefined;
            if (fromTime !== undefined && rawTime < fromTime) return false;
            if (toTime !== undefined && rawTime > toTime) return false;
            return true;
          }
          default:
            return true;
        }
      }
      if (Array.isArray(filterValue)) {
        const needles = filterValue.map((v) => String(v).trim().toLowerCase()).filter((v) => v !== '');
        if (needles.length === 0) return true;
        if (Array.isArray(raw)) {
          const hay = raw
            .map((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v).trim().toLowerCase() : ''))
            .filter((s) => s !== '');
          return needles.some((n) => hay.includes(n));
        }
        const text = textVal.toLowerCase();
        return needles.some((n) => text === n);
      }
      const needle = typeof filterValue === 'string' ? filterValue.trim().toLowerCase() : '';
      if (Array.isArray(raw)) {
        return raw.some((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') && String(v).toLowerCase().includes(needle));
      }
      const text = textVal.toLowerCase();
      return text.includes(needle);
    });
  });
  const t1 = nowMs();
  console.log('[Grid Perf] Client filteredItems (ms):', Math.round(t1 - t0), 'items:', items.length, 'filters:', filterEntries.length, 'result:', out.length);
  return out;
};
