import * as React from 'react';
import { SAMPLE_SALE_DETAILS, SAMPLE_USER_LOOKUP } from './sampleData';
import {
  AttributeChip,
  AttributeTone,
  AuditHistoryViewModel,
  MasterSaleSource,
  PromotedMasterRecordViewModel,
  SaleDetailsRecord,
  SaleDetailsViewModel,
  SalesParticularAttributeKey,
  SalesParticularOptionsByAttribute,
  SalesParticularReviewStatus,
  SalesParticularScoringModelRow,
  SharePointCatalogChunks,
} from './types';
import {
  createAttributeChip,
  firstNonEmpty,
  formatValue,
  getRecord,
  getRecordArray,
  getRecordArrayFromKeys,
  getRecordArrayFromPath,
  getRecordFromKeys,
  getValue,
  getValueFromPath,
  isHttpUrl,
  isTrueLike,
  mapPadConfirmationToKey,
  parseCsvCodes,
  parseSaleDetails,
  resolveUserDisplayName,
  isGuidLikeValue,
  toReadableLabel,
  toStatusTone,
  toUkCurrency,
  toUkDate,
} from './utils';
import { buildReferenceImagesFromSharePointChunks } from './sharePointCatalog';
import { normalizeSuid } from '../../utils/IdentifierUtils';
import { buildHereditamentUrl } from '../../utils/HereditamentUrl';
import { EXTERNAL_LINK_DISABLED_REASON, EXTERNAL_LINK_URL_PARTS } from './constants';
const buildPadChip = (
  propertyAndBandingDetails: SaleDetailsRecord,
  padAttributeColorMap: SaleDetailsRecord,
  padAttributeTooltipMap: SaleDetailsRecord,
  attributeKey: string,
  tone: AttributeTone,
): AttributeChip => {
  const value = getValue(propertyAndBandingDetails, attributeKey);

  const tooltipFromMap = firstNonEmpty(
    getValue(padAttributeTooltipMap, attributeKey),
    getValue(padAttributeTooltipMap, attributeKey.toLowerCase()),
    getValue(propertyAndBandingDetails, `${attributeKey}Tooltip`),
  );

  const colorFromMap = firstNonEmpty(
    getValue(padAttributeColorMap, attributeKey),
    getValue(padAttributeColorMap, attributeKey.toLowerCase()),
    getValue(propertyAndBandingDetails, `${attributeKey}Color`),
    getValue(propertyAndBandingDetails, `${attributeKey}Colour`),
  );

  const tooltip = tooltipFromMap && tooltipFromMap !== '-'
    ? tooltipFromMap
    : `${toReadableLabel(attributeKey)}: ${value}`;

  const color = colorFromMap && colorFromMap !== '-' ? colorFromMap : undefined;

  return createAttributeChip(attributeKey, value, tone, tooltip, color);
};

const toEditableInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }
  return trimmed;
};

const getFirstValueByKeys = (record: SaleDetailsRecord, keys: string[]): string => firstNonEmpty(
  ...keys.map((key) => getValue(record, key)),
);

const getValueFromRecordOrRoot = (
  record: SaleDetailsRecord,
  root: SaleDetailsRecord,
  keys: string[],
): string => firstNonEmpty(
  getFirstValueByKeys(record, keys),
  getFirstValueByKeys(root, keys),
);

const normalizeCommaSeparatedText = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }

  const parts = trimmed
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (parts.length === 0) {
    return trimmed;
  }

  return parts.join(', ');
};

const normalizeMasterSaleListText = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }

  if (trimmed.includes(';')) {
    const lines = trimmed
      .split(';')
      .map((item) => normalizeCommaSeparatedText(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (lines.length > 0) {
      return lines.join('\n');
    }
  }

  return normalizeCommaSeparatedText(trimmed);
};

const normalizeSemicolonSeparatedListText = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }

  if (!trimmed.includes(';')) {
    return normalizeCommaSeparatedText(trimmed);
  }

  const parts = trimmed
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (parts.length === 0) {
    return normalizeCommaSeparatedText(trimmed);
  }

  return parts.join(',\n');
};

const normalizeRecordIdentifier = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }
  return trimmed.replace(/^\{+|\}+$/g, '').toLowerCase();
};

const isSameRecordIdentifier = (left: string, right: string): boolean => {
  const normalizedLeft = normalizeRecordIdentifier(left);
  const normalizedRight = normalizeRecordIdentifier(right);
  return normalizedLeft !== '' && normalizedLeft === normalizedRight;
};

const toMasterSaleSource = (raw: string): MasterSaleSource | undefined => {
  const normalized = raw.trim().toLowerCase();
  if (!normalized || normalized === '-') {
    return undefined;
  }

  const compact = normalized.replace(/[^a-z0-9]/g, '');
  if (
    compact.includes('wltt')
    || compact.includes('stampdutylandtax')
    || compact.includes('welshlandtransactiontax')
    || compact === 'wlt'
  ) {
    return 'WLTT';
  }

  if (
    compact.includes('lrppd')
    || compact.includes('landregistrypricepaiddata')
    || compact.includes('landregistry')
    || compact.includes('pricepaid')
  ) {
    return 'LRPPD';
  }

  return undefined;
};

const buildPromotedMasterRecord = (
  source: MasterSaleSource,
  id: string,
  salePrice: string,
  transactionDate: string,
  hpiAdjustedPrice: string,
  ratio: string,
): PromotedMasterRecordViewModel | undefined => {
  const normalizedId = id.trim();
  if (!normalizedId || normalizedId === '-') {
    return undefined;
  }

  return {
    source,
    id: normalizedId,
    salePrice,
    transactionDate,
    hpiAdjustedPrice,
    ratio,
  };
};

const mapSalesParticularReviewStatus = (raw: string): SalesParticularReviewStatus | undefined => {
  const normalized = raw.trim().toLowerCase();
  if (!normalized || normalized === '-') {
    return undefined;
  }

  if (normalized.includes('not reviewed')) {
    return 'not-reviewed';
  }

  if (normalized.includes('not available')) {
    return 'details-not-available';
  }

  if (normalized.includes('details available') || normalized === 'available' || normalized === 'detailsavailable') {
    return 'details-available';
  }

  return undefined;
};

const mapSalesParticularAttributeKey = (raw: string): string => {
  const normalized = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) {
    return '';
  }

  const keyMap: Record<string, string> = {
    kitchenage: 'kitchenAge',
    kitchenspecification: 'kitchenSpecification',
    bathroomage: 'bathroomAge',
    bathroomspecification: 'bathroomSpecification',
    glazing: 'glazing',
    heating: 'heating',
    heatingelements: 'heating',
    heatingelement: 'heating',
    decorativefinishes: 'decorativeFinishes',
  };

  return keyMap[normalized] ?? raw.trim();
};
const SALES_PARTICULAR_COMPONENT_KEYS: SalesParticularAttributeKey[] = [
  'kitchenAge',
  'kitchenSpecification',
  'bathroomAge',
  'bathroomSpecification',
  'glazing',
  'heating',
  'decorativeFinishes',
];

const SALES_PARTICULAR_COMPONENT_WEIGHTS: Record<SalesParticularAttributeKey, number> = {
  kitchenAge: 0.3,
  kitchenSpecification: 0.15,
  bathroomAge: 0.15,
  bathroomSpecification: 0.1,
  glazing: 0.1,
  heating: 0.1,
  decorativeFinishes: 0.1,
};

const SALES_PARTICULAR_COMPONENT_WEIGHT_TOTAL = SALES_PARTICULAR_COMPONENT_KEYS
  .reduce((sum, key) => sum + SALES_PARTICULAR_COMPONENT_WEIGHTS[key], 0);

const SALES_PARTICULAR_COMPONENT_ALIASES: Record<SalesParticularAttributeKey, string[]> = {
  kitchenAge: ['kitchenage'],
  kitchenSpecification: ['kitchenspecification', 'kitchenspec'],
  bathroomAge: ['bathroomage'],
  bathroomSpecification: ['bathroomspecification', 'bathroomspec'],
  glazing: ['glazing'],
  heating: ['heating', 'heatingelements', 'heatingelement'],
  decorativeFinishes: ['decorativefinishes', 'decorativefinish'],
};

const FALLBACK_SALES_PARTICULAR_OPTIONS: SalesParticularOptionsByAttribute = {
  kitchenAge: ['Dated', 'Mid-life', 'Modern', 'New', 'Outdated'],
  kitchenSpecification: ['Basic', 'High', 'Standard'],
  bathroomAge: ['Dated', 'Mid-life', 'Modern', 'New', 'Outdated'],
  bathroomSpecification: ['High', 'Standard'],
  glazing: ['New', 'Double', 'Single'],
  heating: ['Central', 'Dated', 'None'],
  decorativeFinishes: ['Dated', 'Modern', 'Standard'],
};

const createFallbackSalesParticularScoringRow = (
  componentName: string,
  componentKey: SalesParticularAttributeKey,
  conditionCategory: string,
  scoreInComponent: number,
): SalesParticularScoringModelRow => {
  const componentWeight = SALES_PARTICULAR_COMPONENT_WEIGHTS[componentKey];
  return {
    componentName,
    componentKey,
    conditionCategory,
    scoreInComponent,
    componentWeight,
    componentScore: scoreInComponent * componentWeight,
  };
};

const FALLBACK_SALES_PARTICULAR_SCORING_ROWS: SalesParticularScoringModelRow[] = [
  createFallbackSalesParticularScoringRow('KitchenAge', 'kitchenAge', 'Dated', 0.25),
  createFallbackSalesParticularScoringRow('KitchenAge', 'kitchenAge', 'Mid-life', 0.5),
  createFallbackSalesParticularScoringRow('KitchenAge', 'kitchenAge', 'Modern', 0.75),
  createFallbackSalesParticularScoringRow('KitchenAge', 'kitchenAge', 'New', 1),
  createFallbackSalesParticularScoringRow('KitchenAge', 'kitchenAge', 'Outdated', 0),
  createFallbackSalesParticularScoringRow('KitchenSpecification', 'kitchenSpecification', 'Basic', 0),
  createFallbackSalesParticularScoringRow('KitchenSpecification', 'kitchenSpecification', 'High', 1),
  createFallbackSalesParticularScoringRow('KitchenSpecification', 'kitchenSpecification', 'Standard', 0.5),
  createFallbackSalesParticularScoringRow('BathroomAge', 'bathroomAge', 'Dated', 0.25),
  createFallbackSalesParticularScoringRow('BathroomAge', 'bathroomAge', 'Mid-life', 0.5),
  createFallbackSalesParticularScoringRow('BathroomAge', 'bathroomAge', 'Modern', 0.75),
  createFallbackSalesParticularScoringRow('BathroomAge', 'bathroomAge', 'New', 1),
  createFallbackSalesParticularScoringRow('BathroomAge', 'bathroomAge', 'Outdated', 0),
  createFallbackSalesParticularScoringRow('BathroomSpecification', 'bathroomSpecification', 'High', 1),
  createFallbackSalesParticularScoringRow('BathroomSpecification', 'bathroomSpecification', 'Standard', 0),
  createFallbackSalesParticularScoringRow('Glazing', 'glazing', 'New', 1),
  createFallbackSalesParticularScoringRow('Glazing', 'glazing', 'Double', 0.5),
  createFallbackSalesParticularScoringRow('Glazing', 'glazing', 'Single', 0),
  createFallbackSalesParticularScoringRow('HeatingElements', 'heating', 'Central', 1),
  createFallbackSalesParticularScoringRow('HeatingElements', 'heating', 'Dated', 0.5),
  createFallbackSalesParticularScoringRow('HeatingElements', 'heating', 'None', 0),
  createFallbackSalesParticularScoringRow('DecorativeFinishes', 'decorativeFinishes', 'Dated', 0),
  createFallbackSalesParticularScoringRow('DecorativeFinishes', 'decorativeFinishes', 'Modern', 1),
  createFallbackSalesParticularScoringRow('DecorativeFinishes', 'decorativeFinishes', 'Standard', 0.5),
];

const normalizeLookupKey = (raw: string): string => raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const toTextFromUnknown = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = toTextFromUnknown(item);
      if (text) {
        return text;
      }
    }
    return '';
  }

  if (value && typeof value === 'object') {
    const record = value as SaleDetailsRecord;
    return firstNonEmpty(
      toTextFromUnknown(record.Value),
      toTextFromUnknown(record.value),
      toTextFromUnknown(record.Label),
      toTextFromUnknown(record.label),
      toTextFromUnknown(record.Name),
      toTextFromUnknown(record.name),
      toTextFromUnknown(record.Text),
      toTextFromUnknown(record.text),
    );
  }

  return '';
};

const getNormalizedRecordValue = (record: SaleDetailsRecord, candidates: string[]): string => {
  if (candidates.length === 0) {
    return '';
  }

  const normalizedMap = new Map<string, unknown>();
  Object.keys(record).forEach((key) => {
    normalizedMap.set(normalizeLookupKey(key), record[key]);
  });

  for (const candidate of candidates) {
    const direct = toTextFromUnknown(record[candidate]);
    if (direct) {
      return direct;
    }

    const normalizedCandidate = normalizeLookupKey(candidate);
    const normalized = toTextFromUnknown(normalizedMap.get(normalizedCandidate));
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

const ASSIGNED_TO_NAME_KEYS = [
  'assignedToName',
  'assignedToDisplayName',
  'assignedToUserName',
  'caseworkerAssignedToName',
  'caseworkerAssignedToDisplayName',
  'caseworkerAssignedTo',
  'assignedTo',
  'assignedto',
];

const ASSIGNED_TO_ID_KEYS = [
  'assignedToUserId',
  'assignedToId',
  'caseworkerAssignedToUserId',
  'caseworkerAssignedToId',
  'assignedtouserid',
  'assignedtoid',
  'caseworkerassignedtouserid',
  'caseworkerassignedtoid',
];

const QC_ASSIGNED_TO_NAME_KEYS = [
  'qcAssignedToName',
  'qcAssignedToDisplayName',
  'assignedToQcName',
  'assignedToQcDisplayName',
  'assignedToQcUserName',
  'assignedToQc',
  'qcAssignedTo',
  'qcassignedto',
  'assignedtoqc',
];

const QC_ASSIGNED_TO_ID_KEYS = [
  'qcAssignedToUserId',
  'qcAssignedToId',
  'assignedToQcUserId',
  'assignedToQcId',
  'qcassignedtouserid',
  'qcassignedtoid',
  'assignedtoqcuserid',
  'assignedtoqcid',
];

const resolveUserDisplayFromRecord = (
  record: SaleDetailsRecord,
  nameKeys: string[],
  idKeys: string[],
  lookup?: Record<string, string>,
): string => {
  const effectiveLookup = lookup && Object.keys(lookup).length > 0 ? lookup : SAMPLE_USER_LOOKUP;
  for (const key of nameKeys) {
    const raw = getNormalizedRecordValue(record, [key]);
    if (!raw) {
      continue;
    }

    const resolved = resolveUserDisplayName(raw, effectiveLookup).trim();
    if (!resolved) {
      continue;
    }

    if (!isGuidLikeValue(resolved)) {
      return resolved;
    }
  }

  for (const key of idKeys) {
    const raw = getNormalizedRecordValue(record, [key]);
    if (!raw) {
      continue;
    }

    const resolved = resolveUserDisplayName(raw, effectiveLookup).trim();
    if (!resolved || isGuidLikeValue(resolved)) {
      continue;
    }

    return resolved;
  }

  return '';
};

const toDecimal = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isInactiveScoringRecord = (record: SaleDetailsRecord): boolean => {
  const stateRaw = getNormalizedRecordValue(record, ['statecode', 'status', 'statuscode']);
  const normalized = stateRaw.toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized.includes('inactive')) {
    return true;
  }

  return normalized === '1';
};

const resolveScoringComponentKey = (raw: string): SalesParticularAttributeKey | undefined => {
  const normalized = normalizeLookupKey(raw);
  if (!normalized) {
    return undefined;
  }

  for (const key of SALES_PARTICULAR_COMPONENT_KEYS) {
    const aliases = SALES_PARTICULAR_COMPONENT_ALIASES[key];
    if (aliases.some((alias) => alias === normalized)) {
      return key;
    }
  }

  return undefined;
};

const resolveConditionCategory = (record: SaleDetailsRecord): string => {
  const category = getNormalizedRecordValue(record, [
    'conditionCategory',
    'Condition Category',
    'voa_conditioncategory',
    'voa_conditioncat',
    'condition',
    'category',
  ]);
  return toEditableInput(category);
};

const buildSalesParticularScoringRows = (
  details: SaleDetailsRecord,
  salesParticularDetails: SaleDetailsRecord,
): SalesParticularScoringModelRow[] => {
  const candidates: SaleDetailsRecord[] = [
    ...getRecordArrayFromKeys(salesParticularDetails, [
      'conditionScoringModels',
      'conditionScoringModel',
      'scoringModels',
      'scoringModel',
      'svtConditionScoringModels',
      'svtConditionScoringModel',
      'salesParticularConditionScoringModels',
      'salesParticularConditionScoringModel',
    ]),
    ...getRecordArrayFromKeys(details, [
      'conditionScoringModels',
      'conditionScoringModel',
      'svtConditionScoringModels',
      'svtConditionScoringModel',
      'salesParticularConditionScoringModels',
      'salesParticularConditionScoringModel',
      'salesParticularScoringModels',
      'salesParticularScoringModel',
    ]),
  ];

  if (candidates.length === 0) {
    return FALLBACK_SALES_PARTICULAR_SCORING_ROWS;
  }

  const rows: SalesParticularScoringModelRow[] = [];
  const seen = new Set<string>();

  candidates.forEach((record) => {
    if (isInactiveScoringRecord(record)) {
      return;
    }

    const componentName = getNormalizedRecordValue(record, [
      'componentName',
      'Component Name',
      'name',
      'voa_name',
    ]);
    const componentKey = resolveScoringComponentKey(componentName);
    if (!componentKey) {
      return;
    }

    const conditionCategory = resolveConditionCategory(record);
    if (!conditionCategory) {
      return;
    }

    const componentScoreRaw = getNormalizedRecordValue(record, [
      'componentScore',
      'Component Score',
      'voa_componentscore',
      'voa_components',
      'finalScore',
      'weightedScore',
    ]);

    const scoreInComponentRaw = getNormalizedRecordValue(record, [
      'scoreInComponent',
      'Score in Component',
      'voa_scoreincomponent',
      'voa_scoreincom',
      'rawScore',
    ]);

    const componentWeightRaw = getNormalizedRecordValue(record, [
      'componentWeight',
      'Component Weight',
      'voa_componentweight',
      'voa_component',
      'weight',
    ]);

    const directComponentScore = toDecimal(componentScoreRaw);
    const defaultComponentWeight = SALES_PARTICULAR_COMPONENT_WEIGHTS[componentKey];
    const componentWeight = toDecimal(componentWeightRaw) ?? defaultComponentWeight;

    if (!Number.isFinite(componentWeight) || componentWeight <= 0 || SALES_PARTICULAR_COMPONENT_WEIGHT_TOTAL <= 0) {
      return;
    }

    const scoreInComponent = (() => {
      const directCategoryScore = toDecimal(scoreInComponentRaw);
      if (directCategoryScore !== undefined) {
        return directCategoryScore;
      }

      if (directComponentScore !== undefined) {
        return directComponentScore / componentWeight;
      }

      return undefined;
    })();

    if (scoreInComponent === undefined) {
      return;
    }

    const componentScore = directComponentScore ?? (scoreInComponent * componentWeight);
    if (!Number.isFinite(componentScore)) {
      return;
    }

    const dedupeKey = `${componentKey}|${normalizeLookupKey(conditionCategory)}`;
    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);

    rows.push({
      componentName: componentName || componentKey,
      componentKey,
      conditionCategory,
      scoreInComponent,
      componentWeight,
      componentScore,
    });
  });

  return rows.length > 0 ? rows : FALLBACK_SALES_PARTICULAR_SCORING_ROWS;
};

const buildSalesParticularOptions = (
  scoringRows: SalesParticularScoringModelRow[],
): SalesParticularOptionsByAttribute => {
  const options: SalesParticularOptionsByAttribute = {
    kitchenAge: [],
    kitchenSpecification: [],
    bathroomAge: [],
    bathroomSpecification: [],
    glazing: [],
    heating: [],
    decorativeFinishes: [],
  };

  SALES_PARTICULAR_COMPONENT_KEYS.forEach((key) => {
    const orderedFromFallback = FALLBACK_SALES_PARTICULAR_OPTIONS[key];
    const availableByNormalized = new Map<string, string>();

    scoringRows
      .filter((row) => row.componentKey === key)
      .map((row) => toEditableInput(row.conditionCategory))
      .filter((value) => value.length > 0)
      .forEach((value) => {
        const normalized = normalizeLookupKey(value);
        if (!availableByNormalized.has(normalized)) {
          availableByNormalized.set(normalized, value);
        }
      });

    const result: string[] = [];

    orderedFromFallback.forEach((value) => {
      const normalized = normalizeLookupKey(value);
      const resolved = availableByNormalized.get(normalized);
      if (!resolved) {
        return;
      }
      result.push(resolved);
      availableByNormalized.delete(normalized);
    });

    Array.from(availableByNormalized.values())
      .sort((left, right) => left.localeCompare(right, 'en-GB'))
      .forEach((value) => result.push(value));

    options[key] = result.length > 0 ? result : [...orderedFromFallback];
  });

  return options;
};

const normalizeRelativeSharePointUrl = (url: string, siteUrl: string): string => {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (isHttpUrl(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/') && siteUrl) {
    return `${siteUrl.replace(/\/$/, '')}${trimmed}`;
  }

  return trimmed;
};
const UK_AUDIT_DATE_TIME_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

const parseAuditDateTime = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return Number.NaN;
  }

  const ukMatch = UK_AUDIT_DATE_TIME_PATTERN.exec(trimmed);
  if (!ukMatch) {
    const directParsed = Date.parse(trimmed);
    return Number.isNaN(directParsed) ? Number.NaN : directParsed;
  }

  const day = Number(ukMatch[1]);
  const month = Number(ukMatch[2]);
  const year = Number(ukMatch[3]);
  const hours = Number(ukMatch[4] ?? '0');
  const minutes = Number(ukMatch[5] ?? '0');
  const seconds = Number(ukMatch[6] ?? '0');

  const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
    || parsed.getHours() !== hours
    || parsed.getMinutes() !== minutes
    || parsed.getSeconds() !== seconds
  ) {
    return Number.NaN;
  }

  return parsed.getTime();
};

const toUkDateTime = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '-';
  }

  const parsedTime = parseAuditDateTime(trimmed);
  if (Number.isNaN(parsedTime)) {
    return trimmed;
  }

  const parsed = new Date(parsedTime);
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  const seconds = String(parsed.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const normalizeAuditFieldKey = (value: string): string => value
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const AUDIT_FIELD_LABEL_BY_KEY: Record<string, string> = {
  taskstatus: 'Task Status',
  status: 'Task Status',
  assignedto: 'Assigned to',
  caseworkerassignedto: 'Assigned to',
  padconfirmation: 'PAD Confirmation',
  salesource: 'Sale Source',
  source: 'Sale Source',
  wlttid: 'WLTT ID',
  wltid: 'WLTT ID',
  lrppdid: 'LRPPD ID',
  lrpddid: 'LRPPD ID',
  hpiadjustedprice: 'HPI adjusted Price',
  hpiadjustedsaleprice: 'HPI adjusted Price',
  salesparticular: 'Sales Particular',
  salesparticulars: 'Sales Particular',
  linkparticulars: 'Link Particulars',
  kitchenage: 'Kitchen Age',
  kitchenspecification: 'Kitchen Specification',
  bathroomage: 'Bathroom Age',
  bathroomspecification: 'Bathroom Specification',
  glazing: 'Glazing',
  heating: 'Heating',
  decorativefinishes: 'Decorative finishes',
  conditionscore: 'Condition Score',
  conditioncategory: 'Condition Category',
  particularnotes: 'Particular Notes',
  particularsnotes: 'Particular Notes',
  reasonnotes: 'Particular Notes',
  issaleuseful: 'Is this Sale Useful?',
  isthissaleuseful: 'Is this Sale Useful?',
  whynotuseful: 'Why is the sale not useful?',
  whyisthesalenotuseful: 'Why is the sale not useful?',
  additionalnotes: 'Additional Notes',
  assigneddate: 'Assigned Date',
  assignedat: 'Assigned Date',
  caseworkerassigneddate: 'Assigned Date',
  caseworkerassignedon: 'Assigned Date',
  qcassigneddate: 'QC Assigned Date',
  qcassignedat: 'QC Assigned Date',
  qcassignedto: 'QC Assigned to',
  qcremarks: 'QC Remarks',
  outcome: 'Outcome',
  completedat: 'Completed At',
};

const toAuditFieldLabel = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '-';
  }

  const normalized = normalizeAuditFieldKey(trimmed);
  const mapped = AUDIT_FIELD_LABEL_BY_KEY[normalized];
  if (mapped) {
    return mapped;
  }

  return toReadableLabel(trimmed).replace(/\s+/g, ' ').trim();
};
const mapAuditFieldChanges = (record: SaleDetailsRecord): { fieldName: string; oldValue: string; newValue: string }[] => {
  const rawChanges = getRecordArray(record, 'changes');

  const fromChanges = rawChanges.map((change) => ({
    fieldName: formatValue(toAuditFieldLabel(getValue(change, 'fieldName'))),
    oldValue: formatValue(getValue(change, 'oldValue')),
    newValue: formatValue(getValue(change, 'newValue')),
  }));

  if (fromChanges.length > 0) {
    return fromChanges;
  }

  const singleField = formatValue(toAuditFieldLabel(getValue(record, 'fieldName')));
  const singleOldValue = formatValue(getValue(record, 'oldValue'));
  const singleNewValue = formatValue(getValue(record, 'newValue'));

  if (singleField !== '-' || singleOldValue !== '-' || singleNewValue !== '-') {
    return [{
      fieldName: singleField,
      oldValue: singleOldValue,
      newValue: singleNewValue,
    }];
  }

  return [];
};

const mapAuditHistoryModel = (
  payload: SaleDetailsRecord,
  fallbackTaskId: string,
  fallbackRecords: SaleDetailsRecord[],
  lookup?: Record<string, string>,
): AuditHistoryViewModel => {
  const effectiveLookup = lookup && Object.keys(lookup).length > 0 ? lookup : SAMPLE_USER_LOOKUP;
  const taskId = formatValue(firstNonEmpty(getValue(payload, 'taskId'), fallbackTaskId));
  const errorMessage = toEditableInput(firstNonEmpty(getValue(payload, 'errorMessage'), getValue(payload, 'message')));

  const history = (() => {
    const fromPayload = getRecordArrayFromKeys(payload, ['auditHistory', 'history', 'records', 'items']);
    if (fromPayload.length > 0) {
      return fromPayload;
    }
    return fallbackRecords;
  })();

  const entries = history
    .map((record, index) => {
      const changedOnRaw = getValue(record, 'changedOn');
      const parsedChangedOn = parseAuditDateTime(changedOnRaw);

      const changeId = formatValue(firstNonEmpty(getValue(record, 'changeID'), getValue(record, 'changeId'), `${index + 1}`));
      const changedBy = formatValue(resolveUserDisplayName(getValue(record, 'changedBy'), effectiveLookup));
      const changedOn = formatValue(toUkDateTime(changedOnRaw));
      const eventType = formatValue(getValue(record, 'eventType'));
      const changes = mapAuditFieldChanges(record);

      if (changes.length === 0) {
        return undefined;
      }

      return {
        changeId,
        changedBy,
        changedOn,
        eventType,
        changes,
        sortValue: Number.isNaN(parsedChangedOn) ? -(index + 1) : parsedChangedOn,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => right.sortValue - left.sortValue)
    .map(({ sortValue, ...entry }) => entry);

  return {
    taskId,
    entries,
    errorMessage,
  };
};

const resolveAuditPayload = (
  details: SaleDetailsRecord,
  type: 'main' | 'qc',
): { payload: SaleDetailsRecord; historyRecords: SaleDetailsRecord[] } => {
  const auditLogsRecord = getRecord(details, 'auditLogs');
  const namespacedPayload = getRecord(auditLogsRecord, type === 'qc' ? 'qc' : 'sl');

  const directPayload = type === 'qc'
    ? getRecordFromKeys(details, ['qcAuditHistory', 'qualityControlAuditHistory', 'qualityControlHistory'])
    : getRecordFromKeys(details, ['auditHistory', 'salesAuditHistory', 'mainAuditHistory']);

  const payload = Object.keys(namespacedPayload).length > 0
    ? namespacedPayload
    : directPayload;

  const historyRecords = type === 'qc'
    ? getRecordArrayFromKeys(details, ['qcAuditHistory', 'qualityControlAuditHistory'])
    : getRecordArrayFromKeys(details, ['auditHistory', 'salesAuditHistory', 'mainAuditHistory']);

  return {
    payload,
    historyRecords,
  };
};


export const useSaleDetailsViewModel = (
  saleDetailsJson: string,
  sharePointCatalogChunks?: SharePointCatalogChunks,
  fxEnvironmentUrl?: string,
  vmsBaseUrl?: string,
  userLookup?: Record<string, string>,
): SaleDetailsViewModel => {
  const detailsFromPayload = React.useMemo(() => parseSaleDetails(saleDetailsJson), [saleDetailsJson]);

  const details = React.useMemo(() => {
    const task = getRecordFromKeys(detailsFromPayload, ['salesVerificationTaskDetails', 'taskDetails']);
    const banding = getRecordFromKeys(detailsFromPayload, ['propertyAndBandingDetails', 'bandingInfo']);
    const hasData = Object.keys(task).length > 0 || Object.keys(banding).length > 0;
    return hasData ? detailsFromPayload : SAMPLE_SALE_DETAILS;
  }, [detailsFromPayload]);

  const chunkedReferenceImages = React.useMemo(
    () => buildReferenceImagesFromSharePointChunks(sharePointCatalogChunks),
    [sharePointCatalogChunks],
  );

  return React.useMemo(() => {
    const effectiveLookup = userLookup && Object.keys(userLookup).length > 0 ? userLookup : SAMPLE_USER_LOOKUP;
    const salesVerificationTaskDetails = getRecordFromKeys(details, ['salesVerificationTaskDetails', 'taskDetails']);
    const propertyAndBandingDetails = getRecordFromKeys(details, ['propertyAndBandingDetails', 'bandingInfo']);
    const links = getRecord(details, 'links');

    const saleId = formatValue(getNormalizedRecordValue(salesVerificationTaskDetails, ['saleId', 'saleid']));
    const taskId = formatValue(getNormalizedRecordValue(salesVerificationTaskDetails, ['taskId', 'taskid']));

    const statusText = formatValue(getNormalizedRecordValue(salesVerificationTaskDetails, ['taskStatus', 'taskstatus', 'status']));
    const statusTone = toStatusTone(statusText);

    const assignedTo = formatValue(resolveUserDisplayFromRecord(
      salesVerificationTaskDetails,
      ASSIGNED_TO_NAME_KEYS,
      ASSIGNED_TO_ID_KEYS,
      effectiveLookup,
    ));
    const qcAssignedTo = formatValue(resolveUserDisplayFromRecord(
      salesVerificationTaskDetails,
      QC_ASSIGNED_TO_NAME_KEYS,
      QC_ASSIGNED_TO_ID_KEYS,
      effectiveLookup,
    ));
    const normalizeLinkValue = (value: string): string => {
      const trimmed = value.trim();
      return trimmed && trimmed !== '-' ? trimmed : '';
    };

    const configuredVmsBaseUrl = normalizeLinkValue(vmsBaseUrl ?? '');
    const vmsCenterBase = (() => {
      if (!configuredVmsBaseUrl) {
        return EXTERNAL_LINK_URL_PARTS.vmsCenterBase;
      }

      if (configuredVmsBaseUrl.includes('?center=')) {
        return configuredVmsBaseUrl;
      }

      const trimmedBase = configuredVmsBaseUrl.replace(/\/$/, '');
      return `${trimmedBase}/?center=`;
    })();

    const vmsX = normalizeLinkValue(getValue(links, 'vmsX'));
    const vmsY = normalizeLinkValue(getValue(links, 'vmsY'));
    const vmsLegacy = normalizeLinkValue(getValue(links, 'vms'));
    const vmsUrl = isHttpUrl(vmsLegacy)
      ? vmsLegacy
      : (vmsX && vmsY
        ? `${vmsCenterBase}${vmsX},${vmsY}${EXTERNAL_LINK_URL_PARTS.vmsSpatialReferenceSuffix}${EXTERNAL_LINK_URL_PARTS.vmsZoomLevelSuffix}`
        : '');

    const zooplaRaw = normalizeLinkValue(getValue(links, 'zoopla'));
    const rightMoveRaw = normalizeLinkValue(firstNonEmpty(getValue(links, 'rightMove'), getValue(links, 'rightmove')));
    const epcRaw = normalizeLinkValue(getValue(links, 'epc'));

    const externalLinks = [
      {
        key: 'vms',
        title: 'VMS',
        subtitle: 'Valuation Mapping System',
        url: vmsUrl,
        iconName: 'MapLayers',
        disabledReason: EXTERNAL_LINK_DISABLED_REASON,
      },
      {
        key: 'zoopla',
        title: 'Zoopla',
        subtitle: 'External property listing',
        url: isHttpUrl(zooplaRaw) ? zooplaRaw : `${EXTERNAL_LINK_URL_PARTS.zooplaBase}${zooplaRaw}`,
        iconName: 'Home',
        disabledReason: EXTERNAL_LINK_DISABLED_REASON,
      },
      {
        key: 'rightMove',
        title: 'Rightmove',
        subtitle: 'External property listing',
        url: isHttpUrl(rightMoveRaw)
          ? rightMoveRaw
          : `${EXTERNAL_LINK_URL_PARTS.rightmoveBase}${rightMoveRaw}${EXTERNAL_LINK_URL_PARTS.rightmoveSuffix}`,
        iconName: 'HomeSolid',
        disabledReason: EXTERNAL_LINK_DISABLED_REASON,
      },
      {
        key: 'epc',
        title: 'EPC',
        subtitle: 'Energy Performance Certificate',
        url: isHttpUrl(epcRaw) ? epcRaw : `${EXTERNAL_LINK_URL_PARTS.epcBase}${epcRaw}`,
        iconName: 'TextDocument',
        disabledReason: EXTERNAL_LINK_DISABLED_REASON,
      },
    ];

    const address = formatValue(getValue(propertyAndBandingDetails, 'address'));
    const suId = normalizeSuid(firstNonEmpty(
      getValue(propertyAndBandingDetails, 'suId'),
      getValue(propertyAndBandingDetails, 'suid'),
      getValue(propertyAndBandingDetails, 'hereditamentId'),
      getValue(details, 'suId'),
      getValue(details, 'suid'),
      getValue(details, 'hereditamentId'),
    ));
    const addressLink = address !== '-' && suId ? buildHereditamentUrl(fxEnvironmentUrl ?? '', suId) : '';

    const billingAuthorityCode = getValue(propertyAndBandingDetails, 'billingAuthority');
    const billingAuthorityName = getValue(propertyAndBandingDetails, 'billingAuthorityName');
    const billingAuthority = formatValue(
      billingAuthorityName && billingAuthorityCode
        ? `${billingAuthorityName} (${billingAuthorityCode})`
        : (billingAuthorityName || billingAuthorityCode),
    );

    const band = formatValue(getValue(propertyAndBandingDetails, 'band'));
    const bandingEffectiveDate = formatValue(toUkDate(getValue(propertyAndBandingDetails, 'bandingEffectiveDate')));
    const composite = formatValue(getValue(propertyAndBandingDetails, 'composite'));

    const padStatusDisplay = formatValue(getValue(propertyAndBandingDetails, 'padStatus'));
    const padStatusLabel = padStatusDisplay.toLowerCase() === 'committed' ? 'PAD Status: Synced' : `PAD Status: ${padStatusDisplay}`;

    const isActiveRequestPresent = isTrueLike(
      firstNonEmpty(
        getValue(propertyAndBandingDetails, 'activeRequestInVos'),
        getValue(propertyAndBandingDetails, 'isActiveRequestPresent'),
        getValue(details, 'activeRequestInVos'),
        getValue(details, 'isActiveRequestPresent'),
      ),
    );

    const effectiveDate = formatValue(toUkDate(getValue(propertyAndBandingDetails, 'effectiveDate')));
    const effectiveTo = formatValue(toUkDate(getValue(propertyAndBandingDetails, 'effectiveTo')));
    const plotSize = formatValue(getValue(propertyAndBandingDetails, 'plotSize'));

    const padAttributeColorMap = (() => {
      const fromBanding = getRecordFromKeys(propertyAndBandingDetails, ['attributeColors', 'attributeColourCodes', 'propertyAttributeColourCode']);
      return Object.keys(fromBanding).length > 0
        ? fromBanding
        : getRecordFromKeys(details, ['attributeColors', 'attributeColourCodes', 'propertyAttributeColourCode']);
    })();

    const padAttributeTooltipMap = (() => {
      const fromBanding = getRecordFromKeys(propertyAndBandingDetails, ['attributeTooltips', 'padAttributeTooltips', 'propertyAttributeTooltips']);
      return Object.keys(fromBanding).length > 0
        ? fromBanding
        : getRecordFromKeys(details, ['attributeTooltips', 'padAttributeTooltips', 'propertyAttributeTooltips']);
    })();

    const attributeGroups = [
      [
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'dwellingGroup', 'sky'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'dwellingType', 'amber'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'ageCode', 'red'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'dwellingArea', 'violet'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'heating', 'teal'),
      ],
      [
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'mainroomCount', 'purple'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'bedroomCount', 'indigo'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'bathroomCount', 'magenta'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'floorCount', 'slate'),
      ],
      [
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'floorLevel', 'bluegray'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'parkingCode', 'indigo'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'reasonCode', 'slate'),
      ],
      [
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'conservatoryType', 'bluegray'),
        buildPadChip(propertyAndBandingDetails, padAttributeColorMap, padAttributeTooltipMap, 'conservatoryArea', 'bluegray'),
      ],
    ].map((group) => group.filter((chip) => chip.value.trim().length > 0));

    const vscCodes = parseCsvCodes(getValue(propertyAndBandingDetails, 'valueSignificantCodes'));
    const sourceCodes = parseCsvCodes(getValue(propertyAndBandingDetails, 'sourceCodes'));

    const initialPadConfirmationKey = mapPadConfirmationToKey(getValue(propertyAndBandingDetails, 'padConfirmation'));

    const masterSaleRecord = getRecord(details, 'masterSale');
    const repeatSaleInfoRecord = getRecordFromKeys(details, ['repeatsSaleInfo', 'repeatSaleInfo']);

    const masterSale = {
      salePrice: formatValue(toUkCurrency(getValueFromRecordOrRoot(masterSaleRecord, details, ['salePrice', 'masterSalePrice', 'SalePrice']))),
      transactionDate: formatValue(toUkDate(getValueFromRecordOrRoot(masterSaleRecord, details, ['transactionDate', 'masterSaleTransactionDate', 'TransactionDate']))),
      modelValue: formatValue(toUkCurrency(getValueFromRecordOrRoot(masterSaleRecord, details, ['modelValue', 'modelvalue', 'masterSaleModelValue', 'ModelValue']))),
      saleSource: formatValue(normalizeCommaSeparatedText(getValueFromRecordOrRoot(masterSaleRecord, details, ['saleSource', 'masterSaleSource', 'Source']))),
      overallFlag: formatValue(normalizeCommaSeparatedText(getValueFromRecordOrRoot(masterSaleRecord, details, ['overallFlag', 'masterSaleOverallFlag', 'OverallFlag']))),
      ratio: formatValue(getValueFromRecordOrRoot(masterSaleRecord, details, ['ratio', 'masterSaleRatio', 'Ratio'])),
      reviewFlags: formatValue(normalizeMasterSaleListText(getValueFromRecordOrRoot(masterSaleRecord, details, ['reviewFlags', 'masterSaleReviewFlags', 'ReviewFlags']))),
      hpiAdjustedPrice: formatValue(toUkCurrency(getValueFromRecordOrRoot(masterSaleRecord, details, ['hpiAdjustedPrice', 'masterSaleHpiAdjustedPrice', 'HpiAdjustedPrice']))),
      summaryFlags: formatValue(normalizeMasterSaleListText(getValueFromRecordOrRoot(masterSaleRecord, details, ['summaryFlags', 'masterSaleSummaryFlags', 'SummaryFlags']))),
      previousRatioRange: formatValue(getValueFromRecordOrRoot(repeatSaleInfoRecord, details, ['previousRatioRange', 'PreviousRatioRange'])),
      latestRatioRange: formatValue(getValueFromRecordOrRoot(repeatSaleInfoRecord, details, ['latestRatioRange', 'laterRatioRange', 'LatestRatioRange', 'LaterRatioRange'])),
    };

    const wlttRecords = getRecordArray(details, 'welshLandTax').map((record) => ({
      wlttId: formatValue(getValue(record, 'wlttId')),
      transactionPrice: formatValue(toUkCurrency(getValue(record, 'transactionPrice'))),
      transactionPremium: formatValue(toUkCurrency(getValue(record, 'transactionPremium'))),
      transactionDate: formatValue(toUkDate(getValue(record, 'transactionDate'))),
      groundRent: formatValue(toUkCurrency(getValue(record, 'groundRent'))),
      vendors: formatValue(normalizeSemicolonSeparatedListText(getValue(record, 'vendors'))),
      vendees: formatValue(normalizeSemicolonSeparatedListText(getValue(record, 'vendees'))),
      vendorAgents: formatValue(getValue(record, 'vendorAgents')),
      vendeeAgents: formatValue(getValue(record, 'vendeeAgents')),
      typeOfProperty: formatValue(getValue(record, 'typeOfProperty')),
      tenureType: formatValue(getValue(record, 'tenureType')),
      leaseFrom: formatValue(toUkDate(getValue(record, 'leaseFrom'))),
      leaseTerm: formatValue(toUkDate(getValue(record, 'leaseTerm'))),
      hpiAdjustedPrice: formatValue(toUkCurrency(getValue(record, 'hpiAdjustedPrice'))),
      ratio: formatValue(getValue(record, 'ratio')),
    }));

    const lrppdRecords = getRecordArray(details, 'landRegistryData').map((record) => ({
      lrppdId: formatValue(getValue(record, 'lrppdId')),
      address: formatValue(getValue(record, 'address')),
      transactionPrice: formatValue(toUkCurrency(getValue(record, 'transactionPrice'))),
      typeOfProperty: formatValue(getValue(record, 'typeOfProperty')),
      tenureType: formatValue(getValue(record, 'tenureType')),
      pricePaidCategory: formatValue(getValue(record, 'pricePaidCategory')),
      oldNew: formatValue(getValue(record, 'oldNew')),
      transactionDate: formatValue(toUkDate(getValue(record, 'transactionDate'))),
      hpiAdjustedPrice: formatValue(toUkCurrency(getValue(record, 'hpiAdjustedPrice'))),
      ratio: formatValue(getValue(record, 'ratio')),
    }));

    const selectedMasterSource = toMasterSaleSource(firstNonEmpty(
      getValue(salesVerificationTaskDetails, 'salesSource'),
      getValue(salesVerificationTaskDetails, 'saleSource'),
      getValue(masterSaleRecord, 'saleSource'),
      getValue(masterSaleRecord, 'masterSaleSource'),
      getValue(details, 'masterSaleSource'),
    ));

    const selectedWlttId = firstNonEmpty(
      getValue(salesVerificationTaskDetails, 'wltId'),
      getValue(salesVerificationTaskDetails, 'wlttId'),
      getValue(salesVerificationTaskDetails, 'wltid'),
      getValue(salesVerificationTaskDetails, 'wlttid'),
    );

    const selectedLrppdId = firstNonEmpty(
      getValue(salesVerificationTaskDetails, 'lrpddId'),
      getValue(salesVerificationTaskDetails, 'lrppdId'),
      getValue(salesVerificationTaskDetails, 'lrpddid'),
      getValue(salesVerificationTaskDetails, 'lrppdid'),
    );

    const effectiveMasterSource: MasterSaleSource | undefined = selectedMasterSource
      ?? (normalizeRecordIdentifier(selectedWlttId) ? 'WLTT' : undefined)
      ?? (normalizeRecordIdentifier(selectedLrppdId) ? 'LRPPD' : undefined);

    const initialPromotedMasterRecord = (() => {
      if (effectiveMasterSource === 'WLTT') {
        const selectedRecord = (
          wlttRecords.find((record) => isSameRecordIdentifier(record.wlttId, selectedWlttId))
          ?? wlttRecords.find((record) => (
            record.transactionPrice === masterSale.salePrice
            && record.transactionDate === masterSale.transactionDate
          ))
          ?? wlttRecords[0]
        );

        if (!selectedRecord) {
          return undefined;
        }

        return buildPromotedMasterRecord(
          'WLTT',
          selectedRecord.wlttId,
          selectedRecord.transactionPrice,
          selectedRecord.transactionDate,
          selectedRecord.hpiAdjustedPrice,
          selectedRecord.ratio,
        );
      }

      if (effectiveMasterSource === 'LRPPD') {
        const selectedRecord = (
          lrppdRecords.find((record) => isSameRecordIdentifier(record.lrppdId, selectedLrppdId))
          ?? lrppdRecords.find((record) => (
            record.transactionPrice === masterSale.salePrice
            && record.transactionDate === masterSale.transactionDate
          ))
          ?? lrppdRecords[0]
        );

        if (!selectedRecord) {
          return undefined;
        }

        return buildPromotedMasterRecord(
          'LRPPD',
          selectedRecord.lrppdId,
          selectedRecord.transactionPrice,
          selectedRecord.transactionDate,
          selectedRecord.hpiAdjustedPrice,
          selectedRecord.ratio,
        );
      }

      return undefined;
    })();

    const salesParticularDetails = getRecordFromKeys(details, ['salesParticularDetails', 'salesParticularInfo']);
    const salesParticularTooltips = getRecordFromKeys(salesParticularDetails, ['attributeTooltips', 'infoTooltips', 'tooltips']);

    const sharePointSiteUrl = firstNonEmpty(
      getValue(salesParticularDetails, 'sharePointSiteUrl'),
      getValue(details, 'sharePointSiteUrl'),
      getValueFromPath(salesParticularDetails, 'sharePointConfig.siteUrl'),
      getValueFromPath(details, 'sharePointConfig.siteUrl'),
    );

    const referenceCandidates: SaleDetailsRecord[][] = [
      getRecordArrayFromKeys(salesParticularDetails, ['referenceImages', 'salesParticularReferenceImages', 'sharePointReferenceImages']),
      getRecordArrayFromPath(salesParticularDetails, 'sharePointResponse.value'),
      getRecordArrayFromPath(salesParticularDetails, 'sharePointReferenceResponse.value'),
      getRecordArrayFromPath(salesParticularDetails, 'graphResponse.value'),
      getRecordArrayFromPath(salesParticularDetails, 'graph.value'),
      getRecordArrayFromKeys(details, ['salesParticularReferenceImages', 'sharePointReferenceImages']),
      getRecordArrayFromPath(details, 'salesParticularReferenceResponse.value'),
      getRecordArrayFromPath(details, 'sharePointResponse.value'),
      getRecordArrayFromPath(details, 'graphResponse.value'),
      getRecordArrayFromPath(details, 'graph.value'),
    ];

    const rawReferenceImages = referenceCandidates.find((items) => items.length > 0) ?? [];

    const referenceImages = rawReferenceImages
      .map((record, index) => {
        const fields = getRecordFromKeys(record, ['fields', 'FieldValuesAsText', 'fieldValuesAsText']);
        const listItem = getRecordFromKeys(record, ['listItem', 'ListItem']);
        const listItemFields = getRecordFromKeys(listItem, ['fields', 'FieldValuesAsText', 'fieldValuesAsText']);
        const sources = [record, fields, listItem, listItemFields];

        const pick = (...keys: string[]): string => {
          const collected: string[] = [];
          for (const source of sources) {
            for (const key of keys) {
              collected.push(getValue(source, key));
              collected.push(getValueFromPath(source, key));
            }
          }
          return firstNonEmpty(...collected);
        };

        const attributeKeyRaw = pick(
          'attributeKey',
          'attribute',
          'fieldName',
          'attribute_name',
          'AttributeKey',
          'PADAttribute',
          'PadAttribute',
          'salesParticularAttribute',
          'targetAttribute',
        );

        const mappedAttributeKey = mapSalesParticularAttributeKey(attributeKeyRaw) || 'all';

        const category = firstNonEmpty(
          pick('category', 'compareType', 'bucket', 'conditionBand', 'Category', 'Compare', 'With'),
          'Reference',
        );

        const sourceUrl = normalizeRelativeSharePointUrl(
          pick(
            'sourceUrl',
            'fileUrl',
            'url',
            'link',
            'webUrl',
            'EncodedAbsUrl',
            'FileRef',
            'serverRelativeUrl',
            'ServerRelativeUrl',
          ),
          sharePointSiteUrl,
        );

        const thumbnailUrl = firstNonEmpty(
          getValueFromPath(record, 'thumbnails.0.large.url'),
          getValueFromPath(record, 'thumbnails.0.medium.url'),
          getValueFromPath(record, 'thumbnails.0.small.url'),
          getValueFromPath(record, 'thumbnails.large.url'),
          getValueFromPath(record, 'thumbnails.medium.url'),
          getValueFromPath(record, 'thumbnails.small.url'),
        );

        const imageUrl = normalizeRelativeSharePointUrl(
          firstNonEmpty(
            thumbnailUrl,
            pick(
              'imageUrl',
              'thumbnailUrl',
              'previewUrl',
              'smallThumbnailUrl',
              'mediumThumbnailUrl',
              'largeThumbnailUrl',
              '@microsoft.graph.downloadUrl',
              'downloadUrl',
              'picture',
              'Picture',
              'Image',
              'ImageUrl',
              'EncodedAbsUrl',
              'FileRef',
            ),
            sourceUrl,
          ),
          sharePointSiteUrl,
        );

        const title = firstNonEmpty(
          pick('title', 'name', 'Title', 'FileLeafRef', 'fileName', 'FileName'),
          `${toReadableLabel(mappedAttributeKey || 'reference')} ${index + 1}`,
        );

        const id = firstNonEmpty(
          pick('id', 'referenceId', 'UniqueId', 'GUID', 'guid'),
          `${mappedAttributeKey || 'ref'}-${index}`,
        );

        return {
          id,
          attributeKey: mappedAttributeKey,
          category,
          title,
          imageUrl,
          sourceUrl,
        };
      })
      .filter((item) => item.imageUrl || item.sourceUrl);

    const mergedReferenceImages = (() => {
      if (chunkedReferenceImages.length === 0) {
        return referenceImages;
      }

      const seen = new Set<string>();
      return [...referenceImages, ...chunkedReferenceImages].filter((item) => {
        const key = [item.attributeKey, item.category, item.imageUrl, item.sourceUrl, item.title].join('|').toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    })();

    const scoringRows = buildSalesParticularScoringRows(details, salesParticularDetails);
    const optionsByAttribute = buildSalesParticularOptions(scoringRows);

    const salesParticular = {
      reviewStatusKey: mapSalesParticularReviewStatus(getValue(salesParticularDetails, 'salesParticular')),
      linkParticulars: toEditableInput(getValue(salesParticularDetails, 'linkParticulars')),
      kitchenAge: toEditableInput(getValue(salesParticularDetails, 'kitchenAge')),
      kitchenSpecification: toEditableInput(getValue(salesParticularDetails, 'kitchenSpecification')),
      bathroomAge: toEditableInput(getValue(salesParticularDetails, 'bathroomAge')),
      bathroomSpecification: toEditableInput(getValue(salesParticularDetails, 'bathroomSpecification')),
      glazing: toEditableInput(getValue(salesParticularDetails, 'glazing')),
      heating: toEditableInput(getValue(salesParticularDetails, 'heating')),
      decorativeFinishes: toEditableInput(getValue(salesParticularDetails, 'decorativeFinishes')),
      conditionScore: toEditableInput(getValue(salesParticularDetails, 'conditionScore')),
      conditionCategory: toEditableInput(getValue(salesParticularDetails, 'conditionCategory')),
      particularsNotes: toEditableInput(
        firstNonEmpty(
          getValue(salesParticularDetails, 'particularNotes'),
          getValue(salesParticularDetails, 'particularsNotes'),
        ),
      ),
      attributeTooltips: {
        kitchenAge: firstNonEmpty(
          getValue(salesParticularTooltips, 'kitchenAge'),
          getValue(salesParticularDetails, 'kitchenAgeTooltip'),
          'Compare kitchen age using reference images',
        ),
        kitchenSpecification: firstNonEmpty(
          getValue(salesParticularTooltips, 'kitchenSpecification'),
          getValue(salesParticularDetails, 'kitchenSpecificationTooltip'),
          'Compare kitchen specification using reference images',
        ),
        bathroomAge: firstNonEmpty(
          getValue(salesParticularTooltips, 'bathroomAge'),
          getValue(salesParticularDetails, 'bathroomAgeTooltip'),
          'Compare bathroom age using reference images',
        ),
        bathroomSpecification: firstNonEmpty(
          getValue(salesParticularTooltips, 'bathroomSpecification'),
          getValue(salesParticularDetails, 'bathroomSpecificationTooltip'),
          'Compare bathroom specification using reference images',
        ),
        glazing: firstNonEmpty(
          getValue(salesParticularTooltips, 'glazing'),
          getValue(salesParticularDetails, 'glazingTooltip'),
          'Compare glazing using reference images',
        ),
        heating: firstNonEmpty(
          getValue(salesParticularTooltips, 'heating'),
          getValue(salesParticularTooltips, 'heatingElements'),
          getValue(salesParticularDetails, 'heatingTooltip'),
          'Compare heating using reference images',
        ),
        decorativeFinishes: firstNonEmpty(
          getValue(salesParticularTooltips, 'decorativeFinishes'),
          getValue(salesParticularDetails, 'decorativeFinishesTooltip'),
          'Compare decorative finishes using reference images',
        ),
      },
      optionsByAttribute,
      scoringRows,
      referenceImages: mergedReferenceImages,
    };
    const salesVerificationDetails = getRecordFromKeys(details, ['salesVerificationDetails', 'salesVerificationInfo']);
    const qualityControlOutcome = getRecordFromKeys(details, ['qualityControlOutcome', 'qcOutcomeDetails']);

    const salesVerification = {
      isSaleUseful: toEditableInput(getValue(salesVerificationDetails, 'isSaleUseful')),
      whyNotUseful: toEditableInput(getValue(salesVerificationDetails, 'whyNotUseful')),
      additionalNotes: toEditableInput(getValue(salesVerificationDetails, 'additionalNotes')),
      remarks: toEditableInput(getValue(salesVerificationDetails, 'remarks')),
      qcOutcome: toEditableInput(getValue(qualityControlOutcome, 'qcOutcome')),
      qcRemark: toEditableInput(getValue(qualityControlOutcome, 'qcRemark')),
      qcReviewedBy: formatValue(resolveUserDisplayName(getValue(qualityControlOutcome, 'qcReviewedBy'), effectiveLookup)),
    };

    const mainAuditHistorySource = resolveAuditPayload(details, 'main');
    const qcAuditHistorySource = resolveAuditPayload(details, 'qc');

    const mainAuditHistory = mapAuditHistoryModel(mainAuditHistorySource.payload, taskId, mainAuditHistorySource.historyRecords, effectiveLookup);
    const qcAuditHistory = mapAuditHistoryModel(qcAuditHistorySource.payload, taskId, qcAuditHistorySource.historyRecords, effectiveLookup);

    return {
      saleId,
      taskId,
      statusText,
      statusTone,
      assignedTo,
      qcAssignedTo,
      externalLinks,
      address,
      addressLink,
      billingAuthority,
      band,
      bandingEffectiveDate,
      composite,
      padStatusDisplay,
      padStatusLabel,
      isActiveRequestPresent,
      effectiveDate,
      effectiveTo,
      plotSize,
      attributeGroups,
      vscCodes,
      sourceCodes,
      initialPadConfirmationKey,
      masterSale,
      wlttRecords,
      lrppdRecords,
      initialPromotedMasterRecord,
      salesParticular,
      salesVerification,
      mainAuditHistory,
      qcAuditHistory,
    } as SaleDetailsViewModel;
  }, [chunkedReferenceImages, details, fxEnvironmentUrl, userLookup, vmsBaseUrl]);
};













































