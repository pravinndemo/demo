import { IDropdownOption } from '@fluentui/react';
import {
  MANAGER_SEARCH_BY_OPTIONS as MANAGER_SEARCH_BY_OPTIONS_CONST,
  MANAGER_WORKTHAT_BILLING,
  MANAGER_WORKTHAT_CASEWORKER,
  CASEWORKER_WORKTHAT_OPTIONS as CASEWORKER_WORKTHAT_OPTIONS_CONST,
  QC_SEARCH_BY_OPTIONS as QC_SEARCH_BY_OPTIONS_CONST,
  QC_WORKTHAT_QCUSER_OPTIONS as QC_WORKTHAT_QCUSER_OPTIONS_CONST,
  QC_WORKTHAT_SELF_OPTIONS as QC_WORKTHAT_SELF_OPTIONS_CONST,
  QC_WORKTHAT_CASEWORKER_OPTIONS as QC_WORKTHAT_CASEWORKER_OPTIONS_CONST,
  QC_WORKTHAT_TASK_OPTIONS as QC_WORKTHAT_TASK_OPTIONS_CONST,
  MANAGER_BILLING_AUTHORITY_OPTIONS as MANAGER_BILLING_AUTHORITY_OPTIONS_CONST,
  MANAGER_CASEWORKER_OPTIONS as MANAGER_CASEWORKER_OPTIONS_CONST,
} from '../constants/FilterConstants';

export type QcSearchBy = 'qcUser' | 'caseworker' | 'task';
export type ManagerSearchBy = 'billingAuthority' | 'caseworker' | QcSearchBy;
export type ManagerWorkThat =
  | 'readyToAllocate'
  | 'currentlyAssigned'
  | 'hasBeenComplete'
  | 'awaitingQc'
  | 'assignedToSelected'
  | 'completedBySelected'
  | 'assignedAwaitingQc'
  | 'qcAssignedToSelected'
  | 'qcCompletedBySelected'
  | 'qcAssignedInProgress'
  | 'caseworkerCompletedQcRequested'
  | 'caseworkerCompleted'
  | 'taskCompletedQcRequested'
  | 'taskCompleted';

export interface ManagerPrefilterState {
  searchBy: ManagerSearchBy;
  billingAuthorities: string[];
  caseworkers: string[];
  workThat?: ManagerWorkThat;
  completedFrom?: string;
  completedTo?: string;
}

export const MANAGER_PREFILTER_DEFAULT: ManagerPrefilterState = {
  searchBy: 'billingAuthority',
  billingAuthorities: [],
  caseworkers: [],
};

export const CASEWORKER_PREFILTER_DEFAULT: ManagerPrefilterState = {
  searchBy: 'caseworker',
  billingAuthorities: [],
  caseworkers: [],
  workThat: 'assignedToSelected',
};

export const QC_PREFILTER_DEFAULT: ManagerPrefilterState = {
  searchBy: 'task',
  billingAuthorities: [],
  caseworkers: [],
};

export const QC_VIEW_PREFILTER_DEFAULT: ManagerPrefilterState = {
  searchBy: 'qcUser',
  billingAuthorities: [],
  caseworkers: [],
  workThat: 'qcAssignedToSelected',
};

export const MANAGER_SEARCH_BY_OPTIONS: IDropdownOption[] = MANAGER_SEARCH_BY_OPTIONS_CONST;
export const QC_SEARCH_BY_OPTIONS: IDropdownOption[] = QC_SEARCH_BY_OPTIONS_CONST;
const BILLING_WORKTHAT_OPTIONS: IDropdownOption[] = MANAGER_WORKTHAT_BILLING;
const CASEWORKER_WORKTHAT_OPTIONS: IDropdownOption[] = MANAGER_WORKTHAT_CASEWORKER;
export const CASEWORKER_WORKTHAT_SELF_OPTIONS: IDropdownOption[] = CASEWORKER_WORKTHAT_OPTIONS_CONST;
const QC_WORKTHAT_QCUSER_OPTIONS: IDropdownOption[] = QC_WORKTHAT_QCUSER_OPTIONS_CONST;
export const QC_WORKTHAT_SELF_OPTIONS: IDropdownOption[] = QC_WORKTHAT_SELF_OPTIONS_CONST;
const QC_WORKTHAT_CASEWORKER_OPTIONS: IDropdownOption[] = QC_WORKTHAT_CASEWORKER_OPTIONS_CONST;
const QC_WORKTHAT_TASK_OPTIONS: IDropdownOption[] = QC_WORKTHAT_TASK_OPTIONS_CONST;
export const MANAGER_BILLING_AUTHORITY_OPTIONS: IDropdownOption[] = MANAGER_BILLING_AUTHORITY_OPTIONS_CONST;
export const MANAGER_CASEWORKER_OPTIONS: IDropdownOption[] = MANAGER_CASEWORKER_OPTIONS_CONST;

// Configurable separators for list-style API parameters (all screens).
export const PREFILTER_VALUE_SEPARATOR = ',';
export const TASKSTATUS_VALUE_SEPARATOR = ',';
// Column filter format uses field/operator/value; values may be multi-select.
export const COLUMN_FILTER_CONDITION_SEPARATOR = '~';
export const COLUMN_FILTER_VALUE_SEPARATOR = ',';

export const getManagerWorkThatOptions = (searchBy: ManagerSearchBy): IDropdownOption[] =>
  (searchBy === 'caseworker' ? CASEWORKER_WORKTHAT_OPTIONS : BILLING_WORKTHAT_OPTIONS);

export const getQcWorkThatOptions = (searchBy: QcSearchBy): IDropdownOption[] => {
  switch (searchBy) {
    case 'qcUser':
      return QC_WORKTHAT_QCUSER_OPTIONS;
    case 'caseworker':
      return QC_WORKTHAT_CASEWORKER_OPTIONS;
    case 'task':
      return QC_WORKTHAT_TASK_OPTIONS;
    default:
      return QC_WORKTHAT_TASK_OPTIONS;
  }
};

export const isManagerCompletedWorkThat = (workThat?: ManagerWorkThat): boolean =>
  workThat === 'hasBeenComplete' || workThat === 'completedBySelected';

export const isQcCompletedWorkThat = (workThat?: ManagerWorkThat): boolean =>
  workThat === 'qcCompletedBySelected' || workThat === 'caseworkerCompleted' || workThat === 'taskCompleted';

const mapWorkThatToStatuses = (workThat?: ManagerWorkThat): string[] => {
  switch (workThat) {
    case 'readyToAllocate':
      return ['New'];
    case 'currentlyAssigned':
      return ['Assigned QC Failed', 'Assigned'];
    case 'awaitingQc':
      return ['QC Requested', 'Reassigned To QC', 'Assigned To QC'];
    case 'assignedToSelected':
      return ['Assigned QC Failed', 'Assigned'];
    case 'assignedAwaitingQc':
      return ['QC Requested', 'Reassigned To QC', 'Assigned To QC'];
    case 'completedBySelected':
    case 'hasBeenComplete':
      return ['Complete Passed QC', 'Complete'];
    default:
      return [];
  }
};

const mapQcWorkThatToStatuses = (workThat?: ManagerWorkThat): string[] => {
  switch (workThat) {
    case 'qcAssignedToSelected':
      return ['Reassigned To QC', 'Assigned To QC'];
    case 'qcCompletedBySelected':
      return ['Complete Passed QC'];
    case 'qcAssignedInProgress':
      return ['Assigned QC Failed'];
    case 'caseworkerCompletedQcRequested':
    case 'taskCompletedQcRequested':
      return ['QC Requested'];
    case 'caseworkerCompleted':
    case 'taskCompleted':
      return ['Complete'];
    default:
      return [];
  }
};

const mapQcViewWorkThatToStatuses = (workThat?: ManagerWorkThat): string[] => {
  switch (workThat) {
    case 'qcAssignedToSelected':
      return ['Reassigned To QC', 'Assigned To QC'];
    case 'qcCompletedBySelected':
      return ['Complete Passed QC', 'Complete'];
    case 'qcAssignedInProgress':
      return ['Assigned QC Failed', 'Assigned'];
    default:
      return [];
  }
};

export const mapManagerPrefiltersToApi = (prefilters?: ManagerPrefilterState): Record<string, string> => {
  if (!prefilters) return {};
  const params: Record<string, string> = {};
  const prefilterSeparator = PREFILTER_VALUE_SEPARATOR;
  const taskStatusSeparator = TASKSTATUS_VALUE_SEPARATOR;
  const isAllSelected = (values: string[]): boolean => values.some((v) => v.trim() === '__all__');
  const trimList = (values: string[]): string[] =>
    values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v) => v.length > 0);
  const joinValues = (values: string[]): string | undefined => {
    if (isAllSelected(values)) {
      return 'ALL';
    }
    const trimmed = trimList(values);
    return trimmed.length > 0 ? trimmed.join(prefilterSeparator) : undefined;
  };
  const formatIsoToDdMmYyyy = (value?: string): string | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return undefined;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  params.searchBy = prefilters.searchBy === 'caseworker' ? 'CW' : 'BA';

  if (prefilters.searchBy === 'billingAuthority') {
    const joined = joinValues(prefilters.billingAuthorities ?? []);
    if (joined) params.preFilter = joined;
  }
  if (prefilters.searchBy === 'caseworker') {
    const joined = joinValues(prefilters.caseworkers ?? []);
    if (joined) params.preFilter = joined;
  }
  const statuses = mapWorkThatToStatuses(prefilters.workThat);
  if (statuses.length > 0) params.taskStatus = statuses.join(taskStatusSeparator);
  const fromDate = formatIsoToDdMmYyyy(prefilters.completedFrom);
  const toDate = formatIsoToDdMmYyyy(prefilters.completedTo);
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  return params;
};

export const mapQcPrefiltersToApi = (prefilters?: ManagerPrefilterState): Record<string, string> => {
  if (!prefilters) return {};
  const params: Record<string, string> = {};
  const prefilterSeparator = PREFILTER_VALUE_SEPARATOR;
  const taskStatusSeparator = TASKSTATUS_VALUE_SEPARATOR;
  const isAllSelected = (values: string[]): boolean => values.some((v) => v.trim() === '__all__');
  const trimList = (values: string[]): string[] =>
    values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v) => v.length > 0);
  const joinValues = (values: string[]): string | undefined => {
    if (isAllSelected(values)) {
      return 'ALL';
    }
    const trimmed = trimList(values);
    return trimmed.length > 0 ? trimmed.join(prefilterSeparator) : undefined;
  };
  const formatIsoToDdMmYyyy = (value?: string): string | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return undefined;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  switch (prefilters.searchBy) {
    case 'qcUser':
      params.searchBy = 'QC';
      break;
    case 'caseworker':
      params.searchBy = 'CW';
      break;
    case 'task':
      params.searchBy = 'TK';
      break;
    default:
      break;
  }

  const joined = joinValues(prefilters.caseworkers ?? []);
  if (joined) params.preFilter = joined;

  const statuses = mapQcWorkThatToStatuses(prefilters.workThat);
  if (statuses.length > 0) params.taskStatus = statuses.join(taskStatusSeparator);

  const fromDate = formatIsoToDdMmYyyy(prefilters.completedFrom);
  const toDate = formatIsoToDdMmYyyy(prefilters.completedTo);
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  return params;
};

export const mapQcViewPrefiltersToApi = (prefilters?: ManagerPrefilterState): Record<string, string> => {
  if (!prefilters) return {};
  const params: Record<string, string> = {};
  const prefilterSeparator = PREFILTER_VALUE_SEPARATOR;
  const taskStatusSeparator = TASKSTATUS_VALUE_SEPARATOR;
  const isAllSelected = (values: string[]): boolean => values.some((v) => v.trim() === '__all__');
  const trimList = (values: string[]): string[] =>
    values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v) => v.length > 0);
  const joinValues = (values: string[]): string | undefined => {
    if (isAllSelected(values)) {
      return 'ALL';
    }
    const trimmed = trimList(values);
    return trimmed.length > 0 ? trimmed.join(prefilterSeparator) : undefined;
  };
  const formatIsoToDdMmYyyy = (value?: string): string | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return undefined;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  switch (prefilters.searchBy) {
    case 'caseworker':
      params.searchBy = 'CW';
      break;
    case 'task':
      params.searchBy = 'TK';
      break;
    case 'qcUser':
    default:
      params.searchBy = 'QC';
      break;
  }

  const joined = joinValues(prefilters.caseworkers ?? []);
  if (joined) params.preFilter = joined;

  const statuses = mapQcViewWorkThatToStatuses(prefilters.workThat);
  if (statuses.length > 0) params.taskStatus = statuses.join(taskStatusSeparator);

  const fromDate = formatIsoToDdMmYyyy(prefilters.completedFrom);
  const toDate = formatIsoToDdMmYyyy(prefilters.completedTo);
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  return params;
};
