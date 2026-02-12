import { IDropdownOption } from '@fluentui/react';

export const MANAGER_SEARCH_BY_OPTIONS: IDropdownOption[] = [
  { key: 'billingAuthority', text: 'Billing Authority' },
  { key: 'caseworker', text: 'Caseworker' },
];

export const MANAGER_WORKTHAT_BILLING: IDropdownOption[] = [
  { key: 'readyToAllocate', text: 'Is ready to allocate' },
  { key: 'currentlyAssigned', text: 'Is currently assigned' },
  { key: 'hasBeenComplete', text: 'Has been complete' },
  { key: 'awaitingQc', text: 'Is awaiting or undergoing QC' },
];

export const MANAGER_WORKTHAT_CASEWORKER: IDropdownOption[] = [
  { key: 'assignedToSelected', text: 'Is assigned to the selected user(s)' },
  { key: 'completedBySelected', text: 'Has been completed by the selected user(s)' },
  { key: 'assignedAwaitingQc', text: 'Is assigned to the selected user(s) but is awaiting or undergoing QC' },
];

export const CASEWORKER_WORKTHAT_OPTIONS: IDropdownOption[] = [
  { key: 'assignedToSelected', text: 'Is assigned to me' },
  { key: 'completedBySelected', text: 'I have completed' },
  { key: 'assignedAwaitingQc', text: 'Is assigned to me but is awaiting or undergoing QC' },
];

export const QC_SEARCH_BY_OPTIONS: IDropdownOption[] = [
  { key: 'qcUser', text: 'QC User' },
  { key: 'task', text: 'Task' },
  { key: 'caseworker', text: 'Caseworker' },
];

export const QC_WORKTHAT_QCUSER_OPTIONS: IDropdownOption[] = [
  { key: 'qcAssignedToSelected', text: 'Is assigned to the selected user(s)' },
  { key: 'qcCompletedBySelected', text: 'Has been completed by the selected user(s)' },
  { key: 'qcAssignedInProgress', text: 'Is assigned to the selected user(s) but is being progressed by the caseworker' },
];

export const QC_WORKTHAT_SELF_OPTIONS: IDropdownOption[] = [
  { key: 'qcAssignedToSelected', text: 'Is assigned to me' },
  { key: 'qcCompletedBySelected', text: 'I have completed' },
  { key: 'qcAssignedInProgress', text: 'Is assigned to me but is being progressed by the caseworker' },
];

export const QC_WORKTHAT_CASEWORKER_OPTIONS: IDropdownOption[] = [
  { key: 'caseworkerCompletedQcRequested', text: 'Has been complete by the selected caseworker where QC has been requested' },
  { key: 'caseworkerCompleted', text: 'Has been complete by the selected caseworker' },
];

export const QC_WORKTHAT_TASK_OPTIONS: IDropdownOption[] = [
  { key: 'taskCompletedQcRequested', text: 'Has been complete by a caseworker where QC has been requested' },
  { key: 'taskCompleted', text: 'Has been complete by a caseworker' },
];

export const MANAGER_BILLING_AUTHORITY_OPTIONS: IDropdownOption[] = [
  { key: 'Cardiff', text: 'Cardiff' },
  { key: 'Newport', text: 'Newport' },
  { key: 'Bridgend', text: 'Bridgend' },
];

export const MANAGER_CASEWORKER_OPTIONS: IDropdownOption[] = [
  { key: 'Alice Johnson', text: 'Alice Johnson' },
  { key: 'Bob Smith', text: 'Bob Smith' },
  { key: 'Carol Davis', text: 'Carol Davis' },
  { key: 'David Brown', text: 'David Brown' },
  { key: 'Emma Wilson', text: 'Emma Wilson' },
];

export const SCREEN_TEXT = {
  common: {
    buttons: {
      search: 'Search',
      clearAll: 'Clear all',
      clearFilters: 'Clear filters',
      apply: 'Apply',
      clear: 'Clear',
      previous: 'Previous',
      next: 'Next',
      top: 'Top',
      back: 'Back',
    },
    toggles: {
      showFilters: 'Show Filters',
      hideFilters: 'Hide Filters',
      showPrefilter: 'Show Prefilter',
      hidePrefilter: 'Hide Prefilter',
    },
    emptyState: {
      title: "We didn't find anything to show here",
      message: 'Try adjusting your filters or search.',
    },
    selectionControls: {
      toolbarAriaLabel: 'Table actions',
      groupAriaLabel: 'Page selection',
      selectAllText: 'Select all',
      selectFirstLabel: 'Select first',
      selectFirstPlaceholder: 'Number',
      selectFirstSuffix: 'on this page',
      selectFirstButtonText: 'Apply',
      clearSelectionText: 'Clear selection',
      selectFirstHelperText: 'Uses the current page order.',
      selectFirstErrorText: 'Enter a number between 1 and {max}.',
      selectionSummaryText: 'Selected: {selected} of {pageTotal} on this page',
    },
    tableActions: {
      viewSalesRecord: 'View Sales Record',
    },
    columnMenu: {
      sortAscending: 'Sort Ascending',
      sortDescending: 'Sort Descending',
      apply: 'Apply',
      clear: 'Clear',
      optionsLabel: 'Options',
    },
    labels: {
      searchBy: 'Search by',
      options: 'Options',
      min: 'Min',
      max: 'Max',
    },
    filters: {
      numericModes: {
        gte: 'Greater than or equal to',
        lte: 'Less than or equal to',
        between: 'Between',
      },
    },
    aria: {
      back: 'Back',
      resultsTable: 'Results table',
      resultsScrollRegion: 'Results table scroll region',
      skipToResults: 'Skip to results',
      skipToPagination: 'Skip to pagination',
      loadingFilterResults: 'Loading filter results',
      clearSearchFilters: 'Clear search filters',
      clearAllFilters: 'Clear all filters',
      clearColumnFilters: 'Clear column filters',
      viewSelectedSalesRecord: 'View selected sales record',
      pagination: 'Pagination',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      goToTop: 'Go to top',
    },
    messages: {
      columnConfigMissing: 'One or more column configurations reference fields that do not exist in the dataset.',
      metadataApiNotConfigured: 'Metadata API name is not configured.',
      billingAuthoritiesMissing: 'No billing authorities returned.',
      billingAuthoritiesLoadFailed: 'Unable to load Billing Authorities.',
      loadingSaleRecord: 'Loading sale record...',
    },
    hints: {
      postcodePartial: 'Partial postcodes return all matching entries.',
    },
  },
  managerAssignment: {
    title: 'Manager Assignment',
    assignActionText: 'Assign Tasks',
    assignUserListTitle: 'SVT Users',
    errors: {
      assignableUsersApiNotConfigured: 'Assignable users API name is not configured.',
      caseworkersLoadFailed: 'Unable to load caseworkers.',
    },
    prefilter: {
      labels: {
        searchBy: 'Search by',
        billingAuthority: 'Billing Authority',
        caseworker: 'Caseworker',
        workThat: 'Work that',
        completedDateRange: 'Select Completed Date Range',
        fromDate: 'From date',
        toDate: 'To date',
      },
      placeholders: {
        billingAuthority: 'Select Billing Authorities',
        caseworker: 'Select User',
        workThat: 'Select a option',
        completedFrom: 'Select a From date...',
        completedTo: 'Select a To date...',
      },
      buttons: {
        search: 'Search',
        clearSearch: 'Clear search',
      },
      options: {
        searchBy: MANAGER_SEARCH_BY_OPTIONS,
        workThatBilling: MANAGER_WORKTHAT_BILLING,
        workThatCaseworker: MANAGER_WORKTHAT_CASEWORKER,
        billingAuthority: MANAGER_BILLING_AUTHORITY_OPTIONS,
        caseworker: MANAGER_CASEWORKER_OPTIONS,
      },
    },
  },
  qcAssignment: {
    title: 'QC Assignment',
    assignActionText: 'Assign QC Tasks',
    assignUserListTitle: 'QC Users',
    errors: {
      assignableUsersApiNotConfigured: 'Assignable users API name is not configured.',
      caseworkersLoadFailed: 'Unable to load users.',
    },
    prefilter: {
      labels: {
        searchBy: 'Search by',
        qcUser: 'QC User',
        caseworker: 'Caseworker',
        workThat: 'Work that',
        completedDateRange: 'Select Completed Date Range',
        fromDate: 'From date',
        toDate: 'To date',
      },
      placeholders: {
        qcUser: 'Select User',
        caseworker: 'Select User',
        workThat: 'Select a option',
        completedFrom: 'Select a From date...',
        completedTo: 'Select a To date...',
      },
      buttons: {
        search: 'Search',
        clearSearch: 'Clear search',
      },
      options: {
        searchBy: QC_SEARCH_BY_OPTIONS,
        workThatQcUser: QC_WORKTHAT_QCUSER_OPTIONS,
        workThatCaseworker: QC_WORKTHAT_CASEWORKER_OPTIONS,
        workThatTask: QC_WORKTHAT_TASK_OPTIONS,
      },
    },
    emptyState: {
      title: 'No results found',
      message: '',
    },
  },
  caseworkerView: {
    title: 'My Allocated Sales',
    emptyState: {
      title: 'No results found',
      message: '',
    },
  },
  qcView: {
    title: 'Quality Control View',
    emptyState: {
      title: 'No results found',
      message: '',
    },
    prefilter: {
      labels: {
        searchBy: 'Search by',
        qcUser: 'QC User',
        caseworker: 'Caseworker',
        workThat: 'Work that',
        completedDateRange: 'Select Completed Date Range',
        fromDate: 'From date',
        toDate: 'To date',
      },
      placeholders: {
        qcUser: 'Select User',
        caseworker: 'Select User',
        workThat: 'Select a option',
        completedFrom: 'Select a From date...',
        completedTo: 'Select a To date...',
      },
      buttons: {
        search: 'Search',
        clearSearch: 'Clear search',
      },
      options: {
        workThatSelf: QC_WORKTHAT_SELF_OPTIONS,
      },
    },
  },
  salesSearch: {
    title: 'Sales Record Search',
    searchPanel: {
      searchByLabel: 'Search by',
    },
    fields: {
      buildingNameNumber: 'Building Name/Number',
      street: 'Street',
      townCity: 'Town/City',
      postcode: 'Postcode',
      billingAuthority: 'Billing Authority',
      billingAuthorityReference: 'Billing Authority Reference',
      saleId: 'Sale ID',
      taskId: 'Task ID',
      uprn: 'UPRN',
    },
    placeholders: {
      billingAuthority: 'Select Billing Authority',
    },
  },
  assignTasks: {
    title: 'Assign Tasks',
    searchPlaceholder: 'Search user',
    loadingUsersText: 'Loading users...',
    loadingAssignText: 'Assigning tasks',
    loadingText: 'Please wait...',
    messages: {
      selectTasksWarning: 'Please select one or more tasks to assign.',
      apiNotConfigured: 'Task assignment API name is not configured.',
      assignableUsersApiNotConfigured: 'Assignable users API name is not configured.',
      assignableUsersLoadFailed: 'Unable to load assignable users.',
      assignableUsersParseFailed: 'Unable to parse assignable users response.',
      noUsersFound: 'No users found.',
      noValidTaskIds: 'No valid task IDs were selected.',
      assignedSuccess: 'The selected tasks have been assigned successfully.',
      assignedSuccessSingle: 'The task has been assigned successfully.',
      assignedSuccessMultiple: 'The selected tasks have been assigned successfully.',
      assignedSuccessWithUserSingle: 'Assigned 1 task to {user}.',
      assignedSuccessWithUserMultiple: 'Assigned {count} tasks to {user}.',
      alreadyAssigned: 'One or more of the selected tasks has already been assigned. Please refresh the page and try again.',
      assignmentFailed: 'Technical error. Please try again in some time.',
      invalidStatus: 'Assignment is not available for the selected status. Check the task status and try this option again.',
      tooManyTasks: 'Please select {max} tasks or fewer for batch assignment.',
    },
    aria: {
      backToManager: 'Back to manager assignment',
      closeAssign: 'Close assign tasks screen',
    },
  },
};
