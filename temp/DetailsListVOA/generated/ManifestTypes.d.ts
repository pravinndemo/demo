/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    canvasScreenName: ComponentFramework.PropertyTypes.StringProperty;
    customApiName: ComponentFramework.PropertyTypes.StringProperty;
    customApiType: ComponentFramework.PropertyTypes.StringProperty;
    pageSize: ComponentFramework.PropertyTypes.WholeNumberProperty;
    columnDisplayNames: ComponentFramework.PropertyTypes.StringProperty;
    columnConfig: ComponentFramework.PropertyTypes.StringProperty;
    searchBy: ComponentFramework.PropertyTypes.StringProperty;
    billingAuthorities: ComponentFramework.PropertyTypes.StringProperty;
    caseworkers: ComponentFramework.PropertyTypes.StringProperty;
    workThat: ComponentFramework.PropertyTypes.StringProperty;
    fromDate: ComponentFramework.PropertyTypes.StringProperty;
    toDate: ComponentFramework.PropertyTypes.StringProperty;
    searchTrigger: ComponentFramework.PropertyTypes.StringProperty;
    allowColumnReorder: ComponentFramework.PropertyTypes.TwoOptionsProperty;
    perfLogsEnabled: ComponentFramework.PropertyTypes.TwoOptionsProperty;
}
export interface IOutputs {
    selectedTaskId?: string;
    selectedSaleId?: string;
    saleDetails?: string;
    selectedTaskIdsJson?: string;
    selectedSaleIdsJson?: string;
}
