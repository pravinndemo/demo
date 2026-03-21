import { buildReferenceImagesFromSharePointChunks } from '../components/SaleDetailsShell/sharePointCatalog';
import { SharePointCatalogChunks } from '../components/SaleDetailsShell/types';

const makeChunks = (overrides?: Partial<SharePointCatalogChunks>): SharePointCatalogChunks => ({
  optionsJson: '{}',
  recordsJson1: '[]',
  recordsJson2: '[]',
  ...overrides,
});

describe('sharePointCatalog chunk parser', () => {
  test('returns empty list for missing chunks', () => {
    expect(buildReferenceImagesFromSharePointChunks(undefined)).toEqual([]);
  });

  test('maps a row into all five sales particular attributes', () => {
    const records = [
      {
        sale_id: 'S-100',
        age_kitchen: 'Modern',
        spec_kitchen: 'High',
        age_bath: 'Old',
        spec_bath: 'Standard',
        decorative_finishes: 'Premium',
        image_url: 'https://contoso.sharepoint.com/site/image-1.jpg',
      },
    ];

    const parsed = buildReferenceImagesFromSharePointChunks(makeChunks({
      recordsJson1: JSON.stringify(records),
    }));

    const attributes = parsed.map((item) => item.attributeKey);
    expect(attributes).toEqual(expect.arrayContaining([
      'kitchenAge',
      'kitchenSpecification',
      'bathroomAge',
      'bathroomSpecification',
      'decorativeFinishes',
    ]));
    expect(parsed).toHaveLength(5);
  });

  test('combines both record chunks and supports choice object values', () => {
    const records1 = [
      {
        sale_id: 'S-101',
        age_kitchen: { Value: 'New' },
        image_url: 'https://contoso.sharepoint.com/site/image-2.jpg',
      },
    ];

    const records2 = [
      {
        sale_id: 'S-102',
        decorative_finishes: { value: 'Average' },
        source_url: 'https://contoso.sharepoint.com/site/image-3.jpg',
      },
    ];

    const parsed = buildReferenceImagesFromSharePointChunks(makeChunks({
      recordsJson1: JSON.stringify(records1),
      recordsJson2: JSON.stringify(records2),
    }));

    expect(parsed.some((item) => item.category === 'New' && item.attributeKey === 'kitchenAge')).toBe(true);
    expect(parsed.some((item) => item.category === 'Average' && item.attributeKey === 'decorativeFinishes')).toBe(true);
  });

  test('maps spImageLink as source URL', () => {
    const parsed = buildReferenceImagesFromSharePointChunks(makeChunks({
      recordsJson1: JSON.stringify([
        {
          sale_id: 'S-150',
          spec_kitchen: 'standard',
          spImageLink: 'https://sharepoint.example.com/ref-150.jpg',
        },
      ]),
    }));

    expect(parsed).toHaveLength(1);
    expect(parsed[0].attributeKey).toBe('kitchenSpecification');
    expect(parsed[0].sourceUrl).toBe('https://sharepoint.example.com/ref-150.jpg');
    expect(parsed[0].imageUrl).toBe('https://sharepoint.example.com/ref-150.jpg');
  });

  test('deduplicates equivalent references across chunks', () => {
    const duplicateRow = {
      sale_id: 'S-200',
      age_kitchen: 'Modern',
      image_url: 'https://contoso.sharepoint.com/site/image-4.jpg',
    };

    const parsed = buildReferenceImagesFromSharePointChunks(makeChunks({
      recordsJson1: JSON.stringify([duplicateRow]),
      recordsJson2: JSON.stringify([duplicateRow]),
    }));

    expect(parsed).toHaveLength(1);
    expect(parsed[0].attributeKey).toBe('kitchenAge');
  });
});

