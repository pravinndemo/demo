import { buildApiParamsFor } from '../config/TableConfigs';

export interface ClientSortState {
  name: string;
  sortDirection: number; // 0 asc, 1 desc
}

export interface BuildGridApiParamsArgs {
  tableKey: string;
  filters: unknown;
  source?: string;
  requestedBy?: string;
  currentPage: number;
  pageSize: number;
  clientSort?: ClientSortState;
  prefilters?: unknown;
  searchQuery?: string;
}

export const normalizeSortField = (value?: string): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (normalized === 'saleid') return 'saleId';
  if (normalized === 'taskid') return 'taskId';
  if (normalized === 'saleprice' || normalized === 'salesprice') return 'salesPrice';
  return trimmed;
};

export const buildGridApiParams = (args: BuildGridApiParamsArgs): Record<string, string> => {
  const pageSize = args.pageSize ?? 500;
  const source = typeof args.source === 'string' ? args.source.trim() : '';
  const requestedBy = typeof args.requestedBy === 'string' ? args.requestedBy.trim() : '';
  const baseFilters = (args.filters ?? {}) as Record<string, unknown>;
  const filtersWithSource = source ? { ...baseFilters, source } : baseFilters;
  const apiParamsBase = buildApiParamsFor(args.tableKey, filtersWithSource as never, args.currentPage, pageSize, args.prefilters);
  const searchQuery = typeof args.searchQuery === 'string' ? args.searchQuery.trim() : '';

  const sortBy = args.clientSort?.name;
  const sortDirection = args.clientSort?.sortDirection;
  const normalizedSortField = normalizeSortField(sortBy);

  const p: Record<string, string> = {
    ...apiParamsBase,
    pageNumber: String(args.currentPage + 1),
    pageSize: String(pageSize),
  };
  if (normalizedSortField) p.sortField = normalizedSortField;
  if (typeof sortDirection === 'number') p.sortDirection = sortDirection === 1 ? 'desc' : 'asc';
  if (searchQuery) p.SearchQuery = searchQuery;
  if (requestedBy) p.RequestedBy = requestedBy;
  return p;
};
