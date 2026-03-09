import { ColumnConfig } from '../Component.types';

// Built-in, code-defined column configuration profiles.
// Any JSON provided in `columnConfig` will be merged on top to override.

const SALES_COLUMNS: ColumnConfig[] = [
  // ID columns: center-aligned horizontally (fixed-width identifiers), vertically centered
  { ColName: 'saleid',           ColDisplayName: 'Sale ID',            ColWidth: 120, ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
  { ColName: 'taskid',           ColDisplayName: 'Task ID',            ColWidth: 120, ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
  { ColName: 'uprn',             ColDisplayName: 'UPRN',               ColWidth: 120, ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },

  // Text columns: left-aligned, vertically centered
  { ColName: 'address',          ColDisplayName: 'Address',            ColWidth: 280, ColMultiLine: true, ColCellType: 'link', ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'postcode',         ColDisplayName: 'Postcode',           ColWidth: 110, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'billingauthority', ColDisplayName: 'Billing Authority',  ColWidth: 180, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'dwellingtype',     ColDisplayName: 'Dwelling Type',      ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'assignedto',       ColDisplayName: 'Assigned To',        ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'qcassignedto',     ColDisplayName: 'QC Assigned To',     ColWidth: 170, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },

  // Date columns: left-aligned (consistent format width), vertically centered
  { ColName: 'transactiondate',  ColDisplayName: 'Transaction Date',   ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'assigneddate',     ColDisplayName: 'Assigned Date',      ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'taskcompleteddate',ColDisplayName: 'Task Completed Date',ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'qcassigneddate',   ColDisplayName: 'QC Assigned Date',   ColWidth: 170, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'qccompleteddate',  ColDisplayName: 'QC Completed Date',  ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },

  // Numeric/decimal columns: right-aligned (digit alignment for comparison), vertically centered
  // saleprice uses ColFormat: 'currency' to render with £ prefix and thousands separators
  { ColName: 'saleprice',        ColDisplayName: 'Sale Price',         ColWidth: 140, ColHorizontalAlign: 'right', ColVerticalAlign: 'center', ColFormat: 'currency' },
  { ColName: 'ratio',            ColDisplayName: 'Ratio',              ColWidth: 140, ColHorizontalAlign: 'right', ColVerticalAlign: 'center' },
  { ColName: 'outlierratio',     ColDisplayName: 'Outlier Ratio',      ColWidth: 140, ColHorizontalAlign: 'right', ColVerticalAlign: 'center' },

  // Tag/status columns: center-aligned (visual symmetry for badges), vertically centered
  { ColName: 'flaggedforreview', ColDisplayName: 'Flagged For Review', ColWidth: 160, ColCellType: 'tag', ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
  { ColName: 'reviewflags',      ColDisplayName: 'Review Flags',       ColWidth: 160, ColCellType: 'tag', ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
  { ColName: 'overallflag',      ColDisplayName: 'Overall Flag',       ColWidth: 140, ColCellType: 'tag', ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
  { ColName: 'summaryflags',     ColDisplayName: 'Summary Flag',       ColWidth: 120, ColCellType: 'tag', ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
  { ColName: 'taskstatus',       ColDisplayName: 'Task Status',        ColWidth: 140, ColCellType: 'tag', ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
];

export const COLUMN_PROFILES: Record<string, ColumnConfig[]> = {
  // Default sales-style grid
  sales: SALES_COLUMNS,
  // Other personas can start by reusing the sales definition
  allsales: [],
  myassignment: [],
  manager: SALES_COLUMNS,
  qa: SALES_COLUMNS,
  qaassign: SALES_COLUMNS,
  qaview: SALES_COLUMNS,
};

export function getProfileConfigs(key?: string): ColumnConfig[] {
  const k = (key ?? '').trim().toLowerCase();
  if (!k) return COLUMN_PROFILES.sales ?? [];
  const prof = COLUMN_PROFILES[k];
  if (!prof || prof.length === 0) {
    // Fall back to sales when a known key maps to empty array
    if (k in COLUMN_PROFILES) return COLUMN_PROFILES.sales ?? [];
    return COLUMN_PROFILES.sales ?? [];
  }
  return prof;
}
