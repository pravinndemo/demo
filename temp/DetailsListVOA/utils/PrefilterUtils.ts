import {
  MANAGER_PREFILTER_DEFAULT,
  QC_PREFILTER_DEFAULT,
  MANAGER_SEARCH_BY_OPTIONS,
  QC_SEARCH_BY_OPTIONS,
  type ManagerSearchBy,
} from '../config/PrefilterConfigs';
import { isGuidValue, normalizeUserId } from './IdentifierUtils';
import { type ScreenKind } from './ScreenResolution';

const MANAGER_SEARCH_BY_KEYS = new Set(MANAGER_SEARCH_BY_OPTIONS.map((opt) => String(opt.key)));
const QC_SEARCH_BY_KEYS = new Set(QC_SEARCH_BY_OPTIONS.map((opt) => String(opt.key)));

export const normalizePrefilterSearchBy = (value: unknown, kind: ScreenKind): ManagerSearchBy => {
  const raw = typeof value === 'string' ? value : '';
  if (kind === 'caseworkerView') return 'caseworker';
  if (kind === 'qcView') return 'qcUser';
  if (kind === 'qcAssign') {
    return QC_SEARCH_BY_KEYS.has(raw) ? (raw as ManagerSearchBy) : QC_PREFILTER_DEFAULT.searchBy;
  }
  return MANAGER_SEARCH_BY_KEYS.has(raw) ? (raw as ManagerSearchBy) : MANAGER_PREFILTER_DEFAULT.searchBy;
};

export const shouldRemoveStoredPrefilter = (
  isDefault: boolean,
  prefilterApplied: boolean,
  wasCleared: boolean,
): boolean => isDefault && !prefilterApplied && wasCleared;

export const shouldSkipPrefilterAutoApply = (
  manualApplyPending: boolean,
  prefilterApplied: boolean,
): boolean => manualApplyPending && !prefilterApplied;

interface PrefilterUserAutoApplyReadinessArgs {
  screenKind: ScreenKind;
  searchBy: string;
  selectedUsers: string[];
  caseworkerOptionsLoading?: boolean;
  caseworkerOptionsError?: string;
  caseworkerOptions?: string[];
  qcUserOptionsLoading?: boolean;
  qcUserOptionsError?: string;
  qcUserOptions?: string[];
}

const hasNamedUserSelections = (values: string[]): boolean =>
  values.some((value) => {
    const raw = String(value ?? '').trim();
    if (!raw || raw === '__all__') return false;
    return !isGuidValue(normalizeUserId(raw));
  });

export const isPrefilterUserAutoApplyReady = ({
  screenKind,
  searchBy,
  selectedUsers,
  caseworkerOptionsLoading = false,
  caseworkerOptionsError,
  caseworkerOptions = [],
  qcUserOptionsLoading = false,
  qcUserOptionsError,
  qcUserOptions = [],
}: PrefilterUserAutoApplyReadinessArgs): boolean => {
  if (!hasNamedUserSelections(selectedUsers)) {
    return true;
  }

  if ((screenKind === 'managerAssign' || screenKind === 'caseworkerView') && searchBy === 'caseworker') {
    return !caseworkerOptionsLoading
      && !caseworkerOptionsError
      && caseworkerOptions.length > 0;
  }

  if (screenKind === 'qcAssign' && searchBy === 'caseworker') {
    return !caseworkerOptionsLoading
      && !caseworkerOptionsError
      && caseworkerOptions.length > 0;
  }

  if ((screenKind === 'qcAssign' || screenKind === 'qcView') && searchBy === 'qcUser') {
    return !qcUserOptionsLoading
      && !qcUserOptionsError
      && qcUserOptions.length > 0;
  }

  return true;
};
