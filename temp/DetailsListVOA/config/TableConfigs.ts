import { GridFilterState, SearchByOption } from '../Filters';
import { mapManagerPrefiltersToApi, type ManagerPrefilterState } from './PrefilterConfigs';

export type TableKey = 'sales' | 'allsales' | 'myassignment' | 'manager' | 'qa' | 'qaassign' | 'qaview';

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
  buildPrefilterParams?: (prefilters?: unknown) => Record<string, string>;
  // Controls which top-of-grid search modes are available per persona/table
  searchByOptions: SearchByOption[];
  columnFilterConfig: Record<string, ColumnFilterConfig>;
  showViewSalesRecord?: boolean;
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
  flaggedforreview: { control: 'singleSelect', options: ['true', 'false'], minLength: 1 },
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
  taskcompleteddate: { control: 'dateRange', minLength: 1 },
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
    pageNumber: String(page + 1),
    pageSize: String(pageSize),
  };

  if (filters.source) params.source = filters.source;
  if (filters.saleId) params.saleId = filters.saleId;
  if (filters.taskId) params.taskId = filters.taskId;
  if (filters.uprn) params.uprn = filters.uprn;
  if (filters.address) params.address = filters.address;
  if (filters.buildingNameNumber) params.buildingNameOrNumber = filters.buildingNameNumber;
  if (filters.street) params.street = filters.street;
  if (filters.townCity) params.town = filters.townCity;
  if (filters.postcode) params.postcode = filters.postcode;
  if (filters.billingAuthority?.length) params.billingAuthority = filters.billingAuthority.join(',');
  if (filters.bacode) params.billingAuthorityReference = filters.bacode;
  if (filters.transactionDate) {
    const from = filters.transactionDate.from;
    const to = filters.transactionDate.to;
    if (from && to && from === to) {
      params.transactionDate = from;
    } else if (from && !to) {
      params.transactionDate = from;
    } else if (to && !from) {
      params.transactionDate = to;
    } else if (from) {
      params.transactionDate = from;
    }
  }
  if (filters.salePrice) {
    const { mode, min, max } = filters.salePrice;
    if (mode === '>=' && min !== undefined) {
      params.salesPrice = String(min);
      params.salesPriceOperator = 'GE';
    } else if (mode === '<=' && max !== undefined) {
      params.salesPrice = String(max);
      params.salesPriceOperator = 'LE';
    } else if (mode === 'between') {
      if (min !== undefined) {
        params.salesPrice = String(min);
        params.salesPriceOperator = 'GE';
      } else if (max !== undefined) {
        params.salesPrice = String(max);
        params.salesPriceOperator = 'LE';
      }
    }
  }
  if (filters.ratio) {
    if (filters.ratio.mode === '>=' && filters.ratio.min !== undefined) {
      params.ratio = String(filters.ratio.min);
    } else if (filters.ratio.mode === '<=' && filters.ratio.max !== undefined) {
      params.ratio = String(filters.ratio.max);
    } else if (filters.ratio.mode === 'between') {
      if (filters.ratio.min !== undefined) {
        params.ratio = String(filters.ratio.min);
      } else if (filters.ratio.max !== undefined) {
        params.ratio = String(filters.ratio.max);
      }
    }
  }
  if (filters.dwellingType?.length) params.dwellingType = filters.dwellingType.join(',');
  if (filters.flaggedForReview) params.flaggedForReview = filters.flaggedForReview;
  if (filters.reviewFlags?.length) params.reviewFlag = filters.reviewFlags.join(',');
  if (filters.outlierKeySale?.length) params.outlierKeySale = filters.outlierKeySale.join(',');
  if (filters.outlierRatio) {
    if (filters.outlierRatio.mode === '>=' && filters.outlierRatio.min !== undefined) {
      params.outlierRatio = String(filters.outlierRatio.min);
    } else if (filters.outlierRatio.mode === '<=' && filters.outlierRatio.max !== undefined) {
      params.outlierRatio = String(filters.outlierRatio.max);
    } else if (filters.outlierRatio.mode === 'between') {
      if (filters.outlierRatio.min !== undefined) {
        params.outlierRatio = String(filters.outlierRatio.min);
      } else if (filters.outlierRatio.max !== undefined) {
        params.outlierRatio = String(filters.outlierRatio.max);
      }
    }
  }
  if (filters.overallFlag?.length) params.overallFlag = filters.overallFlag.join(',');
  if (filters.summaryFlag) params.summaryFlag = filters.summaryFlag;
  if (filters.taskStatus?.length) params.taskStatus = filters.taskStatus.join(',');
  if (filters.assignedTo) params.assignedTo = filters.assignedTo;
  if (filters.assignedDate) {
    if (filters.assignedDate.from) params.assignedFromDate = filters.assignedDate.from;
    if (filters.assignedDate.to) params.assignedToDate = filters.assignedDate.to;
  }
  if (filters.qcAssignedTo) params.qcAssignedTo = filters.qcAssignedTo;
  if (filters.qcAssignedDate) {
    if (filters.qcAssignedDate.from) params.qcAssignedFromDate = filters.qcAssignedDate.from;
    if (filters.qcAssignedDate.to) params.qcAssignedToDate = filters.qcAssignedDate.to;
  }
  if (filters.qcCompletedDate) {
    if (filters.qcCompletedDate.from) params.qcCompleteFromDate = filters.qcCompletedDate.from;
    if (filters.qcCompletedDate.to) params.qcCompleteToDate = filters.qcCompletedDate.to;
  }
  return params;
};

export const TABLE_CONFIGS: Record<TableKey, TableConfig> = {
  // All Sales (alias 'sales')
  sales: {
    lookupFields: salesLookupFields,
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    showViewSalesRecord: true,
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
    ],
  },
  allsales: {
    lookupFields: salesLookupFields,
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    showViewSalesRecord: true,
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
    ],
  },
  // My Assignment
  myassignment: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    showViewSalesRecord: true,
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
    ],
  },
  // Manager dashboard
  manager: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    buildPrefilterParams: (prefilters?: unknown) => mapManagerPrefiltersToApi(prefilters as ManagerPrefilterState | undefined),
    columnFilterConfig: SALES_COLUMN_FILTERS,
    showViewSalesRecord: true,
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
    ],
  },
  // QA dashboard
  qa: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    showViewSalesRecord: true,
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
    ],
  },
  // QA assignment screen (alias of QA for now)
  qaassign: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    showViewSalesRecord: true,
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
    ],
  },
  // QA view screen (alias of QA for now)
  qaview: {
    lookupFields: new Set<string>([...salesLookupFields]),
    buildApiParams: buildSalesParams,
    columnFilterConfig: SALES_COLUMN_FILTERS,
    showViewSalesRecord: true,
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
  prefilters?: unknown,
): Record<string, string> {
  const config = getConfig(table);
  const base = config.buildApiParams(filters, page, pageSize);
  const extra = config.buildPrefilterParams ? config.buildPrefilterParams(prefilters) : {};
  return {
    ...base,
    ...extra,
  };
}

export function getSearchByOptionsFor(table?: string): SearchByOption[] {
  return getConfig(table).searchByOptions;
}

export function isViewSalesRecordEnabledFor(table?: string): boolean {
  return getConfig(table).showViewSalesRecord !== false;
}

export function getColumnFilterConfigFor(table: string, fieldName?: string): ColumnFilterConfig | undefined {
  if (!fieldName) return undefined;
  const f = fieldName.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return getConfig(table).columnFilterConfig[f];
}
