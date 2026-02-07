export const CONTROL_CONFIG = {
  apiBaseUrl: '',
  customApiName: 'voa_GetAllSalesRecord',
  customApiType: 'function',
  metadataApiName: 'voa_SvtGetSalesMetadata',
  metadataApiType: 'function',
  viewSaleRecordApiName: 'voa_GetViewSaleRecordById',
  tableKey: 'sales',
  serverDrivenThreshold: 2000,
  taskAssignmentApiName: 'voa_SvtTaskAssignment',
  assignableUsersApiName: 'voa_SvtGetAssignableUsers',
  assignableUsersApiType: 'function',
  taskAssignment: {
    maxBatchSize: 500,
    allowedStatusesManager: [
      'New',
      'Assigned',
      'Assigned QC failed',
      'QC requested',
    ],
    allowedStatusesQc: [
      'QC requested',
      'Assigned QC failed',
      'Assigned To QC',
      'Reassigned To QC',
    ],
    // Fallback for non-assignment screens if needed.
    allowedStatuses: [],
  },
};
