import { IColumn } from '@fluentui/react';

export interface IGridColumn extends IColumn {
    isBold?: boolean;
    tagColor?: string;
    tagBorderColor?: string;
    headerPaddingLeft?: number;
    cellType?: string;
    showAsSubTextOf?: string;
    subTextRow?: number;
    childColumns: IGridColumn[];
    isLabelAbove?: boolean;
    paddingLeft?: number;
    paddingTop?: number;
    multiValuesDelimiter?: string;
    firstMultiValueBold?: boolean;
    inlineLabel?: string;
    hideWhenBlank?: boolean;
    ariaTextColumn?: string;
    cellActionDisabledColumn?: string;
    imageWidth?: string;
    imagePadding?: number;
    verticalAligned?: string;
    horizontalAligned?: string;
    sortable?: boolean;
    sortBy?: string;
}

export interface ColumnConfig {
    ColName: string;
    ColDisplayName?: string;
    ColWidth?: number;
    ColSortable?: boolean;
    ColCellType?: string;
    ColIsBold?: boolean;
    ColTagColorColumn?: string;
    ColTagColor?: string;
    ColTagBorderColorColumn?: string;
    ColTagBorderColor?: string;
    ColMultiLine?: boolean;
    ColHorizontalAlign?: string;
    ColVerticalAlign?: string;
    ColResizable?: boolean;
    ColHeaderPaddingLeft?: number;
    ColShowAsSubTextOf?: string;
    ColPaddingTop?: number;
    ColPaddingLeft?: number;
    ColLabelAbove?: boolean;
    ColMultiValueDelimiter?: string;
    ColFirstMultiValueBold?: boolean;
    ColInlineLabel?: string;
    ColHideWhenBlank?: boolean;
    ColSubTextRow?: number;
    ColAriaTextColumn?: string;
    ColCellActionDisabledColumn?: string;
    ColImageWidth?: number;
    ColImagePadding?: number;
    ColRowHeader?: boolean;
    ColSortBy?: string;
}
