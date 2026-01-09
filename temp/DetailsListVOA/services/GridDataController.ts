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
}

const getPrefilterParams = (context: ComponentFramework.Context<IInputs>): Record<string, string> => {
  const params = context.parameters as unknown as Record<string, { raw?: string | number | boolean }>;
  const normalizeText = (raw?: string | number | boolean): string => {
    if (raw === undefined || raw === null) return '';
    const text = String(raw).trim();
    return text;
  };
  const normalizeMulti = (raw?: string | number | boolean): string => {
    const text = normalizeText(raw);
    if (!text) return '';
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => String(value).trim()).filter((value) => value !== '').join(',');
      }
    } catch {
      // ignore JSON parsing errors; fall back to raw text
    }
    return text;
  };
  const addIfPresent = (obj: Record<string, string>, key: string, value: string): void => {
    if (value.trim().length > 0) {
      obj[key] = value.trim();
    }
  };
  const result: Record<string, string> = {};
  addIfPresent(result, 'billingAuthority', normalizeMulti(params.billingAuthorities?.raw));
  addIfPresent(result, 'assignedTo', normalizeMulti(params.caseworkers?.raw));
  addIfPresent(result, 'taskStatus', normalizeMulti(params.workThat?.raw));
  addIfPresent(result, 'assignedFromDate', normalizeText(params.fromDate?.raw));
  addIfPresent(result, 'assignedToDate', normalizeText(params.toDate?.raw));
  return result;
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

export async function loadGridData(
  context: ComponentFramework.Context<IInputs>,
  args: {
    tableKey: string;
    filters: unknown; // GridFilterState but keep loose to avoid circular deps
    currentPage: number;
    pageSize: number;
    headerFilters: Record<string, string | string[]>;
    clientSort?: ClientSortState;
  },
): Promise<LoadResult> {
  const pageSize = args.pageSize ?? (context.parameters as unknown as Record<string, { raw?: number }>).pageSize?.raw ?? 10;
  const apiParamsBase = buildApiParamsFor(args.tableKey, args.filters as never, args.currentPage, pageSize);
  const prefilterParams = getPrefilterParams(context);
  const headerFilterEntries = Object.entries(args.headerFilters).filter(([_, v]) =>
    Array.isArray(v) ? v.length > 0 : (v ?? '').toString().trim() !== '',
  );

  const customApiName = resolveCustomApiName(context);
  const customApiType = resolveCustomApiType(context);

  const sortBy = args.clientSort?.name;
  const sortDirection = args.clientSort?.sortDirection;
  const buildParams = (page: number) => {
    const p: Record<string, string> = {
      ...apiParamsBase,
      ...prefilterParams,
      pageNumber: String(page + 1),
      pageSize: String(pageSize),
    };
    if (sortBy) p.sortField = sortBy;
    if (typeof sortDirection === 'number') p.sortDirection = sortDirection === 1 ? 'desc' : 'asc';
    return p;
  };

  const execCustomApi = async (params: Record<string, string>): Promise<TaskSearchResponse> => {
    const withFilters = {
      ...params,
      ...(headerFilterEntries.length > 0 ? { columnFilters: JSON.stringify(args.headerFilters) } : {}),
    };
    const rawPayload = await executeUnboundCustomApi<TaskSearchResponse | SalesApiResponse>(context, customApiName, withFilters, {
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
    const serverDriven = total > 2000;
    const responseFilters = firstPayload.filters;
    if (!serverDriven && total > 0 && (firstPayload.items?.length ?? 0) < total) {
      const pages = Math.ceil(total / pageSize);
      const all: TaskSearchItem[] = [...(firstPayload.items ?? [])];
      for (let p = 0; p < pages; p++) {
        if (p === args.currentPage) continue;
        const payload = await execCustomApi(buildParams(p));
        all.push(...(payload.items ?? []));
      }
      return { items: all, totalCount: total, serverDriven: false, filters: responseFilters };
    }
    return { items: firstPayload.items ?? [], totalCount: total, serverDriven, filters: responseFilters };
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
    return { items: [], totalCount: 0, serverDriven: false };
  }
}
