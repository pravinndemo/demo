/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    canvasScreenName: ComponentFramework.PropertyTypes.StringProperty;
    tableKey: ComponentFramework.PropertyTypes.StringProperty;
    customApiName: ComponentFramework.PropertyTypes.StringProperty;
    customApiType: ComponentFramework.PropertyTypes.StringProperty;
    metadataApiName: ComponentFramework.PropertyTypes.StringProperty;
    metadataApiType: ComponentFramework.PropertyTypes.StringProperty;
    taskAssignmentApiName: ComponentFramework.PropertyTypes.StringProperty;
    viewSaleRecordApiName: ComponentFramework.PropertyTypes.StringProperty;
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
    actionType?: string;
    actionRequestId?: string;
    selectedTaskIdsJson?: string;
    selectedSaleIdsJson?: string;
    selectedCount?: number;
    backRequestId?: string;
}
