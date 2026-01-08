import { 
  CheckboxVisibility,
  ColumnActionsMode,
  ContextualMenu,
  ContextualMenuItemType,
  createTheme,
  DirectionalHint,
  IColumn,
  IColumnReorderOptions,
  IContextualMenuItem,
  IDetailsList,
  IObjectWithKey,
  IRefObject,
  ISelection,
  IPartialTheme,
  IDropdownOption,
  PrimaryButton,
  SelectionMode,
  ShimmeredDetailsList,
  Overlay,
  ThemeProvider,
  TextField,
  Stack,
  Text,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Dropdown,
  ComboBox,
  IComboBoxOption,
  Spinner,
  SpinnerSize,
  Link,
  DatePicker,
  DayOfWeek,
  IDatePickerStrings,
} from '@fluentui/react';
import * as React from 'react';
import { NoFields } from './NoFields';
import { RecordsColumns } from '../config/ManifestConstants';
import { IGridColumn, ColumnConfig } from '../Component.types';
import { GridCell } from './GridCell';
import { ClassNames } from './Grid.styles';
import { GridFilterState, createDefaultGridFilters, sanitizeFilters, SearchByOption, ManualCheckFilter } from '../Filters';
import { logPerf } from '../utils/Perf';
import { getSearchByOptionsFor, isLookupFieldFor } from '../config/TableConfigs';

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;

export interface GridProps {
  // When false, hides the built-in top search panel
  showSearchPanel?: boolean;
  tableKey?: string;
  height?: number;
  taskCount?: number;
  selectedCount?: number;
  datasetColumns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
  columnConfigs: Record<string, ColumnConfig>;
  records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>;
  sortedRecordIds: string[];
  shimmer: boolean;
  itemsLoading: boolean;
  selectionType: SelectionMode;
  selection: ISelection<IObjectWithKey>;
  onNavigate: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => void;
  onSort: (name: string, desc: boolean) => void;
  sorting: ComponentFramework.PropertyHelper.DataSetApi.SortStatus[];
  componentRef: IRefObject<IDetailsList>;
  compact?: boolean;
  themeJSON?: string | IPartialTheme;
  isHeaderVisible?: boolean;
  resources: ComponentFramework.Resources;
  columnDatasetNotDefined?: boolean;
  onSearch: (filters: GridFilterState) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onSetPage: (page: number) => void;
  currentPage: number;
  totalPages: number;
  canNext: boolean;
  canPrev: boolean;
  overlayOnSort?: boolean;
  searchFilters: GridFilterState;
  errorMessage?: string;
  showResults?: boolean;
  onLoadFilterOptions?: (field: string, query: string) => Promise<string[]>;
  onColumnFiltersChange?: (filters: Record<string, string | string[]>) => void;
  allowColumnReorder?: boolean;
  // Fully controlled header filters from host
  columnFilters: Record<string, string | string[]>;
}

const defaultTheme = createTheme({
  palette: {
    themePrimary: '#3B79B7',
  },
  fonts: {
    medium: {
      fontFamily: "'Segoe UI', 'SegoeUI', 'Arial', sans-serif",
      fontSize: '14px',
    },
  },
});

function useTheme(themeJSON?: string | IPartialTheme) {
  return React.useMemo(() => {
    if (!themeJSON) {
      return defaultTheme;
    }
    try {
      const partial: IPartialTheme = typeof themeJSON === 'string' ? (JSON.parse(themeJSON) as unknown as IPartialTheme) : themeJSON;
      return createTheme(partial);
    } catch {
      return defaultTheme;
    }
  }, [themeJSON]);
}

export function getRecordKey(record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord): string {
  const customKey = record.getValue(RecordsColumns.RecordKey);
  const trimmed = typeof customKey === 'string' ? customKey.trim() : '';
  return trimmed !== '' ? trimmed : record.getRecordId();
}

export const Grid = React.memo((props: GridProps) => {
  const {
    showSearchPanel = true,
    tableKey = 'sales',
    taskCount,
    selectedCount = 0,
    datasetColumns,
    columnConfigs,
    records,
    sortedRecordIds,
    shimmer,
    itemsLoading,
    selectionType,
    selection,
    onNavigate,
    onSort,
    sorting,
    componentRef,
    compact,
    themeJSON,
    isHeaderVisible,
    resources,
    columnDatasetNotDefined,
    height,
    onSearch,
    onNextPage,
    onPrevPage,
    onSetPage,
    currentPage,
    totalPages,
    canNext,
    canPrev,
    overlayOnSort,
    searchFilters,
    errorMessage,
    showResults,
    onLoadFilterOptions,
    onColumnFiltersChange,
    columnFilters,
  } = props;

  const theme = useTheme(themeJSON);
  const paginationButtonStyles = React.useMemo(
    () => ({
      root: {
        height: 32,
        minWidth: 32,
        padding: '0 10px',
        borderRadius: 6,
      },
    }),
    [],
  );
  const activePaginationButtonStyles = React.useMemo(
    () => ({
      root: {
        height: 32,
        minWidth: 32,
        padding: '0 10px',
        borderRadius: 6,
        backgroundColor: theme.palette.neutralLighter,
        borderColor: theme.palette.neutralQuaternary,
        fontWeight: 600,
      },
    }),
    [theme.palette.neutralLighter, theme.palette.neutralQuaternary],
  );

  const [columns, setColumns] = React.useState<IGridColumn[]>([]);
  const [isComponentLoading, setIsLoading] = React.useState(false);
  // No local columnFilters; use controlled prop
  const [menuState, setMenuState] = React.useState<{
    target: HTMLElement;
    column: IGridColumn;
  }>();
  const [menuFilterValue, setMenuFilterValue] = React.useState<string | string[]>('');
  const [menuFilterText, setMenuFilterText] = React.useState('');
  const [menuExtraOptions, setMenuExtraOptions] = React.useState<string[]>([]);
  const [menuOptionsLoading, setMenuOptionsLoading] = React.useState(false);
  const menuOptionsTimer = React.useRef<number | undefined>(undefined);
  const liveFilterTimer = React.useRef<number | undefined>(undefined);
  const [filters, setFilters] = React.useState<GridFilterState>(searchFilters);

  // No sync needed; columnFilters is controlled by host

  // Debounced search when typing in non-UPRN text fields
  const searchTimer = React.useRef<number | undefined>(undefined);
  const scheduleSearch = React.useCallback(() => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
    searchTimer.current = window.setTimeout(() => {
      const sanitized = sanitizeFilters(filters);
      if (
        sanitized.searchBy === 'uprn' &&
        sanitized.uprn &&
        (sanitized.uprn.length < 8 || sanitized.uprn.length > 10)
      ) {
        return;
      }
      setFilters(sanitized);
      onSearch(sanitized);
    }, 350);
  }, [filters, onSearch]);

  React.useEffect(() => () => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
  }, []);

  React.useEffect(() => {
    setFilters(searchFilters);
  }, [searchFilters]);

  const toISODateString = React.useCallback((date?: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const parseISODate = React.useCallback((value?: string): Date | undefined => {
    if (!value) return undefined;
    const [y, m, d] = value.split('-').map((v) => Number(v));
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  }, []);

  const formatDisplayDate = React.useCallback((date?: Date | null): string => {
    if (!date) return '';
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const dateStrings: IDatePickerStrings = React.useMemo(
    () => ({
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      shortDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      goToToday: 'Go to today',
      prevMonthAriaLabel: 'Go to previous month',
      nextMonthAriaLabel: 'Go to next month',
      prevYearAriaLabel: 'Go to previous year',
      nextYearAriaLabel: 'Go to next year',
      prevYearRangeAriaLabel: 'Go to previous year range',
      nextYearRangeAriaLabel: 'Go to next year range',
      closeButtonAriaLabel: 'Close date picker',
      isRequiredErrorMessage: 'This field is required.',
      invalidInputErrorMessage: 'Invalid date format.',
    }),
    [],
  );

  const searchByOptions = React.useMemo<IDropdownOption[]>(() => {
    const keys: SearchByOption[] = getSearchByOptionsFor(String(tableKey));
    const toLabel = (k: string): string => {
      switch (k) {
        case 'saleId':
          return 'Sale ID';
        case 'uprn':
          return 'UPRN';
        case 'taskId':
          return 'Task';
        case 'manualCheck':
          return 'Manual Check';
        case 'address':
          return 'Address';
        case 'postcode':
          return 'Postcode';
        case 'street':
          return 'Street';
        case 'town':
          return 'Town/City';
        case 'taskStatus':
          return 'Task Status';
        case 'source':
          return 'Source';
        case 'qcCompletedDate':
          return 'QC Completed date';
        default:
          return k.charAt(0).toUpperCase() + k.slice(1);
      }
    };
    return keys.map((k: SearchByOption) => ({ key: k as string, text: toLabel(k as string) }));
  }, [tableKey]);

  const manualCheckOptions = React.useMemo<IDropdownOption[]>(
    () => [
      { key: 'all', text: 'All' },
      { key: 'yes', text: 'Yes' },
      { key: 'no', text: 'No' },
    ],
    [],
  );

  const onFieldEnter = React.useCallback(
    (ev: React.KeyboardEvent<HTMLElement>) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const sanitized = sanitizeFilters(filters);
        const uprnInvalid = sanitized.searchBy === 'uprn' && !!sanitized.uprn && (sanitized.uprn.length < 8 || sanitized.uprn.length > 10);
        if (!uprnInvalid) {
          setFilters(sanitized);
          onSearch(sanitized);
        }
      }
    },
    [filters, onSearch],
  );

  const updateFilters = React.useCallback(
    (key: keyof GridFilterState, value: GridFilterState[keyof GridFilterState]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // No ref needed; use TextField inputProps to set native attributes

  const onSearchByChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (!option) {
        return;
      }
      const selected = option.key as SearchByOption;
      setFilters((prev) => ({
        ...prev,
        searchBy: selected,
        manualCheck: prev.manualCheck ?? 'all',
      }));
    },
    [],
  );

  const onManualCheckChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (!option) {
        return;
      }
      updateFilters('manualCheck', option.key as ManualCheckFilter);
    },
    [updateFilters],
  );

  const onSaleIdChange = React.useCallback(
    (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      updateFilters('saleId', value ?? '');
    },
    [updateFilters],
  );

  const onUprnChange = React.useCallback(
    (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      const digits = (value ?? '').replace(/\D/g, '');
      updateFilters('uprn', digits);
    },
    [updateFilters],
  );

  const onTaskIdChange = React.useCallback(
    (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      updateFilters('taskId', value ?? '');
      scheduleSearch();
    },
    [updateFilters, scheduleSearch],
  );

  const onBuildingNameChange = React.useCallback(
    (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      updateFilters('buildingNameNumber', value ?? '');
      scheduleSearch();
    },
    [updateFilters, scheduleSearch],
  );

  const onStreetChange = React.useCallback(
    (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      updateFilters('street', value ?? '');
      scheduleSearch();
    },
    [updateFilters, scheduleSearch],
  );

  const onTownChange = React.useCallback(
    (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      updateFilters('townCity', value ?? '');
      scheduleSearch();
    },
    [updateFilters, scheduleSearch],
  );

  const onPostcodeChange = React.useCallback(
    (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      updateFilters('postcode', (value ?? '').toUpperCase());
      scheduleSearch();
    },
    [updateFilters, scheduleSearch],
  );

  

  const onTaskStatusFilterChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      updateFilters('taskStatus', (option?.key as string) ?? '');
    },
    [updateFilters],
  );

  const onSourceFilterChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      updateFilters('source', (option?.key as string) ?? '');
    },
    [updateFilters],
  );

  const uprnError = React.useMemo(() => {
    if (filters.searchBy !== 'uprn' || !filters.uprn || filters.uprn.length === 0) {
      return undefined;
    }
    if (filters.uprn.length >= 8 && filters.uprn.length <= 10) {
      return undefined;
    }
    return 'UPRN must be 8 to 10 digits';
  }, [filters.searchBy, filters.uprn]);

  const isSearchDisabled = React.useMemo(() => !!uprnError, [uprnError]);

  const handleSearch = React.useCallback(() => {
    const sanitized = sanitizeFilters(filters);
    if (sanitized.searchBy === 'uprn' && sanitized.uprn && (sanitized.uprn.length < 8 || sanitized.uprn.length > 10)) {
      return;
    }
    setFilters(sanitized);
    onSearch(sanitized);
  }, [filters, onSearch]);

  const handleClear = React.useCallback(() => {
    const defaults = createDefaultGridFilters();
    setFilters(defaults);
    onSearch(defaults);
  }, [onSearch]);

  const showPostcodeHint = React.useMemo(() => {
    if (!filters.postcode || filters.postcode.length === 0) {
      return false;
    }
    return filters.searchBy === 'postcode' || filters.searchBy === 'address';
  }, [filters.postcode, filters.searchBy]);

  React.useEffect(() => {
    setColumns(
      datasetColumns.map((c) => {
        const lowerName = c.name.toLowerCase();
        const cfg =
          columnConfigs[lowerName] ||
          (c.alias ? columnConfigs[c.alias.toLowerCase()] : undefined) ||
          {};
        const datasetCellType = (c as { cellType?: string }).cellType;
        const sort = sorting?.find((s) => s.name === c.name);
        const visualSize =
          typeof c.visualSizeFactor === 'number' && !isNaN(c.visualSizeFactor)
            ? c.visualSizeFactor
            : 100;
        const width = typeof cfg.ColWidth === 'number' ? cfg.ColWidth : visualSize;
        const resolvedCellType = (cfg.ColCellType ?? datasetCellType)?.toLowerCase();
        const effectiveCellType = cfg.ColCellType ?? datasetCellType;
        const col: IGridColumn = {
          key: c.name,
          name: cfg.ColDisplayName ?? c.displayName,
          fieldName: c.name,
          minWidth: width,
          maxWidth: cfg.ColWidth,
          isResizable: cfg.ColResizable ?? true,
          isSorted: !!sort,
          isSortedDescending: sort ? Number(sort.sortDirection) === 1 : undefined,
          isBold: cfg.ColIsBold,
          cellType: effectiveCellType,
          tagColor: cfg.ColTagColor ?? cfg.ColTagColorColumn,
          tagBorderColor: cfg.ColTagBorderColor ?? cfg.ColTagBorderColorColumn,
          isMultiline: cfg.ColMultiLine,
          horizontalAligned: cfg.ColHorizontalAlign,
          verticalAligned: cfg.ColVerticalAlign,
          headerPaddingLeft: cfg.ColHeaderPaddingLeft,
          showAsSubTextOf: cfg.ColShowAsSubTextOf,
          paddingTop: cfg.ColPaddingTop,
          paddingLeft: cfg.ColPaddingLeft,
          isLabelAbove: cfg.ColLabelAbove,
          multiValuesDelimiter: cfg.ColMultiValueDelimiter,
          firstMultiValueBold: cfg.ColFirstMultiValueBold,
          inlineLabel: cfg.ColInlineLabel,
          hideWhenBlank: cfg.ColHideWhenBlank,
          subTextRow: cfg.ColSubTextRow,
          ariaTextColumn: cfg.ColAriaTextColumn,
          cellActionDisabledColumn: cfg.ColCellActionDisabledColumn,
          imageWidth: cfg.ColImageWidth ? String(cfg.ColImageWidth) : undefined,
          imagePadding: cfg.ColImagePadding,
          sortable: cfg.ColSortable !== false,
          columnActionsMode:
            cfg.ColSortable !== false ? ColumnActionsMode.hasDropdown : ColumnActionsMode.disabled,
          sortBy: cfg.ColSortBy,
          childColumns: [],
        };
        if (
          resolvedCellType === 'tag' ||
          resolvedCellType === 'indicatortag' ||
          resolvedCellType === 'link' ||
          resolvedCellType === 'image' ||
          resolvedCellType === 'clickableimage' ||
          resolvedCellType === 'expand'
        ) {
          col.onRender = (
            item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
            _?: number,
            column?: IColumn,
          ) => (
            <GridCell item={item} column={column} onCellAction={(i) => onNavigate(i)} />
          );
        }
        return col;
      }),
    );
  }, [datasetColumns, sorting, columnConfigs, onNavigate]);

  const handleColumnReorder = React.useCallback((draggedIndex: number, targetIndex: number) => {
    setColumns((prev) => {
      const newCols = [...prev];
      const [moved] = newCols.splice(draggedIndex, 1);
      newCols.splice(targetIndex, 0, moved);
      return newCols;
    });
  }, []);

  const columnReorderOptions = React.useMemo<IColumnReorderOptions>(
    () => ({
      handleColumnReorder,
    }),
    [handleColumnReorder],
  );

  const items = React.useMemo<DataSet[]>(() => {
    const mapped = sortedRecordIds.map((id) => {
      const record = records[id];
      const k = getRecordKey(record);
      const stableKey = typeof k === 'string' && k.trim() !== '' ? k : id;
      (record as DataSet).key = stableKey;
      return record as DataSet;
    });
    setIsLoading(false);
    return mapped;
  }, [records, sortedRecordIds]);

  const recordCount = React.useMemo(() => Object.keys(records).length, [records]);

  const getFilterableText = React.useCallback((raw: unknown): string => {
    if (Array.isArray(raw)) {
      return raw
        .map((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : ''))
        .filter((s) => s !== '')
        .join(', ');
    }
    if (typeof raw === 'string') {
      return raw;
    }
    if (typeof raw === 'number' || typeof raw === 'boolean') {
      return raw.toString();
    }
    return '';
  }, []);

  // Identify columns that should use a value dropdown (lookup/choice-like fields)
  const isLookupField = React.useCallback((field: string | undefined): boolean => {
    return Boolean(isLookupFieldFor(String(tableKey), field));
  }, [tableKey]);

  const isTextOnlyField = React.useCallback((field: string | undefined): boolean => {
    if (!field) return false;
    const f = field.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return (
      f === 'saleid' ||
      f === 'taskid' ||
      f === 'uprn' ||
      f === 'address' ||
      f === 'transactiondate' ||
      f === 'saleprice' ||
      f === 'marketvalue' ||
      f === 'ratio'
    );
  }, [isLookupField]);

  // Derive icons each render to reflect current sort/filter state
  const columnsWithIcons = React.useMemo<IGridColumn[]>(() => {
    return columns.map((c) => {
      const field = c.fieldName ?? c.key;
      const key = (field ?? '').toString();
      const keyLower = key.toLowerCase();
      const hasLocal = !!columnFilters[key] || !!columnFilters[keyLower];
      const hasControlled = !!(columnFilters[key]) || !!(columnFilters[keyLower]);
      const activeFilter = hasLocal || hasControlled;
      const sort = sorting?.find((s) => s.name === field);
      const sortIcon = sort ? (Number(sort.sortDirection) === 1 ? 'SortDown' : 'SortUp') : undefined;
      const iconName = sortIcon ?? (activeFilter ? 'Filter' : undefined);
      return { ...c, iconName } as IGridColumn;
    });
  }, [columns, columnFilters, sorting]);

  const filteredItems = React.useMemo(() => {
    const t0 = performance.now();
    const filterEntries = Object.entries(columnFilters).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value.trim() !== '',
    );
    if (filterEntries.length === 0) {
      const t1 = performance.now();
      logPerf('[Grid Perf] Client filteredItems (no filters) (ms):', Math.round(t1 - t0), 'items:', items.length);
      return items;
    }
    const out = items.filter((item) => {
      const record = item as unknown as Record<string, unknown>;
      return filterEntries.every(([fieldName, filterValue]) => {
        const raw = record[fieldName];
        if (Array.isArray(filterValue)) {
          const needles = filterValue.map((v) => String(v).trim().toLowerCase()).filter((v) => v !== '');
          if (needles.length === 0) return true;
          if (Array.isArray(raw)) {
            const hay = raw
              .map((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v).trim().toLowerCase() : ''))
              .filter((s) => s !== '');
            return needles.some((n) => hay.includes(n));
          }
          const text = getFilterableText(raw).trim().toLowerCase();
          return needles.some((n) => text === n);
        }
        const needle = filterValue.trim().toLowerCase();
        if (Array.isArray(raw)) {
          return raw.some((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') && String(v).toLowerCase().includes(needle));
        }
        const text = getFilterableText(raw).trim().toLowerCase();
        return text.includes(needle);
      });
    });
    const t1 = performance.now();
    logPerf('[Grid Perf] Client filteredItems (ms):', Math.round(t1 - t0), 'items:', items.length, 'filters:', filterEntries.length, 'result:', out.length);
    return out;
  }, [columnFilters, getFilterableText, items]);

  const clearAllColumnFilters = React.useCallback(() => {
    const cleared: Record<string, string | string[]> = {};
    onColumnFiltersChange?.(cleared);
  }, [onColumnFiltersChange]);

  const getDistinctOptions = React.useCallback(
    (candidates: string[]): IDropdownOption[] => {
      if (recordCount > 250 && onLoadFilterOptions) {
        return [];
      }
      const t0 = performance.now();
      const set = new Set<string>();
      Object.values(records).forEach((it) => {
        const rec = it as unknown as Record<string, unknown>;
        for (const c of candidates) {
          const raw = rec[c];
          if (Array.isArray(raw)) {
            raw.forEach((v) => {
              const s = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v).trim() : '';
              if (s) set.add(s);
            });
            if (raw.length > 0) break;
          } else {
            const v = getFilterableText(raw);
            if (v) {
              set.add(v.trim());
              break;
            }
          }
        }
      });
      const arr = Array.from(set)
        .filter((v) => v !== '')
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ key: v, text: v }));
      const t1 = performance.now();
      logPerf('[Grid Perf] Distinct options (ms):', Math.round(t1 - t0), 'candidates:', candidates.join(','), 'records:', Object.keys(records).length, 'options:', arr.length);
      return arr;
    },
    [getFilterableText, records, onLoadFilterOptions, recordCount],
  );

  const scheduleLiveTextFilter = React.useCallback((fieldName: string, value: string) => {
    if (liveFilterTimer.current) {
      window.clearTimeout(liveFilterTimer.current);
    }
    liveFilterTimer.current = window.setTimeout(() => {
      const updated: Record<string, string | string[]> = { ...columnFilters };
      const trimmed = value.trim();
      if (trimmed === '') {
        delete updated[fieldName];
      } else {
        updated[fieldName] = trimmed;
      }
      onColumnFiltersChange?.(updated);
    }, 300);
  }, [columnFilters, onColumnFiltersChange]);

  React.useEffect(() => () => {
    if (liveFilterTimer.current) {
      window.clearTimeout(liveFilterTimer.current);
    }
  }, []);

  const onItemInvoked = React.useCallback(
    (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => {
      onNavigate(item);
    },
    [onNavigate],
  );

  const handleSort = React.useCallback(
    (column: IGridColumn, descending: boolean) => {
      if (column.sortable === false) {
        return;
      }
      if (overlayOnSort) {
        setIsLoading(true);
      }
      const sortField = column.sortBy ?? column.key;
      onSort(sortField, descending);
      setMenuState(undefined);
    },
    [onSort, overlayOnSort],
  );

  const openMenuForColumn = React.useCallback(
    (gridCol: IGridColumn, target?: HTMLElement) => {
      if (!target) {
        return;
      }
      const fieldName = gridCol.fieldName ?? gridCol.key;
      // Prefer local value; fall back to controlled header filters to prefill text after reloads
      const key = String(fieldName ?? '');
      const keyLower = key.toLowerCase();
      // Controlled filters only
      const existing = columnFilters[key] ?? columnFilters[keyLower];
      // Perf: log what we will prefill (controlled vs local)
      logPerf('[Grid Perf] OpenMenu prefill', {
        field: keyLower,
        existingControlled: columnFilters[keyLower] ?? columnFilters[key],
        existingLocal: undefined,
        mode: Array.isArray(existing) ? 'multi' : 'text',
        text: typeof existing === 'string' ? existing : '',
      });
      if (Array.isArray(existing)) {
        setMenuFilterValue(existing);
        setMenuFilterText('');
      } else {
        setMenuFilterValue(existing ?? '');
        setMenuFilterText(typeof existing === 'string' ? existing : '');
      }
      setMenuExtraOptions([]);
      setMenuOptionsLoading(false);
      setMenuState({ target, column: gridCol });
      // For large datasets, prefer server-provided options for lookup fields
      const lookup = isLookupField(fieldName);
      if (lookup && recordCount > 250 && onLoadFilterOptions) {
        setMenuOptionsLoading(true);
        void onLoadFilterOptions(fieldName ?? '', '')
          .then((vals) => {
            setMenuExtraOptions(vals ?? []);
            setMenuOptionsLoading(false);
            return null;
          })
          .catch(() => {
            setMenuOptionsLoading(false);
            return null;
          });
      }
    },
    [columnFilters, isLookupField, onLoadFilterOptions, recordCount],
  );

  // Ensure prefill is applied after the menu is set (covers any race on first open after reload)
  React.useEffect(() => {
    if (!menuState) return;
    const fieldName = menuState.column.fieldName ?? menuState.column.key;
    const key = String(fieldName ?? '');
    const keyLower = key.toLowerCase();
    const existing = columnFilters[key] ?? columnFilters[keyLower];
    if (Array.isArray(existing)) {
      setMenuFilterValue(existing);
      setMenuFilterText('');
    } else {
      const text = typeof existing === 'string' ? existing : '';
      setMenuFilterValue(text);
      setMenuFilterText(text);
    }
  }, [menuState, columnFilters]);

  const onColumnHeaderClick = React.useCallback(
    (ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
      if (!column) {
        return;
      }
      ev?.preventDefault();
      ev?.stopPropagation();
      const gridCol = column as IGridColumn;
      const target = ev?.currentTarget as HTMLElement | undefined;
      openMenuForColumn(gridCol, target);
    },
    [openMenuForColumn],
  );

  const onColumnHeaderContextMenu = React.useCallback(
    (column?: IColumn, ev?: React.MouseEvent<HTMLElement>) => {
      if (!column) {
        return;
      }
      ev?.preventDefault();
      const gridCol = column as IGridColumn;
      const target = (ev?.currentTarget ?? ev?.target) as HTMLElement | undefined;
      openMenuForColumn(gridCol, target);
    },
    [openMenuForColumn],
  );

  const applyFilter = React.useCallback(() => {
    if (!menuState) {
      return;
    }
    const fieldName = menuState.column.fieldName ?? menuState.column.key;
    const updated: Record<string, string | string[]> = { ...columnFilters };
    // If any values are selected in the list, prefer them (exact match semantics).
    if (Array.isArray(menuFilterValue)) {
      const vals = menuFilterValue.map((v) => String(v).trim()).filter((v) => v !== '');
      if (vals.length > 0) {
        updated[fieldName] = vals;
        onColumnFiltersChange?.(updated);
        setMenuState(undefined);
        return;
      }
    }
    // Otherwise, apply free‑text contains
    const trimmed = String(menuFilterText ?? '').trim();
    if (trimmed === '') {
      delete updated[fieldName];
    } else {
      updated[fieldName] = trimmed;
    }
    onColumnFiltersChange?.(updated);
    setMenuState(undefined);
  }, [menuFilterValue, menuFilterText, menuState, onColumnFiltersChange, columnFilters]);

  const clearFilter = React.useCallback(() => {
    if (!menuState) {
      return;
    }
    const fieldName = menuState.column.fieldName ?? menuState.column.key;
    if (!(fieldName in columnFilters)) {
      const lookup = isLookupField(fieldName);
      setMenuFilterValue(lookup ? [] : '');
      setMenuFilterText('');
      setMenuState(undefined);
      return;
    }
    const updated = { ...columnFilters };
    delete updated[fieldName];
    onColumnFiltersChange?.(updated);
    const lookup = isLookupField(fieldName);
    setMenuFilterValue(lookup ? [] : '');
    setMenuFilterText('');
    setMenuState(undefined);
  }, [menuState, isLookupField, onColumnFiltersChange, columnFilters]);

  const menuItems = React.useMemo<IContextualMenuItem[]>(() => {
    if (!menuState) {
      return [];
    }
    const fieldName = menuState.column.fieldName ?? menuState.column.key;
    const lookup = isLookupField(fieldName);
    const baseOptions: IDropdownOption[] = getDistinctOptions([fieldName ?? '']);
    const extraOptions: IDropdownOption[] = menuExtraOptions
      .filter((v) => v && !baseOptions.some((b) => b.text.toLowerCase() === v.toLowerCase()))
      .map((v) => ({ key: v, text: v }));
    const valueOptions: IDropdownOption[] = [...baseOptions, ...extraOptions];
    const filteredValueOptions = valueOptions.filter((o) =>
      o.text.toLowerCase().includes(menuFilterText.toLowerCase()),
    );
    return [
      {
        key: 'sortAsc',
        text: 'Sort Ascending',
        iconProps: { iconName: 'SortUp' },
        onClick: () => handleSort(menuState.column, false),
      },
      {
        key: 'sortDesc',
        text: 'Sort Descending',
        iconProps: { iconName: 'SortDown' },
        onClick: () => handleSort(menuState.column, true),
      },
      {
        key: 'divider',
        itemType: ContextualMenuItemType.Divider,
      },
      {
        key: 'filterHeader',
        text: 'Filter',
        iconProps: { iconName: 'Filter' },
        disabled: true,
        style: { fontWeight: 600 },
      },
      {
        key: 'filterInput',
        onRender: () => (
          <div style={{ padding: '0 12px 12px', width: 260 }}>
            <Text variant="small" style={{ marginBottom: 4, display: 'block' }}>
              Contains
            </Text>
            {lookup ? (
              <>
                <TextField
                  placeholder={`Filter ${menuState.column.name}`}
                  value={menuFilterText}
                  onChange={(_, v) => {
                    const next = v ?? '';
                    setMenuFilterText(next);
                    if (onLoadFilterOptions && !isTextOnlyField(fieldName)) {
                      if (menuOptionsTimer.current) {
                        window.clearTimeout(menuOptionsTimer.current);
                      }
                      menuOptionsTimer.current = window.setTimeout(() => {
                        setMenuOptionsLoading(true);
                        void onLoadFilterOptions(fieldName ?? '', next)
                          .then((vals) => setMenuExtraOptions(vals ?? []))
                          .finally(() => setMenuOptionsLoading(false));
                      }, 350);
                    }
                  }}
                />
                {menuOptionsLoading && (
                  <Stack horizontal verticalAlign="center" style={{ margin: '6px 0' }}>
                    <Spinner size={SpinnerSize.small} />
                    <Text variant="small" style={{ marginLeft: 8 }}>Searching…</Text>
                  </Stack>
                )}
                <Dropdown
                  placeholder={`Select ${menuState.column.name}`}
                  options={filteredValueOptions}
                  multiSelect
                  selectedKeys={Array.isArray(menuFilterValue) ? menuFilterValue : []}
                  onChange={(_, opt) => {
                    const key = String(opt?.key ?? '');
                    setMenuFilterValue((prev) => {
                      const current = Array.isArray(prev) ? prev.slice() : [];
                      const idx = current.indexOf(key);
                      if (opt?.selected) {
                        if (idx === -1) current.push(key);
                      } else {
                        if (idx !== -1) current.splice(idx, 1);
                      }
                      return current;
                    });
                  }}
                  styles={{ dropdown: { width: '100%' } }}
                />
              </>
            ) : (
              <>
                <TextField
                  placeholder={`Filter ${menuState.column.name}`}
                  value={menuFilterText}
                  onChange={(_, v) => {
                    const next = v ?? '';
                    setMenuFilterText(next);
                    if (onLoadFilterOptions && !isTextOnlyField(fieldName)) {
                      if (menuOptionsTimer.current) {
                        window.clearTimeout(menuOptionsTimer.current);
                      }
                      menuOptionsTimer.current = window.setTimeout(() => {
                        setMenuOptionsLoading(true);
                        void onLoadFilterOptions(fieldName ?? '', next)
                          .then((vals) => setMenuExtraOptions(vals ?? []))
                          .finally(() => setMenuOptionsLoading(false));
                      }, 350);
                    }
                  }}
                />
                {menuOptionsLoading && (
                  <Stack horizontal verticalAlign="center" style={{ margin: '6px 0' }}>
                    <Spinner size={SpinnerSize.small} />
                    <Text variant="small" style={{ marginLeft: 8 }}>Searching…</Text>
                  </Stack>
                )}
                {!isTextOnlyField(fieldName) && (
                <Dropdown
                  placeholder={`Select ${menuState.column.name}`}
                  options={filteredValueOptions}
                  multiSelect
                  selectedKeys={Array.isArray(menuFilterValue) ? menuFilterValue : (menuFilterValue ? [menuFilterValue] : [])}
                  onChange={(_, opt) => {
                    const key = String(opt?.key ?? '');
                    setMenuFilterValue((prev) => {
                      const current = Array.isArray(prev) ? prev.slice() : (prev ? [String(prev)] : []);
                      const idx = current.indexOf(key);
                      if (opt?.selected) {
                        if (idx === -1) current.push(key);
                      } else {
                        if (idx !== -1) current.splice(idx, 1);
                      }
                      return current;
                    });
                  }}
                  styles={{ dropdown: { width: '100%' } }}
                />)}
              </>
            )}
            <Stack horizontal tokens={{ childrenGap: 8 }} style={{ marginTop: 8 }}>
              <PrimaryButton text="Apply" onClick={applyFilter} />
              <DefaultButton text="Clear" onClick={clearFilter} />
            </Stack>
          </div>
        ),
      },
    ];
  }, [applyFilter, clearFilter, handleSort, menuFilterValue, menuState, isLookupField, getDistinctOptions, scheduleLiveTextFilter]);

  if (datasetColumns.length === 0) {
    return <NoFields resources={resources} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <div style={{ height }}>
        {columnDatasetNotDefined && (
          <MessageBar messageBarType={MessageBarType.error} style={{ marginBottom: 16 }}>
            One or more column configurations reference fields that do not exist in the dataset.
          </MessageBar>
        )}
        {errorMessage && (
          <MessageBar messageBarType={MessageBarType.error} style={{ marginBottom: 16 }}>
            {errorMessage}
          </MessageBar>
        )}
        {showSearchPanel && (
        <Stack
          horizontal
          wrap
          verticalAlign="end"
          tokens={{ childrenGap: 16 }}
          style={{ marginBottom: 16 }}
        >
          <Stack.Item grow styles={{ root: { minWidth: 0 } }}>
            <Stack
              horizontal
              wrap
              verticalAlign="end"
              tokens={{ childrenGap: 16 }}
              styles={{ root: { rowGap: 12 } }}
            >
              <Stack.Item styles={{ root: { minWidth: 200 } }}>
                <Dropdown
                  label="Search by"
              options={searchByOptions}
              selectedKey={filters.searchBy}
              onChange={onSearchByChange}
              styles={{ dropdown: { width: '100%' } }}
            />
          </Stack.Item>
              {filters.searchBy === 'saleId' && (
                <Stack.Item styles={{ root: { minWidth: 200 } }}>
                  <TextField label="Sale ID" value={filters.saleId ?? ''} onChange={onSaleIdChange} onKeyDown={onFieldEnter} />
                </Stack.Item>
              )}
              {filters.searchBy === 'uprn' && (
                <Stack.Item styles={{ root: { minWidth: 200 } }}>
                  <TextField
                    label="UPRN"
                    value={filters.uprn ?? ''}
                    onChange={onUprnChange}
                    onKeyDown={onFieldEnter}
                    errorMessage={uprnError}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </Stack.Item>
              )}
              {filters.searchBy === 'taskId' && (
                <Stack.Item styles={{ root: { minWidth: 200 } }}>
                  <TextField
                    label="Task ID"
                    value={filters.taskId ?? ''}
                    onChange={onTaskIdChange}
                    onKeyDown={onFieldEnter}
                  />
                </Stack.Item>
              )}
              {filters.searchBy === 'manualCheck' && (
                <Stack.Item styles={{ root: { minWidth: 180 } }}>
                  <Dropdown
                    label="Manual check"
                    options={manualCheckOptions}
                    selectedKey={filters.manualCheck ?? 'all'}
                    onChange={onManualCheckChange}
                    styles={{ dropdown: { width: '100%' } }}
                  />
                </Stack.Item>
              )}
              {filters.searchBy === 'address' && (
                <>
                  <Stack.Item styles={{ root: { minWidth: 200 } }}>
                    <TextField
                      label="Building name/number"
                      value={filters.buildingNameNumber ?? ''}
                      onChange={onBuildingNameChange}
                      onKeyDown={onFieldEnter}
                    />
                  </Stack.Item>
                  <Stack.Item styles={{ root: { minWidth: 200 } }}>
                    <TextField
                      label="Street"
                      value={filters.street ?? ''}
                      onChange={onStreetChange}
                      onKeyDown={onFieldEnter}
                    />
                  </Stack.Item>
                  <Stack.Item styles={{ root: { minWidth: 200 } }}>
                    <TextField
                      label="Town or city"
                      value={filters.townCity ?? ''}
                      onChange={onTownChange}
                      onKeyDown={onFieldEnter}
                    />
                  </Stack.Item>
                  <Stack.Item styles={{ root: { minWidth: 160 } }}>
                    <TextField
                      label="Postcode"
                      value={filters.postcode ?? ''}
                      onChange={onPostcodeChange}
                      onKeyDown={onFieldEnter}
                    />
                    {showPostcodeHint && (
                      <Text variant="small" styles={{ root: { marginTop: 4 } }}>
                        Partial postcodes return all matching entries.
                      </Text>
                    )}
                  </Stack.Item>
                </>
              )}
              {filters.searchBy === 'street' && (
                <Stack.Item styles={{ root: { minWidth: 200 } }}>
                  <TextField
                    label="Street"
                    value={filters.street ?? ''}
                    onChange={onStreetChange}
                    onKeyDown={onFieldEnter}
                  />
                </Stack.Item>
              )}
              {filters.searchBy === 'town' && (
                <Stack.Item styles={{ root: { minWidth: 200 } }}>
                  <TextField
                    label="Town or city"
                    value={filters.townCity ?? ''}
                    onChange={onTownChange}
                    onKeyDown={onFieldEnter}
                  />
                </Stack.Item>
              )}
              {filters.searchBy === 'taskStatus' && (
                <Stack.Item styles={{ root: { minWidth: 200 } }}>
                  <Dropdown
                    label="Task Status"
                    options={getDistinctOptions(['taskstatus', 'taskStatus', 'status', 'statuscode'])}
                    selectedKey={filters.taskStatus}
                    onChange={onTaskStatusFilterChange}
                    styles={{ dropdown: { width: '100%' } }}
                  />
                </Stack.Item>
              )}
              {filters.searchBy === 'source' && (
                <Stack.Item styles={{ root: { minWidth: 200 } }}>
                  <Dropdown
                    label="Source"
                    options={getDistinctOptions(['source', 'sale_source', 'salesource'])}
                    selectedKey={filters.source}
                    onChange={onSourceFilterChange}
                    styles={{ dropdown: { width: '100%' } }}
                  />
                </Stack.Item>
              )}
              {filters.searchBy === 'postcode' && (
                <Stack.Item styles={{ root: { minWidth: 160 } }}>
                  <TextField
                    label="Postcode"
                    value={filters.postcode ?? ''}
                    onChange={onPostcodeChange}
                    onKeyDown={onFieldEnter}
                  />
                  {showPostcodeHint && (
                    <Text variant="small" styles={{ root: { marginTop: 4 } }}>
                      Partial postcodes return all matching entries.
                    </Text>
                  )}
                </Stack.Item>
              )}
              {filters.searchBy === 'qcCompletedDate' && (
                <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                  <Stack.Item styles={{ root: { minWidth: 160 } }}>
                    <DatePicker
                      label="QC Completed start"
                      firstDayOfWeek={DayOfWeek.Monday}
                      strings={dateStrings}
                      value={parseISODate(filters.qcCompletedDate?.from)}
                      formatDate={formatDisplayDate}
                      onSelectDate={(d) => updateFilters('qcCompletedDate', { ...(filters.qcCompletedDate ?? {}), from: toISODateString(d) })}
                    />
                  </Stack.Item>
                  <Stack.Item styles={{ root: { minWidth: 160 } }}>
                    <DatePicker
                      label="QC Completed end"
                      firstDayOfWeek={DayOfWeek.Monday}
                      strings={dateStrings}
                      value={parseISODate(filters.qcCompletedDate?.to)}
                      formatDate={formatDisplayDate}
                      onSelectDate={(d) => updateFilters('qcCompletedDate', { ...(filters.qcCompletedDate ?? {}), to: toISODateString(d) })}
                    />
                  </Stack.Item>
                </Stack>
              )}
            </Stack>
          </Stack.Item>
          <Stack.Item styles={{ root: { display: 'flex', alignItems: 'flex-end' } }}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
              {(shimmer || itemsLoading || isComponentLoading) && (
                <Spinner size={SpinnerSize.small} ariaLabel="Loading filter results" />
              )}
              <PrimaryButton text="Search" onClick={handleSearch} disabled={isSearchDisabled} />
              <Link
                onClick={(ev) => {
                  ev.preventDefault();
                  handleClear();
                }}
                aria-label="Clear all filters"
                styles={{ root: { fontSize: 14 } }}
              >
                Clear all
              </Link>
            </Stack>
          </Stack.Item>
        </Stack>
        )}
        {showResults && (
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }} style={{ margin: '4px 0 8px 0' }}>
            <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
              {selectedCount} selected of {typeof taskCount === 'number' ? taskCount : filteredItems.length}
            </Text>
            <DefaultButton
              text="Clear filters"
              iconProps={{ iconName: 'ClearFilter' }}
              onClick={() => clearAllColumnFilters()}
              disabled={Object.keys(columnFilters).length === 0}
              styles={{ root: { height: 28 } }}
            />
          </Stack>
        )}
        {showResults && (
        <ShimmeredDetailsList
          className={ClassNames.PowerCATFluentDetailsList}
          componentRef={componentRef}
          items={filteredItems}
          columns={columnsWithIcons}
          setKey="grid"
          enableShimmer={itemsLoading || shimmer}
          selectionMode={selectionType}
          selection={selection}
          checkboxVisibility={selectionType === SelectionMode.none ? CheckboxVisibility.hidden : CheckboxVisibility.always}
          onColumnHeaderClick={onColumnHeaderClick}
          onColumnHeaderContextMenu={onColumnHeaderContextMenu}
          onItemInvoked={onItemInvoked}
          columnReorderOptions={props.allowColumnReorder ? columnReorderOptions : undefined}
          compact={compact}
          isHeaderVisible={isHeaderVisible}
        />)}
        {showResults && menuState && (
          <ContextualMenu
            target={menuState.target}
            items={menuItems}
            onDismiss={() => setMenuState(undefined)}
            directionalHint={DirectionalHint.bottomLeftEdge}
            calloutProps={{ setInitialFocus: true }}
          />
        )}
        {showResults && (itemsLoading || isComponentLoading) && <Overlay />}
        {showResults && (
        <Stack
          horizontal
          tokens={{ childrenGap: 8 }}
          style={{ marginTop: 8 }}
          verticalAlign="center"
        >
          <DefaultButton
            text="Previous"
            onClick={onPrevPage}
            disabled={!canPrev}
            styles={{ root: { height: 32, padding: '0 8px' } }}
          />
          {(() => {
            const pageItems: (number | 'ellipsis')[] = [];
            if (totalPages <= 7) {
              pageItems.push(...Array.from({ length: totalPages }, (_, i) => i));
            } else if (currentPage <= 2) {
              pageItems.push(0, 1, 2, 3, 'ellipsis', totalPages - 1);
            } else if (currentPage >= totalPages - 3) {
              pageItems.push(0, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
            } else {
              pageItems.push(0, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages - 1);
            }

            return pageItems.map((item, index) => {
              if (item === 'ellipsis') {
                return (
                  <Text key={`page-ellipsis-${index}`} style={{ fontSize: 14, padding: '0 4px' }}>
                    ...
                  </Text>
                );
              }

              return (
                <DefaultButton
                  key={`page-${item}`}
                  styles={item === currentPage ? activePaginationButtonStyles : paginationButtonStyles}
                  onClick={() => onSetPage(item)}
                >
                  {item + 1}
                </DefaultButton>
              );
            });
          })()}
          <DefaultButton
            text="Next"
            onClick={onNextPage}
            disabled={!canNext}
            styles={{ root: { height: 32, padding: '0 8px' } }}
          />
        </Stack>
        )}
      </div>
    </ThemeProvider>
  );
});

Grid.displayName = 'Grid';
