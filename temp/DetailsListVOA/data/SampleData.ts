export interface SampleColumnDefinition {
    name: string;
    displayName: string;
    width?: number;
    cellType?:string;
}

// Sample records can include numbers and arrays as provided by API-like payloads
export type SampleRecordValue = string | number | boolean | string[] | number[] | null | undefined;
export type SampleRecord = Record<string, SampleRecordValue>;

export const SAMPLE_COLUMNS: SampleColumnDefinition[] = [
    { name: 'saleid', displayName: 'Sale ID', width: 120, cellType:'link' },
    { name: 'taskid', displayName: 'Task ID', width: 120 },
    { name: 'uprn', displayName: 'UPRN', width: 120 },
    { name: 'address', displayName: 'Address', width: 260 },
    { name: 'postcode', displayName: 'Postcode', width: 110 },
    { name: 'billingauthority', displayName: 'Billing Authority', width: 220 },
    { name: 'transactiondate', displayName: 'Transaction Date', width: 160 },
    { name: 'saleprice', displayName: 'Sale Price', width: 120 },
    { name: 'ratio', displayName: 'Ratio', width: 90 },
    { name: 'dwellingtype', displayName: 'Dwelling Type', width: 140 },
    { name: 'flaggedforreview', displayName: 'Flagged for Review', width: 160 },
    { name: 'reviewflags', displayName: 'Review Flags', width: 160 },
    { name: 'outlierratio', displayName: 'Outlier Ratio', width: 130 },
    { name: 'overallflag', displayName: 'Overall Flag', width: 170 },
    { name: 'summaryflags', displayName: 'Summary Flags', width: 160 },
    { name: 'taskstatus', displayName: 'Task Status', width: 140 },
    { name: 'assignedto', displayName: 'Assigned To', width: 140 },
    { name: 'assigneddate', displayName: 'Assigned Date', width: 150 },
    { name: 'taskcompleteddate', displayName: 'Task completed date', width: 160 },
    { name: 'qcassignedto', displayName: 'QC Assigned To', width: 150 },
    { name: 'qcassigneddate', displayName: 'QC Assigned date', width: 170 },
    { name: 'qccompleteddate', displayName: 'QC Completed Date', width: 150 },
];

export const SAMPLE_RECORDS: SampleRecord[] = [
  
];
