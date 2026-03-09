# Column Text Alignment Rules

This document describes the usability rules governing horizontal and vertical text alignment
for all grid columns in the SVT Details List control, explains the rationale behind each rule,
and maps every column in the current `SALES_COLUMNS` profile to its expected alignment.

Applies to all grid screens that share the `SALES_COLUMNS` profile:
- Sales Record Search (SRS)
- Manager Assignment (MA)
- QA Assignment (QCA)
- QA View (QCV)
- Caseworker View (CWV)

---

## Alignment Rules

### Rule 1 — Vertical alignment: always `center`

Every cell in every row must be vertically middle-aligned regardless of column type.

**Why:** When rows have variable-height content (multi-line address, multiple tags) the neighbouring
cells appear anchored to the top, making the row look broken. Centering all cells vertically creates
a balanced, professional row regardless of content height.

**Implementation:** `ColVerticalAlign: 'center'` on every `ColumnConfig` entry.
In `GridCell.tsx` this maps to `alignItems: 'center'` on the flex container.

---

### Rule 2 — Text / string columns: `left` horizontal

Plain text, names, descriptions, and hyperlinks are left-aligned.

**Why:** Text is read left-to-right. Left alignment gives a consistent ragged-right edge that is
easier to scan down a column than centered text, which produces a different start position on
every row.

**Applies to:** address, postcode, billingauthority, dwellingtype, assignedto, qcassignedto

---

### Rule 3 — Date columns: `left` horizontal

Date and datetime values are left-aligned.

**Why:** Dates are fixed-format strings (e.g. `dd/MM/yyyy`). Because all values have the same
character width, left-alignment provides the same visual result as center-alignment while staying
consistent with the text-column rule above. This avoids a visual mismatch when date columns sit
adjacent to text columns.

**Applies to:** transactiondate, assigneddate, taskcompleteddate, qcassigneddate, qccompleteddate

---

### Rule 4 — Numeric / currency / decimal columns: `right` horizontal

Numbers, prices, and ratios are right-aligned.

**Why:** Right-aligning numeric values keeps decimal points and units (£, %, etc.) in the same
horizontal position across rows, making order-of-magnitude differences immediately visible when
scanning down the column — the standard convention in financial and data tables.

**Applies to:** saleprice, ratio, outlierratio

---

### Rule 5 — ID / reference columns: `center` horizontal

Fixed-width identifier strings (Sale ID, Task ID, UPRN) are center-aligned.

**Why:** IDs are not read as prose and are not compared numerically. Centering them treats the
column as a badge/reference cell rather than a text field, making it visually distinct and easier
to locate at a glance. All three IDs have a consistent prefix-plus-digits format.

**Applies to:** saleid, taskid, uprn

---

### Rule 6 — Tag / status / badge columns: `center` horizontal

Pill-shaped tag cells are center-aligned.

**Why:** Tags are visual elements (colored badges with rounded corners) rather than textual
content. Centering them within the column cell provides visual symmetry and prevents the badges
from appearing left-stranded in a wide column.

**Applies to:** flaggedforreview, reviewflags, overallflag, summaryflags, taskstatus

---

### Rule 7 — Column headers match their data alignment

Column header text must use the same horizontal alignment as the data cells beneath it.

**Why:** A header that is left-aligned above right-aligned numbers makes the column feel
inconsistent. Fluent UI's `DetailsList` picks up the `textAlign` of the header cell from the
`IColumn` definition; our `GridCell` flex container handles data cells — both are driven by the
same `ColHorizontalAlign` value, so they stay in sync automatically.

---

## Column Alignment Reference

### Current `SALES_COLUMNS` profile

| Column | Display Name | Data Type | H-Align | V-Align | Format | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| `saleid` | Sale ID | ID / Reference | `center` | `center` | — | 5, 1 |
| `taskid` | Task ID | ID / Reference | `center` | `center` | — | 5, 1 |
| `uprn` | UPRN | ID / Reference | `center` | `center` | — | 5, 1 |
| `address` | Address | Text (link, multiline) | `left` | `center` | — | 2, 1 |
| `postcode` | Postcode | Text | `left` | `center` | — | 2, 1 |
| `billingauthority` | Billing Authority | Text | `left` | `center` | — | 2, 1 |
| `transactiondate` | Transaction Date | Date | `left` | `center` | — | 3, 1 |
| `saleprice` | Sale Price | Currency | `right` | `center` | `currency` (£) | 4, 1 |
| `ratio` | Ratio | Decimal / Numeric | `right` | `center` | — | 4, 1 |
| `dwellingtype` | Dwelling Type | Text | `left` | `center` | — | 2, 1 |
| `flaggedforreview` | Flagged For Review | Tag | `center` | `center` | — | 6, 1 |
| `reviewflags` | Review Flags | Tag | `center` | `center` | — | 6, 1 |
| `outlierratio` | Outlier Ratio | Decimal / Numeric | `right` | `center` | — | 4, 1 |
| `overallflag` | Overall Flag | Tag | `center` | `center` | — | 6, 1 |
| `summaryflags` | Summary Flag | Tag | `center` | `center` | — | 6, 1 |
| `taskstatus` | Task Status | Tag | `center` | `center` | — | 6, 1 |
| `assignedto` | Assigned To | Text | `left` | `center` | — | 2, 1 |
| `assigneddate` | Assigned Date | Date | `left` | `center` | — | 3, 1 |
| `taskcompleteddate` | Task Completed Date | Date | `left` | `center` | — | 3, 1 |
| `qcassignedto` | QC Assigned To | Text | `left` | `center` | — | 2, 1 |
| `qcassigneddate` | QC Assigned Date | Date | `left` | `center` | — | 3, 1 |
| `qccompleteddate` | QC Completed Date | Date | `left` | `center` | — | 3, 1 |

---

## How Alignment is Applied

Alignment flows through three layers:

```
ColumnProfiles.ts          Grid.tsx                    GridCell.tsx
─────────────────          ────────────────────        ──────────────────────────────
ColHorizontalAlign   →     col.horizontalAligned   →   justifyContent (flex)
ColVerticalAlign     →     col.verticalAligned     →   alignItems     (flex)
```

1. **`ColumnProfiles.ts`** — the source of truth. Each `ColumnConfig` entry declares
   `ColHorizontalAlign` and `ColVerticalAlign`.

2. **`Grid.tsx`** (line ~547) — maps `cfg.ColHorizontalAlign` → `IGridColumn.horizontalAligned`
   and `cfg.ColVerticalAlign` → `IGridColumn.verticalAligned`.

3. **`GridCell.tsx`** (lines 47–61) — reads `column.horizontalAligned` and
   `column.verticalAligned`, passes them through `MAP_CSS_ALIGN`, and applies them as
   `justifyContent` and `alignItems` on the cell's flex container.

The `MAP_CSS_ALIGN` dictionary in `GridCell.tsx` translates human-readable names:

| Input value | CSS output |
| --- | --- |
| `left` | `start` |
| `right` | `end` |
| `center` | `center` |
| `top` | `start` |
| `bottom` | `end` |

---

## Cell Value Formatting (`ColFormat`)

Beyond alignment, cells can apply display formatting to their raw API values via `ColFormat`.

### Supported formats

| `ColFormat` value | Behaviour | Example input | Example output |
| --- | --- | --- | --- |
| `currency` | Prefixes with `£`, adds en-GB thousands separators. Omits pence for whole numbers; shows 2 d.p. for fractional values. | `250000` | `£250,000` |
| `currency` | Fractional | `250000.50` | `£250,000.50` |
| *(not set)* | Value rendered as-is from the API | `1.25` | `1.25` |

**Note:** `ratio` and `outlierratio` intentionally do **not** use `currency` format — they are dimensionless decimal ratios, not monetary values.

`ColFormat` flows through the same pipeline as alignment:

```
ColumnProfiles.ts    Grid.tsx               GridCell.tsx
─────────────────    ────────────────────   ─────────────────────────────────────
ColFormat      →     col.format         →   applyFormat(value, column.format)
                                            called inside getCellContent()
```

The `applyFormat` function in `GridCell.tsx` strips any existing `£` or commas before parsing,
so values that arrive pre-formatted from the API are handled safely.

### Runtime override

To change the format for a specific screen via the `columnConfig` PCF property:

```json
[
  { "ColName": "saleprice", "ColFormat": "" }
]
```

Setting `ColFormat` to an empty string disables formatting and shows the raw value.

---

## Overriding Alignment at Runtime

The `columnConfig` PCF property accepts a JSON array that is merged on top of the profile.
Any column entry can override alignment without changing the source profile:

```json
[
  { "ColName": "saleprice", "ColHorizontalAlign": "center" }
]
```

This is useful for canvas app configurations that need a different visual treatment for a
specific screen without changing the shared profile used by all other screens.

---

## Adding a New Column

When adding a column to any profile, choose alignment by answering the following:

| Question | Yes → | No → |
| --- | --- | --- |
| Is the value a colored badge / pill? | `center` (Rule 6) | next question |
| Is the value a numeric amount or ratio? | `right` (Rule 4) | next question |
| Is the value a fixed-format ID or reference? | `center` (Rule 5) | next question |
| Is the value a date or datetime? | `left` (Rule 3) | `left` (Rule 2) |

Always add `ColVerticalAlign: 'center'` (Rule 1) regardless of the horizontal choice.

---

## Tests

Column alignment rules are enforced by automated tests in
`DetailsListVOA/tests/column-alignment.test.ts`.

Run them with:

```bash
npx jest tests/column-alignment --no-coverage
```

The suite checks:
- Every column in `SALES_COLUMNS` has `ColVerticalAlign = "center"`
- Each column type has the correct `ColHorizontalAlign`
- No column is missing either alignment property
- Profile delegation (`manager`, `qa`, `qaassign`, `qaview`) resolves to the SALES column set
- All alignment values are within the allowed vocabulary (`left`, `center`, `right`)
