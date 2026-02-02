import { DefaultButton, FontIcon, IColumn, IconButton, Image, IRawStyle, Link, mergeStyles } from '@fluentui/react';
import * as React from 'react';
import { IGridColumn } from '../Component.types';
import { DatasetArray } from '../utils/DatasetArrayItem';
import { ClassNames, FontStyles } from './Grid.styles';
import { CellTypes } from '../config/ManifestConstants';

const CSS_IMPORTANT = ' !important';

const MAP_CSS_ALIGN: Record<string, string> = {
    top: 'start',
    left: 'start',
    bottom: 'end',
    right: 'end',
    center: 'center',
};
export interface GridCellProps {
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>;
    index?: number;
    column?: IColumn;
    expanded?: boolean;
    onCellAction: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, column?: IColumn) => void;
}

export const GridCell = React.memo((props: GridCellProps) => {
    const { column: col, item, onCellAction, expanded } = props;
    const column = col as IGridColumn;

    const cellNavigation = React.useCallback(() => {
        onCellAction(item as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, column);
    }, [onCellAction, item, column]);

    let cellContent = <></>;
    const childCellRows: Record<string, IGridColumn[]> = {};

    // Add root cell content
    const childColumns = column.childColumns ?? [];
    const columns = [column, ...(expanded !== false ? childColumns : [])];
    if (columns && columns.length > 0) {
        // Group by the row by the Sub Text Row Number
        columns.forEach((c, i) => {
            const row = c.subTextRow?.toString() ?? i;
            childCellRows[row] = childCellRows[row] ?? [];
            childCellRows[row].push(c);
        });

        const verticalAlign: string | undefined = column.verticalAligned
            ? MAP_CSS_ALIGN[column.verticalAligned?.toLowerCase()]
            : undefined;

        const horizontalAlign: string | undefined = column.horizontalAligned
            ? MAP_CSS_ALIGN[column.horizontalAligned?.toLowerCase()]
            : undefined;

        const containerStyle = {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            height: verticalAlign === 'end' || verticalAlign === 'center' ? '100%' : undefined,
            justifyContent: horizontalAlign,
            alignItems: verticalAlign,
        } as IRawStyle;

        const groupedRowKeys = Object.keys(childCellRows);
        // Adding in the child cells/rows to the flex grid. A break div is used for each new row
        cellContent = (
            <div className={mergeStyles(containerStyle)}>
                {groupedRowKeys.map((key, i) => {
                    const moreRows = i < groupedRowKeys.length - 1;
                    const cellCols = childCellRows[key];
                    return (
                        <React.Fragment key={'childCellRow-' + key.toString()}>
                            {cellCols.map((c, colIndex) => {
                                const { cellContents, isBlank } = getCellTemplate(c, item, cellNavigation);
                                const moreCols = colIndex < cellCols.length - 1;
                                return wrapContent(cellContents, c, isBlank, moreCols);
                            })}
                            {moreRows && <span className={ClassNames.subTextRowBreak}></span>}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }
    return cellContent;
});

GridCell.displayName = 'GridCell';

function getCellTemplate(
    columnEx: IGridColumn,
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
    cellNavigation: () => void,
) {
    let cellContents = <></>;
    let isBlank = false;
    const fieldName = columnEx.fieldName?.toLowerCase();
    const addressUrl = getCellValue<string>('addressurl', item)[0];
    if (fieldName === 'address' && typeof addressUrl === 'string' && addressUrl.trim() !== '') {
        ({ isBlank, cellContents } = getAddressLinkCell(columnEx, item, addressUrl));
        return { cellContents, isBlank };
    }
    switch (columnEx.cellType?.toLowerCase()) {
        case CellTypes.Expand:
            cellContents = getExpandIconCell(item, columnEx, cellNavigation);
            break;
        case CellTypes.Image:
        case CellTypes.ClickableImage:
            ({ isBlank, cellContents } = getIconCell(item, columnEx, cellNavigation));
            break;
        case CellTypes.Tag:
            ({ isBlank, cellContents } = getTextTagCell(columnEx, item));
            break;
        case CellTypes.IndicatorTag:
            ({ isBlank, cellContents } = getColorTagCell(columnEx, item));
            break;
        case CellTypes.Link:
            ({ isBlank, cellContents } = getLinkCell(columnEx, item, cellNavigation));
            break;
        default:
            ({ cellContents, isBlank } = getCellContent(item, columnEx));
            isBlank = columnEx.hideWhenBlank === true && isBlank;
            break;
    }
    return { cellContents, isBlank };
}

function wrapContent(cellContents: JSX.Element, column: IGridColumn, isBlank: boolean, moreCols: boolean) {
    // Set the width - if this is the root, then we always set the width to prevent overflow to the column to the right
    // If this is a sub column, then we can alow the content to overflow if the width is not set
    const constrainWidth = column.maxWidth !== undefined || column.isMultiline === true;
    let whiteSpace: string | undefined = undefined;
    if (constrainWidth) {
        whiteSpace = column.isMultiline === true ? 'normal' : 'nowrap';
    }
    const targetWidth = column.currentWidth ?? column.maxWidth;
    // If constrained width and multi-line=true - normal wrap
    // If constrained width and multi-line=false - nowrap
    // If constrained = false - nowrap
    const cellStyle = {
        maxWidth: undefinedIf(constrainWidth, targetWidth),
        textOverflow: undefinedIf(constrainWidth, 'ellipsis'),
        overflow: undefinedIf(constrainWidth, 'hidden'),
        whiteSpace: whiteSpace,
        paddingLeft: undefinedIf(!isBlank, column.paddingLeft),
        paddingTop: undefinedIf(!isBlank, column.paddingTop),
        paddingRight: undefinedIf(!isBlank && moreCols, '4px'),
        fontWeight: column.isBold ? FontStyles.Bold.fontWeight : FontStyles.Normal.fontWeight,
    } as IRawStyle;

    const hasInlineLabel = column.inlineLabel !== undefined;
    const labelAbove = hasInlineLabel && column.isLabelAbove === true;
    cellContents = !isBlank ? (
        <span className={mergeStyles(cellStyle)} key={column.key.toString()}>
            {hasInlineLabel && <span className={ClassNames.inlineLabel}>{column.inlineLabel ?? column.name}</span>}
            {labelAbove && <br />}
            {cellContents}
        </span>
    ) : (
        <></>
    );

    return cellContents;
}
function undefinedIf<T>(flag: boolean, value: T): T | undefined {
    if (!flag) {
        return undefined;
    }
    if (typeof value === 'number' && isNaN(value)) {
        return undefined;
    }
    return value;
}

function getColorTagCell(
    column: IGridColumn,
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
) {
    // Render a status column
    // Get the actual color from the status column

    const tagColor = column.tagColor?.startsWith('#')
        ? column.tagColor
        : getCellValue<string>(column.tagColor, item)[0];

    const indicatorColorClass = `${ClassNames.statusTag} ${mergeStyles({
        ':after': { background: tagColor + CSS_IMPORTANT },
    })}`;
    const tagText = getCellValue<string>(column.fieldName, item)[0];
    const isBlank = !tagText || tagText === '';
    const cellContents = !isBlank ? (
        <span className={indicatorColorClass} title={tagText}>
            {tagText}
        </span>
    ) : (
        <></>
    );
    return { isBlank, cellContents };
}

function getTextTagCell(
    column: IGridColumn,
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
) {
    const tagValues = getCellValue<string>(column.fieldName, item).filter((v) => (v ?? '').toString().trim() !== '');
    const tagColor = column.tagColor?.startsWith('#')
        ? column.tagColor
        : getCellValue<string>(column.tagColor, item)[0];
    const tagBorderColor = column.tagBorderColor?.startsWith('#')
        ? column.tagBorderColor
        : getCellValue<string>(column.tagBorderColor, item)[0];
    const tagColorClass = `${ClassNames.textTag} ${mergeStyles({
        background: tagColor || '#F4F6F7' + CSS_IMPORTANT,
        borderColor: (tagBorderColor || '#CAD0D5') + CSS_IMPORTANT,
    })}`;
    const isSummaryFlags = (column.fieldName ?? '').toLowerCase() === 'summaryflags';
    const normalizedTagValues = isSummaryFlags
        ? tagValues.flatMap((value) => {
            const raw = value?.toString?.().trim() ?? '';
            if (!raw) return [];
            const parts = raw.split(/[;|,]/).map((part) => part.trim()).filter((part) => part.length > 0);
            return parts.length > 0 ? parts : [raw];
        })
        : tagValues;
    const isBlank = normalizedTagValues.length === 0;
    const cellContents = !isBlank ? (
        <span>
            {normalizedTagValues.map((t, idx) => {
                const text = t.toString().trim();
                const displayText = isSummaryFlags ? getSummaryTagLabel(text) : text;
                const colors = isSummaryFlags ? getSummaryTagColors(text) : undefined;
                const summaryClass = isSummaryFlags ? 'voa-summary-tag' : undefined;
                const summaryStyle = colors
                    ? { background: colors.background, borderColor: colors.borderColor, color: colors.color }
                    : undefined;
                return (
                    <span
                        key={idx}
                        className={`${tagColorClass}${summaryClass ? ` ${summaryClass}` : ''}`}
                        title={text}
                        aria-label={`${column.name ?? column.fieldName ?? 'Tag'} ${text}`}
                        style={{ marginRight: 6, ...(summaryStyle ?? {}) }}
                    >
                        {displayText}
                    </span>
                );
            })}
        </span>
    ) : (
        <></>
    );
    return { isBlank, cellContents };
}

function getSummaryTagLabel(text: string): string {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return '';
    const tokens = trimmed.split(/[\s_-]+/).map((t) => t.trim()).filter((t) => t.length > 0);
    if (tokens.length > 1) {
        const initials = tokens.map((t) => t[0]).join('');
        const digits = trimmed.replace(/[^0-9]/g, '');
        return `${initials}${digits}`;
    }
    const letters = trimmed.replace(/[^a-zA-Z]/g, '');
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (letters.length > 0 || digits.length > 0) {
        const prefix = letters.length > 2 ? letters.slice(0, 2) : letters;
        return `${prefix}${digits}`;
    }
    return trimmed.length > 2 ? trimmed.slice(0, 2) : trimmed;
}

function getSummaryTagColors(text: string): { background: string; borderColor: string; color: string } {
    const palette = [
        { background: '#E7F0F7', borderColor: '#2B6CB0', color: '#1B3F6B' },
        { background: '#E9F6F2', borderColor: '#1E7A62', color: '#0F4F3F' },
        { background: '#FFF3E0', borderColor: '#B26A00', color: '#6B3A00' },
        { background: '#F3E8FF', borderColor: '#5A2D82', color: '#3A1B57' },
        { background: '#FDECEE', borderColor: '#B71C1C', color: '#7A1212' },
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash + text.charCodeAt(i) * (i + 1)) % 997;
    }
    return palette[hash % palette.length];
}

function getIconCell(
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
    column: IGridColumn,
    cellNavigation: () => void,
) {
    let cellContents: JSX.Element;
    let isBlank = true;
    if (item?.getValue) {
        const imageData = getCellValue<string>(column.fieldName, item)[0];
        isBlank = !imageData || imageData === '';
        if (imageData) {
            const iconColor = column.tagColor?.startsWith('#')
                ? column.tagColor
                : getCellValue<string>(column.tagColor, item)[0];
            const ariaText = getCellValue<string>(column.ariaTextColumn, item)[0];
            const actionDisabled = getCellValue<string>(column.cellActionDisabledColumn, item)[0];
            const buttonContent: JSX.Element | null = getImageTag(imageData, column, iconColor);
            const padding = column.imagePadding;
            if (column.cellType?.toLowerCase() === CellTypes.ClickableImage) {
                const containerClass = `${ClassNames.imageButton} ${mergeStyles({ padding: padding })}`;
                cellContents = (
                    <DefaultButton
                        onClick={cellNavigation}
                        className={containerClass}
                        data-is-focusable={true}
                        disabled={actionDisabled === 'True'}
                        ariaDescription={ariaText}
                    >
                        {buttonContent}
                    </DefaultButton>
                );
            } else {
                const containerClass = mergeStyles({
                    height: '100%',
                    padding: padding,
                    display: 'flex',
                });
                cellContents = (
                    <div className={containerClass} title={ariaText}>
                        {buttonContent}
                    </div>
                );
            }
        } else {
            cellContents = <DefaultButton onClick={cellNavigation}></DefaultButton>;
        }
    } else {
        cellContents = <></>;
    }
    return { isBlank, cellContents };
}

function getImageTag(imageData: string, column: IGridColumn, iconColor: string) {
    let buttonContent: JSX.Element | null = null;
    const iconName = imageData.substring('icon:'.length);

    const validWidth =
        typeof column.imageWidth === 'number' && !isNaN(column.imageWidth)
            ? column.imageWidth
            : undefined;

    if (imageData.startsWith('icon:')) {
        const fontSize = validWidth ?? 18;
        const iconColorClass = mergeStyles({
            color: iconColor + CSS_IMPORTANT,
            fontSize: fontSize,
        });
        buttonContent = <FontIcon iconName={iconName} className={iconColorClass} aria-hidden="true" />;
    } else if (imageData.startsWith('data:') || imageData.startsWith('https:')) {
        const imageSize = validWidth ?? 32;
        buttonContent = <Image src={imageData} width={imageSize} />;
    }
    return buttonContent;
}

function getExpandIconCell(
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
    column: IColumn,
    cellNavigation: () => void,
) {
    if (item?.getValue && column.fieldName) {
        const expanded =
            (item as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord).getValue(column.fieldName) === true;
        const icon = expanded ? 'ChevronUp' : 'ChevronDown';
        return (
            <IconButton
                className={ClassNames.expandIcon}
                ariaLabel={expanded ? 'Collapse' : 'Expand'}
                data-is-focusable={true}
                iconProps={{ iconName: icon }}
                onClick={cellNavigation}
            />
        );
    }
    return <></>;
}

function getLinkCell(
    column: IGridColumn,
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
    cellNavigation: () => void,
) {
    const cellText = getCellValue<string>(column.fieldName, item)[0];

    const isBlank = !cellText || cellText === '';
    const label = `${column.name ?? column.fieldName ?? 'item'} ${cellText}`.trim();
    const isAddress = (column.fieldName ?? '').toLowerCase() === 'address';
    const linkClassName = isAddress ? 'voa-mda-link' : undefined;
    const onClick = (ev?: React.MouseEvent<HTMLElement>) => {
        ev?.preventDefault();
        ev?.stopPropagation();
        cellNavigation();
    };
    const cellContents = !isBlank ? (
        <Link onClick={onClick} underline aria-label={label} className={linkClassName}>
            {cellText}
        </Link>
    ) : (
        <></>
    );
    return { isBlank, cellContents };
}

function getAddressLinkCell(
    column: IGridColumn,
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
    addressUrl: string,
) {
    const cellText = getCellValue<string>(column.fieldName, item)[0];
    const isBlank = !cellText || cellText === '';
    const label = `${column.name ?? column.fieldName ?? 'Address'} ${cellText} (opens in new tab)`.trim();
    const cellContents = !isBlank ? (
        <Link
            href={addressUrl}
            underline
            aria-label={label}
            target="_blank"
            rel="noopener noreferrer"
            className="voa-mda-link"
            onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                if (addressUrl) {
                    window.open(addressUrl, '_blank', 'noopener,noreferrer');
                }
            }}
        >
            {cellText}{' '}
            <span aria-hidden="true">(opens in new tab)</span>
        </Link>
    ) : (
        <></>
    );
    return { isBlank, cellContents };
}

function getCellValue<T>(
    fieldName?: string,
    item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = '';
    if (fieldName && item) {
        if (item.getValue) {
            const itemEntityRecord = item as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord;
            const rawValue = itemEntityRecord.getValue(fieldName);
            if (rawValue !== null) {
                if (Array.isArray(rawValue)) value = rawValue;
                else value = itemEntityRecord.getFormattedValue(fieldName);
            }
        } else {
            value = (item as Record<string, unknown>)[fieldName];
        }
    }
    const isArrayValue = Array.isArray(value);
    let values: T[];
    if (!isArrayValue) {
        values = [value as T];
    } else {
        const arr = value as unknown[];
        if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && 'Value' in (arr[0] as Record<string, unknown>)) {
            values = (arr as DatasetArray<T>).map((i) => i.Value);
        } else {
            values = arr as T[];
        }
    }
    return values;
}

function getCellContent(
    item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | Record<string, unknown>,
    column: IGridColumn,
    overrideValues?: string[],
) {
    let cellContents: JSX.Element;
    let isBlank = true;
    // Is the contents an array of values - or just a text field?
    // Passing in an array of items is provided to the component as an array of objects
    if (item && (column as IColumn).fieldName) {
        const values: string[] = overrideValues ?? getCellValue((column as IColumn).fieldName, item);
        isBlank = values.length === 0 || values.join('') === '';

        // Two types of cell rendering - single value and multi-value
        if (values.length > 1) {
            const valueDelimiter = column.multiValuesDelimiter;
            const delimiterElement = valueDelimiter ?? ', ';
            cellContents = (
                <>
                    {values.map((value, index) => {
                        const valueElement = column.firstMultiValueBold && index === 0 ? <b>{value}</b> : value;
                        return (
                            <span key={index}>
                                {valueElement}
                                {index < values.length - 1 && delimiterElement}
                            </span>
                        );
                    })}
                </>
            );
        } else {
            cellContents = <>{values[0]}</>;
        }
    } else {
        cellContents = <></>;
    }
    return { cellContents, isBlank };
}
