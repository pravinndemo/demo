import { DefaultButton, FontIcon, IColumn, Image, IRawStyle, Link, mergeStyles } from '@fluentui/react';
import * as React from 'react';
import { IGridColumn } from '../Component.types';
import { DatasetArray } from '../utils/DatasetArrayItem';
import { ClassNames, FontStyles } from './Grid.styles';
import { CellTypes } from '../config/ManifestConstants';
import { SCREEN_TEXT } from '../constants/ScreenText';
import { getFlaggedForReviewTagMeta, getSummaryFlagTagMeta, getTaskStatusTagMeta } from '../utils/TagSemanticUtils';

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
            width: '100%',
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
    const isTagCell =
        column.cellType?.toLowerCase() === CellTypes.Tag
        || column.cellType?.toLowerCase() === CellTypes.IndicatorTag;
    let whiteSpace: string | undefined = undefined;
    if (constrainWidth) {
        whiteSpace = column.isMultiline === true ? 'normal' : 'nowrap';
    }
    const targetWidth = column.currentWidth ?? column.maxWidth;
    // If constrained width and multi-line=true - normal wrap
    // If constrained width and multi-line=false - nowrap
    // If constrained = false - nowrap
    const fieldName = (column.fieldName ?? '').toLowerCase();
    const needsNumericGapRight = fieldName === 'ratio' || fieldName === 'outlierratio';
    const needsLeftInset = fieldName === 'dwellingtype' || fieldName === 'overallflag';
    const effectivePaddingLeft = column.paddingLeft ?? (needsLeftInset ? '12px' : undefined);
    const effectivePaddingRight = needsNumericGapRight ? '18px' : '4px';
    const cellStyle = {
        maxWidth: undefinedIf(constrainWidth, targetWidth),
        textOverflow: undefinedIf(constrainWidth, 'ellipsis'),
        overflow: isTagCell ? 'visible' : undefinedIf(constrainWidth, 'hidden'),
        whiteSpace: whiteSpace,
        display: isTagCell ? 'inline-flex' : undefined,
        alignItems: isTagCell ? 'center' : undefined,
        paddingLeft: undefinedIf(!isBlank, effectivePaddingLeft),
        paddingTop: undefinedIf(!isBlank, column.paddingTop ?? (isTagCell ? '1px' : undefined)),
        paddingBottom: undefinedIf(!isBlank && isTagCell, '1px'),
        paddingRight: undefinedIf(!isBlank && moreCols, effectivePaddingRight),
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
    const fieldName = (column.fieldName ?? '').toLowerCase();
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
    const isSummaryFlags = fieldName === 'summaryflags';
    const isTaskStatus = fieldName === 'taskstatus';
    const isFlaggedForReview = fieldName === 'flaggedforreview';
    const normalizedTagValues = isSummaryFlags
        ? tagValues.flatMap((value) => {
            const raw = value?.toString?.().trim() ?? '';
            if (!raw) return [];
            const parts = raw.split(/[;|,]/).map((part) => part.trim()).filter((part) => part.length > 0);
            return parts.length > 0 ? parts : [raw];
        })
        : tagValues;
    const isBlank = normalizedTagValues.length === 0;
    const summaryFlagsTooltip = isSummaryFlags
        ? normalizedTagValues.map((value) => value.toString().trim()).join(', ')
        : undefined;
    const cellContents = !isBlank ? (
        <span className={isSummaryFlags ? 'voa-summary-tags' : undefined} title={summaryFlagsTooltip ?? undefined}>
            {normalizedTagValues.map((t, idx) => {
                const text = t.toString().trim();
                const semanticMeta =
                    (isFlaggedForReview ? getFlaggedForReviewTagMeta(text) : undefined)
                    ?? (isTaskStatus ? getTaskStatusTagMeta(text) : undefined)
                    ?? (isSummaryFlags ? getSummaryFlagTagMeta(text) : undefined);
                const summaryStyle = semanticMeta?.colors
                    ? {
                        background: semanticMeta.colors.background,
                        borderColor: semanticMeta.colors.borderColor,
                        color: semanticMeta.colors.color,
                    }
                    : undefined;
                const marginRight = isSummaryFlags ? 0 : 6;
                return (
                    <span
                        key={idx}
                        className={[
                            semanticMeta ? ClassNames.textTag : tagColorClass,
                            semanticMeta?.className,
                        ].filter(Boolean).join(' ')}
                        title={semanticMeta?.titleText ?? semanticMeta?.spokenText ?? text}
                        aria-label={`${column.name ?? column.fieldName ?? 'Tag'} ${semanticMeta?.spokenText ?? text}`}
                        style={{ marginRight, ...(summaryStyle ?? {}) }}
                    >
                        {semanticMeta?.label ?? text}
                    </span>
                );
            })}
        </span>
    ) : (
        <></>
    );
    return { isBlank, cellContents };
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
        const rawAriaText = getCellValue<string>(column.ariaTextColumn, item)[0];
        const ariaText = typeof rawAriaText === 'string' ? rawAriaText.trim() : String(rawAriaText ?? '').trim();
        const columnLabel = String(column.name ?? column.fieldName ?? '').trim();
        const cellLabel = ariaText || columnLabel;
        const actionLabel = cellLabel || (columnLabel ? `Open ${columnLabel}` : 'Open details');
        isBlank = !imageData || imageData === '';
        if (imageData) {
            const iconColor = column.tagColor?.startsWith('#')
                ? column.tagColor
                : getCellValue<string>(column.tagColor, item)[0];
            const actionDisabled = getCellValue<string>(column.cellActionDisabledColumn, item)[0];
            const buttonContent: JSX.Element | null = getImageTag(
                imageData,
                column,
                iconColor,
                cellLabel,
                column.cellType?.toLowerCase() === CellTypes.ClickableImage,
            );
            const padding = column.imagePadding;
            if (column.cellType?.toLowerCase() === CellTypes.ClickableImage) {
                const containerClass = `${ClassNames.imageButton} ${mergeStyles({ padding: padding })}`;
                cellContents = (
                    <DefaultButton
                        onClick={cellNavigation}
                        className={containerClass}
                        data-is-focusable={true}
                        disabled={actionDisabled === 'True'}
                        ariaLabel={actionLabel}
                        ariaDescription={ariaText && ariaText !== actionLabel ? ariaText : undefined}
                    >
                        <span className="voa-cell-action-button">
                            {buttonContent}
                            <span className="voa-cell-action-button__label">{actionLabel}</span>
                        </span>
                    </DefaultButton>
                );
            } else {
                const containerClass = mergeStyles({
                    height: '100%',
                    padding: padding,
                    display: 'flex',
                });
                cellContents = (
                    <div className={containerClass} title={actionLabel}>
                        {buttonContent}
                        {actionLabel ? <span className="voa-sr-only">{actionLabel}</span> : null}
                    </div>
                );
            }
        } else {
            cellContents = <DefaultButton onClick={cellNavigation} ariaLabel={actionLabel}></DefaultButton>;
        }
    } else {
        cellContents = <></>;
    }
    return { isBlank, cellContents };
}

function getImageTag(
    imageData: string,
    column: IGridColumn,
    iconColor: string,
    ariaText?: string,
    decorative = false,
) {
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
        buttonContent = <Image src={imageData} width={imageSize} alt={decorative ? '' : ariaText ?? ''} />;
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
        const actionText = expanded ? 'Collapse' : 'Expand';
        return (
            <button
                type="button"
                className="voa-expand-button"
                aria-label={actionText}
                data-is-focusable={true}
                onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    cellNavigation();
                }}
            >
                <FontIcon iconName={icon} className="voa-expand-button__icon" aria-hidden="true" />
                <span className="voa-expand-button__label">{actionText}</span>
            </button>
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
    const buttonClassName = ['voa-mda-link', 'voa-mda-link-button', linkClassName].filter(Boolean).join(' ');
    const cellContents = !isBlank ? (
        <button type="button" onClick={onClick} aria-label={label} className={buttonClassName}>
            {cellText}
        </button>
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
    const newTabText = SCREEN_TEXT.common.links.opensInNewTab;
    const label = `${column.name ?? column.fieldName ?? 'Address'} ${cellText} ${newTabText}`.trim();
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
            }}
        >
            {cellText} {newTabText}
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

/**
 * Applies a display format to a raw cell string value.
 * Supported formats:
 *   'currency' â€” prefixes with Â£ and adds thousands separators (en-GB locale).
 *                Omits pence when the value is a whole number (e.g. Â£250,000).
 *                Includes pence when a fractional part is present (e.g. Â£250,000.50).
 */
function applyFormat(value: string, format?: string): string {
    if (!format || !value) return value;
    const normalizedFormat = format.toLowerCase();
    if (normalizedFormat === 'currency') {
        // Strip any existing currency symbol or grouping separators before parsing.
        const num = parseFloat(String(value).replace(/[£,\s]/g, ''));
        if (isNaN(num)) return value;
        const hasDecimals = num % 1 !== 0;
        return '£' + num.toLocaleString('en-GB', {
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: hasDecimals ? 2 : 0,
        });
    }
    if (normalizedFormat === 'date') {
        // Normalize dd-mm-yyyy to dd/mm/yyyy for display consistency.
        const trimmed = String(value).trim();
        const match = /^(\d{1,2})-(\d{1,2})-(\d{4})(.*)$/.exec(trimmed);
        if (!match) return value;
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        const suffix = match[4] ?? '';
        return `${day}/${month}/${year}${suffix}`;
    }
    return value;
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
        const rawValues: string[] = overrideValues ?? getCellValue((column as IColumn).fieldName, item);
        isBlank = rawValues.length === 0 || rawValues.join('') === '';

        // Apply column-level display format (e.g. 'currency' â†’ Â£ prefix + thousands separators)
        const values = rawValues.map((v) => applyFormat(String(v ?? ''), column.format));

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


