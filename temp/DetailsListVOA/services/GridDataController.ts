import { buildApiParamsFor } from '../config/TableConfigs';
import { CONTROL_CONFIG } from '../config/ControlConfig';
import { TaskSearchItem, TaskSearchResponse } from '../data/TaskSearchSample';
import { SAMPLE_TASK_RESULTS } from '../data/TaskSearchSample';
import { SAMPLE_RECORDS } from '../data/SampleData';
import { IInputs } from '../generated/ManifestTypes';
import { executeUnboundCustomApi, normalizeCustomApiName, resolveCustomApiOperationType } from './CustomApi';
import { normalizeSearchResponse, SalesApiResponse, unwrapCustomApiPayload } from './DataService';

export interface ClientSortState {
  name: string;
  sortDirection: number; // 0 asc, 1 desc
}

export interface LoadResult {
  items: TaskSearchItem[];
  totalCount: number;
  serverDriven: boolean;
  filters?: Record<string, string | string[]>;
  errorMessage?: string;
}

const TECHNICAL_ERROR_MESSAGE = 'Technical error. Please try again in some time.';

const isServerErrorMessage = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return normalized.includes('500')
    || normalized.includes('internal server error')
    || normalized.includes('status: 500')
    || normalized.includes('status code 500');
};

const normalizeErrorMessage = (message?: string): string | undefined => {
  if (!message) return undefined;
  return isServerErrorMessage(message) ? TECHNICAL_ERROR_MESSAGE : message;
};

const normalizeSortField = (value?: string): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (normalized === 'saleid') return 'saleId';
  if (normalized === 'taskid') return 'taskId';
  return trimmed;
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

const resolveServerDrivenThreshold = (context: ComponentFramework.Context<IInputs>): number => {
  const raw = (context.parameters as unknown as Record<string, { raw?: number | string }>).serverDrivenThreshold?.raw;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return CONTROL_CONFIG.serverDrivenThreshold;
};

export async function loadGridData(
  context: ComponentFramework.Context<IInputs>,
  args: {
    tableKey: string;
    filters: unknown; // GridFilterState but keep loose to avoid circular deps
    source?: string;
    currentPage: number;
    pageSize: number;
    clientSort?: ClientSortState;
    prefilters?: unknown;
    searchQuery?: string;
  },
): Promise<LoadResult> {
  const pageSize = args.pageSize ?? (context.parameters as unknown as Record<string, { raw?: number }>).pageSize?.raw ?? 500;
  const source = typeof args.source === 'string' ? args.source.trim() : '';
  const baseFilters = (args.filters ?? {}) as Record<string, unknown>;
  const filtersWithSource = source ? { ...baseFilters, source } : baseFilters;
  const apiParamsBase = buildApiParamsFor(args.tableKey, filtersWithSource as never, args.currentPage, pageSize, args.prefilters);
  const searchQuery = typeof args.searchQuery === 'string' ? args.searchQuery.trim() : '';
  const customApiName = resolveCustomApiName(context);
  const customApiType = resolveCustomApiType(context);

  const sortBy = args.clientSort?.name;
  const sortDirection = args.clientSort?.sortDirection;
  const normalizedSortField = normalizeSortField(sortBy);
  const buildParams = (page: number) => {
    const p: Record<string, string> = {
      ...apiParamsBase,
      pageNumber: String(page + 1),
      pageSize: String(pageSize),
    };
    if (normalizedSortField) p.sortField = normalizedSortField;
    if (typeof sortDirection === 'number') p.sortDirection = sortDirection === 1 ? 'desc' : 'asc';
    if (searchQuery) p.SearchQuery = searchQuery;
    return p;
  };

  const execCustomApi = async (params: Record<string, string>): Promise<TaskSearchResponse> => {
    const rawPayload = await executeUnboundCustomApi<TaskSearchResponse | SalesApiResponse>(context, customApiName, params, {
      operationType: customApiType,
    });
    const payload = unwrapCustomApiPayload(rawPayload);
    return normalizeSearchResponse(payload);
  };

  try {
    const firstParams = buildParams(args.currentPage);
    if (!customApiName) {
      // When no custom API is configured, show local sample data (from SampleData)
      return { items: SAMPLE_RECORDS as unknown as TaskSearchItem[], totalCount: SAMPLE_RECORDS.length, serverDriven: false };
    }
    const firstPayload = await execCustomApi(firstParams);
    const total = Number(firstPayload.totalCount ?? firstPayload.items?.length ?? 0);
    const threshold = resolveServerDrivenThreshold(context);
    const firstPageCount = firstPayload.items?.length ?? 0;
    const serverDriven = total > threshold || total > firstPageCount;
    const responseFilters = firstPayload.filters;
    return {
      items: firstPayload.items ?? [],
      totalCount: total,
      serverDriven,
      filters: responseFilters,
      errorMessage: normalizeErrorMessage(firstPayload.errorMessage),
    };
  } catch (err) {
    // On error, log and fall back to showing local sample data (from SampleData)
    const errText = (() => {
      if (err instanceof Error) return `${err.name}: ${err.message}`;
      if (typeof err === 'string') return err;
      try {
        return JSON.stringify(err);
      } catch {
        return 'Unknown error';
      }
    })();
    try {
      console.error('[GridDataController] loadGridData failed; showing sample data', errText);
    } catch {
      /* ignore logging failures */
    }
    // Sample fallback disabled for now; return empty set on error.
    return {
      items: [],
      totalCount: 0,
      serverDriven: false,
      errorMessage: normalizeErrorMessage(errText) ?? 'Unable to load results. Please try again.',
    };
  }
}
