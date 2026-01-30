import { IDropdownOption } from '@fluentui/react';
import {
  MANAGER_SEARCH_BY_OPTIONS as MANAGER_SEARCH_BY_OPTIONS_CONST,
  MANAGER_WORKTHAT_BILLING,
  MANAGER_WORKTHAT_CASEWORKER,
  MANAGER_BILLING_AUTHORITY_OPTIONS as MANAGER_BILLING_AUTHORITY_OPTIONS_CONST,
  MANAGER_CASEWORKER_OPTIONS as MANAGER_CASEWORKER_OPTIONS_CONST,
} from '../constants/FilterConstants';

export type ManagerSearchBy = 'billingAuthority' | 'caseworker';
export type ManagerWorkThat =
  | 'readyToAllocate'
  | 'currentlyAssigned'
  | 'hasBeenComplete'
  | 'awaitingQc'
  | 'assignedToSelected'
  | 'completedBySelected'
  | 'assignedAwaitingQc';

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

export const MANAGER_SEARCH_BY_OPTIONS: IDropdownOption[] = MANAGER_SEARCH_BY_OPTIONS_CONST;
const BILLING_WORKTHAT_OPTIONS: IDropdownOption[] = MANAGER_WORKTHAT_BILLING;
const CASEWORKER_WORKTHAT_OPTIONS: IDropdownOption[] = MANAGER_WORKTHAT_CASEWORKER;
export const MANAGER_BILLING_AUTHORITY_OPTIONS: IDropdownOption[] = MANAGER_BILLING_AUTHORITY_OPTIONS_CONST;
export const MANAGER_CASEWORKER_OPTIONS: IDropdownOption[] = MANAGER_CASEWORKER_OPTIONS_CONST;

export const MANAGER_PREFILTER_VALUE_SEPARATOR = '~';

export const getManagerWorkThatOptions = (searchBy: ManagerSearchBy): IDropdownOption[] =>
  (searchBy === 'caseworker' ? CASEWORKER_WORKTHAT_OPTIONS : BILLING_WORKTHAT_OPTIONS);

export const isManagerCompletedWorkThat = (workThat?: ManagerWorkThat): boolean =>
  workThat === 'hasBeenComplete' || workThat === 'completedBySelected';

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

export const mapManagerPrefiltersToApi = (prefilters?: ManagerPrefilterState): Record<string, string> => {
  if (!prefilters) return {};
  const params: Record<string, string> = {};
  const separator = MANAGER_PREFILTER_VALUE_SEPARATOR;
  const isAllSelected = (values: string[]): boolean => values.some((v) => v.trim() === '__all__');
  const trimList = (values: string[]): string[] =>
    values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v) => v.length > 0);
  const joinValues = (values: string[]): string | undefined => {
    if (isAllSelected(values)) {
      return 'ALL';
    }
    const trimmed = trimList(values);
    return trimmed.length > 0 ? trimmed.join(separator) : undefined;
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
  if (statuses.length > 0) params.taskStatus = statuses.join(separator);
  const fromDate = formatIsoToDdMmYyyy(prefilters.completedFrom);
  const toDate = formatIsoToDdMmYyyy(prefilters.completedTo);
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  return params;
};
