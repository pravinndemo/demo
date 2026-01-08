import { IInputs } from '../generated/ManifestTypes';
import { GridFilterState } from '../Filters';
import { buildApiParamsFor } from '../config/TableConfigs';
import { CONTROL_CONFIG } from '../config/ControlConfig';
import { TaskSearchItem, TaskSearchResponse } from '../data/TaskSearchSample';

export interface SearchRequest {
  tableKey: string;
  page: number;
  pageSize: number;
  filters: GridFilterState;
}

async function executeCustomApi(
  context: ComponentFramework.Context<IInputs>,
  request: unknown,
): Promise<Response> {
  const webApi = (context as unknown as { webAPI?: { execute?: (req: unknown) => Promise<Response> } }).webAPI;
  if (webApi?.execute) {
    return webApi.execute(request);
  }
  interface XrmLike { WebApi?: { execute?: (req: unknown) => Promise<Response>; online?: { execute?: (req: unknown) => Promise<Response> } } }
  const xrm = (globalThis as unknown as { Xrm?: XrmLike }).Xrm;
  if (xrm?.WebApi?.online?.execute) {
    return xrm.WebApi.online.execute(request);
  }
  if (xrm?.WebApi?.execute) {
    return xrm.WebApi.execute(request);
  }
  throw new Error('Web API execute is not available in this environment');
}

export async function executeSearch(
  context: ComponentFramework.Context<IInputs>,
  req: SearchRequest,
): Promise<TaskSearchResponse> {
  const { tableKey, page, pageSize, filters } = req;
  const ep = CONTROL_CONFIG.apimEndpoint ?? '';
  const baseUrl = ep.trim().length > 0 ? ep : 'https://api.contoso.gov.uk/revaluation/tasks';

  const apiParams = buildApiParamsFor(tableKey, filters, page, pageSize);

  const customApiName = CONTROL_CONFIG.customApiName;
  if (customApiName?.trim()) {
    // Build an unbound Custom API request with string parameters
    const actionName = customApiName.trim();
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
        parameterTypes: Object.keys(apiParams).reduce((acc, key) => {
          acc[key] = { typeName: 'Edm.String', structuralProperty: 1 };
          return acc;
        }, {} as Record<string, { typeName: string; structuralProperty: number }>),
        operationType: 0, // Action
        operationName: actionName,
      }),
    };
    Object.entries(apiParams).forEach(([k, v]) => {
      (request as Record<string, unknown>)[k] = v;
    });

    const result = await executeCustomApi(context, request);
    const payload = (await result.json()) as TaskSearchResponse;
    return payload;
  }

  const url = new URL(baseUrl);
  Object.entries(apiParams).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url.toString(), { method: 'GET' });
  if (!response.ok) {
    throw new Error(`APIM request failed with status ${response.status}`);
  }
  const payload = (await response.json()) as TaskSearchResponse;
  return payload;
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
  const ep = CONTROL_CONFIG.apimEndpoint ?? '';
  const baseUrl = ep.trim().length > 0 ? ep : 'https://api.contoso.gov.uk/revaluation/tasks';

  const customApiName = CONTROL_CONFIG.customApiName;
  if ((customApiName ?? '').trim().length > 0) {
    // Unbound Custom API variant for filter suggestions
    const actionName = `${customApiName?.trim()}_FilterOptions`;
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
        parameterTypes: {
          tableKey: { typeName: 'Edm.String', structuralProperty: 1 },
          field: { typeName: 'Edm.String', structuralProperty: 1 },
          query: { typeName: 'Edm.String', structuralProperty: 1 },
        },
        operationType: 0,
        operationName: actionName,
      }),
    };
    (request as Record<string, unknown>).tableKey = tableKey;
    (request as Record<string, unknown>).field = field;
    (request as Record<string, unknown>).query = query;

    try {
      const resp = await executeCustomApi(context, request);
      const payload = (await resp.json()) as { values?: string[] };
      return payload.values ?? [];
    } catch {
      return [];
    }
  }

  try {
    const url = new URL(baseUrl.replace(/\/?$/, '/')); // ensure trailing slash
    // Expect an endpoint like: GET /filterOptions?tableKey=...&field=...&query=...
    url.pathname = `${url.pathname.replace(/\/$/, '')}/filterOptions`;
    url.searchParams.set('tableKey', tableKey);
    url.searchParams.set('field', field);
    url.searchParams.set('query', query);
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) return [];
    const payload = (await res.json()) as { values?: string[] };
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
  record.taskstatus = item.taskStatus;
  record.taskStatus = item.taskStatus;
  record.caseassignedto = item.caseAssignedTo;
  record.caseAssignedTo = item.caseAssignedTo;
  record.address = item.address;
  record.postcode = item.postcode;
  record.transactiondate = formattedDate;
  record.transactionDate = formattedDate;
  record.source = item.source;
  record.saleId = '';
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
