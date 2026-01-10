export interface IInputs {
    canvasScreenName: ComponentFramework.PropertyTypes.StringProperty;
    customApiName: ComponentFramework.PropertyTypes.StringProperty;
    customApiType: ComponentFramework.PropertyTypes.StringProperty;
    viewSaleRecordApiName: ComponentFramework.PropertyTypes.StringProperty;
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
}

export interface IOutputs {
    selectedTaskId?: string;
    selectedSaleId?: string;
    saleDetails?: string;
}
