import { 
  CheckboxVisibility,
  ColumnActionsMode,
  ContextualMenu,
  ContextualMenuItemType,
  createTheme,
  DetailsList,
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
  ConstrainMode,
  DetailsListLayoutMode,
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
  IComboBox,
  IComboBoxOption,
  Icon,
  Label,
  SearchBox,
  Spinner,
  SpinnerSize,
  Link,
  DatePicker,
  DayOfWeek,
  FocusTrapZone,
  IconButton,
  IDatePickerStrings,
} from '@fluentui/react';
import * as React from 'react';
import { NoFields } from '../DetailsListVOA/grid/NoFields';
import { RecordsColumns } from '../DetailsListVOA/config/ManifestConstants';
import { IGridColumn, ColumnConfig } from './Component.types';
import { GridCell } from '../DetailsListVOA/grid/GridCell';
import { ClassNames } from '../DetailsListVOA/grid/Grid.styles';
import { GridFilterState, NumericFilter, NumericFilterMode, createDefaultGridFilters, sanitizeFilters, SearchByOption, DateRangeFilter, isValidUkPostcode, normalizeUkPostcode } from './Filters';
import { getSearchByOptionsFor, getColumnFilterConfigFor, isLookupFieldFor, isViewSalesRecordEnabledFor, ColumnFilterConfig } from '../DetailsListVOA/config/TableConfigs';
import { MANAGER_PREFILTER_DEFAULT, MANAGER_SEARCH_BY_OPTIONS, MANAGER_BILLING_AUTHORITY_OPTIONS, MANAGER_CASEWORKER_OPTIONS, getManagerWorkThatOptions, isManagerCompletedWorkThat, type ManagerPrefilterState, type ManagerSearchBy, type ManagerWorkThat } from './config/PrefilterConfigs';

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;
type ColumnFilterValue = string | string[] | NumericFilter | DateRangeFilter;

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
  onColumnFiltersChange?: (filters: Record<string, ColumnFilterValue | string | string[]>) => void;
  allowColumnReorder?: boolean;
  columnFilters?: Record<string, ColumnFilterValue>;
  canvasScreenName?: string;
  onAssignTasks?: (user: AssignUser) => Promise<boolean>;
  statusMessage?: { text: string; type: MessageBarType };
  prefilterApplied?: boolean;
  onPrefilterApply?: (prefilters: ManagerPrefilterState) => void;
  onPrefilterClear?: () => void;
  onBackRequested?: () => void;
}

interface AssignUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  team: string;
  role: string;
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

const PREFILTER_COLLAPSE_BREAKPOINT = 1200;

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

const getFilterField = <T = unknown>(state: GridFilterState, key: keyof GridFilterState): T | undefined =>
  (state as unknown as Record<string, unknown>)[key as string] as T | undefined;
const getColumnFilterField = <T extends ColumnFilterValue = ColumnFilterValue>(
  state: Record<string, ColumnFilterValue>,
  key: string,
): T | undefined => (state as unknown as Record<string, ColumnFilterValue>)[key] as T | undefined;

type SearchControlType = 'text' | 'numeric' | 'dateRange' | 'singleSelect' | 'multiSelect' | 'textContains' | 'textPrefix';

interface SearchFieldConfig {
  key: SearchByOption;
  label: string;
  control: SearchControlType;
  stateKey: keyof GridFilterState;
  minLength?: number;
  placeholder?: string;
  inputMode?: 'numeric';
  transform?: (value?: string) => string;
  optionFields?: string[];
  options?: IDropdownOption[];
  selectAll?: boolean;
  selectAllValues?: string[];
  multiLimit?: number;
}

const SEARCH_FIELD_CONFIGS: Record<SearchByOption, SearchFieldConfig> = {
  manualCheck: {
    key: 'manualCheck',
    label: 'Manual check',
    control: 'singleSelect',
    stateKey: 'manualCheck',
    options: [
      { key: 'all', text: 'All' },
      { key: 'yes', text: 'Yes' },
      { key: 'no', text: 'No' },
    ],
  },
  street: { key: 'street', label: 'Street', control: 'textContains', stateKey: 'street', minLength: 1 },
  town: { key: 'town', label: 'Town/City', control: 'textContains', stateKey: 'townCity', minLength: 1 },
  source: { key: 'source', label: 'Source', control: 'textContains', stateKey: 'source', minLength: 1 },
  outlierKeySale: {
    key: 'outlierKeySale',
    label: 'Outlier / Key sale',
    control: 'multiSelect',
    stateKey: 'outlierKeySale',
    options: [
      { key: 'Outlier', text: 'Outlier' },
      { key: 'Key sale', text: 'Key sale' },
    ],
    selectAll: true,
    selectAllValues: ['Outlier', 'Key sale'],
  },
  saleId: { key: 'saleId', label: 'Sale ID', control: 'text', stateKey: 'saleId', placeholder: 'S-1000001' },
  taskId: { key: 'taskId', label: 'Task ID', control: 'text', stateKey: 'taskId', placeholder: 'A-1000001 / M-1000001' },
  uprn: {
    key: 'uprn',
    label: 'UPRN',
    control: 'text',
    stateKey: 'uprn',
    inputMode: 'numeric',
    transform: (v) => (v ?? '').replace(/\D/g, ''),
  },
  address: { key: 'address', label: 'Address', control: 'textContains', stateKey: 'address', minLength: 3 },
  postcode: {
    key: 'postcode',
    label: 'Post code',
    control: 'textPrefix',
    stateKey: 'postcode',
    minLength: 2,
    transform: (v) => (v ?? '').toUpperCase(),
  },
  billingAuthority: {
    key: 'billingAuthority',
    label: 'Billing Authority',
    control: 'multiSelect',
    stateKey: 'billingAuthority',
    optionFields: ['billingauthority'],
    multiLimit: 3,
  },
  transactionDate: { key: 'transactionDate', label: 'Transaction Date', control: 'dateRange', stateKey: 'transactionDate' },
  salePrice: { key: 'salePrice', label: 'Sale Price', control: 'numeric', stateKey: 'salePrice' },
  ratio: { key: 'ratio', label: 'Ratio', control: 'numeric', stateKey: 'ratio' },
  dwellingType: {
    key: 'dwellingType',
    label: 'Dwelling Type',
    control: 'multiSelect',
    stateKey: 'dwellingType',
    optionFields: ['dwellingtype'],
    selectAll: true,
  },
  flaggedForReview: {
    key: 'flaggedForReview',
    label: 'Flagged for review',
    control: 'singleSelect',
    stateKey: 'flaggedForReview',
    options: [
      { key: 'true', text: 'Yes' },
      { key: 'false', text: 'No' },
    ],
  },
  reviewFlags: {
    key: 'reviewFlags',
    label: 'Review Flags',
    control: 'multiSelect',
    stateKey: 'reviewFlags',
    optionFields: ['reviewflags'],
    selectAll: true,
  },
  outlierRatio: { key: 'outlierRatio', label: 'Outlier Ratio', control: 'numeric', stateKey: 'outlierRatio' },
  overallFlag: {
    key: 'overallFlag',
    label: 'Overall flag',
    control: 'multiSelect',
    stateKey: 'overallFlag',
    options: [
      { key: 'Exclude', text: 'Exclude' },
      { key: 'Exclude potential false', text: 'Exclude potential false' },
      { key: 'Investigate can use', text: 'Investigate can use' },
      { key: 'Investigate do not use', text: 'Investigate do not use' },
      { key: 'No flag', text: 'No flag' },
      { key: 'Not fully HPI adjusted', text: 'Not fully HPI adjusted' },
      { key: 'Remove', text: 'Remove' },
    ],
    selectAll: true,
    selectAllValues: [
      'Exclude',
      'Exclude potential false',
      'Investigate can use',
      'Investigate do not use',
      'No flag',
      'Not fully HPI adjusted',
      'Remove',
    ],
  },
  summaryFlag: {
    key: 'summaryFlag',
    label: 'Summary flag',
    control: 'textContains',
    stateKey: 'summaryFlag',
    minLength: 3,
  },
  taskStatus: {
    key: 'taskStatus',
    label: 'Task status',
    control: 'multiSelect',
    stateKey: 'taskStatus',
    optionFields: ['taskstatus', 'status', 'statuscode'],
    selectAll: true,
  },
  assignedTo: {
    key: 'assignedTo',
    label: 'Assigned to',
    control: 'singleSelect',
    stateKey: 'assignedTo',
    optionFields: ['assignedto'],
  },
  assignedDate: { key: 'assignedDate', label: 'Assigned date', control: 'dateRange', stateKey: 'assignedDate' },
  qcAssignedTo: {
    key: 'qcAssignedTo',
    label: 'QC Assigned to',
    control: 'singleSelect',
    stateKey: 'qcAssignedTo',
    optionFields: ['qcassignedto'],
  },
  qcAssignedDate: { key: 'qcAssignedDate', label: 'QC Assigned date', control: 'dateRange', stateKey: 'qcAssignedDate' },
  qcCompletedDate: { key: 'qcCompletedDate', label: 'QC Completed date', control: 'dateRange', stateKey: 'qcCompletedDate' },
};

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
    statusMessage,
    showResults,
    onLoadFilterOptions,
    onColumnFiltersChange,
    columnFilters,
    canvasScreenName,
    onAssignTasks,
    onPrefilterApply,
    prefilterApplied,
    onPrefilterClear,
    onBackRequested,
  } = props;

  const theme = useTheme(themeJSON);
  const topRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const paginationButtonStyles = React.useMemo(
    () => ({
      root: {
        height: 32,
        minWidth: 32,
        padding: '0 10px',
        borderRadius: 6,
        borderColor: theme.palette.neutralQuaternary,
      },
    }),
    [theme.palette.neutralQuaternary],
  );
  const activePaginationButtonStyles = React.useMemo(
    () => ({
      root: {
        height: 32,
        minWidth: 32,
        padding: '0 10px',
        borderRadius: 6,
        backgroundColor: theme.palette.themePrimary,
        borderColor: theme.palette.themePrimary,
        color: theme.palette.white,
        fontWeight: 600,
      },
      rootHovered: {
        backgroundColor: theme.palette.themeDark,
        borderColor: theme.palette.themeDark,
        color: theme.palette.white,
      },
    }),
    [theme.palette.themePrimary, theme.palette.themeDark, theme.palette.white],
  );

  const [columns, setColumns] = React.useState<IGridColumn[]>([]);
  const [isComponentLoading, setIsLoading] = React.useState(false);
  const [columnFiltersState, setColumnFilters] = React.useState<Record<string, ColumnFilterValue>>(columnFilters ?? {});
  const [menuState, setMenuState] = React.useState<{
    target: HTMLElement;
    column: IGridColumn;
  }>();
  const [menuFilterValue, setMenuFilterValue] = React.useState<ColumnFilterValue>('');
  const [menuFilterText, setMenuFilterText] = React.useState('');
  const [menuFilterError, setMenuFilterError] = React.useState<string | undefined>();
  const liveFilterTimer = React.useRef<number | undefined>(undefined);
  const [filters, setFilters] = React.useState<GridFilterState>(searchFilters);
  const autoSearchEnabled = false;
  const [assignPanelOpen, setAssignPanelOpen] = React.useState(false);
  const [assignSearch, setAssignSearch] = React.useState('');
  const [assignTeam, setAssignTeam] = React.useState<string | number | undefined>();
  const [assignRole, setAssignRole] = React.useState<string | number | undefined>();
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [assignSelectedUserId, setAssignSelectedUserId] = React.useState<string | undefined>();
  const [prefilters, setPrefilters] = React.useState<ManagerPrefilterState>(MANAGER_PREFILTER_DEFAULT);
  const [prefilterExpanded, setPrefilterExpanded] = React.useState(true);
  const [prefilterContainerWidth, setPrefilterContainerWidth] = React.useState<number | null>(null);

  const screenName = (canvasScreenName ?? '').toLowerCase();
  const isAssignment = screenName.includes('assignment');
  const isManagerAssign = isAssignment && screenName.includes('manager');
  const isQcAssign = isAssignment && (screenName.includes('qc') || screenName.includes('quality'));
  const isCaseworkerView = screenName.includes('caseworker');
  const isQcView = !isAssignment && (screenName.includes('qc') || screenName.includes('quality'));
  const isSalesSearch = screenName.includes('sales') || screenName.includes('record search');
  const showAssign = isManagerAssign || isQcAssign;
  const useAssignmentLayout = isManagerAssign;
  const assignActionText = isQcAssign ? 'Assign QC Tasks' : 'Assign Tasks';
  const assignHeaderText = isQcAssign ? 'QC Assignment' : 'Manager Assignment';
  const assignUserListTitle = isQcAssign ? 'QC Users' : 'SVT Users';
  const pageHeaderIconName = isManagerAssign
      ? 'People'
      : isQcAssign
        ? 'Shield'
        : isCaseworkerView
          ? 'Contact'
          : isQcView
            ? 'ClipboardList'
            : isSalesSearch
              ? 'Search'
              : undefined;
  const pageHeaderText = isManagerAssign
      ? 'Manager Assignment'
      : isQcAssign
        ? 'QC Assignment'
        : isCaseworkerView
          ? 'Caseworker View'
          : isQcView
            ? 'Quality Control View'
            : isSalesSearch
              ? 'Sales Record Search'
              : undefined;
  const prefilterStorageKey = React.useMemo(
    () => `voa-prefilters:${tableKey}:${screenName || 'default'}`,
    [screenName, tableKey],
  );

  React.useEffect(() => {
    if (columnFilters) {
      setColumnFilters(columnFilters);
    }
  }, [columnFilters]);

  const isPrefilterDefault = React.useCallback((state: ManagerPrefilterState): boolean => {
    return state.searchBy === 'billingAuthority'
      && state.billingAuthorities.length === 0
      && state.caseworkers.length === 0
      && !state.workThat
      && !state.completedFrom
      && !state.completedTo;
  }, []);

  React.useEffect(() => {
    if (!isManagerAssign) return;
    try {
      const raw = localStorage.getItem(prefilterStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ManagerPrefilterState>;
      const next: ManagerPrefilterState = {
        searchBy: parsed.searchBy === 'caseworker' ? 'caseworker' : 'billingAuthority',
        billingAuthorities: Array.isArray(parsed.billingAuthorities) ? parsed.billingAuthorities.map(String) : [],
        caseworkers: Array.isArray(parsed.caseworkers) ? parsed.caseworkers.map(String) : [],
        workThat: parsed.workThat,
        completedFrom: typeof parsed.completedFrom === 'string' ? parsed.completedFrom : undefined,
        completedTo: typeof parsed.completedTo === 'string' ? parsed.completedTo : undefined,
      };
      setPrefilters(next);
    } catch {
      // ignore parse errors
    }
  }, [isManagerAssign, prefilterStorageKey]);

  React.useEffect(() => {
    if (!isManagerAssign) return;
    try {
      if (isPrefilterDefault(prefilters)) {
        localStorage.removeItem(prefilterStorageKey);
      } else {
        localStorage.setItem(prefilterStorageKey, JSON.stringify(prefilters));
      }
    } catch {
      // ignore storage failures
    }
  }, [isManagerAssign, isPrefilterDefault, prefilterStorageKey, prefilters]);

  React.useEffect(() => {
    if (!useAssignmentLayout) return;
    const element = topRef.current;
    if (!element) return;
    const updateWidth = (width: number) => {
      if (!Number.isFinite(width)) return;
      setPrefilterContainerWidth(Math.round(width));
    };
    const updateFromElement = () => updateWidth(element.clientWidth);
    updateFromElement();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        updateWidth(entries[0].contentRect.width);
      });
      observer.observe(element);
      return () => observer.disconnect();
    }
    const handleResize = () => updateFromElement();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [useAssignmentLayout]);

  const isPrefilterNarrow = useAssignmentLayout
    && prefilterContainerWidth !== null
    && prefilterContainerWidth < PREFILTER_COLLAPSE_BREAKPOINT;

  const togglePrefilters = React.useCallback(() => {
    setPrefilterExpanded((prev) => !prev);
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

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const computeCompletedToDate = React.useCallback((from?: Date | null): string | undefined => {
    if (!from) return undefined;
    const start = new Date(from.getTime());
    start.setHours(0, 0, 0, 0);
    const target = new Date(start.getTime());
    target.setDate(target.getDate() + 14);
    const toDate = target > today ? today : target;
    return toISODateString(toDate);
  }, [today, toISODateString]);

  const prefilterFromDateError = React.useMemo(() => {
    if (!prefilters.completedFrom) return undefined;
    const from = parseISODate(prefilters.completedFrom);
    if (!from) return undefined;
    if (from > today) return 'Start date cannot be in the future';
    return undefined;
  }, [parseISODate, prefilters.completedFrom, today]);

  const onPrefilterSearchByChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      const next = option?.key === 'caseworker' ? 'caseworker' : 'billingAuthority';
      setPrefilters((prev) => ({
        ...prev,
        searchBy: next as ManagerSearchBy,
        billingAuthorities: next === 'billingAuthority' ? prev.billingAuthorities : [],
        caseworkers: next === 'caseworker' ? prev.caseworkers : [],
        workThat: undefined,
        completedFrom: undefined,
        completedTo: undefined,
      }));
    },
    [],
  );

  const onPrefilterBillingChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (!option) return;
      const key = String(option.key);
      setPrefilters((prev) => {
        const current = prev.billingAuthorities;
        const next = option.selected ? [...current, key] : current.filter((v) => v !== key);
        return { ...prev, billingAuthorities: next };
      });
    },
    [],
  );

  const onPrefilterCaseworkerChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (!option) return;
      const key = String(option.key);
      setPrefilters((prev) => {
        const current = prev.caseworkers;
        const next = option.selected ? [...current, key] : current.filter((v) => v !== key);
        return { ...prev, caseworkers: next };
      });
    },
    [],
  );

  const onPrefilterWorkThatChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      const nextWork = option?.key as ManagerWorkThat | undefined;
      setPrefilters((prev) => ({
        ...prev,
        workThat: nextWork,
        completedFrom: isManagerCompletedWorkThat(nextWork) ? prev.completedFrom : undefined,
        completedTo: isManagerCompletedWorkThat(nextWork) ? prev.completedTo : undefined,
      }));
    },
    [],
  );

  const onPrefilterFromDateChange = React.useCallback(
    (date?: Date | null) => {
      const fromIso = date ? toISODateString(date) : undefined;
      const toIso = computeCompletedToDate(date);
      setPrefilters((prev) => ({
        ...prev,
        completedFrom: fromIso,
        completedTo: toIso,
      }));
    },
    [computeCompletedToDate, toISODateString],
  );

  const handlePrefilterSearch = React.useCallback(() => {
    if (!onPrefilterApply) return;
    const normalized: ManagerPrefilterState = {
      ...prefilters,
      completedFrom: isManagerCompletedWorkThat(prefilters.workThat) ? prefilters.completedFrom : undefined,
      completedTo: isManagerCompletedWorkThat(prefilters.workThat) ? prefilters.completedTo : undefined,
    };
    onPrefilterApply(normalized);
    if (isPrefilterNarrow) {
      setPrefilterExpanded(false);
    }
  }, [isPrefilterNarrow, onPrefilterApply, prefilters]);

    const handlePrefilterClear = React.useCallback(() => {
      setPrefilters(MANAGER_PREFILTER_DEFAULT);
      onPrefilterClear?.();
    }, [onPrefilterClear]);

  const getLengthErrors = React.useCallback(
    (fs: GridFilterState) => {
      const cfg = SEARCH_FIELD_CONFIGS[fs.searchBy];
      let searchField: string | undefined;
      if (cfg?.minLength && typeof cfg.stateKey === 'string') {
        const val = getFilterField(fs, cfg.stateKey);
        const text = typeof val === 'string' ? val.trim() : '';
        if (text.length > 0 && text.length < cfg.minLength) {
          searchField = `Enter at least ${cfg.minLength} characters`;
        }
      }
      const address = (fs.address ?? '').trim();
      const postcode = normalizeUkPostcode(fs.postcode ?? '');
      const summary = (fs.summaryFlag ?? '').trim();
      const postcodeError = fs.searchBy === 'postcode' && postcode.length > 0
        ? postcode.length < 2
          ? 'Enter at least 2 characters'
          : !isValidUkPostcode(postcode, true)
            ? 'Enter a valid UK postcode'
            : undefined
        : undefined;
      return {
        address: fs.searchBy === 'address' && address.length > 0 && address.length < 3 ? 'Enter at least 3 characters' : undefined,
        postcode: postcodeError,
        summaryFlag: fs.searchBy === 'summaryFlag' && summary.length > 0 && summary.length < 3 ? 'Enter at least 3 characters' : undefined,
        searchField,
      };
    },
    [isValidUkPostcode, normalizeUkPostcode],
  );

  // Debounced search when typing in non-UPRN text fields
  const searchTimer = React.useRef<number | undefined>(undefined);
  const scheduleSearch = React.useCallback(() => {
    if (!autoSearchEnabled) {
      return;
    }
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
    searchTimer.current = window.setTimeout(() => {
      const lengthErrors = getLengthErrors(filters);
      if (lengthErrors.address || lengthErrors.postcode || lengthErrors.summaryFlag) {
        return;
      }
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
  }, [autoSearchEnabled, filters, getLengthErrors, onSearch]);

  React.useEffect(() => () => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
  }, []);

  React.useEffect(() => {
    setFilters(searchFilters);
  }, [searchFilters]);

  const searchByOptions = React.useMemo<IDropdownOption[]>(() => {
    const keys = getSearchByOptionsFor(tableKey);
    return keys.map((k) => {
      const cfg = SEARCH_FIELD_CONFIGS[k];
      const label = cfg?.label ?? k.charAt(0).toUpperCase() + k.slice(1);
      return { key: k, text: label };
    });
  }, [tableKey]);

  const lengthErrors = React.useMemo(() => getLengthErrors(filters), [filters, getLengthErrors]);
  const addressError = lengthErrors.address;
  const postcodeError = lengthErrors.postcode;
  const summaryFlagError = lengthErrors.summaryFlag;
  const searchFieldError = lengthErrors.searchField;

  const updateFilters = React.useCallback(
    (key: keyof GridFilterState, value: GridFilterState[keyof GridFilterState]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onSearchByChange = React.useCallback(
    (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (!option) {
        return;
      }
      const selected = option.key as SearchByOption;
      setFilters((prev) => ({
        ...prev,
        searchBy: selected,
      }));
    },
    [],
  );

  type NumericFilterKey = 'salePrice' | 'ratio' | 'outlierRatio';

  const updateNumericFilter = React.useCallback(
    (key: NumericFilterKey, part: 'mode' | 'min' | 'max', value: string) => {
      setFilters((prev) => {
        const current: NumericFilter = prev[key] ?? { mode: '>=' };
        const updated: NumericFilter = { ...current };
        if (part === 'mode') {
          const nextMode: NumericFilterMode = value === '<=' || value === 'between' ? value : '>=';
          updated.mode = nextMode;
        } else {
          const parsed = value === '' ? undefined : Number(value);
          updated[part] = typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : undefined;
        }
        return { ...prev, [key]: updated };
      });
    },
    [],
  );

  const isNumericFilterKey = (key: SearchByOption): key is NumericFilterKey =>
    key === 'salePrice' || key === 'ratio' || key === 'outlierRatio';

  const updateDateRange = React.useCallback(
    (key: 'transactionDate' | 'assignedDate' | 'qcAssignedDate' | 'qcCompletedDate', part: 'from' | 'to', value?: Date | null) => {
      setFilters((prev) => {
        const existing = prev[key] ?? {};
        return { ...prev, [key]: { ...existing, [part]: toISODateString(value) } };
      });
    },
    [toISODateString],
  );

  const updateMultiSelect = React.useCallback(
    (key: keyof GridFilterState, option?: IDropdownOption, limit?: number) => {
      if (!option) return;
      setFilters((prev) => {
        const current = (prev[key] as string[] | undefined) ?? [];
        let next: string[] = [...current];
        const optKey = String(option.key);
        const exists = next.includes(optKey);
        if (option.selected) {
          if (!exists) next.push(optKey);
        } else {
          next = next.filter((v) => v !== optKey);
        }
        if (limit && next.length > limit) next = next.slice(next.length - limit);
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const updateSingleSelect = React.useCallback(
    (key: keyof GridFilterState, option?: IDropdownOption) => {
      setFilters((prev) => ({ ...prev, [key]: (option?.key as string) ?? undefined }));
    },
    [],
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

  const isSearchDisabled = React.useMemo(
    () => !!uprnError || !!addressError || !!postcodeError || !!summaryFlagError || !!searchFieldError,
    [uprnError, addressError, postcodeError, summaryFlagError, searchFieldError],
  );

  const handleSearch = React.useCallback(() => {
    if (uprnError || addressError || postcodeError || summaryFlagError || searchFieldError) {
      return;
    }
    const sanitized = sanitizeFilters(filters);
    if (sanitized.searchBy === 'uprn' && sanitized.uprn && (sanitized.uprn.length < 8 || sanitized.uprn.length > 10)) {
      return;
    }
    setFilters(sanitized);
    onSearch(sanitized);
  }, [addressError, filters, onSearch, postcodeError, summaryFlagError, uprnError, searchFieldError]);

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
      (record as DataSet).key = getRecordKey(record);
      return record as DataSet;
    });
    setIsLoading(false);
    return mapped;
  }, [records, sortedRecordIds]);

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
    return isLookupFieldFor(tableKey, field);
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
      const activeFilter = columnFiltersState[(field ?? '').toString()] !== undefined;
      const sort = sorting?.find((s) => s.name === field);
      const sortIcon = sort ? (Number(sort.sortDirection) === 1 ? 'SortDown' : 'SortUp') : undefined;
      const iconName = sortIcon ?? (activeFilter ? 'Filter' : undefined);
      const columnName = c.name ?? String(field ?? '');
      const sortState = sort ? (Number(sort.sortDirection) === 1 ? 'sorted descending' : 'sorted ascending') : 'not sorted';
      const filterState = activeFilter ? 'filtered' : 'not filtered';
      return {
        ...c,
        iconName,
        isFiltered: activeFilter,
        isSorted: !!sort,
        isSortedDescending: sort ? Number(sort.sortDirection) === 1 : undefined,
        ariaLabel: `${columnName} column, ${sortState}, ${filterState}`,
        ariaLabelItemName: columnName,
      } as IGridColumn;
    });
  }, [columns, columnFiltersState, sorting]);

  const filteredItems = React.useMemo(() => {
    const t0 = performance.now();
    const filterEntries = Object.entries(columnFiltersState).filter(([, value]) => {
      if (value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      if ((value as NumericFilter).mode !== undefined) {
        const num = value as NumericFilter;
        if (num.mode === 'between') return num.min !== undefined || num.max !== undefined;
        if (num.mode === '>=') return num.min !== undefined;
        if (num.mode === '<=') return num.max !== undefined;
        return false;
      }
      if ((value as DateRangeFilter).from !== undefined || (value as DateRangeFilter).to !== undefined) {
        return true;
      }
      return false;
    });
    if (filterEntries.length === 0) {
      const t1 = performance.now();
      console.log('[Grid Perf] Client filteredItems (no filters) (ms):', Math.round(t1 - t0), 'items:', items.length);
      return items;
    }
    const out = items.filter((item) => {
      const record = item as unknown as Record<string, unknown>;
      return filterEntries.every(([fieldName, filterValue]) => {
        const cfg = getColumnFilterConfigFor(tableKey, fieldName);
        const raw = record[fieldName];
        const textVal = getFilterableText(raw).trim();
        if (cfg) {
          switch (cfg.control) {
            case 'textEq':
              return typeof filterValue === 'string'
                ? textVal.toLowerCase() === filterValue.trim().toLowerCase()
                : true;
            case 'textPrefix':
              return typeof filterValue === 'string'
                ? textVal.toLowerCase().startsWith(filterValue.trim().toLowerCase())
                : true;
            case 'textContains':
              return typeof filterValue === 'string'
                ? textVal.toLowerCase().includes(filterValue.trim().toLowerCase())
                : true;
            case 'singleSelect':
              return typeof filterValue === 'string'
                ? textVal.toLowerCase() === filterValue.trim().toLowerCase()
                : true;
            case 'multiSelect': {
              const needles = Array.isArray(filterValue)
                ? filterValue.map((v) => String(v).trim().toLowerCase())
                : [];
              if (needles.length === 0) return true;
              if (Array.isArray(raw)) {
                const hay = raw
                  .map((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v).trim().toLowerCase() : ''))
                  .filter((s) => s !== '');
                return needles.some((n) => hay.includes(n));
              }
              return needles.some((n) => textVal.toLowerCase() === n);
            }
            case 'numeric': {
              const numFilter = filterValue as NumericFilter;
              const numericRaw = typeof raw === 'number' ? raw : Number(textVal);
              if (Number.isNaN(numericRaw)) return false;
              if (numFilter.mode === 'between') {
                const minOk = numFilter.min !== undefined ? numericRaw >= numFilter.min : true;
                const maxOk = numFilter.max !== undefined ? numericRaw <= numFilter.max : true;
                return minOk && maxOk;
              }
              if (numFilter.mode === '>=') return numFilter.min !== undefined ? numericRaw >= numFilter.min : true;
              if (numFilter.mode === '<=') return numFilter.max !== undefined ? numericRaw <= numFilter.max : true;
              return true;
            }
            case 'dateRange': {
              const dr = filterValue as DateRangeFilter;
              const rawDate = textVal;
              const rawTime = Date.parse(rawDate);
              if (Number.isNaN(rawTime)) return false;
              const fromTime = dr.from ? Date.parse(dr.from) : undefined;
              const toTime = dr.to ? Date.parse(dr.to) : undefined;
              if (fromTime !== undefined && rawTime < fromTime) return false;
              if (toTime !== undefined && rawTime > toTime) return false;
              return true;
            }
            default:
              return true;
          }
        }
        if (Array.isArray(filterValue)) {
          const needles = filterValue.map((v) => String(v).trim().toLowerCase()).filter((v) => v !== '');
          if (needles.length === 0) return true;
          if (Array.isArray(raw)) {
            const hay = raw
              .map((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v).trim().toLowerCase() : ''))
              .filter((s) => s !== '');
            return needles.some((n) => hay.includes(n));
          }
          const text = textVal.toLowerCase();
          return needles.some((n) => text === n);
        }
        const needle = typeof filterValue === 'string' ? filterValue.trim().toLowerCase() : '';
        if (Array.isArray(raw)) {
          return raw.some((v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') && String(v).toLowerCase().includes(needle));
        }
        const text = textVal.toLowerCase();
        return text.includes(needle);
      });
    });
    const t1 = performance.now();
    console.log('[Grid Perf] Client filteredItems (ms):', Math.round(t1 - t0), 'items:', items.length, 'filters:', filterEntries.length, 'result:', out.length);
    return out;
  }, [columnFiltersState, getFilterableText, items, tableKey]);

  const clearAllColumnFilters = React.useCallback(() => {
    setColumnFilters(() => {
      const cleared: Record<string, ColumnFilterValue> = {};
      onColumnFiltersChange?.(cleared);
      return cleared;
    });
  }, [onColumnFiltersChange]);

  const getDistinctOptions = React.useCallback(
    (candidates: string[]): IDropdownOption[] => {
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
      console.log('[Grid Perf] Distinct options (ms):', Math.round(t1 - t0), 'candidates:', candidates.join(','), 'records:', Object.keys(records).length, 'options:', arr.length);
      return arr;
    },
    [getFilterableText, records],
  );

  const buildDropdownOptions = React.useCallback(
    (cfg: SearchFieldConfig): IComboBoxOption[] => {
      const deduped: IComboBoxOption[] = [];
      const seen = new Set<string>();
      const push = (opt?: IComboBoxOption) => {
        if (!opt) return;
        const key = String(opt.key);
        if (seen.has(key)) return;
        seen.add(key);
        deduped.push(opt);
      };
      (cfg.options ?? []).forEach(push);
      if (cfg.optionFields) {
        getDistinctOptions(cfg.optionFields).forEach(push);
      }
      let combined = deduped;
      if (cfg.selectAll) {
        combined = [{ key: 'all', text: 'Select all' }, ...combined];
      }
      return combined;
    },
    [getDistinctOptions],
  );

  const renderSearchControl = React.useCallback(() => {
    const cfg = SEARCH_FIELD_CONFIGS[filters.searchBy];
    if (!cfg) return null;

    const textError =
      cfg.key === 'address'
        ? addressError
        : cfg.key === 'postcode'
        ? postcodeError
        : cfg.key === 'summaryFlag'
        ? summaryFlagError
        : cfg.key === 'uprn'
        ? uprnError
        : filters.searchBy === cfg.key
        ? searchFieldError
        : undefined;

    if (cfg.control === 'text' || cfg.control === 'textContains' || cfg.control === 'textPrefix') {
      const val = getFilterField(filters, cfg.stateKey);
      const value = typeof val === 'string' ? val : '';
      return (
        <Stack.Item styles={{ root: { minWidth: cfg.control === 'textContains' ? 260 : 200 } }}>
          <TextField
            label={cfg.label}
            value={value}
            onChange={(_, v) => {
              const next = cfg.transform ? cfg.transform(v) : v ?? '';
              updateFilters(cfg.stateKey, next);
              if (cfg.key === 'taskId' || cfg.key === 'postcode') {
                scheduleSearch();
              }
            }}
            errorMessage={textError}
            inputMode={cfg.inputMode}
          />
          {cfg.key === 'postcode' && showPostcodeHint && (
            <Text variant="small" styles={{ root: { marginTop: 4 } }}>
              Partial postcodes return all matching entries.
            </Text>
          )}
        </Stack.Item>
      );
    }

    if (cfg.control === 'numeric') {
      const numericKey = cfg.stateKey as NumericFilterKey;
      const numericFilter = filters[numericKey] ?? { mode: '>=' };
      const mode = numericFilter.mode ?? '>=';
      const minValue = mode === '<=' ? numericFilter.max : numericFilter.min;
      const maxValue = numericFilter.max;
      return (
        <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
          <Stack.Item styles={{ root: { minWidth: 140 } }}>
            <Dropdown
              label="Options"
              options={[
                { key: '>=', text: 'Greater than or equal to' },
                { key: '<=', text: 'Less than or equal to' },
                { key: 'between', text: 'Between' },
              ]}
              selectedKey={mode}
              onChange={(_, o) =>
                updateNumericFilter(numericKey, 'mode', typeof o?.key === 'string' ? o.key : mode)
              }
            />
          </Stack.Item>
          <Stack.Item styles={{ root: { minWidth: 140 } }}>
            <TextField
              label={mode === '<=' ? 'Max' : 'Min'}
              type="number"
              value={String(minValue ?? '')}
              onChange={(_, v) => updateNumericFilter(numericKey, mode === '<=' ? 'max' : 'min', v ?? '')}
            />
          </Stack.Item>
          {mode === 'between' && (
            <Stack.Item styles={{ root: { minWidth: 140 } }}>
              <TextField
                label="Max"
                type="number"
                value={String(maxValue ?? '')}
                onChange={(_, v) => updateNumericFilter(numericKey, 'max', v ?? '')}
              />
            </Stack.Item>
          )}
        </Stack>
      );
    }

    if (cfg.control === 'dateRange') {
      const dateVal = getFilterField<{ from?: string; to?: string }>(filters, cfg.stateKey);
      const from = parseISODate(dateVal?.from);
      const to = parseISODate(dateVal?.to);
      return (
        <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
          <Stack.Item styles={{ root: { minWidth: 160 } }}>
            <DatePicker
              label={`${cfg.label} start`}
              firstDayOfWeek={DayOfWeek.Monday}
              strings={dateStrings}
              value={from}
              formatDate={formatDisplayDate}
              onSelectDate={(d) => updateDateRange(cfg.stateKey as 'transactionDate', 'from', d)}
            />
          </Stack.Item>
          <Stack.Item styles={{ root: { minWidth: 160 } }}>
            <DatePicker
              label={`${cfg.label} end`}
              firstDayOfWeek={DayOfWeek.Monday}
              strings={dateStrings}
              value={to}
              formatDate={formatDisplayDate}
              onSelectDate={(d) => updateDateRange(cfg.stateKey as 'transactionDate', 'to', d)}
            />
          </Stack.Item>
        </Stack>
      );
    }

    if (cfg.control === 'singleSelect') {
      const options = buildDropdownOptions(cfg);
      const selectedKey = getFilterField<string>(filters, cfg.stateKey);
      return (
        <Stack.Item styles={{ root: { minWidth: 200 } }}>
          <ComboBox
            label={cfg.label}
            options={options}
            selectedKey={selectedKey}
            allowFreeform={false}
            autoComplete="on"
            onChange={(_, opt) => updateSingleSelect(cfg.stateKey, opt as IDropdownOption)}
            styles={{
              root: { width: '100%' },
              callout: { minWidth: 240 },
              optionsContainer: { minWidth: 200 },
            }}
          />
        </Stack.Item>
      );
    }

    if (cfg.control === 'multiSelect') {
      const options = buildDropdownOptions(cfg);
      const selected = getFilterField<string[]>(filters, cfg.stateKey);
      return (
        <Stack.Item styles={{ root: { minWidth: 200 } }}>
          <ComboBox
            label={cfg.label}
            multiSelect
            allowFreeform={false}
            autoComplete="on"
            options={options}
            selectedKey={selected ?? []}
            onChange={(_, opt) => {
              if (!opt) return;
              if (opt.key === 'all') {
                const values =
                  cfg.selectAllValues ??
                  options
                    .filter((o) => o.key !== 'all')
                    .map((o) => String(o.key));
                updateFilters(cfg.stateKey, cfg.multiLimit ? values.slice(Math.max(0, values.length - cfg.multiLimit)) : values);
                return;
              }
              updateMultiSelect(cfg.stateKey, opt as IDropdownOption, cfg.multiLimit);
            }}
            styles={{
              root: { width: '100%' },
              callout: { minWidth: 240 },
              optionsContainer: { minWidth: 200 },
            }}
          />
        </Stack.Item>
      );
    }

    return null;
  }, [
    filters,
    addressError,
    postcodeError,
    summaryFlagError,
    searchFieldError,
    uprnError,
    updateFilters,
    scheduleSearch,
    showPostcodeHint,
    updateNumericFilter,
    parseISODate,
    dateStrings,
    formatDisplayDate,
    updateDateRange,
    buildDropdownOptions,
    updateSingleSelect,
    updateMultiSelect,
  ]);

  const scheduleLiveTextFilter = React.useCallback((fieldName: string, value: string) => {
    if (liveFilterTimer.current) {
      window.clearTimeout(liveFilterTimer.current);
    }
    liveFilterTimer.current = window.setTimeout(() => {
      setColumnFilters((prev) => {
        const updated: Record<string, ColumnFilterValue> = { ...prev };
        const trimmed = value.trim();
        if (trimmed === '') {
          delete updated[fieldName];
        } else {
          updated[fieldName] = trimmed;
        }
        return updated;
      });
    }, 300);
  }, []);

  React.useEffect(() => () => {
    if (liveFilterTimer.current) {
      window.clearTimeout(liveFilterTimer.current);
    }
  }, []);

  const onViewSelected = React.useCallback(() => {
    const selected = selection.getSelection();
    if (selected.length !== 1) return;
    const first = selected[0] as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | undefined;
    if (first) {
      onNavigate(first);
    }
  }, [onNavigate, selection]);

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

  const buildColumnFilterOptions = React.useCallback(
    (fieldName: string, cfg?: ColumnFilterConfig): IComboBoxOption[] => {
    const seen = new Set<string>();
      const opts: IComboBoxOption[] = [];
      const push = (key: string, text?: string) => {
        if (!key) return;
        if (seen.has(key)) return;
        seen.add(key);
        opts.push({ key, text: text ?? key });
      };
      (cfg?.options ?? []).forEach((o) => push(o, o));
      if (cfg?.optionFields) {
        getDistinctOptions(cfg.optionFields).forEach((o) => push(String(o.key), o.text));
      }
      if (cfg?.selectAllValues) {
        opts.unshift({ key: 'all', text: 'Select all' });
      }
      return opts;
    },
    [getDistinctOptions],
  );

  const openMenuForColumn = React.useCallback(
    (gridCol: IGridColumn, target?: HTMLElement) => {
      if (!target) {
        return;
      }
      const fieldName = (gridCol.fieldName ?? gridCol.key) ?? '';
      const cfg = getColumnFilterConfigFor(tableKey, fieldName);
      const existing = columnFiltersState[fieldName];
      let initialValue: ColumnFilterValue = '';
      if (cfg) {
        switch (cfg.control) {
          case 'textEq':
          case 'textPrefix':
          case 'textContains':
            initialValue = typeof existing === 'string' ? existing : '';
            break;
          case 'singleSelect':
            initialValue = typeof existing === 'string' ? existing : '';
            break;
          case 'multiSelect':
            initialValue = Array.isArray(existing) ? existing : [];
            break;
          case 'numeric':
            initialValue = (existing as NumericFilter) ?? { mode: '>=' };
            break;
          case 'dateRange':
            initialValue = (existing as DateRangeFilter) ?? {};
            break;
          default:
            initialValue = typeof existing === 'string' ? existing : '';
            break;
        }
      } else {
        initialValue = typeof existing === 'string' ? existing : '';
      }
      setMenuFilterValue(initialValue);
      setMenuFilterText(typeof initialValue === 'string' ? initialValue : '');
      setMenuFilterError(undefined);
      setMenuState({ target, column: gridCol });
    },
    [columnFiltersState, tableKey],
  );

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
    if (!menuState) return;
    const fieldName = (menuState.column.fieldName ?? menuState.column.key) ?? '';
    const normalizedField = fieldName.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (normalizedField === 'postcode') {
      const trimmed = normalizeUkPostcode(String(menuFilterText ?? ''));
      if (trimmed && !isValidUkPostcode(trimmed, true)) {
        setMenuFilterError('Enter a valid UK postcode');
        return;
      }
    }
    const cfg: ColumnFilterConfig | undefined = getColumnFilterConfigFor(tableKey, fieldName);
    if (menuFilterError) {
      setMenuFilterError(undefined);
    }
    setColumnFilters((prev) => {
      const updated: Record<string, ColumnFilterValue> = { ...prev };
      if (!cfg) {
        const trimmed = String(menuFilterText ?? '').trim();
        if (trimmed === '') delete updated[fieldName];
        else updated[fieldName] = trimmed;
        onColumnFiltersChange?.(updated);
        return updated;
      }
      switch (cfg.control) {
        case 'textEq':
        case 'textPrefix':
        case 'textContains': {
          const trimmed = String(menuFilterText ?? '').trim();
          if (trimmed === '') delete updated[fieldName];
          else updated[fieldName] = trimmed;
          break;
        }
        case 'singleSelect': {
          const val = typeof menuFilterValue === 'string' ? menuFilterValue : '';
          if (!val) delete updated[fieldName];
          else updated[fieldName] = val;
          break;
        }
        case 'multiSelect': {
          const vals = Array.isArray(menuFilterValue)
            ? menuFilterValue.map((v) => String(v).trim()).filter((v) => v !== '')
            : [];
          if (vals.length === 0) delete updated[fieldName];
          else updated[fieldName] = vals;
          break;
        }
        case 'numeric': {
          const val = (menuFilterValue as NumericFilter) ?? { mode: '>=' };
          const sanitized: NumericFilter = {
            mode: val.mode ?? '>=',
            min: val.min ?? undefined,
            max: val.max ?? undefined,
          };
          if (sanitized.mode === 'between' && sanitized.min === undefined && sanitized.max === undefined) {
            delete updated[fieldName];
          } else if (sanitized.mode === '>=' && sanitized.min === undefined) {
            delete updated[fieldName];
          } else if (sanitized.mode === '<=' && sanitized.max === undefined) {
            delete updated[fieldName];
          } else {
            updated[fieldName] = sanitized;
          }
          break;
        }
        case 'dateRange': {
          const val = (menuFilterValue as DateRangeFilter) ?? {};
          const normalized: DateRangeFilter = {
            from: val.from && val.from.trim() !== '' ? val.from : undefined,
            to: val.to && val.to.trim() !== '' ? val.to : undefined,
          };
          if (!normalized.from && !normalized.to) delete updated[fieldName];
          else updated[fieldName] = normalized;
          break;
        }
        default:
          break;
      }
      onColumnFiltersChange?.(updated);
      return updated;
    });
    setMenuState(undefined);
    menuState.target?.focus?.();
  }, [isValidUkPostcode, menuFilterError, menuFilterText, menuFilterValue, menuState, normalizeUkPostcode, onColumnFiltersChange, tableKey]);

  const clearFilter = React.useCallback(() => {
    if (!menuState) {
      return;
    }
    const fieldName = (menuState.column.fieldName ?? menuState.column.key) ?? '';
    setColumnFilters((prev) => {
      if (!(fieldName in prev)) return prev;
      const updated: Record<string, ColumnFilterValue> = { ...prev };
      delete updated[fieldName];
      onColumnFiltersChange?.(updated);
      return updated;
    });
    setMenuFilterValue('');
    setMenuFilterText('');
    setMenuFilterError(undefined);
    setMenuState(undefined);
    menuState.target?.focus?.();
  }, [menuState, onColumnFiltersChange]);

  const onGoToTop = React.useCallback(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    topRef.current?.focus?.();
  }, []);

  const assignUsers = React.useMemo(() => {
    if (isQcAssign) {
      return [
        { id: 'q1', firstName: 'Quinn', lastName: 'Adams', email: 'quinn.adams@example.com', team: 'QC Team A', role: 'QC Reviewer' },
        { id: 'q2', firstName: 'Rita', lastName: 'Brown', email: 'rita.brown@example.com', team: 'QC Team A', role: 'QC Reviewer' },
        { id: 'q3', firstName: 'Sam', lastName: 'Carter', email: 'sam.carter@example.com', team: 'QC Team B', role: 'QC Lead' },
        { id: 'q4', firstName: 'Tina', lastName: 'Davis', email: 'tina.davis@example.com', team: 'QC Team B', role: 'QC Reviewer' },
        { id: 'q5', firstName: 'Uma', lastName: 'Evans', email: 'uma.evans@example.com', team: 'QC Team C', role: 'QC Reviewer' },
      ];
    }
    return [
      { id: 'u1', firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@example.com', team: 'Team A', role: 'Caseworker' },
      { id: 'u2', firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@example.com', team: 'Team A', role: 'Caseworker' },
      { id: 'u3', firstName: 'Carol', lastName: 'Davis', email: 'carol.davis@example.com', team: 'Team B', role: 'Caseworker' },
      { id: 'u4', firstName: 'David', lastName: 'Brown', email: 'david.brown@example.com', team: 'Team B', role: 'Caseworker' },
      { id: 'u5', firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@example.com', team: 'Team C', role: 'Caseworker' },
    ];
  }, [isQcAssign]);

  const assignFilteredUsers = React.useMemo(() => {
    const term = assignSearch.trim().toLowerCase();
    return assignUsers.filter((u) => {
      if (assignTeam && u.team !== assignTeam) return false;
      if (assignRole && u.role !== assignRole) return false;
      if (!term) return true;
      return (
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [assignUsers, assignSearch, assignRole, assignTeam]);

  const handleAssignClick = React.useCallback(async (user: AssignUser) => {
    if (!onAssignTasks || assignLoading) return;
    setAssignSelectedUserId(user.id);
    setAssignLoading(true);
    try {
      const ok = await onAssignTasks(user);
      if (ok) {
        setAssignPanelOpen(false);
      }
    } finally {
      setAssignLoading(false);
      setAssignSelectedUserId(undefined);
    }
  }, [assignLoading, onAssignTasks]);

  const assignColumns = React.useMemo<IColumn[]>(
    () => [
      { key: 'firstName', name: 'First Name', fieldName: 'firstName', minWidth: 120, isResizable: true },
      { key: 'lastName', name: 'Last Name', fieldName: 'lastName', minWidth: 120, isResizable: true },
      { key: 'email', name: 'Email', fieldName: 'email', minWidth: 220, isResizable: true },
      {
        key: 'assign',
        name: 'Action',
        minWidth: 120,
        onRender: (item: AssignUser) => (
          <PrimaryButton
            text="Assign Task"
            ariaLabel={`Assign task to ${item.firstName} ${item.lastName}`}
            disabled={assignLoading || (!!assignSelectedUserId && assignSelectedUserId !== item.id)}
            onClick={() => {
              void handleAssignClick(item);
            }}
          />
        ),
      },
    ],
    [assignLoading, assignSelectedUserId, handleAssignClick],
  );

  const prefilterWorkThatOptions = React.useMemo(
    () => getManagerWorkThatOptions(prefilters.searchBy),
    [prefilters.searchBy],
  );
  const renderPrefilterTitle = React.useCallback((options?: IDropdownOption[]) => {
    const text = (options ?? [])
      .map((opt) => String(opt.text ?? opt.key ?? '').trim())
      .filter((val) => val !== '')
      .join(', ');
    return (
      <span className="voa-prefilter-title" title={text} aria-label={text}>
        {text}
      </span>
    );
  }, []);
  const prefilterNeedsCompletedDates = isManagerCompletedWorkThat(prefilters.workThat);
  const prefilterHasOwner = prefilters.searchBy === 'billingAuthority'
    ? prefilters.billingAuthorities.length > 0
    : prefilters.caseworkers.length > 0;
  const prefilterHasWorkThat = !!prefilters.workThat;
  const prefilterHasFromDate = !prefilterNeedsCompletedDates || !!prefilters.completedFrom;
  const prefilterSearchDisabled = !onPrefilterApply
    || !prefilterHasOwner
    || !prefilterHasWorkThat
    || !prefilterHasFromDate
    || !!prefilterFromDateError;
  const prefilterIsDefault = isPrefilterDefault(prefilters);
  const hasColumnFilters = Object.keys(columnFiltersState).length > 0;
  const showViewSalesRecord = isViewSalesRecordEnabledFor(tableKey);
  const showPrefilterToggle = useAssignmentLayout && !!showResults && !!prefilterApplied;
  const prefilterToggleText = prefilterExpanded ? 'Hide Prefilter' : 'Show Prefilter';

  const menuItems = React.useMemo<IContextualMenuItem[]>(() => {
    if (!menuState) return [];
    const fieldName = (menuState.column.fieldName ?? menuState.column.key) ?? '';
    const cfg = getColumnFilterConfigFor(tableKey, fieldName);
    const options = cfg?.control === 'multiSelect' || cfg?.control === 'singleSelect'
      ? buildColumnFilterOptions(fieldName, cfg)
      : [];
    const textVal = typeof menuFilterValue === 'string' ? menuFilterValue : '';
    const numVal = (menuFilterValue as NumericFilter) ?? { mode: '>=' };
    const dateVal = (menuFilterValue as DateRangeFilter) ?? {};
    const minLen = cfg?.minLength ?? 1;
    const normalizedField = fieldName.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const isPostcodeField = normalizedField === 'postcode';

    const isApplyDisabled = () => {
      if (!cfg) {
        return (menuFilterText ?? '').trim().length < minLen;
      }
      switch (cfg.control) {
        case 'textEq':
        case 'textPrefix':
        case 'textContains': {
          return (menuFilterText ?? '').trim().length < minLen;
        }
        case 'singleSelect': {
          const val = typeof menuFilterValue === 'string' ? menuFilterValue.trim() : '';
          return val.length < minLen;
        }
        case 'multiSelect': {
          const vals = Array.isArray(menuFilterValue)
            ? menuFilterValue.map((v) => String(v).trim()).filter((v) => v !== '')
            : [];
          return vals.length < minLen;
        }
        case 'numeric': {
          const v = (menuFilterValue as NumericFilter) ?? { mode: '>=' };
          if (v.mode === 'between') return v.min === undefined && v.max === undefined;
          if (v.mode === '<=') return v.max === undefined;
          return v.min === undefined;
        }
        case 'dateRange': {
          const v = (menuFilterValue as DateRangeFilter) ?? {};
          return !(v.from ?? v.to);
        }
        default:
          return false;
      }
    };
    const applyDisabled = isApplyDisabled();

    const renderControl = () => {
      if (!cfg) {
        return (
          <TextField
            label={`Filter ${menuState.column.name}`}
            placeholder={`Filter ${menuState.column.name}`}
            value={textVal}
            onChange={(_, v) => {
              const next = v ?? '';
              setMenuFilterValue(next);
              setMenuFilterText(next);
              if (menuFilterError) setMenuFilterError(undefined);
            }}
            errorMessage={isPostcodeField ? menuFilterError : undefined}
          />
        );
      }
      switch (cfg.control) {
        case 'textEq':
        case 'textPrefix':
        case 'textContains':
            return (
              <TextField
                label={`Filter ${menuState.column.name}`}
                placeholder={`Filter ${menuState.column.name}`}
                value={textVal}
                onChange={(_, v) => {
                  const next = v ?? '';
                  setMenuFilterValue(next);
                  setMenuFilterText(next);
                  if (menuFilterError) setMenuFilterError(undefined);
                }}
                errorMessage={isPostcodeField ? menuFilterError : undefined}
              />
            );
          case 'singleSelect':
            return (
              <ComboBox
                label={`Filter ${menuState.column.name}`}
                placeholder={`Select ${menuState.column.name}`}
                options={options}
                allowFreeform={false}
                autoComplete="on"
              selectedKey={typeof menuFilterValue === 'string' ? menuFilterValue : undefined}
              onChange={(_, opt) => setMenuFilterValue((opt?.key as string) ?? '')}
              styles={{
                root: { width: '100%' },
                callout: { minWidth: 240 },
                optionsContainer: { minWidth: 200 },
              }}
            />
          );
          case 'multiSelect':
            return (
          <ComboBox
            label={`Filter ${menuState.column.name}`}
            placeholder={`Select ${menuState.column.name}`}
            options={options}
            multiSelect
            allowFreeform={false}
            autoComplete="on"
            selectedKey={Array.isArray(menuFilterValue) ? menuFilterValue : []}
            onChange={(_, opt) => {
              if (!opt) return;
              if (opt.key === 'all' && cfg.selectAllValues) {
                setMenuFilterValue(cfg.selectAllValues);
                return;
              }
              setMenuFilterValue((prev) => {
                const current = Array.isArray(prev) ? prev.slice() : [];
                const key = String(opt.key);
                  const idx = current.indexOf(key);
                  if (opt.selected) {
                    if (idx === -1) current.push(key);
                  } else if (idx !== -1) {
                    current.splice(idx, 1);
                  }
                  if (cfg.multiLimit && current.length > cfg.multiLimit) {
                    return current.slice(current.length - cfg.multiLimit);
                  }
                  return current;
                });
              }}
              styles={{
                root: { width: '100%' },
                callout: { minWidth: 240 },
                optionsContainer: { minWidth: 200 },
              }}
            />
          );
        case 'numeric':
          return (
            <Stack tokens={{ childrenGap: 8 }}>
              <Dropdown
                label="Options"
                options={[
                  { key: '>=', text: 'Greater than or equal to' },
                  { key: '<=', text: 'Less than or equal to' },
                  { key: 'between', text: 'Between' },
                ]}
                selectedKey={numVal.mode ?? '>='}
                onChange={(_, opt) =>
                  setMenuFilterValue((prev) => {
                    const current = (prev as NumericFilter) ?? { mode: '>=' };
                    const mode = typeof opt?.key === 'string' ? (opt.key as NumericFilter['mode']) : current.mode ?? '>=';
                    return { ...current, mode };
                  })
                }
              />
              <TextField
                label={`${menuState.column.name} ${numVal.mode === '<=' ? 'max' : 'min'}`}
                type="number"
                value={String(numVal.mode === '<=' ? numVal.max ?? '' : numVal.min ?? '')}
                onChange={(_, v) =>
                  setMenuFilterValue((prev) => {
                    const current = (prev as NumericFilter) ?? { mode: '>=' };
                    const mode = current.mode ?? '>=';
                    if (mode === '<=') {
                      return { ...current, max: v === '' ? undefined : Number(v) };
                    }
                    return { ...current, min: v === '' ? undefined : Number(v) };
                  })
                }
              />
              {numVal.mode === 'between' && (
                <TextField
                  label={`${menuState.column.name} max`}
                  type="number"
                  value={String(numVal.max ?? '')}
                  onChange={(_, v) =>
                    setMenuFilterValue((prev) => {
                      const current = (prev as NumericFilter) ?? { mode: 'between' };
                      return { ...current, max: v === '' ? undefined : Number(v) };
                    })
                  }
                />
              )}
            </Stack>
          );
        case 'dateRange':
          return (
            <Stack tokens={{ childrenGap: 8 }}>
              <DatePicker
                label={`${menuState.column.name} start`}
                firstDayOfWeek={DayOfWeek.Monday}
                strings={dateStrings}
                value={parseISODate(dateVal.from)}
                formatDate={formatDisplayDate}
                onSelectDate={(d) =>
                  setMenuFilterValue((prev) => {
                    const current = (prev as DateRangeFilter) ?? {};
                    return { ...current, from: toISODateString(d) };
                  })
                }
              />
              <DatePicker
                label={`${menuState.column.name} end`}
                firstDayOfWeek={DayOfWeek.Monday}
                strings={dateStrings}
                value={parseISODate(dateVal.to)}
                formatDate={formatDisplayDate}
                onSelectDate={(d) =>
                  setMenuFilterValue((prev) => {
                    const current = (prev as DateRangeFilter) ?? {};
                    return { ...current, to: toISODateString(d) };
                  })
                }
              />
            </Stack>
          );
        default:
          return null;
      }
    };

    const columnName = menuState.column.name ?? 'column';
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
      { key: 'divider', itemType: ContextualMenuItemType.Divider },
      {
        key: 'filterInput',
        onRender: () => (
          <div style={{ padding: '0 12px 12px', width: 280 }}>
            {renderControl()}
            <Stack horizontal tokens={{ childrenGap: 8 }} style={{ marginTop: 8 }}>
              <PrimaryButton
                text="Apply"
                onClick={applyFilter}
                disabled={applyDisabled}
                ariaLabel={`Apply filter for ${columnName}`}
              />
              <DefaultButton text="Clear" onClick={clearFilter} ariaLabel={`Clear filter for ${columnName}`} />
            </Stack>
          </div>
        ),
      },
    ];
  }, [
    menuState,
    tableKey,
    menuFilterError,
    menuFilterValue,
    menuFilterText,
    handleSort,
    buildColumnFilterOptions,
    applyFilter,
    clearFilter,
    dateStrings,
    parseISODate,
    formatDisplayDate,
    toISODateString,
  ]);

  if (datasetColumns.length === 0) {
    return <NoFields resources={resources} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <div
        className={`voa-grid-shell${useAssignmentLayout ? ' voa-grid-shell--assignment' : ''}`}
        style={{ height, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}
        ref={topRef}
        tabIndex={-1}
        aria-label="Results table"
      >
        <div className="voa-skip-links">
          <a href="#voa-grid-results">Skip to results</a>
          <a href="#voa-grid-pagination">Skip to pagination</a>
        </div>
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
          {statusMessage && (
            <MessageBar messageBarType={statusMessage.type} style={{ marginBottom: 16 }}>
              {statusMessage.text}
            </MessageBar>
          )}
          {pageHeaderText && useAssignmentLayout && (
            <div className="voa-command-bar" role="heading" aria-level={2}>
              <div className="voa-command-bar__left">
                {onBackRequested && (
                  <IconButton
                    className="voa-back-button"
                    iconProps={{ iconName: 'Back' }}
                    ariaLabel="Back"
                    title="Back"
                    onClick={onBackRequested}
                  />
                )}
                <div className="voa-command-bar__title-group">
                  <Text variant="large" className="voa-command-bar__title">
                    {pageHeaderText}
                  </Text>
                  <Text variant="small" className="voa-command-bar__meta" role="status" aria-live="polite">
                    Selected: {selectedCount} of {typeof taskCount === 'number' ? taskCount : filteredItems.length}
                  </Text>
                </div>
              </div>
              <div className="voa-command-bar__actions">
                {showPrefilterToggle && (
                  <DefaultButton
                    className="voa-prefilter-toggle"
                    text={prefilterToggleText}
                    iconProps={{ iconName: prefilterExpanded ? 'FilterSolid' : 'Filter' }}
                    ariaLabel={prefilterToggleText}
                    title={prefilterToggleText}
                    aria-expanded={prefilterExpanded}
                    aria-controls="voa-prefilter-panel"
                    onClick={togglePrefilters}
                  />
                )}
                {showResults && showViewSalesRecord && (
                  <DefaultButton
                    text="View Sales Record"
                    iconProps={{ iconName: 'View' }}
                    onClick={onViewSelected}
                    disabled={selectedCount !== 1}
                    ariaLabel="View selected sales record"
                  />
                )}
                {hasColumnFilters && (
                  <DefaultButton
                    text="Clear filters"
                    iconProps={{ iconName: 'ClearFilter' }}
                    onClick={() => clearAllColumnFilters()}
                    disabled={!hasColumnFilters}
                    ariaLabel="Clear column filters"
                  />
                )}
                {showAssign && (
                  <PrimaryButton
                    text={assignActionText}
                    iconProps={{ iconName: 'AddFriend' }}
                    onClick={() => setAssignPanelOpen(true)}
                    disabled={selectedCount === 0}
                    ariaLabel={assignActionText}
                  />
                )}
              </div>
            </div>
          )}
          {pageHeaderText && !useAssignmentLayout && (
            <div className="voa-page-header" role="heading" aria-level={2}>
              {onBackRequested && (
                <IconButton
                  className="voa-back-button"
                  iconProps={{ iconName: 'Back' }}
                  ariaLabel="Back"
                  title="Back"
                  onClick={onBackRequested}
                />
              )}
              <div className="voa-page-header__center">
                {pageHeaderIconName && (
                  <Icon iconName={pageHeaderIconName} className="voa-page-header__icon" aria-hidden="true" />
                )}
                <Text variant="xLarge" className="voa-page-header__title">
                  {pageHeaderText}
                </Text>
              </div>
            </div>
          )}
          {isManagerAssign && prefilterExpanded && (
        <Stack
          horizontal
          wrap
          verticalAlign="end"
          tokens={{ childrenGap: 16 }}
          id="voa-prefilter-panel"
          className={`voa-prefilter-bar${useAssignmentLayout ? ' voa-prefilter-bar--inline' : ''}${prefilterNeedsCompletedDates ? '' : ' voa-prefilter-bar--no-date'}`}
        >
          <Stack.Item className="voa-prefilter-col voa-prefilter-col-searchby-label">
            <div className="voa-prefilter-field">
              <Label htmlFor="prefilter-searchby" className="voa-prefilter-label">Search by</Label>
            </div>
          </Stack.Item>
          <Stack.Item className="voa-prefilter-col voa-prefilter-col-searchby-field">
            <div className="voa-prefilter-field">
              <Dropdown
                id="prefilter-searchby"
                ariaLabel="Search by"
                options={MANAGER_SEARCH_BY_OPTIONS}
                selectedKey={prefilters.searchBy}
                onChange={onPrefilterSearchByChange}
                onRenderTitle={renderPrefilterTitle}
                styles={{ dropdown: { width: '100%' } }}
              />
            </div>
          </Stack.Item>
          {prefilters.searchBy === 'billingAuthority' ? (
            <>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-label">
                <div className="voa-prefilter-field">
                  <Label htmlFor="prefilter-billing" className="voa-prefilter-label">Billing Authority</Label>
                </div>
              </Stack.Item>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-field">
                <div className="voa-prefilter-field">
                  <Dropdown
                    id="prefilter-billing"
                    ariaLabel="Billing Authority"
                    placeholder="Select Billing Authorities"
                    multiSelect
                    options={MANAGER_BILLING_AUTHORITY_OPTIONS}
                    selectedKeys={prefilters.billingAuthorities}
                    onChange={onPrefilterBillingChange}
                    onRenderTitle={renderPrefilterTitle}
                    styles={{ dropdown: { width: '100%' } }}
                  />
                </div>
              </Stack.Item>
            </>
          ) : (
            <>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-label">
                <div className="voa-prefilter-field">
                  <Label htmlFor="prefilter-caseworker" className="voa-prefilter-label">Caseworker</Label>
                </div>
              </Stack.Item>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-field">
                <div className="voa-prefilter-field">
                  <Dropdown
                    id="prefilter-caseworker"
                    ariaLabel="Caseworker"
                    placeholder="Select User"
                    multiSelect
                    options={MANAGER_CASEWORKER_OPTIONS}
                    selectedKeys={prefilters.caseworkers}
                    onChange={onPrefilterCaseworkerChange}
                    onRenderTitle={renderPrefilterTitle}
                    styles={{ dropdown: { width: '100%' } }}
                  />
                </div>
              </Stack.Item>
            </>
          )}
          <Stack.Item className="voa-prefilter-col voa-prefilter-col-workthat-label">
            <div className="voa-prefilter-field">
              <Label htmlFor="prefilter-workthat" className="voa-prefilter-label">Work that</Label>
            </div>
          </Stack.Item>
          <Stack.Item className="voa-prefilter-col voa-prefilter-col-workthat-field">
            <div className="voa-prefilter-field">
              <Dropdown
                id="prefilter-workthat"
                ariaLabel="Work that"
                placeholder="Select a option"
                options={prefilterWorkThatOptions}
                selectedKey={prefilters.workThat}
                onChange={onPrefilterWorkThatChange}
                onRenderTitle={renderPrefilterTitle}
                styles={{ dropdown: { width: '100%' } }}
              />
            </div>
          </Stack.Item>
          {prefilterNeedsCompletedDates && (
            <>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-daterange-label">
                <div className="voa-prefilter-field">
                  <Label
                    id="voa-prefilter-date-range"
                    className="voa-prefilter-label voa-prefilter-label--daterange"
                  >
                    Select Completed Date Range
                  </Label>
                </div>
              </Stack.Item>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-daterange-fields">
                <div role="group" aria-labelledby="voa-prefilter-date-range" className="voa-prefilter-field">
                  <div className="voa-prefilter-date-fields">
                    <DatePicker
                      placeholder="Select a From date..."
                      firstDayOfWeek={DayOfWeek.Monday}
                      strings={dateStrings}
                      value={parseISODate(prefilters.completedFrom)}
                      formatDate={formatDisplayDate}
                      onSelectDate={onPrefilterFromDateChange}
                      maxDate={today}
                      styles={{ root: { width: 180 } }}
                      ariaLabel="From date"
                    />
                    {prefilterFromDateError && (
                      <Text variant="small" styles={{ root: { color: theme.palette.redDark, marginTop: -2 } }}>
                        {prefilterFromDateError}
                      </Text>
                    )}
                    <DatePicker
                      placeholder="Select a To date..."
                      firstDayOfWeek={DayOfWeek.Monday}
                      strings={dateStrings}
                      value={parseISODate(prefilters.completedTo)}
                      formatDate={formatDisplayDate}
                      disabled
                      styles={{ root: { width: 180 } }}
                      ariaLabel="To date"
                    />
                  </div>
                </div>
              </Stack.Item>
            </>
          )}
          <Stack.Item className="voa-prefilter-col voa-prefilter-col-actions">
            <div className="voa-prefilter-field voa-prefilter-actions">
              <span className="voa-prefilter-label-spacer" aria-hidden="true"></span>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
                <PrimaryButton
                  text="Search"
                  iconProps={{ iconName: 'Search' }}
                  onClick={handlePrefilterSearch}
                  disabled={prefilterSearchDisabled}
                />
                {!prefilterIsDefault && (
                  <DefaultButton
                    text="Clear search"
                    iconProps={{ iconName: 'ClearFilter' }}
                    onClick={handlePrefilterClear}
                    aria-label="Clear search filters"
                    className="voa-prefilter-clear"
                  />
                )}
              </Stack>
            </div>
          </Stack.Item>
        </Stack>
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
              {renderSearchControl()}
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
          {showResults && !useAssignmentLayout && (
            <div className="voa-grid-toolbar" role="toolbar" aria-label="Table actions">
              <div className="voa-grid-toolbar__left">
                {hasColumnFilters && (
                  <DefaultButton
                    text="Clear filters"
                    iconProps={{ iconName: 'ClearFilter' }}
                    onClick={() => clearAllColumnFilters()}
                    disabled={!hasColumnFilters}
                    ariaLabel="Clear column filters"
                  />
                )}
              </div>
              <div className="voa-grid-toolbar__center" role="status" aria-live="polite">
                <Text variant="medium" className="voa-grid-toolbar__count">
                  Selected: {selectedCount} of {typeof taskCount === 'number' ? taskCount : filteredItems.length}
                </Text>
              </div>
              <div className="voa-grid-toolbar__right">
                {showViewSalesRecord && (
                  <DefaultButton
                    text="View Sales Record"
                    iconProps={{ iconName: 'View' }}
                    onClick={onViewSelected}
                    disabled={selectedCount !== 1}
                    ariaLabel="View selected sales record"
                  />
                )}
                {showAssign && (
                  <DefaultButton
                    text={assignActionText}
                    iconProps={{ iconName: 'AddFriend' }}
                    onClick={() => setAssignPanelOpen(true)}
                    ariaLabel={assignActionText}
                  />
                )}
              </div>
            </div>
          )}
          {showResults && (
            <div
              id="voa-grid-results"
              ref={resultsRef}
              className="voa-grid-results"
              data-is-scrollable="true"
              style={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflowY: 'scroll',
                overflowX: 'auto',
              }}
              role="region"
              aria-label="Results table scroll region"
              tabIndex={0}
            >
              <div className="voa-grid-list">
                <ShimmeredDetailsList
                  className={ClassNames.PowerCATFluentDetailsList}
                  componentRef={componentRef}
                  items={filteredItems}
                  columns={columnsWithIcons}
                  setKey="grid"
                  enableShimmer={itemsLoading || shimmer}
                  onShouldVirtualize={() => true}
                  useReducedRowRenderer={true}
                  enableUpdateAnimations={false}
                  selectionMode={selectionType}
                  selection={selection}
                  checkboxVisibility={selectionType === SelectionMode.none ? CheckboxVisibility.hidden : CheckboxVisibility.always}
                  constrainMode={ConstrainMode.unconstrained}
                  layoutMode={DetailsListLayoutMode.fixedColumns}
                  onColumnHeaderClick={onColumnHeaderClick}
                  onColumnHeaderContextMenu={onColumnHeaderContextMenu}
                  onItemInvoked={onItemInvoked}
                  columnReorderOptions={props.allowColumnReorder ? columnReorderOptions : undefined}
                  compact={compact}
                  isHeaderVisible={isHeaderVisible}
                />
              </div>
              {!itemsLoading && !shimmer && filteredItems.length === 0 && (
                <div className="voa-empty-state" role="status" aria-live="polite">
                  <div className="voa-empty-state__icon" aria-hidden="true">
                    <Icon iconName="PageList" />
                  </div>
                  <Text variant="mediumPlus" className="voa-empty-state__title">
                    We didn&apos;t find anything to show here
                  </Text>
                  <Text variant="small" className="voa-empty-state__text">
                    Try adjusting your filters or search.
                  </Text>
                </div>
              )}
            </div>
          )}
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
            id="voa-grid-pagination"
            horizontal
            tokens={{ childrenGap: 6 }}
            className="voa-grid-pagination"
            style={{ width: '100%' }}
            verticalAlign="center"
            role="navigation"
            aria-label="Pagination"
          >
            <DefaultButton
              aria-label="Previous page"
              text="Previous"
              iconProps={{ iconName: 'ChevronLeft' }}
              onClick={onPrevPage}
              disabled={!canPrev}
              styles={paginationButtonStyles}
            />
            {(() => {
              const pageItems: (number | 'ellipsis')[] = [];
              if (totalPages <= 11) {
                pageItems.push(...Array.from({ length: totalPages }, (_, i) => i));
              } else if (currentPage <= 4) {
                pageItems.push(0, 1, 2, 3, 4, 5, 6, 'ellipsis', totalPages - 1);
              } else if (currentPage >= totalPages - 5) {
                pageItems.push(0, 'ellipsis', totalPages - 6, totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
              } else {
                pageItems.push(0, 'ellipsis', currentPage - 3, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, currentPage + 3, 'ellipsis', totalPages - 1);
              }

              return pageItems.map((item, index) => {
                if (item === 'ellipsis') {
                  return (
                    <Text key={`page-ellipsis-${index}`} style={{ fontSize: 14, padding: '0 6px' }} aria-hidden="true">
                      ...
                    </Text>
                  );
                }

                const isCurrent = item === currentPage;
                return (
                  <DefaultButton
                    key={`page-${item}`}
                    aria-label={`Page ${item + 1}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    styles={isCurrent ? activePaginationButtonStyles : paginationButtonStyles}
                    onClick={() => onSetPage(item)}
                  >
                    {item + 1}
                  </DefaultButton>
                );
              });
            })()}
            <DefaultButton
              aria-label="Next page"
              text="Next"
              iconProps={{ iconName: 'ChevronRight' }}
              onClick={onNextPage}
              disabled={!canNext}
              styles={paginationButtonStyles}
            />
            <Stack.Item styles={{ root: { marginLeft: 'auto' } }}>
              <DefaultButton
                text="Top"
                iconProps={{ iconName: 'ChevronUp' }}
                aria-label="Go to top"
                onClick={onGoToTop}
                styles={paginationButtonStyles}
              />
            </Stack.Item>
          </Stack>
        )}
        {assignPanelOpen && (
          <div className="voa-assign-overlay" role="dialog" aria-modal="true" aria-labelledby="assign-screen-title">
            <FocusTrapZone>
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { minHeight: '100%', padding: 20 } }}>
                <Stack horizontal verticalAlign="center" styles={{ root: { borderBottom: '1px solid #e1e1e1', paddingBottom: 12 } }}>
                  <DefaultButton
                    text="Back"
                    iconProps={{ iconName: 'Back' }}
                    onClick={() => setAssignPanelOpen(false)}
                    ariaLabel="Back to manager assignment"
                  />
                  <Text id="assign-screen-title" variant="xLarge" styles={{ root: { marginLeft: 12, fontWeight: 600 } }}>
                    {assignHeaderText}
                  </Text>
                  <Stack.Item styles={{ root: { marginLeft: 'auto' } }}>
                    <IconButton
                      iconProps={{ iconName: 'Cancel' }}
                      ariaLabel="Close assign tasks screen"
                      onClick={() => setAssignPanelOpen(false)}
                    />
                  </Stack.Item>
                </Stack>
                <SearchBox
                  placeholder="Search user"
                  ariaLabel="Search user"
                  value={assignSearch}
                  onChange={(_, v) => setAssignSearch(v ?? '')}
                  disabled={assignLoading}
                />
                <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
                  <Dropdown
                    label="Team"
                    selectedKey={assignTeam}
                    placeholder="Filter by team"
                    options={assignUsers
                      .map((u) => u.team)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((team) => ({ key: team, text: team }))}
                    onChange={(_, opt) => setAssignTeam(opt?.key)}
                    disabled={assignLoading}
                    styles={{ root: { minWidth: 200 } }}
                  />
                  <Dropdown
                    label="Role"
                    selectedKey={assignRole}
                    placeholder="Filter by role"
                    options={assignUsers
                      .map((u) => u.role)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((role) => ({ key: role, text: role }))}
                    onChange={(_, opt) => setAssignRole(opt?.key)}
                    disabled={assignLoading}
                    styles={{ root: { minWidth: 200 } }}
                  />
                </Stack>
                {assignLoading && <Spinner size={SpinnerSize.small} ariaLabel="Assigning tasks" />}
                <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                  {assignUserListTitle}
                </Text>
                <DetailsList
                  items={assignFilteredUsers}
                  columns={assignColumns}
                  selectionMode={SelectionMode.none}
                  isHeaderVisible
                />
              </Stack>
            </FocusTrapZone>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
});

Grid.displayName = 'Grid';
