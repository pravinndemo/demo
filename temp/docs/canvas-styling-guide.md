# SVT PCF Styling Guide (for Canvas)

Source of truth: `DetailsListVOA/css/DetailsListVOA.css` and Fluent UI defaults used by the PCF.

## Typography

Notes:
- No explicit `font-family` is set in the CSS. The PCF inherits the Fluent UI theme font (typically Segoe UI in Dataverse).
- Many headings use Fluent UI `Text` variants (`small`, `mediumPlus`, `large`, `xLarge`). These sizes are defined by the Fluent UI theme, not overridden in CSS.

### Font Family

| Usage | Value |
| --- | --- |
| Global font | Inherited from Fluent UI theme (typically `Segoe UI`) |

### Font Sizes and Weights (explicit in CSS)

| UI Element | CSS Class | Size | Weight | Color |
| --- | --- | --- | --- | --- |
| Tag text | `.status-tag`, `.text-tag` | 12px | bold / 600 | `#212A35` |
| Command bar meta text | `.voa-command-bar__meta` | 12px | 400 | `#5D656E` |
| Prefilter label | `.voa-prefilter-label` | 14px | 600 | `#0B0C0C` |
| Search panel label | `.voa-search-panel .ms-Label` | 14px | 600 | `#0B0C0C` |
| Summary tag | `.voa-summary-tag` | 11px | 600 | `#212A35` |
| Empty state icon | `.voa-empty-state__icon` | 28px | 600 | `#6B6B6B` |
| Empty state title | `.voa-empty-state__title` | from `Text mediumPlus` | 600 | `#212A35` |
| Empty state text | `.voa-empty-state__text` | from `Text small` | 400 | `#5D656E` |
| Page header icon | `.voa-page-header__icon` | 18px | 600 | `#1D70B8` |
| Selection toolbar suffix | `.voa-selection-controls__suffix` | 12px | 400 | `#605E5C` |

### Text Variants (Fluent UI)

These are used in `DetailsListVOA/Grid.tsx` and follow Fluent UI theme sizing:
- `Text variant="small"`: helper/metadata text.
- `Text variant="mediumPlus"`: section titles (e.g., empty state).
- `Text variant="large"`: command bar page title.
- `Text variant="xLarge"`: assignment screen title.

## Color Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Primary | `#1D70B8` | Buttons, focus outline, hover accents, icons |
| Primary dark | `#005A9E` | Link, icon accent |
| Primary light | `#E8F1FB` | Button hover background |
| Text primary | `#0B0C0C` | Headings, labels |
| Text secondary | `#5D656E` | Meta text, helper text |
| Text neutral | `#212A35` | Tags, titles |
| Border light | `#E6E6E6` | Table borders, panel separators |
| Border mid | `#B1B4B6` | Prefilter bar and header borders |
| Surface | `#FFFFFF` | Page background, panels |
| Surface muted | `#F3F2F1` | Prefilter bar, row hover |
| Header surface | `#F7F7F7` | Table header background |
| Warning focus | `#FFBF47` | Focus outline for skip links |

## Layout and Spacing

| Element | Class | Key Styles |
| --- | --- | --- |
| Command bar | `.voa-command-bar` | `padding: 6px 12px; gap: 8px 12px; border-bottom: 1px solid #E6E6E6` |
| Grid toolbar | `.voa-grid-toolbar` | `padding: 8px 12px; gap: 12px;` |
| Prefilter bar | `.voa-prefilter-bar` | `background: #F3F2F1; border-bottom: 1px solid #B1B4B6;` |
| Prefilter inline | `.voa-prefilter-bar--inline` | `background: #FFF; box-shadow: 0 2px 8px rgba(0,0,0,0.12)` |
| Table container | `.voa-grid-results` | `border: 1px solid #E6E6E6; border-left/right: none;` |

## Buttons

| Type | Styles |
| --- | --- |
| Standard button | `height: 32px; border-radius: 4px; font-weight: 600;` |
| Primary (custom) | `background: #FFF; border-color: #1D70B8; color: #1D70B8;` |
| Primary hover | `background: #E8F1FB; border-color: #1D70B8;` |
| Disabled | `background: #F3F2F1; border-color: #C8C8C8; color: #A6A6A6;` |
| Back button | `32x32; border-radius: 50%; border: 1px solid #B1B4B6;` |

## Inputs

| Type | Styles |
| --- | --- |
| ComboBox/Dropdown in prefilter inline | `min-height: 32px; font-size: 13px; padding: 6px 10px;` |
| Date picker width | `min-width: 160px; max-width: 190px;` |
| TextField in selection controls | `min-width: 120px;` |

## Table (DetailsList)

| Element | Styles |
| --- | --- |
| Header | `background: #F7F7F7; font-weight: 600; position: sticky;` |
| Row | `border-bottom: 1px solid #E6E6E6;` |
| Row hover | `background: #F3F2F1; box-shadow: inset 4px 0 0 #1D70B8;` |
| Focus outline | `outline: 2px solid #1D70B8; outline-offset: -2px;` |

## Tags and Chips

| Element | Styles |
| --- | --- |
| Status tag | `12px, bold, border: 1px solid #CAD0D5; padding: 4px 8px 4px 20px;` |
| Summary tag | `11px, uppercase, letter-spacing: 0.3px; border-radius: 999px;` |

## Links

| State | Color |
| --- | --- |
| Default | `#005A9E` |
| Visited | `#3B5B7E` |
| Hover | underline |
| Focus | `outline: 2px solid #FFBF47; outline-offset: 2px;` |

## Canvas Mapping Suggestions

If you want to match the PCF style in Canvas:
- Use Segoe UI (or the default Canvas font).
- Use 14px/600 for field labels.
- Use 12px/400 for helper/meta text.
- Use 18px/600 for main screen titles (matches Fluent UI `large`).
- Use 20px/600 for modal titles (matches Fluent UI `xLarge`).
- Use 32px height and 4px radius for buttons.
- Use `#1D70B8` for primary accents and `#F3F2F1` for panel backgrounds.
