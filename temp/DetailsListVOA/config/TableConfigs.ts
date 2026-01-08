import { GridFilterState, SearchByOption } from '../Filters';

export type TableKey = 'sales' | 'allsales' | 'myassignment' | 'manager' | 'qa';

export type ColumnFilterControl =
  | 'textEq'
  | 'textContains'
  | 'textPrefix'
  | 'numeric'
  | 'dateRange'
  | 'singleSelect'
  | 'multiSelect';

export interface ColumnFilterConfig {
  control: ColumnFilterControl;
  minLength?: number;
  optionFields?: string[];
  options?: string[];
  selectAllValues?: string[];
  multiLimit?: number;
}

export interface TableConfig {
  lookupFields: Set<string>;
  buildApiParams: (filters: GridFilterState, page: number, pageSize: number) => Record<string, string>;
  // Controls which top-of-grid search modes are available per persona/table
  searchByOptions: SearchByOption[];
  columnFilterConfig: Record<string, ColumnFilterConfig>;
}

const salesLookupFields = new Set<string>([
  'taskstatus',
  'status',
  'statuscode',
  'saleid',
  'billingauthority',
  'flaggedforreview',
  'reviewflags',
  'overallflag',
  'dwellingtype',
  'assignedto',
  'qcassignedto',
  'summaryflags',
]);

const SALES_COLUMN_FILTERS: Record<string, ColumnFilterConfig> = {
  saleid: { control: 'textEq', minLength: 1 },
  taskid: { control: 'textEq', minLength: 1 },
  uprn: { control: 'textEq', minLength: 1 },
  address: { control: 'textContains', minLength: 3 },
  postcode: { control: 'textPrefix', minLength: 2 },
  billingauthority: { control: 'multiSelect', optionFields: ['billingauthority'], multiLimit: 3, minLength: 1 },
  transactiondate: { control: 'dateRange', minLength: 1 },
  saleprice: { control: 'numeric', minLength: 1 },
  ratio: { control: 'numeric', minLength: 1 },
  dwellingtype: { control: 'multiSelect', optionFields: ['dwellingtype'], selectAllValues: ['all'], minLength: 1 },
  flaggedforreview: { control: 'singleSelect', options: ['yes', 'no'], minLength: 1 },
  reviewflags: { control: 'multiSelect', optionFields: ['reviewflags'], minLength: 1 },
  outlierratio: { control: 'numeric', minLength: 1 },
  overallflag: {
    control: 'multiSelect',
    minLength: 1,
    options: [
      'Exclude',
      'Exclude potential false',
      'Investigate can use',
      'Investigate do not use',
      'No flag',
      'Not fully HPI adjusted',
      'Remove',
    ],
  },
  summaryflag: { control: 'textContains', minLength: 3 },
  taskstatus: { control: 'multiSelect', optionFields: ['taskstatus', 'status', 'statuscode'], minLength: 1 },
  assignedto: { control: 'singleSelect', optionFields: ['assignedto'], minLength: 1 },
  assigneddate: { control: 'dateRange', minLength: 1 },
  completeddate: { control: 'dateRange', minLength: 1 },
  qcassignedto: { control: 'singleSelect', optionFields: ['qcassignedto'], minLength: 1 },
  qcassigneddate: { control: 'dateRange', minLength: 1 },
  qccompleteddate: { control: 'dateRange', minLength: 1 },
};

const buildSalesParams = (
  filters: GridFilterState,
  page: number,
  pageSize: number,
): Record<string, string> => {
  const params: Record<string, string> = {
    searchBy: filters.searchBy,
    page: String(page),
    pageSize: String(pageSize),
  };

  if (filters.saleId) params.saleId = filters.saleId;
  if (filters.taskId) params.taskId = filters.taskId;
  if (filters.uprn) params.uprn = filters.uprn;
  if (filters.address) params.address = filters.address;
  if (filters.postcode) params.postcode = filters.postcode;
  if (filters.billingAuthority?.length) params.billingAuthority = filters.billingAuthority.join(',');
  if (filters.transactionDate) {
    if (filters.transactionDate.from) params.transactionDateFrom = filters.transactionDate.from;
    if (filters.transactionDate.to) params.transactionDateTo = filters.transactionDate.to;
  }
  if (filters.salePrice) {
    params.salePriceMode = filters.salePrice.mode;
    if (filters.salePrice.min !== undefined) params.salePriceMin = String(filters.salePrice.min);
    if (filters.salePrice.max !== undefined) params.salePriceMax = String(filters.salePrice.max);
  }
  if (filters.ratio) {
    params.ratioMode = filters.ratio.mode;
    if (filters.ratio.min !== undefined) params.ratioMin = String(filters.ratio.min);
    if (filters.ratio.max !== undefined) params.ratioMax = String(filters.ratio.max);
  }
  if (filters.dwellingType?.length) params.dwellingType = filters.dwellingType.join(',');
  if (filters.flaggedForReview) params.flaggedForReview = filters.flaggedForReview;
  if (filters.reviewFlags?.length) params.reviewFlags = filters.reviewFlags.join(',');
  if (filters.outlierKeySale?.length) params.outlierKeySale = filters.outlierKeySale.join(',');
  if (filters.outlierRatio) {
    params.outlierRatioMode = filters.outlierRatio.mode;
    if (filters.outlierRatio.min !== undefined) params.outlierRatioMin = String(filters.outlierRatio.min);
    if (filters.outlierRatio.max !== undefined) params.outlierRatioMax = String(filters.outlierRatio.max);
  }
  if (filters.overallFlag?.length) params.overallFlag = filters.overallFlag.join(',');
  if (filters.summaryFlag) params.summaryFlag = filters.summaryFlag;
  if (filters.taskStatus?.length) params.taskStatus = filters.taskStatus.join(',');
  if (filters.assignedTo) params.assignedTo = filters.assignedTo;
  if (filters.assignedDate) {
    if (filters.assignedDate.from) params.assignedDateFrom = filters.assignedDate.from;
    if (filters.assignedDate.to) params.assignedDateTo = filters.assignedDate.to;
  }
  if (filters.qcAssignedTo) params.qcAssignedTo = filters.qcAssignedTo;
  if (filters.qcAssignedDate) {
    if (filters.qcAssignedDate.from) params.qcAssignedDateFrom = filters.qcAssignedDate.from;
    if (filters.qcAssignedDate.to) params.qcAssignedDateTo = filters.qcAssignedDate.to;
  }
  if (filters.qcCompletedDate) {
    if (filters.qcCompletedDate.from) params.qcCompletedDateFrom = filters.qcCompletedDate.from;
    if (filters.qcCompletedDate.to) params.qcCompletedDateTo = filters.qcCompletedDate.to;
  }
  if (filters.completedDate) {
    if (filters.completedDate.from) params.completedDateFrom = filters.completedDate.from;
    if (filters.completedDate.to) params.completedDateTo = filters.completedDate.to;
  }

  return params;
};

export const TABLE_CONFIGS: Record<TableKey, TableConfig> = {
  // All Sales (alias 'sales')
  sales: {
    lookupFields: salesLookupFields,
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    searchByOptions: [
      'saleId',
      'taskId',
      'uprn',
      'address',
      'postcode',
      'billingAuthority',
      'transactionDate',
      'salePrice',
      'ratio',
      'dwellingType',
      'flaggedForReview',
      'reviewFlags',
      'outlierRatio',
      'overallFlag',
      'summaryFlag',
      'taskStatus',
      'assignedTo',
      'assignedDate',
      'qcAssignedTo',
      'qcAssignedDate',
      'qcCompletedDate',
      'completedDate',
    ],
  },
  allsales: {
    lookupFields: salesLookupFields,
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    searchByOptions: [
      'saleId',
      'taskId',
      'uprn',
      'address',
      'postcode',
      'billingAuthority',
      'transactionDate',
      'salePrice',
      'ratio',
      'dwellingType',
      'flaggedForReview',
      'reviewFlags',
      'outlierRatio',
      'overallFlag',
      'summaryFlag',
      'taskStatus',
      'assignedTo',
      'assignedDate',
      'qcAssignedTo',
      'qcAssignedDate',
      'qcCompletedDate',
      'completedDate',
    ],
  },
  // My Assignment
  myassignment: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    searchByOptions: [
      'saleId',
      'taskId',
      'uprn',
      'address',
      'postcode',
      'billingAuthority',
      'transactionDate',
      'salePrice',
      'ratio',
      'dwellingType',
      'flaggedForReview',
      'reviewFlags',
      'outlierRatio',
      'overallFlag',
      'summaryFlag',
      'taskStatus',
      'assignedTo',
      'assignedDate',
      'qcAssignedTo',
      'qcAssignedDate',
      'qcCompletedDate',
      'completedDate',
    ],
  },
  // Manager dashboard
  manager: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    searchByOptions: [
      'saleId',
      'taskId',
      'uprn',
      'address',
      'postcode',
      'billingAuthority',
      'transactionDate',
      'salePrice',
      'ratio',
      'dwellingType',
      'flaggedForReview',
      'reviewFlags',
      'outlierRatio',
      'overallFlag',
      'summaryFlag',
      'taskStatus',
      'assignedTo',
      'assignedDate',
      'qcAssignedTo',
      'qcAssignedDate',
      'qcCompletedDate',
      'completedDate',
    ],
  },
  // QA dashboard
  qa: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    searchByOptions: [
      'saleId',
      'taskId',
      'uprn',
      'address',
      'postcode',
      'billingAuthority',
      'transactionDate',
      'salePrice',
      'ratio',
      'dwellingType',
      'flaggedForReview',
      'reviewFlags',
      'outlierRatio',
      'overallFlag',
      'summaryFlag',
      'taskStatus',
      'assignedTo',
      'assignedDate',
      'qcAssignedTo',
      'qcAssignedDate',
      'qcCompletedDate',
      'completedDate',
    ],
  },
};

function getConfig(table?: string): TableConfig {
  const key = (table?.toLowerCase?.() as TableKey) ?? 'sales';
  return (TABLE_CONFIGS as Record<string, TableConfig>)[key] ?? TABLE_CONFIGS.sales;
}

export function isLookupFieldFor(table: string, fieldName?: string): boolean {
  if (!fieldName) return false;
  const f = fieldName.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return getConfig(table).lookupFields.has(f);
}

export function buildApiParamsFor(
  table: string,
  filters: GridFilterState,
  page: number,
  pageSize: number,
): Record<string, string> {
  return getConfig(table).buildApiParams(filters, page, pageSize);
}

export function getSearchByOptionsFor(table?: string): SearchByOption[] {
  return getConfig(table).searchByOptions;
}

export function getColumnFilterConfigFor(table: string, fieldName?: string): ColumnFilterConfig | undefined {
  if (!fieldName) return undefined;
  const f = fieldName.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return getConfig(table).columnFilterConfig[f];
}
