# SharePoint Chunked Catalog Setup (`optionsJson + recordsJson1 + recordsJson2`)

Date: 2026-03-20

## 1) Goal
Pass SharePoint reference data (200-300 rows) from Canvas to PCF without using one oversized input string.

This implementation uses three PCF text inputs:
- `sharePointOptionsJson`
- `sharePointRecordsJson1`
- `sharePointRecordsJson2`

PCF merges the two record chunks and maps rows into Sales Particular reference images.

## 2) Contract

### 2.1 `sharePointOptionsJson` (object)
```json
{
  "age_kitchen": ["Old", "Modern"],
  "spec_kitchen": ["Basic", "High"],
  "age_bath": ["Old", "New"],
  "spec_bath": ["Standard", "Premium"],
  "decorative_finishes": ["Average", "Premium"]
}
```

### 2.2 `sharePointRecordsJson1` and `sharePointRecordsJson2` (arrays)
```json
[
  {
    "sale_id": "S-100",
    "age_kitchen": "Modern",
    "spec_kitchen": "High",
    "age_bath": "Old",
    "spec_bath": "Standard",
    "decorative_finishes": "Premium",
    "image_url": "https://tenant.sharepoint.com/...",
    "source_url": "https://tenant.sharepoint.com/..."
  }
]
```

Notes:
- `source_url` is optional.
- PCF accepts values as text or choice objects with `.Value`.
- Field names are expected as above (snake_case).

## 3) PCF Changes Already Implemented

- Manifest inputs added in `DetailsListVOA/ControlManifest.Input.xml`:
  - `sharePointOptionsJson`
  - `sharePointRecordsJson1`
  - `sharePointRecordsJson2`
- Runtime reads chunk inputs and passes them to Sale Details shell.
- Sale Details parser merges chunks and converts rows into reference images for:
  - `kitchenAge`
  - `kitchenSpecification`
  - `bathroomAge`
  - `bathroomSpecification`
  - `decorativeFinishes`

## 4) Canvas Implementation Steps

### Step 1: Load SharePoint rows (once)
Use `ShowColumns` to limit payload to required fields.

```powerfx
ClearCollect(
    colSvtRaw,
    ShowColumns(
        SVT_SharePoint_List,
        "sale_id",
        "age_kitchen",
        "spec_kitchen",
        "age_bath",
        "spec_bath",
        "decorative_finishes",
        "image_url",
        "source_url"
    )
);
```

### Step 2: Flatten choice/object fields to text

```powerfx
ClearCollect(
    colSvtCatalog,
    ForAll(
        colSvtRaw,
        {
            sale_id: Text(sale_id),
            age_kitchen: Coalesce(age_kitchen.Value, Text(age_kitchen), ""),
            spec_kitchen: Coalesce(spec_kitchen.Value, Text(spec_kitchen), ""),
            age_bath: Coalesce(age_bath.Value, Text(age_bath), ""),
            spec_bath: Coalesce(spec_bath.Value, Text(spec_bath), ""),
            decorative_finishes: Coalesce(decorative_finishes.Value, Text(decorative_finishes), ""),
            image_url: Coalesce(image_url, ""),
            source_url: Coalesce(source_url, "")
        }
    )
);
```

### Step 3: Build options JSON

```powerfx
Set(
    varOptionsJson,
    JSON(
        {
            age_kitchen: ForAll(Choices(SVT_SharePoint_List.age_kitchen), Value),
            spec_kitchen: ForAll(Choices(SVT_SharePoint_List.spec_kitchen), Value),
            age_bath: ForAll(Choices(SVT_SharePoint_List.age_bath), Value),
            spec_bath: ForAll(Choices(SVT_SharePoint_List.spec_bath), Value),
            decorative_finishes: ForAll(Choices(SVT_SharePoint_List.decorative_finishes), Value)
        },
        JSONFormat.Compact
    )
);
```

### Step 4: Split records into two chunks
Use a deterministic split point (150 recommended for 200-300 rows).

```powerfx
Set(varSplitIndex, 150);

Set(
    varRecordsJson1,
    JSON(
        FirstN(colSvtCatalog, varSplitIndex),
        JSONFormat.Compact
    )
);

Set(
    varRecordsJson2,
    JSON(
        LastN(
            colSvtCatalog,
            Max(CountRows(colSvtCatalog) - varSplitIndex, 0)
        ),
        JSONFormat.Compact
    )
);
```

### Step 5: Optional size diagnostics

```powerfx
Set(varLenOptions, Len(varOptionsJson));
Set(varLenRecords1, Len(varRecordsJson1));
Set(varLenRecords2, Len(varRecordsJson2));
Set(varLenTotal, varLenOptions + varLenRecords1 + varLenRecords2);
```

### Step 6: Bind Canvas vars to PCF inputs
In PCF control properties:
- `sharePointOptionsJson` -> `varOptionsJson`
- `sharePointRecordsJson1` -> `varRecordsJson1`
- `sharePointRecordsJson2` -> `varRecordsJson2`

## 5) UX/Behavior in PCF
- Existing reference images from API payload are still supported.
- Chunked SharePoint references are merged with existing references.
- Duplicates are removed by `(attributeKey + category + image/source URL + title)`.
- If chunks are blank/invalid JSON, PCF safely ignores them.

## 6) Validation Checklist
1. Confirm `Len(...)` for each chunk is populated and non-empty.
2. Open a sale record and click info icon on:
   - Kitchen Age
   - Kitchen Specification
   - Bathroom Age
   - Bathroom Specification
   - Decorative Finishes
3. Verify modal categories and images appear.
4. Verify no duplicate cards for identical rows in both chunks.
5. Verify app still works when one chunk is empty.

## 7) Why Row Chunking (not field grouping)
Do not split payload by `kitchen/bath/decorative` into separate full datasets.
That duplicates `sale_id + image_url` multiple times and increases total size.

Row chunking keeps each record once and is more size-efficient.
