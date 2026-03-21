import { AttributeChip, AttributeTone, SaleDetailsRecord, StatusTone } from './types';

export const isRecord = (value: unknown): value is SaleDetailsRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toDisplayText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item)).filter((item) => item.trim() !== '').join(', ');
  }
  if (isRecord(value)) {
    return JSON.stringify(value);
  }
  return '';
};

const getUnknownFromPath = (root: unknown, path: string): unknown => {
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return undefined;
  }

  const segments = trimmedPath.split('.').filter((segment) => segment.length > 0);
  let current: unknown = root;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (isRecord(current)) {
      current = current[segment];
      continue;
    }

    return undefined;
  }

  return current;
};

export const getRecord = (root: SaleDetailsRecord, key: string): SaleDetailsRecord => {
  const candidate = root[key];
  return isRecord(candidate) ? candidate : {};
};

export const getRecordFromKeys = (root: SaleDetailsRecord, keys: string[]): SaleDetailsRecord => {
  for (const key of keys) {
    const candidate = root[key];
    if (isRecord(candidate)) {
      return candidate;
    }
  }
  return {};
};

export const getRecordFromPath = (root: SaleDetailsRecord, path: string): SaleDetailsRecord => {
  const candidate = getUnknownFromPath(root, path);
  return isRecord(candidate) ? candidate : {};
};

export const getRecordArray = (root: SaleDetailsRecord, key: string): SaleDetailsRecord[] => {
  const candidate = root[key];
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.filter(isRecord);
};

export const getRecordArrayFromKeys = (root: SaleDetailsRecord, keys: string[]): SaleDetailsRecord[] => {
  for (const key of keys) {
    const candidate = root[key];
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }
  return [];
};

export const getRecordArrayFromPath = (root: SaleDetailsRecord, path: string): SaleDetailsRecord[] => {
  const candidate = getUnknownFromPath(root, path);
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.filter(isRecord);
};

export const getValue = (record: SaleDetailsRecord, key: string): string => toDisplayText(record[key]).trim();

export const getValueFromPath = (root: SaleDetailsRecord, path: string): string => toDisplayText(getUnknownFromPath(root, path)).trim();

export const firstNonEmpty = (...values: string[]): string => {
  for (const value of values) {
    if (value.trim().length > 0) {
      return value;
    }
  }
  return '';
};

export const formatValue = (value: string): string => (value && value.trim().length > 0 ? value : '-');

export const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

export const toUkDate = (value: string): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());
  return `${day}/${month}/${year}`;
};

export const toUkCurrency = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }

  const normalized = trimmed.replace(/[£,\s]/g, '');
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return trimmed;
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
};

export const buildSearchUrl = (baseUrl: string, query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) {
    return '';
  }
  return `${baseUrl}${encodeURIComponent(trimmed)}`;
};

export const parseSaleDetails = (payload: string): SaleDetailsRecord => {
  if (!payload) return {};
  try {
    const parsed = JSON.parse(payload) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const toInitials = (displayName: string): string => {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter((item) => item.length > 0);

  if (words.length === 0) {
    return '?';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

export const toStatusTone = (statusText: string): StatusTone => {
  const normalized = statusText.trim().toLowerCase();
  if (!normalized) {
    return 'neutral';
  }
  if (normalized.includes('fail') || normalized.includes('reject')) {
    return 'critical';
  }
  if (normalized.includes('complete') || normalized.includes('pass') || normalized.includes('commit')) {
    return 'ok';
  }
  if (normalized.includes('review') || normalized.includes('investigate') || normalized.includes('assigned')) {
    return 'warning';
  }
  return 'neutral';
};

export const parseCsvCodes = (raw: string): string[] => {
  const value = raw.trim();
  if (!value || value === '-') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const isTrueLike = (raw: string): boolean => {
  const normalized = raw.trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
};

export const mapPadConfirmationToKey = (raw: string): string | undefined => {
  const normalized = raw.trim().toLowerCase();
  if (!normalized || normalized === '-') {
    return undefined;
  }
  if (normalized.includes('confirm')) {
    return 'confirmed';
  }
  if (normalized.includes('update')) {
    return 'needs-update';
  }
  if (normalized.includes('review')) {
    return 'further-review';
  }
  return undefined;
};

export const toReadableLabel = (key: string): string => key
  .replace(/([A-Z])/g, ' $1')
  .replace(/^./, (char) => char.toUpperCase())
  .trim();

export const createAttributeChip = (
  key: string,
  value: string,
  tone: AttributeTone,
  tooltip?: string,
  color?: string,
): AttributeChip => ({ key, value, tone, tooltip, color });

const GUID_VALUE_PATTERN = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;

const normalizeUserLookupKey = (value: string): string => value.trim().replace(/^\{/, '').replace(/\}$/, '').toLowerCase();

export const isGuidLikeValue = (value: string): boolean => GUID_VALUE_PATTERN.test(value.trim());

export const resolveUserDisplayName = (value: string, lookup: Record<string, string>): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const normalized = normalizeUserLookupKey(trimmed);
  const resolvedName = lookup[normalized] ?? lookup[trimmed.toLowerCase()];
  if (resolvedName?.trim()) {
    return resolvedName;
  }

  if (isGuidLikeValue(trimmed)) {
    return 'Unknown User';
  }

  return trimmed;
};


