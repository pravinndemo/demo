import { ColumnConfig } from '../Component.types';

// Built-in, code-defined column configuration profiles.
// Any JSON provided in `columnConfig` will be merged on top to override.

const SALES_COLUMNS: ColumnConfig[] = [
  // Identifiers are left-aligned because users scan and copy them like labels, not quantities.
  { ColName: 'saleid',           ColDisplayName: 'Sale ID',            ColWidth: 140, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'taskid',           ColDisplayName: 'Task ID',            ColWidth: 140, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'uprn',             ColDisplayName: 'UPRN',               ColWidth: 120, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  // Text columns: left-aligned, vertically centered
  { ColName: 'address',          ColDisplayName: 'Address',            ColWidth: 280, ColMultiLine: true, ColCellType: 'link', ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'postcode',         ColDisplayName: 'Postcode',           ColWidth: 110, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'billingauthority', ColDisplayName: 'Billing Authority',  ColWidth: 180, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  // Date columns: left-aligned (consistent format width), vertically centered
  { ColName: 'transactiondate',  ColDisplayName: 'Transaction Date',   ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center', ColFormat: 'date' },
  // Numeric/decimal columns: right-aligned (digit alignment for comparison), vertically centered
  // saleprice uses ColFormat: 'currency' to render with GBP prefix and thousands separators
  { ColName: 'saleprice',        ColDisplayName: 'Sale Price',         ColWidth: 136, ColHorizontalAlign: 'right', ColVerticalAlign: 'center', ColFormat: 'currency' },
  { ColName: 'ratio',            ColDisplayName: 'Ratio',              ColWidth: 120, ColHorizontalAlign: 'right', ColVerticalAlign: 'center' },
    // Text columns: left-aligned, vertically centered
    { ColName: 'dwellingtype',     ColDisplayName: 'Dwelling Type',      ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
   // Tag/status columns: center-aligned (visual symmetry for badges), vertically centered
  { ColName: 'flaggedforreview', ColDisplayName: 'Flagged For Review', ColWidth: 160, ColCellType: 'tag', ColHorizontalAlign: 'center', ColVerticalAlign: 'center' },
  { ColName: 'reviewflags',      ColDisplayName: 'Review Flags',       ColWidth: 220, ColCellType: 'tag', ColMultiLine: true, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'outlierratio',     ColDisplayName: 'Outlier Ratio',      ColWidth: 150, ColHorizontalAlign: 'right', ColVerticalAlign: 'center' },
   { ColName: 'overallflag',      ColDisplayName: 'Overall Flag',       ColWidth: 220, ColCellType: 'tag', ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
   { ColName: 'summaryflags',     ColDisplayName: 'Summary Flag',       ColWidth: 170, ColCellType: 'tag', ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'taskstatus',       ColDisplayName: 'Task Status',        ColWidth: 190, ColCellType: 'tag', ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'assignedto',       ColDisplayName: 'Assigned To',        ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
   { ColName: 'assigneddate',     ColDisplayName: 'Assigned Date',      ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center', ColFormat: 'date' },
  { ColName: 'taskcompleteddate',ColDisplayName: 'Task Completed Date',ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center', ColFormat: 'date' },
  { ColName: 'qcassignedto',     ColDisplayName: 'QC Assigned To',     ColWidth: 170, ColHorizontalAlign: 'left', ColVerticalAlign: 'center' },
  { ColName: 'qcassigneddate',   ColDisplayName: 'QC Assigned Date',   ColWidth: 170, ColHorizontalAlign: 'left', ColVerticalAlign: 'center', ColFormat: 'date' },
  { ColName: 'qccompleteddate',  ColDisplayName: 'QC Completed Date',  ColWidth: 160, ColHorizontalAlign: 'left', ColVerticalAlign: 'center', ColFormat: 'date' }, 
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

