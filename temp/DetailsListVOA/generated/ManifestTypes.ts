export interface IInputs {
    canvasScreenName: ComponentFramework.PropertyTypes.StringProperty;
    tableKey: ComponentFramework.PropertyTypes.StringProperty;
    country: ComponentFramework.PropertyTypes.StringProperty;
    listYear: ComponentFramework.PropertyTypes.StringProperty;
    fxEnvironmentUrl: ComponentFramework.PropertyTypes.StringProperty;
    sharePointOptionsJson: ComponentFramework.PropertyTypes.StringProperty;
    sharePointRecordsJson1: ComponentFramework.PropertyTypes.StringProperty;
    sharePointRecordsJson2: ComponentFramework.PropertyTypes.StringProperty;
    customApiName: ComponentFramework.PropertyTypes.StringProperty;
    customApiType: ComponentFramework.PropertyTypes.StringProperty;
    metadataApiName: ComponentFramework.PropertyTypes.StringProperty;
    metadataApiType: ComponentFramework.PropertyTypes.StringProperty;
    userContextApiName: ComponentFramework.PropertyTypes.StringProperty;
    userContextApiType: ComponentFramework.PropertyTypes.StringProperty;
    taskAssignmentApiName: ComponentFramework.PropertyTypes.StringProperty;
    submitQcRemarksApiName: ComponentFramework.PropertyTypes.StringProperty;
    viewSaleRecordApiName: ComponentFramework.PropertyTypes.StringProperty;
    auditLogsApiName: ComponentFramework.PropertyTypes.StringProperty;
    auditLogsApiType: ComponentFramework.PropertyTypes.StringProperty;
    manualTaskCreationApiName: ComponentFramework.PropertyTypes.StringProperty;
    manualTaskCreationApiType: ComponentFramework.PropertyTypes.StringProperty;
    modifyTaskApiName: ComponentFramework.PropertyTypes.StringProperty;
    modifyTaskApiType: ComponentFramework.PropertyTypes.StringProperty;
    enablePcfViewSalesDetails: ComponentFramework.PropertyTypes.TwoOptionsProperty;
    pageSize: ComponentFramework.PropertyTypes.WholeNumberProperty;
    serverDrivenThreshold: ComponentFramework.PropertyTypes.WholeNumberProperty;
    columnDisplayNames: ComponentFramework.PropertyTypes.StringProperty;
    columnConfig: ComponentFramework.PropertyTypes.StringProperty;
    searchTrigger: ComponentFramework.PropertyTypes.StringProperty;
    allowColumnReorder: ComponentFramework.PropertyTypes.TwoOptionsProperty;
    perfLogsEnabled: ComponentFramework.PropertyTypes.TwoOptionsProperty;
}

export interface IOutputs {
    selectedTaskId?: string;
    selectedSaleId?: string;
    saleDetails?: string;
    viewSalePending?: boolean;
    actionType?: string;
    actionRequestId?: string;
    selectedTaskIdsJson?: string;
    selectedSaleIdsJson?: string;
    selectedCount?: number;
    backRequestId?: string;
}



