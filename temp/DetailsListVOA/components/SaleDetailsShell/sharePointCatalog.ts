import { SalesParticularReferenceImageViewModel, SharePointCatalogChunks } from './types';

type UnknownRecord = Record<string, unknown>;

interface FieldMapping {
  attributeKey: string;
  fieldCandidates: string[];
}

const FIELD_MAPPINGS: FieldMapping[] = [
  {
    attributeKey: 'kitchenAge',
    fieldCandidates: ['age_kitchen', 'ageKitchen', 'kitchen_age', 'kitchenAge'],
  },
  {
    attributeKey: 'kitchenSpecification',
    fieldCandidates: ['spec_kitchen', 'specKitchen', 'kitchen_specification', 'kitchenSpecification'],
  },
  {
    attributeKey: 'bathroomAge',
    fieldCandidates: ['age_bath', 'ageBath', 'bath_age', 'bathAge', 'bathroom_age', 'bathroomAge'],
  },
  {
    attributeKey: 'bathroomSpecification',
    fieldCandidates: ['spec_bath', 'specBath', 'bath_specification', 'bathSpecification', 'bathroom_specification', 'bathroomSpecification'],
  },
  {
    attributeKey: 'decorativeFinishes',
    fieldCandidates: ['decorative_finishes', 'decorativeFinishes'],
  },
];

const SALE_ID_KEYS = ['sale_id', 'saleId', 'saleid', 'recordId', 'record_id'];
const RECORD_ID_KEYS = ['id', 'reference_id', 'referenceId', 'uniqueId', 'UniqueId'];
const TITLE_KEYS = ['title', 'name', 'file_name', 'fileName', 'image_name', 'imageName'];
const IMAGE_URL_KEYS = ['image_url', 'imageUrl', 'thumbnail_url', 'thumbnailUrl', 'preview_url', 'previewUrl'];
const SOURCE_URL_KEYS = ['source_url', 'sourceUrl', 'spImageLink', 'sp_image_link', 'file_url', 'fileUrl', 'url', 'link', 'sourceLink'];

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (isRecord(value)) {
    if ('Value' in value) {
      return toText(value.Value);
    }
    if ('value' in value) {
      return toText(value.value);
    }
  }
  return '';
};

const parseRecord = (payload: string): UnknownRecord => {
  if (!payload) {
    return {};
  }

  try {
    const parsed = JSON.parse(payload) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const parseRecordArray = (payload: string): UnknownRecord[] => {
  if (!payload) {
    return [];
  }

  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isRecord);
  } catch {
    return [];
  }
};

const pickValue = (record: UnknownRecord, candidates: string[]): string => {
  for (const key of candidates) {
    const direct = toText(record[key]);
    if (direct) {
      return direct;
    }

    const alt = Object.keys(record).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (alt) {
      const value = toText(record[alt]);
      if (value) {
        return value;
      }
    }
  }
  return '';
};

const toSafeId = (value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return normalized || 'item';
};

const mergeUniqueReferenceImages = (
  images: SalesParticularReferenceImageViewModel[],
): SalesParticularReferenceImageViewModel[] => {
  const seen = new Set<string>();
  const unique: SalesParticularReferenceImageViewModel[] = [];

  images.forEach((item) => {
    const key = [item.attributeKey, item.category, item.imageUrl, item.sourceUrl, item.title].join('|').toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(item);
  });

  return unique;
};

const buildReferencesFromRows = (rows: UnknownRecord[]): SalesParticularReferenceImageViewModel[] => {
  const references: SalesParticularReferenceImageViewModel[] = [];

  rows.forEach((row, rowIndex) => {
    const saleId = pickValue(row, SALE_ID_KEYS);
    const explicitRecordId = pickValue(row, RECORD_ID_KEYS);
    const title = pickValue(row, TITLE_KEYS) || (saleId ? `Sale ${saleId}` : `Reference ${rowIndex + 1}`);
    const imageUrl = pickValue(row, IMAGE_URL_KEYS);
    const sourceUrl = pickValue(row, SOURCE_URL_KEYS);

    const resolvedImageUrl = imageUrl || sourceUrl;
    const resolvedSourceUrl = sourceUrl || imageUrl;

    if (!resolvedImageUrl && !resolvedSourceUrl) {
      return;
    }

    FIELD_MAPPINGS.forEach((mapping) => {
      const category = pickValue(row, mapping.fieldCandidates);
      if (!category) {
        return;
      }

      const idBase = explicitRecordId || saleId || `row-${rowIndex + 1}`;
      const referenceId = `${toSafeId(idBase)}-${mapping.attributeKey}-${toSafeId(category)}-${rowIndex}`;

      references.push({
        id: referenceId,
        attributeKey: mapping.attributeKey,
        category,
        title,
        imageUrl: resolvedImageUrl,
        sourceUrl: resolvedSourceUrl,
      });
    });
  });

  return mergeUniqueReferenceImages(references);
};

export const buildReferenceImagesFromSharePointChunks = (
  chunks?: SharePointCatalogChunks,
): SalesParticularReferenceImageViewModel[] => {
  if (!chunks) {
    return [];
  }

  // Parse options to validate payload shape; records drive actual references.
  parseRecord(chunks.optionsJson);

  const rows = [
    ...parseRecordArray(chunks.recordsJson1),
    ...parseRecordArray(chunks.recordsJson2),
  ];

  if (rows.length === 0) {
    return [];
  }

  return buildReferencesFromRows(rows);
};



