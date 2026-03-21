export const normalizeTextValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
};

export const hasDisplayText = (value: unknown): boolean => {
  const normalized = normalizeTextValue(value);
  return normalized !== '' && normalized !== '-';
};

export const normalizeGuidValue = (value?: string): string =>
  normalizeTextValue(value).replace(/^\{+|\}+$/g, '');
