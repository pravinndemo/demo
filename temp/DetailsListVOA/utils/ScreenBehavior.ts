import { type GridFilterState } from '../Filters';
import { type ScreenKind } from './ScreenResolution';

export const isPrefilterScreenKind = (kind: ScreenKind): boolean =>
  kind === 'managerAssign' || kind === 'caseworkerView' || kind === 'qcAssign' || kind === 'qcView';

export const isSalesSearchKind = (kind: ScreenKind): boolean => kind === 'salesSearch';

export const shouldShowResults = (
  kind: ScreenKind,
  prefilterApplied: boolean,
  salesSearchApplied: boolean,
): boolean =>
  (!isPrefilterScreenKind(kind) || prefilterApplied) && (!isSalesSearchKind(kind) || salesSearchApplied);

export const resolveAssignmentScreenName = (raw: string, kind: ScreenKind): string => {
  switch (kind) {
    case 'managerAssign':
      return 'manager assignment';
    case 'qcAssign':
      return 'quality control assignment';
    default: {
      const trimmed = raw.trim();
      return trimmed;
    }
  }
};

export const isSalesSearchDefaultFilters = (fs: GridFilterState): boolean => {
  if (fs.searchBy !== 'address') return false;
  const billingAuthorityEmpty = !fs.billingAuthority || fs.billingAuthority.length === 0;
  return !fs.saleId
    && !fs.taskId
    && !fs.uprn
    && !fs.address
    && !fs.buildingNameNumber
    && !fs.street
    && !fs.townCity
    && !fs.postcode
    && billingAuthorityEmpty
    && !fs.bacode;
};
