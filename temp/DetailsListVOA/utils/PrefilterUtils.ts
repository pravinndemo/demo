import {
  MANAGER_PREFILTER_DEFAULT,
  QC_PREFILTER_DEFAULT,
  MANAGER_SEARCH_BY_OPTIONS,
  QC_SEARCH_BY_OPTIONS,
  type ManagerSearchBy,
} from '../config/PrefilterConfigs';
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
