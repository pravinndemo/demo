import { IInputs } from '../generated/ManifestTypes';
import { GridFilterState } from '../Filters';
import { buildApiParamsFor } from '../config/TableConfigs';
import { CONTROL_CONFIG } from '../config/ControlConfig';
import { SAMPLE_RECORDS, SampleRecord, SampleRecordValue } from '../data/SampleData';
import { TaskSearchItem, TaskSearchResponse, SAMPLE_TASK_RESULTS } from '../data/TaskSearchSample';
import { executeUnboundCustomApi, normalizeCustomApiName, resolveCustomApiOperationType } from './CustomApi';

export interface SearchRequest {
  tableKey: string;
  page: number;
  pageSize: number;
  filters: GridFilterState;
}

interface SalesPageInfo {
  pageNumber?: number;
  pageSize?: number;
  totalRecords?: number;
  totalRows?: number;
}

interface SalesApiItem {
  saleId?: string;
  suid?: string;
  taskId?: string;
  uprn?: string;
  address?: string;
  postcode?: string;
  billingAuthority?: string;
  transactionDate?: string;
  salesPrice?: number;
  ratio?: number;
  dwellingType?: string;
  flaggedForReview?: boolean;
  reviewFlags?: string[];
  outlierRatio?: number;
  overallFlag?: string;
  summaryFlags?: string[];
  taskStatus?: string;
  assignedTo?: string[] | string;
  assignedDate?: string | null;
  taskCompletedDate?: string | null;
  qcAssignedTo?: string[] | string;
  qcAssignedDate?: string | null;
  qcCompletedDate?: string | null;
}

export interface SalesApiResponse {
  pageInfo?: SalesPageInfo;
  sales?: SalesApiItem[];
  filters?: Record<string, string | string[]>;
}

type SalesPayload = TaskSearchResponse | SalesApiResponse;

const sampleValueToString = (value: SampleRecordValue): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
  return '';
};

const sampleValueToOptionalString = (value: SampleRecordValue): string | undefined => {
  const text = sampleValueToString(value);
  return text ? text : undefined;
};

const sampleValueToNumber = (value: SampleRecordValue): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const sampleValueToStringArray = (value: SampleRecordValue): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map((entry) => sampleValueToString(entry));
  }
  const text = sampleValueToOptionalString(value);
  return text ? [text] : undefined;
};

const sampleValueToStringOrArray = (value: SampleRecordValue): string | string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map((entry) => sampleValueToString(entry));
  }
  return sampleValueToOptionalString(value);
};

const sampleValueToBoolean = (value: SampleRecordValue): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['yes', 'true', 'y', '1'].includes(normalized)) return true;
    if (['no', 'false', 'n', '0'].includes(normalized)) return false;
  }
  return undefined;
};

const mapSampleRecordToTaskSearchItem = (record: SampleRecord): TaskSearchItem => ({
  saleId: sampleValueToOptionalString(record.saleid),
  taskId: sampleValueToString(record.taskid),
  uprn: sampleValueToString(record.uprn),
  taskStatus: sampleValueToString(record.taskstatus),
  address: sampleValueToString(record.address),
  postcode: sampleValueToString(record.postcode),
  transactionDate: sampleValueToString(record.transactiondate),
  billingAuthority: sampleValueToOptionalString(record.billingauthority),
  salePrice: sampleValueToNumber(record.saleprice),
  ratio: sampleValueToNumber(record.ratio),
  dwellingType: sampleValueToOptionalString(record.dwellingtype),
  flaggedForReview: sampleValueToBoolean(record.flaggedforreview),
  reviewFlags: sampleValueToStringArray(record.reviewflags),
  outlierRatio: sampleValueToNumber(record.outlierratio),
  overallFlag: sampleValueToOptionalString(record.overallflag),
  summaryFlags: sampleValueToStringArray(record.summaryflags),
  assignedTo: sampleValueToStringOrArray(record.assignedto),
  assignedDate: sampleValueToOptionalString(record.assigneddate),
  taskCompletedDate: sampleValueToOptionalString(record.taskcompleteddate ?? record.completeddate),
  qcAssignedTo: sampleValueToStringOrArray(record.qcassignedto),
  qcAssignedDate: sampleValueToOptionalString(record.qcassigneddate),
  qcCompletedDate: sampleValueToOptionalString(record.qccompleteddate),
});

const normalizeKey = (key: string): string => key.replace(/[^a-z0-9]/gi, '').toLowerCase();

const buildNormalizedMap = (item: Record<string, unknown>): Record<string, unknown> => {
  const map: Record<string, unknown> = {};
  Object.keys(item).forEach((key) => {
    const normalized = normalizeKey(key);
    if (normalized) map[normalized] = item[key];
  });
  return map;
};

const getNormalizedValue = (
  map: Record<string, unknown>,
  key: string,
  aliases: string[] = [],
): unknown => {
  const keys = [key, ...aliases];
  for (const k of keys) {
    const normalized = normalizeKey(k);
    if (Object.prototype.hasOwnProperty.call(map, normalized)) {
      return map[normalized];
    }
  }
  return undefined;
};

const toText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

const toTextOrEmpty = (value: unknown): string => toText(value) ?? '';

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['yes', 'true', 'y', '1'].includes(normalized)) return true;
    if (['no', 'false', 'n', '0'].includes(normalized)) return false;
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const out = value.map((entry) => toText(entry)).filter((entry): entry is string => !!entry && entry.length > 0);
    return out.length > 0 ? out : undefined;
  }
  const text = toText(value);
  return text ? [text] : undefined;
};

const toStringArrayOrEmpty = (value: unknown): string[] => toStringArray(value) ?? [];

const toDelimitedStringArray = (value: unknown, delimiter: string): string[] | undefined => {
  const text = toText(value);
  if (!text) return undefined;
  const parts = text
    .split(delimiter)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  return parts.length > 0 ? parts : undefined;
};

const toStringOrArray = (value: unknown): string | string[] | undefined => {
  if (Array.isArray(value)) {
    const out = value.map((entry) => toText(entry)).filter((entry): entry is string => !!entry && entry.length > 0);
    return out.length > 0 ? out : undefined;
  }
  return toText(value);
};

const toStringOrArrayOrEmpty = (value: unknown): string | string[] =>
  (toStringOrArray(value) ?? '');

const normalizeSalesItem = (item: SalesApiItem): TaskSearchItem => {
  const map = buildNormalizedMap(item as Record<string, unknown>);
  const assignedToValue = getNormalizedValue(map, 'assignedTo', ['assignedto']);
  const assignedTo = toStringOrArrayOrEmpty(assignedToValue);

  return {
    saleId: toText(getNormalizedValue(map, 'saleId')) ?? undefined,
    suid: toText(getNormalizedValue(map, 'suid')) ?? undefined,
    taskId: toTextOrEmpty(getNormalizedValue(map, 'taskId')),
    uprn: toTextOrEmpty(getNormalizedValue(map, 'uprn')),
    taskStatus: toTextOrEmpty(getNormalizedValue(map, 'taskStatus')),
    address: toTextOrEmpty(getNormalizedValue(map, 'address')),
    postcode: toTextOrEmpty(getNormalizedValue(map, 'postcode', ['postCode'])),
    transactionDate: toTextOrEmpty(getNormalizedValue(map, 'transactionDate')),
    billingAuthority: toText(getNormalizedValue(map, 'billingAuthority', ['billingauthorityity'])) ?? undefined,
    salePrice: toNumber(getNormalizedValue(map, 'saleprice', ['salePrice', 'salesPrice'])),
    ratio: toNumber(getNormalizedValue(map, 'ratio')),
    dwellingType: toText(getNormalizedValue(map, 'dwellingType', ['deellingtype', 'dwellinlingtype', 'dwelwellingtype'])) ?? undefined,
    flaggedForReview: toBoolean(getNormalizedValue(map, 'flaggedForReview')),
    reviewFlags: toStringArrayOrEmpty(getNormalizedValue(map, 'reviewFlags', ['reviewFlag'])),
    outlierRatio: toNumber(getNormalizedValue(map, 'outlierRatio')),
    overallFlag: toText(getNormalizedValue(map, 'overallFlag')) ?? undefined,
    summaryFlags: toDelimitedStringArray(getNormalizedValue(map, 'summaryFlags', ['summaryFlag']), ';') ?? [],
    assignedTo,
    assignedDate: toText(getNormalizedValue(map, 'assignedDate')) ?? undefined,
    taskCompletedDate: toText(getNormalizedValue(map, 'taskCompletedDate', ['completedDate', 'taskcomplpleteddate', 'taskcompleteddate'])) ?? undefined,
    qcAssignedTo: toStringOrArrayOrEmpty(getNormalizedValue(map, 'qcAssignedTo', ['acassignedto', 'qeassssignedto'])),
    qcAssignedDate: toText(getNormalizedValue(map, 'qcAssignedDate', ['qcassigneddate'])) ?? undefined,
    qcCompletedDate: toText(getNormalizedValue(map, 'qcCompletedDate', ['qccompleteddate'])) ?? undefined,
  };
};

const FILTER_KEY_ALIASES: Record<string, string> = {
  reviewflag: 'reviewflags',
  summaryflag: 'summaryflags',
  deellingtype: 'dwellingtype',
  billingauthorityity: 'billingauthority',
  dwellinlingtype: 'dwellingtype',
  dwelwellingtype: 'dwellingtype',
};

const normalizeFilterMap = (filters: Record<string, string | string[]>): Record<string, string | string[]> => {
  const normalized: Record<string, string | string[]> = {};
  Object.entries(filters).forEach(([key, value]) => {
    const base = normalizeKey(key);
    const alias = FILTER_KEY_ALIASES[base] ?? base;
    if (alias) normalized[alias] = value;
  });
  return normalized;
};

export const normalizeSearchResponse = (payload: TaskSearchResponse | SalesApiResponse): TaskSearchResponse => {
  if ('sales' in payload || 'pageInfo' in payload) {
    const sales = payload.sales ?? [];
    return {
      items: sales.map(normalizeSalesItem),
      totalCount: payload.pageInfo?.totalRecords ?? payload.pageInfo?.totalRows ?? sales.length,
      page: payload.pageInfo?.pageNumber ?? 1,
      pageSize: payload.pageInfo?.pageSize ?? sales.length,
      filters: payload.filters ? normalizeFilterMap(payload.filters) : undefined,
    };
  }
  return payload as TaskSearchResponse;
};

export const unwrapCustomApiPayload = (payload: unknown): SalesPayload => {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const raw = record.Result ?? record.result;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as SalesPayload;
      } catch {
        return payload as SalesPayload;
      }
    }
  }
  return payload as SalesPayload;
};

const resolveCustomApiName = (context: ComponentFramework.Context<IInputs>): string => {
  const raw = (context.parameters as unknown as Record<string, { raw?: string }>).customApiName?.raw;
  const fromContext = normalizeCustomApiName(typeof raw === 'string' ? raw : undefined);
  const fallback = normalizeCustomApiName(CONTROL_CONFIG.customApiName);
  return fromContext || fallback || '';
};

const resolveCustomApiType = (context: ComponentFramework.Context<IInputs>): number => {
  const raw = (context.parameters as unknown as Record<string, { raw?: string }>).customApiType?.raw;
  const fromContext = typeof raw === 'string' ? raw : undefined;
  return resolveCustomApiOperationType(fromContext ?? CONTROL_CONFIG.customApiType);
};

export async function executeSearch(
  context: ComponentFramework.Context<IInputs>,
  req: SearchRequest,
): Promise<TaskSearchResponse> {
  const { tableKey, page, pageSize, filters } = req;

  const apiParams = buildApiParamsFor(tableKey, filters, page, pageSize);

  const customApiName = resolveCustomApiName(context);
  const customApiType = resolveCustomApiType(context);
  if (!customApiName) {
    return {
      items: SAMPLE_TASK_RESULTS,
      totalCount: SAMPLE_TASK_RESULTS.length,
      page,
      pageSize,
    };
  }

  try {
    const rawPayload = await executeUnboundCustomApi<TaskSearchResponse | SalesApiResponse>(
      context,
      customApiName,
      apiParams,
      { operationType: customApiType },
    );
    const payload = unwrapCustomApiPayload(rawPayload);
    return normalizeSearchResponse(payload);
  } catch {
    // Sample fallback disabled for now; return empty set on error.
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }
}

export interface FilterOptionsRequest {
  tableKey: string;
  field: string;
  query: string;
}

export async function fetchFilterOptions(
  context: ComponentFramework.Context<IInputs>,
  req: FilterOptionsRequest,
): Promise<string[]> {
  const { tableKey, field, query } = req;
  const customApiName = resolveCustomApiName(context);
  const customApiType = resolveCustomApiType(context);
  if (!customApiName) return [];
  // Unbound Custom API variant for filter suggestions
  const actionName = `${customApiName}_FilterOptions`;
  try {
    const payload = await executeUnboundCustomApi<{ values?: string[] }>(
      context,
      actionName,
      { tableKey, field, query },
      { operationType: customApiType },
    );
    return payload.values ?? [];
  } catch {
    return [];
  }
}

export function mapTaskItemToRecord(
  item: TaskSearchItem,
  index: number,
): ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & Record<string, unknown> {
  const recordBase: Record<string, unknown> = {};
  const record = recordBase as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & Record<string, unknown>;
  const recordId = item.taskId || `${item.uprn}-${index}` || `apim-${index}`;
  const assignedTo = Array.isArray(item.assignedTo) ? item.assignedTo.join(', ') : item.assignedTo ?? '';
  record.getRecordId = () => recordId;
  record.getNamedReference = undefined as unknown as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getNamedReference'];
  record.getValue = ((columnName: string) => record[columnName] ?? '') as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getValue'];
  record.getFormattedValue = ((columnName: string) => {
    const value = record[columnName];
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value.toString();
    }
    return '';
  }) as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getFormattedValue'];

  const formattedDate = tryFormatDate(item.transactionDate);
  record.uprn = item.uprn;
  record.taskid = item.taskId;
  record.taskId = item.taskId;
  record.saleid = item.saleId ?? '';
  record.saleId = item.saleId ?? '';
  record.suid = item.suid ?? '';
  record.taskstatus = item.taskStatus;
  record.taskStatus = item.taskStatus;
  record.address = item.address;
  record.postcode = item.postcode;
  record.transactiondate = formattedDate;
  record.transactionDate = formattedDate;
  record.billingauthority = item.billingAuthority ?? '';
  record.billingAuthority = item.billingAuthority ?? '';
  record.saleprice = item.salePrice ?? '';
  record.ratio = item.ratio ?? '';
  record.dwellingtype = item.dwellingType ?? '';
  record.flaggedforreview = item.flaggedForReview ?? '';
  record.reviewflags = item.reviewFlags ?? [];
  record.outlierratio = item.outlierRatio ?? '';
  record.overallflag = item.overallFlag ?? '';
  record.summaryflags = item.summaryFlags ?? [];
  record.assignedto = assignedTo;
  record.assignedTo = assignedTo;
  record.assigneddate = item.assignedDate ?? '';
  record.taskcompleteddate = item.taskCompletedDate ?? '';
  record.qcassignedto = item.qcAssignedTo ?? '';
  record.qcassigneddate = item.qcAssignedDate ?? '';
  record.qccompleteddate = item.qcCompletedDate ?? '';
  return record;
}

export function tryFormatDate(value?: string): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
