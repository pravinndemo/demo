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
  PREFILTER_API_PARAMS,
  MANAGER_WORKTHAT_STATUS_MAP,
  QC_ASSIGNMENT_WORKTHAT_STATUS_MAP,
  QC_VIEW_WORKTHAT_STATUS_MAP,
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

const joinPrefilterValues = (values: string[]): string | undefined => {
  const trimmed = values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v) => v.length > 0);
  if (trimmed.some((v) => v === '__all__')) return 'ALL';
  return trimmed.length > 0 ? trimmed.join(PREFILTER_VALUE_SEPARATOR) : undefined;
};

const mapWorkThatToStatuses = (workThat?: ManagerWorkThat): string[] =>
  (workThat ? MANAGER_WORKTHAT_STATUS_MAP[workThat] : undefined) ?? [];

const mapQcWorkThatToStatuses = (workThat?: ManagerWorkThat): string[] =>
  (workThat ? QC_ASSIGNMENT_WORKTHAT_STATUS_MAP[workThat] : undefined) ?? [];

const mapQcViewWorkThatToStatuses = (workThat?: ManagerWorkThat): string[] =>
  (workThat ? QC_VIEW_WORKTHAT_STATUS_MAP[workThat] : undefined) ?? [];

export const mapManagerPrefiltersToApi = (prefilters?: ManagerPrefilterState): Record<string, string> => {
  if (!prefilters) return {};
  const params: Record<string, string> = {};
  const taskStatusSeparator = TASKSTATUS_VALUE_SEPARATOR;
  const formatIsoToDdMmYyyy = (value?: string): string | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return undefined;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  params.searchBy = prefilters.searchBy === 'caseworker'
    ? PREFILTER_API_PARAMS.managerAssignment.searchBy.caseworker
    : PREFILTER_API_PARAMS.managerAssignment.searchBy.billingAuthority;

  if (prefilters.searchBy === 'billingAuthority') {
    const joined = joinPrefilterValues(prefilters.billingAuthorities ?? []);
    if (joined) params.preFilter = joined;
  }
  if (prefilters.searchBy === 'caseworker') {
    const joined = joinPrefilterValues(prefilters.caseworkers ?? []);
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
  const taskStatusSeparator = TASKSTATUS_VALUE_SEPARATOR;
  const formatIsoToDdMmYyyy = (value?: string): string | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return undefined;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  switch (prefilters.searchBy) {
    case 'qcUser':
      params.searchBy = PREFILTER_API_PARAMS.qcAssignment.searchBy.qcUser;
      break;
    case 'caseworker':
      params.searchBy = PREFILTER_API_PARAMS.qcAssignment.searchBy.caseworker;
      break;
    case 'task':
      params.searchBy = PREFILTER_API_PARAMS.qcAssignment.searchBy.task;
      break;
    default:
      break;
  }

  if (prefilters.searchBy !== 'task') {
    const joined = joinPrefilterValues(prefilters.caseworkers ?? []);
    if (joined) params.preFilter = joined;
  }

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
  const taskStatusSeparator = TASKSTATUS_VALUE_SEPARATOR;
  const formatIsoToDdMmYyyy = (value?: string): string | undefined => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return undefined;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  const statuses = mapQcViewWorkThatToStatuses(prefilters.workThat);
  if (statuses.length > 0) params.taskStatus = statuses.join(taskStatusSeparator);

  const fromDate = formatIsoToDdMmYyyy(prefilters.completedFrom);
  const toDate = formatIsoToDdMmYyyy(prefilters.completedTo);
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  return params;
};
