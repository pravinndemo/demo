import { ColumnConfig } from '../Component.types';

// Built-in, code-defined column configuration profiles.
// Any JSON provided in `columnConfig` will be merged on top to override.

const SALES_COLUMNS: ColumnConfig[] = [
  { ColName: 'saleid', ColDisplayName: 'Sale ID', ColWidth: 120,    },
  { ColName: 'taskid', ColDisplayName: 'Task ID', ColWidth: 120 },
  { ColName: 'uprn', ColDisplayName: 'UPRN', ColWidth: 120 },
  { ColName: 'address', ColDisplayName: 'Address', ColWidth: 280, ColMultiLine: true, ColCellType: 'link' },
  { ColName: 'postcode', ColDisplayName: 'Postcode', ColWidth: 110 },
  { ColName: 'billingauthority', ColDisplayName: 'Billing Authority', ColWidth: 180 },
  { ColName: 'transactiondate', ColDisplayName: 'Transaction Date', ColWidth: 160 },
  { ColName: 'saleprice', ColDisplayName: 'Sale Price', ColWidth: 140 },
  { ColName: 'ratio', ColDisplayName: 'Ratio', ColWidth: 140 },
  { ColName: 'dwellingtype', ColDisplayName: 'Dwelling Type', ColWidth: 160 },
  { ColName: 'flaggedforreview', ColDisplayName: 'Flagged For Review', ColWidth: 160, ColCellType: 'tag' },
  { ColName: 'reviewflags', ColDisplayName: 'Review Flags', ColWidth: 160, ColCellType: 'tag' },
  { ColName: 'outlierratio', ColDisplayName: 'Outlier Ratio', ColWidth: 140 },
  { ColName: 'overallflag', ColDisplayName: 'Overall Flag', ColWidth: 140, ColCellType: 'tag' },
  { ColName: 'summaryflags', ColDisplayName: 'Summary Flag', ColWidth: 120, ColCellType: 'tag' },
  { ColName: 'taskstatus', ColDisplayName: 'Task Status', ColWidth: 140, ColCellType: 'tag' },
  { ColName: 'assignedto', ColDisplayName: 'Assigned To', ColWidth: 160 },
  { ColName: 'assigneddate', ColDisplayName: 'Assigned Date', ColWidth: 160 },
  { ColName: 'taskcompleteddate', ColDisplayName: 'Task Completed Date', ColWidth: 160 },
  { ColName: 'qcassignedto', ColDisplayName: 'QC Assigned To', ColWidth: 170 },
  { ColName: 'qcassigneddate', ColDisplayName: 'QC Assigned Date', ColWidth: 170 },
  { ColName: 'qccompleteddate', ColDisplayName: 'QC Completed Date', ColWidth: 160 },

];

export const COLUMN_PROFILES: Record<string, ColumnConfig[]> = {
  // Default sales-style grid
  sales: SALES_COLUMNS,
  // Other personas can start by reusing the sales definition
  allsales: [],
  myassignment: [],
  manager: SALES_COLUMNS,
  qa: SALES_COLUMNS,
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
