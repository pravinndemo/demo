import { type NumericFilter, type DateRangeFilter } from '../Filters';
import { getColumnFilterConfigFor, type TableKey } from '../config/TableConfigs';
import { COLUMN_FILTER_CONDITION_SEPARATOR, COLUMN_FILTER_VALUE_SEPARATOR } from '../config/PrefilterConfigs';

export type ColumnFilterValue = string | string[] | NumericFilter | DateRangeFilter;

const COLUMN_FILTER_FIELD_MAP: Record<string, string> = {
  saleid: 'saleId',
  taskid: 'taskId',
  uprn: 'uprn',
  address: 'address',
  postcode: 'postCode',
  billingauthority: 'billingAuthority',
  transactiondate: 'transactionDate',
  saleprice: 'salesPrice',
  salesprice: 'salesPrice',
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

export const normalizeColumnFilterFieldName = (field: string): string => {
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

export const buildColumnFilterTokens = (
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
    return [apiField, operator, values.join(COLUMN_FILTER_VALUE_SEPARATOR)];
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
        return [apiField, 'between', String(min), String(max)];
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

export const buildColumnFilterSortMarker = (sort?: { name?: string; sortDirection?: number }): string | undefined => {
  if (!sort?.name) return undefined;
  const normalizedField = normalizeColumnFilterFieldName(sort.name);
  if (!normalizedField) return undefined;
  const direction = sort.sortDirection === 1 ? 'DESC' : 'ASC';
  const encodedField = encodeURIComponent(normalizedField);
  return `columnFilter=${encodedField}~SORT~${direction}`;
};

export const buildColumnFilterQuery = (
  tableKey: TableKey,
  filters: Record<string, ColumnFilterValue>,
  sort?: { name?: string; sortDirection?: number },
): string => {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  const expressions = entries
    .map(([field, value]) => buildColumnFilterTokens(tableKey, field, value))
    .filter((tokens): tokens is string[] => !!tokens && tokens.length > 0)
    .map((tokens) => {
      const encoded = tokens.map((token) => encodeURIComponent(token));
      return `columnFilter=${encoded.join(COLUMN_FILTER_CONDITION_SEPARATOR)}`;
    });

  if (expressions.length === 0) {
    return '';
  }
  const sortMarker = buildColumnFilterSortMarker(sort);
  return sortMarker ? `${expressions.join('&')}&${sortMarker}` : expressions.join('&');
};
