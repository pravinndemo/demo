import { buildApiParamsFor } from '../config/TableConfigs';
import { CONTROL_CONFIG } from '../config/ControlConfig';
import { TaskSearchItem, TaskSearchResponse } from '../data/TaskSearchSample';
import { SAMPLE_RECORDS } from '../data/SampleData';
import { IInputs } from '../generated/ManifestTypes';

export interface ClientSortState {
  name: string;
  sortDirection: number; // 0 asc, 1 desc
}

export interface LoadResult {
  items: TaskSearchItem[];
  totalCount: number;
  serverDriven: boolean;
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
  addIfPresent(result, 'searchBy', normalizeText(params.searchBy?.raw));
  addIfPresent(result, 'billingAuthorities', normalizeMulti(params.billingAuthorities?.raw));
  addIfPresent(result, 'caseworkers', normalizeMulti(params.caseworkers?.raw));
  addIfPresent(result, 'workThat', normalizeText(params.workThat?.raw));
  addIfPresent(result, 'fromDate', normalizeText(params.fromDate?.raw));
  addIfPresent(result, 'toDate', normalizeText(params.toDate?.raw));
  return result;
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
  const configuredEndpoint = CONTROL_CONFIG.apimEndpoint?.trim();
  const baseUrl = configuredEndpoint && configuredEndpoint.length > 0
    ? configuredEndpoint
    : 'https://api.contoso.gov.uk/revaluation/tasks';

  let requestUrl: URL;
  try {
    requestUrl = new URL(baseUrl);
  } catch {
    // Fall back to showing local SAMPLE_RECORDS via host's sample path
    return { items: [], totalCount: SAMPLE_RECORDS.length, serverDriven: false };
  }

  const pageSize = (context.parameters as unknown as Record<string, { raw?: number }>).pageSize?.raw ?? 10;
  const apiParamsBase = buildApiParamsFor(args.tableKey, args.filters as never, args.currentPage, pageSize);
  const prefilterParams = getPrefilterParams(context);
  const headerFilterEntries = Object.entries(args.headerFilters).filter(([_, v]) =>
    Array.isArray(v) ? v.length > 0 : (v ?? '').toString().trim() !== '',
  );

  const customApiName = CONTROL_CONFIG.customApiName?.trim();

  const sortBy = args.clientSort?.name;
  const sortDirection = args.clientSort?.sortDirection;
  const buildParams = (page: number) => {
    const p: Record<string, string> = {
      ...apiParamsBase,
      ...prefilterParams,
      page: String(page),
      pageSize: String(pageSize),
    };
    if (sortBy) p.sortBy = sortBy;
    if (typeof sortDirection === 'number') p.sortDirection = String(sortDirection);
    return p;
  };

  const execCustomApi = async (params: Record<string, string>): Promise<TaskSearchResponse> => {
    const request: Record<string, unknown> & {
      getMetadata: () => {
        boundParameter: null;
        parameterTypes: Record<string, { typeName: string; structuralProperty: number }>;
        operationType: number;
        operationName: string;
      };
    } = {
      getMetadata: () => ({
        boundParameter: null,
        parameterTypes: Object.keys(params).reduce((acc, key) => {
          acc[key] = { typeName: 'Edm.String', structuralProperty: 1 };
          return acc;
        }, {} as Record<string, { typeName: string; structuralProperty: number }>),
        operationType: 0,
        operationName: customApiName ?? '',
      }),
    };
    Object.entries(params).forEach(([k, v]) => {
      request[k] = v;
    });
    if (headerFilterEntries.length > 0) {
      request.columnFilters = JSON.stringify(args.headerFilters);
    }
    interface WebApiWithExecute { execute: (request: unknown) => Promise<Response>; }
    const result = await (context.webAPI as unknown as WebApiWithExecute).execute(request);
    return (await result.json()) as TaskSearchResponse;
  };

  const execHttp = async (params: Record<string, string>): Promise<TaskSearchResponse> => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    if (headerFilterEntries.length > 0) {
      headerFilterEntries.forEach(([field, val]) => {
        if (Array.isArray(val)) {
          val.forEach((v) => {
            if ((v ?? '').toString().trim() !== '') url.searchParams.append(`filter[${field}][]`, String(v));
          });
        } else {
          const trimmed = (val ?? '').toString().trim();
          if (trimmed !== '') url.searchParams.append(`filter[${field}]`, trimmed);
        }
      });
    }
    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) throw new Error(`APIM request failed with status ${response.status}`);
    return (await response.json()) as TaskSearchResponse;
  };

  try {
    const firstParams = buildParams(args.currentPage);
    const firstPayload = customApiName ? await execCustomApi(firstParams) : await execHttp(firstParams);
    const total = Number(firstPayload.totalCount ?? firstPayload.items?.length ?? 0);
    const serverDriven = total > 2000;
    if (!serverDriven && total > 0 && (firstPayload.items?.length ?? 0) < total) {
      const pages = Math.ceil(total / pageSize);
      const all: TaskSearchItem[] = [...(firstPayload.items ?? [])];
      for (let p = 0; p < pages; p++) {
        if (p === args.currentPage) continue;
        const payload = customApiName ? await execCustomApi(buildParams(p)) : await execHttp(buildParams(p));
        all.push(...(payload.items ?? []));
      }
      return { items: all, totalCount: total, serverDriven: false };
    }
    return { items: firstPayload.items ?? [], totalCount: total, serverDriven };
  } catch {
    // Fall back to showing local SAMPLE_RECORDS via host's sample path
    return { items: [], totalCount: SAMPLE_RECORDS.length, serverDriven: false };
  }
}
