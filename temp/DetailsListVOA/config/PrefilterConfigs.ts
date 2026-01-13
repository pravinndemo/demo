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

export const getManagerWorkThatOptions = (searchBy: ManagerSearchBy): IDropdownOption[] =>
  (searchBy === 'caseworker' ? CASEWORKER_WORKTHAT_OPTIONS : BILLING_WORKTHAT_OPTIONS);

export const isManagerCompletedWorkThat = (workThat?: ManagerWorkThat): boolean =>
  workThat === 'hasBeenComplete' || workThat === 'completedBySelected';

const mapWorkThatToStatuses = (workThat?: ManagerWorkThat): string[] => {
  switch (workThat) {
    case 'readyToAllocate':
      return ['New'];
    case 'currentlyAssigned':
      return ['Assigned QC -Failed', 'Assigned'];
    case 'awaitingQc':
      return ['QC requested', 'Reassigned to QC', 'Assigned to QC'];
    case 'assignedToSelected':
      return ['Assigned QC -Failed', 'Assigned'];
    case 'assignedAwaitingQc':
      return ['QC requested', 'Reassigned to QC', 'Assigned to QC'];
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
  if (prefilters.searchBy === 'billingAuthority' && prefilters.billingAuthorities.length > 0) {
    params.billingAuthority = prefilters.billingAuthorities.join(',');
  }
  if (prefilters.searchBy === 'caseworker' && prefilters.caseworkers.length > 0) {
    params.assignedTo = prefilters.caseworkers.join(',');
  }
  const statuses = mapWorkThatToStatuses(prefilters.workThat);
  if (statuses.length > 0) params.taskStatus = statuses.join(',');
  if (prefilters.completedFrom) params.completedFromDate = prefilters.completedFrom;
  if (prefilters.completedTo) params.completedToDate = prefilters.completedTo;
  return params;
};
