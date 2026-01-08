export type SearchByOption =
  | 'taskId'
  | 'uprn'
  | 'address'
  | 'postcode'
  | 'manualCheck'
  | 'street'
  | 'town'
  | 'source'
  | 'saleId'
  | 'billingAuthority'
  | 'transactionDate'
  | 'salePrice'
  | 'ratio'
  | 'dwellingType'
  | 'flaggedForReview'
  | 'reviewFlags'
  | 'outlierKeySale'
  | 'outlierRatio'
  | 'overallFlag'
  | 'summaryFlag'
  | 'taskStatus'
  | 'assignedTo'
  | 'assignedDate'
  | 'qcAssignedTo'
  | 'qcAssignedDate'
  | 'completedDate'
  | 'qcCompletedDate';

export type ManualCheckFilter = 'all' | 'yes' | 'no';

export type NumericFilterMode = '>=' | '<=' | 'between';

export interface NumericFilter {
  mode: NumericFilterMode;
  min?: number;
  max?: number;
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface GridFilterState {
  searchBy: SearchByOption;
  uprn?: string;
  taskId?: string;
  saleId?: string;
  address?: string;
  buildingNameNumber?: string;
  street?: string;
  townCity?: string;
  postcode?: string;
  billingAuthority?: string[];
  manualCheck?: ManualCheckFilter;
  transactionDate?: DateRangeFilter;
  salePrice?: NumericFilter;
  ratio?: NumericFilter;
  dwellingType?: string[];
  flaggedForReview?: 'true' | 'false';
  reviewFlags?: string[];
  outlierKeySale?: string[];
  outlierRatio?: NumericFilter;
  overallFlag?: string[];
  summaryFlag?: string;
  taskStatus?: string[];
  assignedTo?: string;
  assignedDate?: DateRangeFilter;
  qcAssignedTo?: string;
  qcAssignedDate?: DateRangeFilter;
  qcCompletedDate?: DateRangeFilter;
  completedDate?: DateRangeFilter;
  source?: string;
  bacode?: string;
}

export const createDefaultGridFilters = (): GridFilterState => ({
  searchBy: 'taskId',
});

export const sanitizeFilters = (filters: GridFilterState): GridFilterState => {
  const sanitized: GridFilterState = {
    searchBy: filters.searchBy,
  };

  if (filters.uprn) {
    const digits = filters.uprn.replace(/\D/g, '');
    sanitized.uprn = digits.length > 0 ? digits : undefined;
  }

  if (filters.taskId) {
    const trimmed = filters.taskId.trim();
    sanitized.taskId = trimmed.length > 0 ? trimmed : undefined;
  }

  if (filters.saleId) {
    const trimmed = filters.saleId.trim();
    sanitized.saleId = trimmed.length > 0 ? trimmed : undefined;
  }

  if (filters.postcode) {
    const trimmed = filters.postcode.trim().toUpperCase();
    sanitized.postcode = trimmed.length >= 2 ? trimmed : undefined;
  }

  if (filters.address) {
    const trimmed = filters.address.trim();
    sanitized.address = trimmed.length >= 3 ? trimmed : undefined;
  }

  if (filters.buildingNameNumber) {
    const trimmed = filters.buildingNameNumber.trim();
    sanitized.buildingNameNumber = trimmed.length > 0 ? trimmed : undefined;
  }

  if (filters.street) {
    const trimmed = filters.street.trim();
    sanitized.street = trimmed.length > 0 ? trimmed : undefined;
  }

  if (filters.townCity) {
    const trimmed = filters.townCity.trim();
    sanitized.townCity = trimmed.length > 0 ? trimmed : undefined;
  }

  if (filters.manualCheck) sanitized.manualCheck = filters.manualCheck;

  if (filters.billingAuthority?.length) {
    const trimmed = filters.billingAuthority.map((b) => b.trim()).filter((b) => b.length > 0);
    if (trimmed.length > 0) sanitized.billingAuthority = trimmed.slice(0, 3);
  }

  if (filters.transactionDate) {
    const from = filters.transactionDate.from?.trim();
    const to = filters.transactionDate.to?.trim();
    sanitized.transactionDate = {
      from: from && from.length > 0 ? from : undefined,
      to: to && to.length > 0 ? to : undefined,
    };
  }

  const sanitizeNumeric = (value?: NumericFilter): NumericFilter | undefined => {
    if (!value) return undefined;
    const mode = value.mode ?? '>=';
    const min = value.min !== undefined && !Number.isNaN(value.min) ? value.min : undefined;
    const max = value.max !== undefined && !Number.isNaN(value.max) ? value.max : undefined;
    if (mode === 'between') {
      if (min === undefined && max === undefined) return undefined;
    } else if (mode === '>=') {
      if (min === undefined) return undefined;
    } else if (mode === '<=') {
      if (max === undefined) return undefined;
    }
    return { mode, min, max };
  };

  const salePrice = sanitizeNumeric(filters.salePrice);
  if (salePrice) sanitized.salePrice = salePrice;

  const ratio = sanitizeNumeric(filters.ratio);
  if (ratio) sanitized.ratio = ratio;

  const outlierRatio = sanitizeNumeric(filters.outlierRatio);
  if (outlierRatio) sanitized.outlierRatio = outlierRatio;

  const sanitizeMulti = (values?: string[]): string[] | undefined => {
    if (!values || values.length === 0) return undefined;
    const trimmed = values.map((v) => v.trim()).filter((v) => v.length > 0);
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const dwellingType = sanitizeMulti(filters.dwellingType);
  if (dwellingType) sanitized.dwellingType = dwellingType;

  if (filters.flaggedForReview) sanitized.flaggedForReview = filters.flaggedForReview;

  const reviewFlags = sanitizeMulti(filters.reviewFlags);
  if (reviewFlags) sanitized.reviewFlags = reviewFlags;

  const outlierKeySale = sanitizeMulti(filters.outlierKeySale);
  if (outlierKeySale) sanitized.outlierKeySale = outlierKeySale;

  const overallFlag = sanitizeMulti(filters.overallFlag);
  if (overallFlag) sanitized.overallFlag = overallFlag;

  if (filters.summaryFlag) {
    const trimmed = filters.summaryFlag.trim();
    sanitized.summaryFlag = trimmed.length >= 3 ? trimmed : undefined;
  }

  if (filters.source) {
    const trimmed = filters.source.trim();
    sanitized.source = trimmed.length > 0 ? trimmed : undefined;
  }

  const taskStatus = sanitizeMulti(filters.taskStatus);
  if (taskStatus) sanitized.taskStatus = taskStatus;

  if (filters.assignedTo) {
    const trimmed = filters.assignedTo.trim();
    sanitized.assignedTo = trimmed.length > 0 ? trimmed : undefined;
  }

  const assignedDate = filters.assignedDate
    ? {
        from: filters.assignedDate.from?.trim() ?? undefined,
        to: filters.assignedDate.to?.trim() ?? undefined,
      }
    : undefined;
  if (assignedDate && (assignedDate.from || assignedDate.to)) sanitized.assignedDate = assignedDate;

  if (filters.qcAssignedTo) {
    const trimmed = filters.qcAssignedTo.trim();
    sanitized.qcAssignedTo = trimmed.length > 0 ? trimmed : undefined;
  }

  const qcAssignedDate = filters.qcAssignedDate
    ? {
        from: filters.qcAssignedDate.from?.trim() ?? undefined,
        to: filters.qcAssignedDate.to?.trim() ?? undefined,
      }
    : undefined;
  if (qcAssignedDate && (qcAssignedDate.from || qcAssignedDate.to)) sanitized.qcAssignedDate = qcAssignedDate;

  const qcCompletedDate = filters.qcCompletedDate
    ? {
        from: filters.qcCompletedDate.from?.trim() ?? undefined,
        to: filters.qcCompletedDate.to?.trim() ?? undefined,
      }
    : undefined;
  if (qcCompletedDate && (qcCompletedDate.from || qcCompletedDate.to)) sanitized.qcCompletedDate = qcCompletedDate;

  const completedDate = filters.completedDate
    ? {
        from: filters.completedDate.from?.trim() ?? undefined,
        to: filters.completedDate.to?.trim() ?? undefined,
      }
    : undefined;
  if (completedDate && (completedDate.from || completedDate.to)) sanitized.completedDate = completedDate;

  if (filters.bacode) {
    const trimmed = filters.bacode.trim();
    sanitized.bacode = trimmed.length > 0 ? trimmed : undefined;
  }

  return sanitized;
};
