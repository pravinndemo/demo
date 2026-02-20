import { type GridFilterState, isValidUkPostcode, normalizeUkPostcode } from '../Filters';

export interface SalesSearchErrors {
  address?: string;
  postcode?: string;
  street?: string;
  townCity?: string;
  saleId?: string;
  taskId?: string;
  uprn?: string;
  billingAuthority?: string;
  bacode?: string;
  summaryFlag?: string;
  searchField?: string;
}

export const ID_FIELD_MAX_LENGTH = 15;
export const UPRN_MAX_LENGTH = 12;
export const ADDRESS_FIELD_MAX_LENGTH = 150;
export const MIN_ADDRESS_TEXT_LENGTH = 3;
export const SALE_ID_REGEX = /^S-\d+$/i;
export const TASK_ID_REGEX = /^(?:\d+|[AM]-\d+)$/i;
export const TASK_ID_MIN_LENGTH = 3;

export const sanitizeAlphaNumHyphen = (value?: string, maxLength = ID_FIELD_MAX_LENGTH): string =>
  (value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, maxLength);

export const sanitizeTaskIdInput = (value?: string, maxLength = ID_FIELD_MAX_LENGTH): string =>
  (value ?? '')
    .toUpperCase()
    .replace(/[^AM0-9-]/g, '')
    .slice(0, maxLength);

export const sanitizeDigits = (value?: string, maxLength = UPRN_MAX_LENGTH): string =>
  (value ?? '')
    .replace(/\D/g, '')
    .slice(0, maxLength);

export const getSalesSearchErrors = (fs: GridFilterState): SalesSearchErrors => {
  const saleId = sanitizeAlphaNumHyphen(fs.saleId, ID_FIELD_MAX_LENGTH).trim();
  const taskId = sanitizeTaskIdInput(fs.taskId, ID_FIELD_MAX_LENGTH).trim();
  const uprn = sanitizeDigits(fs.uprn, UPRN_MAX_LENGTH).trim();
  const building = (fs.buildingNameNumber ?? '').trim();
  const street = (fs.street ?? '').trim();
  const town = (fs.townCity ?? '').trim();
  const postcode = normalizeUkPostcode(fs.postcode ?? '').trim();
  const billingAuthority = (fs.billingAuthority?.[0] ?? '').trim();
  const saleIdError =
    fs.searchBy === 'saleId' && saleId.length > 0 && (!SALE_ID_REGEX.test(saleId) || saleId.length < 3)
      ? 'Please enter a valid Sale ID'
      : undefined;
  const taskIdError =
    fs.searchBy === 'taskId' && taskId.length > 0
      ? taskId.length < TASK_ID_MIN_LENGTH
        ? `Enter at least ${TASK_ID_MIN_LENGTH} characters`
        : !TASK_ID_REGEX.test(taskId)
          ? 'Use A- or M- prefix (e.g. A-1000001) or numbers only.'
          : undefined
      : undefined;
  const uprnError =
    fs.searchBy === 'uprn' && (fs.uprn ?? '').trim().length > 0 && uprn.length === 0
      ? 'Please enter a valid UPRN'
      : undefined;

  let billingAuthorityError: string | undefined;
  const billingAuthorityRefError: string | undefined = undefined;
  if (fs.searchBy === 'billingAuthority' && billingAuthority.length === 0) {
    billingAuthorityError = 'Billing Authority is required';
  }

  let postcodeError: string | undefined;
  let streetError: string | undefined;
  let townError: string | undefined;
  let addressCriteriaError: string | undefined;
  if (fs.searchBy === 'address') {
    const hasPostcode = postcode.length > 0;
    const postcodeValid = hasPostcode ? isValidUkPostcode(postcode, false) : false;
    if (hasPostcode && !postcodeValid) {
      postcodeError = 'Please enter a valid postcode';
    }
    const requiresOtherCriteria = !postcodeValid;
    if (requiresOtherCriteria) {
      if (street.length > 0 && street.length < MIN_ADDRESS_TEXT_LENGTH) {
        streetError = `Enter at least ${MIN_ADDRESS_TEXT_LENGTH} characters`;
      }
      if (town.length > 0 && town.length < MIN_ADDRESS_TEXT_LENGTH) {
        townError = `Enter at least ${MIN_ADDRESS_TEXT_LENGTH} characters`;
      }
      const buildingValid = building.length > 0;
      const streetValid = street.length >= MIN_ADDRESS_TEXT_LENGTH;
      const townValid = town.length >= MIN_ADDRESS_TEXT_LENGTH;
      const criteriaCount = (buildingValid ? 1 : 0) + (streetValid ? 1 : 0) + (townValid ? 1 : 0);
      if (!hasPostcode && criteriaCount === 1) {
        addressCriteriaError = 'Please provide at least two search criteria.';
      }
    }
  }

  return {
    address: addressCriteriaError,
    postcode: postcodeError,
    street: streetError,
    townCity: townError,
    saleId: saleIdError,
    taskId: taskIdError,
    uprn: uprnError,
    billingAuthority: billingAuthorityError,
    bacode: billingAuthorityRefError,
    summaryFlag: undefined,
    searchField: undefined,
  };
};
