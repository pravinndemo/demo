export const normalizeUserId = (value?: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/^[{(]?(.*?)[)}]?$/, '$1');
};

export const isGuidValue = (value: string): boolean =>
  /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

export const normalizeSuid = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) return '';
  const lowered = trimmed.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return '';
  const unwrapped = trimmed.replace(/^[{(]?(.*?)[)}]?$/, '$1');
  return isGuidValue(unwrapped) ? unwrapped : '';
};
