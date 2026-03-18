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
  IDetailsRowProps,
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
  ThemeProvider,
  TextField,
  Stack,
  Text,
  DefaultButton,
  MessageBar,
  MessageBarType,
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
  IDatePickerStrings,
  IButtonStyles,
  TooltipHost,
} from '@fluentui/react';
import * as React from 'react';
import { NoFields } from '../DetailsListVOA/grid/NoFields';
import { RecordsColumns } from '../DetailsListVOA/config/ManifestConstants';
import { IGridColumn, ColumnConfig, AssignUser } from './Component.types';
import { GridCell } from '../DetailsListVOA/grid/GridCell';
import { ClassNames } from '../DetailsListVOA/grid/Grid.styles';
import { GridFilterState, NumericFilter, NumericFilterMode, createDefaultGridFilters, sanitizeFilters, SearchByOption, DateRangeFilter, isValidUkPostcode, normalizeUkPostcode } from './Filters';
import { filterItemsByColumnFilters, type ColumnFilterValue } from './utils/GridColumnFilters';
import { getSearchByOptionsFor, getColumnFilterConfigFor, isLookupFieldFor, isViewSalesRecordEnabledFor, ColumnFilterConfig } from '../DetailsListVOA/config/TableConfigs';
import {
  ADDRESS_FIELD_MAX_LENGTH,
  ID_FIELD_MAX_LENGTH,
  MIN_ADDRESS_TEXT_LENGTH,
  SALE_ID_REGEX,
  TASK_ID_MIN_LENGTH,
  TASK_ID_REGEX,
  UPRN_MAX_LENGTH,
  getSalesSearchErrors,
  sanitizeAlphaNumHyphen,
  sanitizeDigits,
  sanitizeTaskIdInput,
} from './utils/SalesSearchValidation';
import { buildPrefilterStorageKey, shouldResetPrefiltersOnScreenChange } from './utils/ScreenBehavior';
import {
  MANAGER_PREFILTER_DEFAULT,
  CASEWORKER_PREFILTER_DEFAULT,
  QC_PREFILTER_DEFAULT,
  QC_VIEW_PREFILTER_DEFAULT,
  CASEWORKER_WORKTHAT_SELF_OPTIONS,
  QC_WORKTHAT_SELF_OPTIONS,
  MANAGER_SEARCH_BY_OPTIONS,
  QC_SEARCH_BY_OPTIONS,
  getManagerWorkThatOptions,
  isManagerCompletedWorkThat,
  getQcWorkThatOptions,
  isQcCompletedWorkThat,
  type ManagerPrefilterState,
  type ManagerSearchBy,
  type ManagerWorkThat,
  type QcSearchBy,
} from './config/PrefilterConfigs';
import { computeCompletedToDateIso, getPrefilterFromDateError } from './utils/PrefilterDateUtils';
import { parseDateInput } from './utils/DateInputUtils';
import {
  isPrefilterUserAutoApplyReady,
  normalizePrefilterSearchBy,
  shouldRemoveStoredPrefilter,
  shouldSkipPrefilterAutoApply,
} from './utils/PrefilterUtils';
import { type ScreenKind } from './utils/ScreenResolution';
import { SCREEN_TEXT } from '../DetailsListVOA/constants/ScreenText';
import { CONTROL_CONFIG } from './config/ControlConfig';
import {
  resolveAssignedUserIdsToDisable,
  resolveAssignmentStatusValidation,
  type AssignmentConfig,
} from './utils/AssignmentHelpers';

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;
const ASSIGN_LOADING_ROW_ID = '__loading__';
export type GridScreenKind = ScreenKind;

export interface GridProps {
  // When false, hides the built-in top search panel
  showSearchPanel?: boolean;
  screenKind?: GridScreenKind;
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
  onNavigate: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => void | Promise<void>;
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
  pageSize?: number;
  canNext: boolean;
  canPrev: boolean;
  overlayOnSort?: boolean;
  searchFilters: GridFilterState;
  billingAuthorityOptions?: string[];
  billingAuthorityOptionsLoading?: boolean;
  billingAuthorityOptionsError?: string;
  caseworkerOptions?: string[];
  caseworkerOptionsLoading?: boolean;
  caseworkerOptionsError?: string;
  qcUserOptions?: string[];
  qcUserOptionsLoading?: boolean;
  qcUserOptionsError?: string;
  errorMessage?: string;
  showResults?: boolean;
  onLoadFilterOptions?: (field: string, query: string) => Promise<string[]>;
  onColumnFiltersChange?: (filters: Record<string, ColumnFilterValue | string | string[]>) => void;
  allowColumnReorder?: boolean;
  columnFilters?: Record<string, ColumnFilterValue>;
  disableClientFiltering?: boolean;
  canvasScreenName?: string;
  onAssignTasks?: (user: AssignUser) => Promise<boolean>;
  onMarkPassedQc?: () => Promise<void>;
  statusMessage?: { text: string; type: MessageBarType };
  onStatusMessageDismiss?: () => void;
  prefilterApplied?: boolean;
  onPrefilterApply?: (prefilters: ManagerPrefilterState, options?: { source?: 'auto' | 'user' }) => void;
  onPrefilterClear?: () => void;
  onPrefilterDirty?: () => void;
  onSearchDirty?: () => void;
  onBackRequested?: () => void;
  disableViewSalesRecordAction?: boolean;
  rowInvokeEnabled?: boolean;
  assignUsers?: AssignUser[];
  assignUsersLoading?: boolean;
  assignUsersError?: string;
  assignUsersInfo?: string;
  onAssignPanelToggle?: (isOpen: boolean) => boolean | void;
  currentUserId?: string;
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
  tooltip?: string;
  inputMode?: 'numeric';
  transform?: (value?: string) => string;
  optionFields?: string[];
  options?: IDropdownOption[];
  selectAll?: boolean;
  selectAllValues?: string[];
  multiLimit?: number;
}

interface PrefilterTooltips {
  searchBy?: string;
  billingAuthority?: string;
  caseworker?: string;
  qcUser?: string;
  workThat?: string;
  fromDate?: string;
  toDate?: string;
}

const SALES_SEARCH_OPTIONS: SearchByOption[] = ['address', 'saleId', 'taskId', 'uprn', 'billingAuthority'];
const BILLING_AUTHORITY_ALL_KEY = '__all__';
const CASEWORKER_ALL_KEY = '__all__';
const SELECT_ALL_KEY = '__select_all__';

type StoredPrefilterState = Partial<ManagerPrefilterState> & { applied?: boolean };

const normalizeOptionToken = (value: unknown): string => {
  if (typeof value === 'string') return value.trim().toLowerCase();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim().toLowerCase();
  return '';
};
const isAllToken = (value: unknown): boolean => normalizeOptionToken(value) === 'all';
const isOtherToken = (value: unknown): boolean => {
  const token = normalizeOptionToken(value);
  return token === 'other' || token === 'others' || token === 'other(s)';
};
const hasAllOption = (options: IComboBoxOption[]): boolean =>
  options.some((opt) => isAllToken(opt.key) || isAllToken(opt.text ?? opt.key));
const hasOtherOption = (options: IComboBoxOption[]): boolean =>
  options.some((opt) => isOtherToken(opt.key) || isOtherToken(opt.text ?? opt.key));
const hasAllOrOtherOption = (options: IComboBoxOption[]): boolean => hasAllOption(options) || hasOtherOption(options);
const resolveAllOptionKey = (options: IComboBoxOption[]): string | undefined => {
  const match = options.find((opt) => isAllToken(opt.key) || isAllToken(opt.text ?? opt.key));
  return match ? String(match.key) : undefined;
};
const buildAriaDescribedBy = (...ids: (string | undefined)[]): string | undefined => {
  const values = ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  return values.length > 0 ? values.join(' ') : undefined;
};
const joinClassNames = (...classNames: (string | undefined | false)[]): string | undefined => {
  const values = classNames.filter((className): className is string => typeof className === 'string' && className.trim().length > 0);
  return values.length > 0 ? values.join(' ') : undefined;
};
const formatRequiredAriaLabel = (label: string, required?: boolean): string => (
  required ? `${label}, required` : label
);

interface FocusableActionButtonProps {
  ariaCurrent?: 'page';
  ariaDescribedBy?: string;
  ariaLabel: string;
  buttonType?: 'default' | 'primary';
  children?: React.ReactNode;
  className?: string;
  iconProps?: { iconName: string };
  onClick: () => void;
  onUnavailableClick?: () => void;
  styles?: IButtonStyles;
  text?: string;
  title?: string;
  unavailable?: boolean;
  unavailableReason?: string;
  unavailableReasonId?: string;
}

const FocusableActionButton = ({
  ariaCurrent,
  ariaDescribedBy,
  ariaLabel,
  buttonType = 'default',
  children,
  className,
  iconProps,
  onClick,
  onUnavailableClick,
  styles,
  text,
  title,
  unavailable = false,
  unavailableReason,
  unavailableReasonId,
}: FocusableActionButtonProps) => {
  const ButtonComponent = buttonType === 'primary' ? PrimaryButton : DefaultButton;
  const handleClick = React.useCallback((event?: React.MouseEvent<unknown>) => {
    if (unavailable) {
      onUnavailableClick?.();
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }
    onClick();
  }, [onClick, onUnavailableClick, unavailable]);
  const describedBy = buildAriaDescribedBy(
    ariaDescribedBy,
    unavailable && unavailableReason ? unavailableReasonId : undefined,
  );

  return (
    <>
      {unavailable && unavailableReason && unavailableReasonId && (
        <span id={unavailableReasonId} className="voa-sr-only">
          {unavailableReason}
        </span>
      )}
      <ButtonComponent
        disabled={unavailable}
        text={text}
        iconProps={iconProps}
        onClick={handleClick}
        aria-describedby={describedBy}
        ariaLabel={ariaLabel}
        aria-current={ariaCurrent}
        className={joinClassNames(className, unavailable ? 'voa-focusable-disabled-button' : undefined)}
        styles={styles}
        title={unavailable ? unavailableReason ?? title : title}
      >
        {children}
      </ButtonComponent>
    </>
  );
};

const renderLabelWithRequired = (
  text: string,
  options?: {
    htmlFor?: string;
    id?: string;
    className?: string;
    required?: boolean;
  },
) => (
  <Label htmlFor={options?.htmlFor} id={options?.id} className={options?.className}>
    <span>{text}</span>
    {options?.required && (
      <>
        <span className="voa-required-indicator" aria-hidden="true"> *</span>
        <span className="voa-sr-only"> required</span>
      </>
    )}
  </Label>
);

type SalesSearchFieldKey =
  | 'buildingNameNumber'
  | 'street'
  | 'townCity'
  | 'postcode'
  | 'billingAuthority'
  | 'bacode'
  | 'saleId'
  | 'taskId'
  | 'uprn';

const focusSalesSearchFieldById = (fieldId: string): void => {
  if (typeof document === 'undefined') return;
  const fieldRoot = document.getElementById(fieldId);
  if (!fieldRoot) return;
  const focusTarget = (fieldRoot.matches('input,button,textarea,[tabindex]') ? fieldRoot : fieldRoot.querySelector<HTMLElement>('input,button,textarea,[tabindex]'))
    ?? undefined;
  focusTarget?.focus();
};

const normalizePrefilterArray = (value: unknown): string[] =>
  (Array.isArray(value) ? value.map((item) => String(item)) : []);

const normalizeComboSearchText = (value?: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(',');
  return (parts[parts.length - 1] ?? '').trim();
};

const getComboInputValue = (event: React.KeyboardEvent<IComboBox>): string => {
  const target = event.target as HTMLInputElement | null;
  return typeof target?.value === 'string' ? target.value : '';
};

const normalizeMultiSelectSearchText = (
  value: string | undefined,
  options: IComboBoxOption[],
  selectedKeys: string[],
): string => {
  const raw = value ?? '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (selectedKeys.length > 0) {
    const selectedText = selectedKeys
      .map((key) => {
        const match = options.find((opt) => String(opt.key) === key);
        return String(match?.text ?? match?.key ?? '');
      })
      .filter((text) => text !== '')
      .join(', ');
    if (selectedText && trimmed === selectedText) {
      return '';
    }
  }
  return normalizeComboSearchText(raw);
};

const normalizeSingleSelectSearchText = (
  value: string | undefined,
  _options: IComboBoxOption[],
): string => {
  const raw = value ?? '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return normalizeComboSearchText(raw);
};

const formatTemplate = (template: string, tokens: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match: string, key: string) => (
    Object.prototype.hasOwnProperty.call(tokens, key) ? String(tokens[key]) : match
  ));

const filterComboOptions = (options: IComboBoxOption[], query: string): IComboBoxOption[] => {
  const term = query.trim().toLowerCase();
  if (!term) return options;
  return options.filter((opt) => {
    const key = String(opt.key ?? '');
    if (key.startsWith('__') && key !== BILLING_AUTHORITY_ALL_KEY && key !== CASEWORKER_ALL_KEY) {
      return true;
    }
    const text = String(opt.text ?? opt.key ?? '').toLowerCase();
    return text.includes(term) || key.toLowerCase().includes(term);
  });
};

const resolveComboOptionKey = (options: IComboBoxOption[], value?: string): string | undefined => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return undefined;
  const target = trimmed.toLowerCase();
  const match = options.find((opt) => {
    const text = String(opt.text ?? opt.key ?? '').trim().toLowerCase();
    const key = String(opt.key ?? '').trim().toLowerCase();
    return text === target || key === target;
  });
  return match ? String(match.key) : undefined;
};

const resolveComboKeyFromSearch = (
  options: IComboBoxOption[],
  value?: string,
  preferredKey?: string | number | boolean,
): string | undefined => {
  const exact = resolveComboOptionKey(options, value);
  if (exact) return exact;
  const filtered = filterComboOptions(options, value ?? '');
  const enabled = filtered.filter((opt) => !opt.disabled);
  if (enabled.length === 1) return String(enabled[0].key);
  if (preferredKey !== undefined) {
    const preferred = String(preferredKey);
    if (options.some((opt) => String(opt.key) === preferred && !opt.disabled)) {
      return preferred;
    }
  }
  return undefined;
};

const getOptionText = (options: IComboBoxOption[], key: string): string => {
  const match = options.find((opt) => String(opt.key) === key);
  return String(match?.text ?? match?.key ?? key);
};

const getSelectedOptionLabels = (selectedKeys: string[], options: IComboBoxOption[]): string[] =>
  selectedKeys.map((key) => getOptionText(options, key)).filter((text) => text.trim().length > 0);

const buildSelectedTooltip = (
  selectedKeys: string[],
  options: IComboBoxOption[],
  emptyHint?: string,
): string | undefined => {
  if (!selectedKeys || selectedKeys.length === 0) return emptyHint;
  const labels = getSelectedOptionLabels(selectedKeys, options);
  if (labels.length === 0) return emptyHint;
  const prefix = labels.length > 1 ? `Selected (${labels.length}): ` : 'Selected: ';
  return `${prefix}${labels.join(', ')}`;
};

const buildCompactSelectedSummary = (
  selectedKeys: string[],
  options: IComboBoxOption[],
): string | undefined => {
  if (!selectedKeys || selectedKeys.length === 0) return undefined;
  const labels = getSelectedOptionLabels(selectedKeys, options);
  if (labels.length <= 1) return undefined;
  if (labels.some((label) => label.trim().toLowerCase() === 'all')) {
    return 'All selected';
  }
  return `${labels.length} selected`;
};

const buildValueTooltip = (value: string | undefined, emptyHint?: string): string | undefined => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return emptyHint;
  return `Selected: ${trimmed}`;
};

const COMBO_DISAMBIGUATION_HINT = 'Type more or use arrow keys to choose.';
const SEARCH_BY_RESET_NOTICE = 'Changing Search by cleared the previous search values.';
const PREFILTER_RESET_NOTICE = 'Changing Search by cleared dependent filters.';

const getComboDisambiguationHint = (options: IComboBoxOption[], value?: string): string | undefined => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return undefined;
  if (resolveComboOptionKey(options, trimmed)) return undefined;
  const filtered = filterComboOptions(options, trimmed).filter((opt) => !opt.disabled);
  return filtered.length > 1 ? COMBO_DISAMBIGUATION_HINT : undefined;
};

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
  saleId: {
    key: 'saleId',
    label: 'Sale ID',
    control: 'text',
    stateKey: 'saleId',
    placeholder: 'S-1000001',
    tooltip: 'Format: S-1234567.',
    transform: (v) => sanitizeAlphaNumHyphen(v, ID_FIELD_MAX_LENGTH),
  },
  taskId: {
    key: 'taskId',
    label: 'Task ID',
    control: 'text',
    stateKey: 'taskId',
    placeholder: 'A-1000001 or 1000001',
    minLength: TASK_ID_MIN_LENGTH,
    tooltip: 'Use A- or M- prefix (e.g. A-1000001) or numbers only.',
    transform: (v) => sanitizeTaskIdInput(v, ID_FIELD_MAX_LENGTH),
  },
  uprn: {
    key: 'uprn',
    label: 'UPRN',
    control: 'text',
    stateKey: 'uprn',
    placeholder: '12345678',
    tooltip: 'Digits only.',
    inputMode: 'numeric',
    transform: (v) => sanitizeDigits(v, UPRN_MAX_LENGTH),
  },
  address: {
    key: 'address',
    label: 'Address',
    control: 'textContains',
    stateKey: 'address',
    minLength: 3,
    placeholder: 'Enter address',
    tooltip: 'Enter at least 3 characters.',
  },
  postcode: {
    key: 'postcode',
    label: 'Post code',
    control: 'textPrefix',
    stateKey: 'postcode',
    minLength: 2,
    placeholder: 'CF10 1AA',
    tooltip: 'Enter a full or partial UK postcode.',
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
    screenKind: screenKindProp,
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
    pageSize,
    canNext,
    canPrev,
    searchFilters,
    billingAuthorityOptions = [],
    billingAuthorityOptionsLoading = false,
    billingAuthorityOptionsError,
    caseworkerOptions = [],
    caseworkerOptionsLoading = false,
    caseworkerOptionsError,
    qcUserOptions = [],
    qcUserOptionsLoading = false,
    qcUserOptionsError,
    errorMessage,
    statusMessage,
    onStatusMessageDismiss,
    showResults,
    onLoadFilterOptions,
    onColumnFiltersChange,
  columnFilters,
  disableClientFiltering,
    canvasScreenName,
    onAssignTasks,
    onPrefilterApply,
    prefilterApplied,
    onPrefilterClear,
    onPrefilterDirty,
    onSearchDirty,
    onBackRequested,
    disableViewSalesRecordAction = false,
    rowInvokeEnabled = true,
    assignUsers: assignUsersProp,
    assignUsersLoading = false,
    assignUsersError,
    assignUsersInfo,
    onAssignPanelToggle,
    currentUserId,
    onMarkPassedQc,
  } = props;

  const theme = useTheme(themeJSON);
  const topRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const [horizontalOverflowState, setHorizontalOverflowState] = React.useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });
  const hasSelectionColumn = selectionType !== SelectionMode.none;
  const paginationButtonStyles = React.useMemo(
    () => ({
      root: {
        height: 32,
        minWidth: 32,
        padding: '0 10px',
        borderRadius: 6,
        borderColor: theme.semanticColors.inputBorder,
      },
    }),
    [theme.semanticColors.inputBorder],
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
  const [columnFiltersState, setColumnFilters] = React.useState<Record<string, ColumnFilterValue>>(columnFilters ?? {});
  const [menuState, setMenuState] = React.useState<{
    target: HTMLElement;
    column: IGridColumn;
  }>();
  const [menuFilterValue, setMenuFilterValue] = React.useState<ColumnFilterValue>('');
  const [menuFilterText, setMenuFilterText] = React.useState('');
  const [menuFilterError, setMenuFilterError] = React.useState<string | undefined>();
  const [menuFilterSearch, setMenuFilterSearch] = React.useState('');
  const [menuExtraOptions, setMenuExtraOptions] = React.useState<string[]>([]);
  const menuOptionsFieldRef = React.useRef<string>('');
  const liveFilterTimer = React.useRef<number | undefined>(undefined);
  const [filters, setFilters] = React.useState<GridFilterState>(searchFilters);
  const autoSearchEnabled = false;
  const [billingAuthoritySearch, setBillingAuthoritySearch] = React.useState('');
  const [managerBillingSearch, setManagerBillingSearch] = React.useState('');
  const [caseworkerSearch, setCaseworkerSearch] = React.useState('');
  const [searchBySearch, setSearchBySearch] = React.useState('');
  const [prefilterSearchBySearch, setPrefilterSearchBySearch] = React.useState('');
  const [prefilterWorkThatSearch, setPrefilterWorkThatSearch] = React.useState('');
  const [comboSearchText, setComboSearchText] = React.useState<Record<string, string>>({});
  const [assignPanelOpen, setAssignPanelOpen] = React.useState(false);
  const [assignSearch, setAssignSearch] = React.useState('');
  const [selectFirstInput, setSelectFirstInput] = React.useState('');
  const [selectFirstError, setSelectFirstError] = React.useState<string | undefined>(undefined);
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [assignSelectedUserId, setAssignSelectedUserId] = React.useState<string | undefined>();
  const [viewSaleLoading, setViewSaleLoading] = React.useState(false);
  const viewSaleRequestSeq = React.useRef(0);
  const viewSaleNavigationLockRef = React.useRef(false);
  const [viewSaleNavigationPending, setViewSaleNavigationPending] = React.useState(false);
  const [markPassedQcLoading, setMarkPassedQcLoading] = React.useState(false);
  const [prefilters, setPrefilters] = React.useState<ManagerPrefilterState>(MANAGER_PREFILTER_DEFAULT);
  const [prefilterExpanded, setPrefilterExpanded] = React.useState(true);
  const [prefilterContainerWidth, setPrefilterContainerWidth] = React.useState<number | null>(null);
  const [viewportMetrics, setViewportMetrics] = React.useState({ width: 0, height: 0 });
  const [searchPanelExpanded, setSearchPanelExpanded] = React.useState(true);
  const [comboEditing, setComboEditing] = React.useState<Record<string, boolean>>({});
  const comboIgnoreNextInputRef = React.useRef<Record<string, boolean>>({});
  const comboIgnoreNextChangeRef = React.useRef<Record<string, boolean>>({});
  const comboExpectedSelectionRef = React.useRef<Record<string, { key: string; expiresAt: number }>>({});
  const comboCancelNextDismissRef = React.useRef<Record<string, boolean>>({});
  const lastManagerBillingSelectionRef = React.useRef<string>('');
  const lastCaseworkerSelectionRef = React.useRef<string>('');
  const [dismissedColumnConfigMessage, setDismissedColumnConfigMessage] = React.useState(false);
  const [dismissedErrorMessage, setDismissedErrorMessage] = React.useState(false);
  const [dismissedAssignUsersInfo, setDismissedAssignUsersInfo] = React.useState(false);
  const [dismissedAssignUsersError, setDismissedAssignUsersError] = React.useState(false);
  const [searchResetNotice, setSearchResetNotice] = React.useState<string | undefined>();
  const [salesSearchTouched, setSalesSearchTouched] = React.useState<Partial<Record<SalesSearchFieldKey, boolean>>>({});
  const [salesSearchAttempted, setSalesSearchAttempted] = React.useState(false);
  const [prefilterResetNotice, setPrefilterResetNotice] = React.useState<string | undefined>();

  const setComboEditingFor = React.useCallback((key: string, isEditing: boolean) => {
    setComboEditing((prev) => (prev[key] === isEditing ? prev : { ...prev, [key]: isEditing }));
  }, []);
  const setComboIgnoreNextInput = React.useCallback((key: string) => {
    comboIgnoreNextInputRef.current[key] = true;
  }, []);
  const consumeComboIgnoreNextInput = React.useCallback((key: string) => {
    if (comboIgnoreNextInputRef.current[key]) {
      comboIgnoreNextInputRef.current[key] = false;
      return true;
    }
    return false;
  }, []);
  const setComboIgnoreNextChange = React.useCallback((key: string) => {
    comboIgnoreNextChangeRef.current[key] = true;
  }, []);
  const consumeComboIgnoreNextChange = React.useCallback((key: string, option?: IComboBoxOption) => {
    if (!comboIgnoreNextChangeRef.current[key]) return false;
    comboIgnoreNextChangeRef.current[key] = false;
    const expected = comboExpectedSelectionRef.current[key];
    const optKey = option?.key !== undefined ? String(option.key) : '';
    if (!expected) {
      return optKey === '';
    }
    if (optKey === '' || optKey === expected.key) {
      delete comboExpectedSelectionRef.current[key];
      return true;
    }
    delete comboExpectedSelectionRef.current[key];
    return false;
  }, []);
  const setComboExpectedSelection = React.useCallback((key: string, expectedKey: string) => {
    comboExpectedSelectionRef.current[key] = {
      key: expectedKey,
      expiresAt: Date.now() + 500,
    };
  }, []);
  const setComboCancelNextDismiss = React.useCallback((key: string) => {
    comboCancelNextDismissRef.current[key] = true;
  }, []);
  const consumeComboCancelNextDismiss = React.useCallback((key: string) => {
    if (!comboCancelNextDismissRef.current[key]) return false;
    delete comboCancelNextDismissRef.current[key];
    return true;
  }, []);
  const shouldIgnoreComboChange = React.useCallback((key: string, option?: IComboBoxOption) => {
    const expected = comboExpectedSelectionRef.current[key];
    if (!expected) return false;
    if (Date.now() > expected.expiresAt) {
      delete comboExpectedSelectionRef.current[key];
      return false;
    }
    const optKey = option?.key !== undefined ? String(option.key) : '';
    if (optKey === expected.key) {
      delete comboExpectedSelectionRef.current[key];
      return true;
    }
    if (!optKey) {
      return true;
    }
    delete comboExpectedSelectionRef.current[key];
    return false;
  }, []);
  const commitPrefilterMultiSelect = React.useCallback(
    (
      event: React.KeyboardEvent<IComboBox>,
      searchValue: string,
      options: IComboBoxOption[],
      selectedKeys: string[],
      onChange: (ev: React.FormEvent<IComboBox>, option?: IComboBoxOption) => void,
      ignoreKey: string,
      clearSearch: (value: string) => void,
    ) => {
      const isEnter = event.key === 'Enter';
      const isTab = event.key === 'Tab';
      if (!isEnter && !isTab) return;
      const resolvedKey = resolveComboKeyFromSearch(options, searchValue);
      if (!resolvedKey) return;
      const match = options.find((opt) => String(opt.key) === resolvedKey);
      if (!match || match.disabled) return;
      if (isEnter) {
        event.preventDefault();
      }
      const selected = selectedKeys.map(String).includes(String(resolvedKey));
      const nextOption: IComboBoxOption = { ...match, selected: !selected };
      onChange(event as unknown as React.FormEvent<IComboBox>, nextOption);
      setComboIgnoreNextInput(ignoreKey);
      clearSearch('');
    },
    [setComboIgnoreNextInput],
  );

  const commitComboSingleSelect = React.useCallback(
    (
      event: React.KeyboardEvent<IComboBox>,
      searchValue: string,
      options: IComboBoxOption[],
      selectedKey: string | number | boolean | undefined,
      onSelect: (option: IComboBoxOption) => void,
      ignoreKey?: string,
    ) => {
      const isEnter = event.key === 'Enter';
      const isTab = event.key === 'Tab';
      if (!isEnter && !isTab) return;
      const resolvedKey = resolveComboKeyFromSearch(options, searchValue, selectedKey);
      if (!resolvedKey) {
        if (isEnter) {
          event.preventDefault();
        }
        return;
      }
      const match = options.find((opt) => String(opt.key) === resolvedKey);
      if (!match || match.disabled) return;
      if (isEnter) {
        event.preventDefault();
      }
      if (ignoreKey) {
        setComboCancelNextDismiss(ignoreKey);
        setComboIgnoreNextChange(ignoreKey);
        setComboExpectedSelection(ignoreKey, String(resolvedKey));
      }
      onSelect(match);
    },
    [setComboCancelNextDismiss, setComboExpectedSelection, setComboIgnoreNextChange],
  );

  const commitComboSingleSelectOnDismiss = React.useCallback(
    (
      searchValue: string,
      options: IComboBoxOption[],
      selectedKey: string | number | boolean | undefined,
      onSelect: (option: IComboBoxOption) => void,
    ) => {
      const trimmed = searchValue.trim();
      if (!trimmed) return false;
      const resolvedKey = resolveComboKeyFromSearch(options, trimmed, selectedKey);
      if (!resolvedKey) return false;
      if (selectedKey !== undefined && String(selectedKey) === String(resolvedKey)) {
        return true;
      }
      const match = options.find((opt) => String(opt.key) === String(resolvedKey));
      if (!match || match.disabled) return false;
      onSelect(match);
      return true;
    },
    [],
  );

  React.useEffect(() => {
    setDismissedColumnConfigMessage(false);
  }, [columnDatasetNotDefined]);

  React.useEffect(() => {
    setDismissedErrorMessage(false);
  }, [errorMessage]);

  React.useEffect(() => {
    setDismissedAssignUsersInfo(false);
  }, [assignUsersInfo]);

  React.useEffect(() => {
    setDismissedAssignUsersError(false);
  }, [assignUsersError]);

  const dismissResultMessages = React.useCallback(() => {
    if (statusMessage) {
      onStatusMessageDismiss?.();
    }
    if (errorMessage && !dismissedErrorMessage) {
      setDismissedErrorMessage(true);
    }
  }, [dismissedErrorMessage, errorMessage, onStatusMessageDismiss, statusMessage]);

  const openAssignPanel = React.useCallback(() => {
    const allowOpen = onAssignPanelToggle?.(true);
    if (allowOpen === false) return;
    setAssignSelectedUserId(undefined);
    setAssignPanelOpen(true);
  }, [onAssignPanelToggle]);
  const closeAssignPanel = React.useCallback(() => {
    setAssignSelectedUserId(undefined);
    setAssignPanelOpen(false);
    onAssignPanelToggle?.(false);
  }, [onAssignPanelToggle]);
  const toggleSearchPanel = React.useCallback(() => {
    setSearchPanelExpanded((prev) => !prev);
  }, []);

  const screenName = (canvasScreenName ?? '').toLowerCase();
  const normalizedScreenId = React.useMemo(() => screenName.replace(/[^a-z0-9]/g, ''), [screenName]);
  const derivedScreenKind = React.useMemo<GridScreenKind>(() => {
    if (screenKindProp) return screenKindProp;
    switch (normalizedScreenId) {
      case 'salesrecordsearch':
        return 'salesSearch';
      case 'managerassignment':
        return 'managerAssign';
      case 'caseworkerview':
        return 'caseworkerView';
      case 'qualitycontrolassignment':
        return 'qcAssign';
      case 'qualitycontrolview':
        return 'qcView';
      default:
        break;
    }
    const hasAssignment = screenName.includes('assignment');
    if (hasAssignment && screenName.includes('manager')) return 'managerAssign';
    if (hasAssignment && (screenName.includes('qc') || screenName.includes('quality'))) return 'qcAssign';
    if (screenName.includes('caseworker')) return 'caseworkerView';
    if (!hasAssignment && (screenName.includes('qc') || screenName.includes('quality'))) return 'qcView';
    if (screenName.includes('sales') || screenName.includes('record search') || screenName.includes('recordsearch')) return 'salesSearch';
    return 'unknown';
  }, [normalizedScreenId, screenKindProp, screenName]);

  const isManagerAssign = derivedScreenKind === 'managerAssign';
  const isQcAssign = derivedScreenKind === 'qcAssign';
  const isCaseworkerView = derivedScreenKind === 'caseworkerView';
  const isQcView = derivedScreenKind === 'qcView';
  const isSalesSearch = derivedScreenKind === 'salesSearch';
  const isAssignment = isManagerAssign || isQcAssign;
  const showAssign = isManagerAssign || isQcAssign;
  const showMarkPassedQc = isQcView;
  const useAssignmentLayout = isManagerAssign || isCaseworkerView || isQcAssign || isQcView;
  const commonText = SCREEN_TEXT.common;
  const managerText = SCREEN_TEXT.managerAssignment;
  const qcText = SCREEN_TEXT.qcAssignment;
  const qcViewText = SCREEN_TEXT.qcView;
  const assignTasksText = SCREEN_TEXT.assignTasks;
  const viewSaleLoadingText = commonText.messages.loadingSaleRecord ?? assignTasksText.loadingText;

  const assignButtonState = React.useMemo((): { disabled: boolean; tooltip?: string } => {
    if (selectedCount === 0) {
      return { disabled: true, tooltip: assignTasksText.messages.selectTasksWarning };
    }
    if (isAssignment) {
      const selected = selection.getSelection() as Record<string, unknown>[];
      if (selected.length > 0) {
        const config: AssignmentConfig = CONTROL_CONFIG.taskAssignment ?? {
          allowedStatusesManager: [] as string[],
          allowedStatusesQc: [] as string[],
          allowedStatuses: [] as string[],
        };
        const screenKindForAssign: ScreenKind = isManagerAssign ? 'managerAssign' : 'qcAssign';
        const result = resolveAssignmentStatusValidation(
          selected,
          screenKindForAssign,
          config,
          assignTasksText.messages.invalidStatus,
        );
        if (result.error) {
          return { disabled: true, tooltip: result.error };
        }
      }
    }
    return { disabled: false };
  }, [selectedCount, isAssignment, isManagerAssign, selection, assignTasksText.messages]);
  const salesSearchText = SCREEN_TEXT.salesSearch;
  const caseworkerText = SCREEN_TEXT.caseworkerView;
  const markPassedQcText = SCREEN_TEXT.qcView.markPassedQc;

  const REASSIGNED_TO_QC_STATUS_NORMALIZED = 'reassigned to qc';
  const markPassedQcButtonState = React.useMemo((): { disabled: boolean; tooltip?: string } => {
    if (selectedCount === 0) {
      return { disabled: true, tooltip: markPassedQcText.messages.noSelection };
    }
    const selected = selection.getSelection() as Record<string, unknown>[];
    const allReassigned = selected.length > 0 && selected.every((rec) => {
      const statusRaw = (rec.taskstatus ?? rec.taskStatus ?? '') as string;
      return String(statusRaw).trim().toLowerCase() === REASSIGNED_TO_QC_STATUS_NORMALIZED;
    });
    if (!allReassigned) {
      return { disabled: true, tooltip: markPassedQcText.messages.invalidStatus };
    }
    return { disabled: false };
  }, [markPassedQcText.messages, selectedCount, selection]);

  const prefilterText = isQcAssign ? qcText.prefilter : isQcView ? qcViewText.prefilter : managerText.prefilter;
  const prefilterTooltips: PrefilterTooltips = isQcAssign
    ? qcText.prefilter.tooltips
    : isQcView
      ? qcViewText.prefilter.tooltips
      : managerText.prefilter.tooltips;
  const assignActionText = isQcAssign ? qcText.assignActionText : managerText.assignActionText;
  const assignHeaderText = assignTasksText.title;
  const assignUserListTitle = isQcAssign ? qcText.assignUserListTitle : managerText.assignUserListTitle;
  const pageHeaderText = isManagerAssign
      ? managerText.title
      : isQcAssign
        ? qcText.title
        : isCaseworkerView
          ? SCREEN_TEXT.caseworkerView.title
          : isQcView
            ? SCREEN_TEXT.qcView.title
            : isSalesSearch
              ? salesSearchText.title
              : undefined;
  const emptyStateText = isCaseworkerView && caseworkerText.emptyState
    ? caseworkerText.emptyState
    : isQcAssign && qcText.emptyState
      ? qcText.emptyState
      : isQcView && qcViewText.emptyState
        ? qcViewText.emptyState
        : commonText.emptyState;
  const prefilterStorageKey = React.useMemo(
    () => buildPrefilterStorageKey(tableKey, derivedScreenKind),
    [derivedScreenKind, tableKey],
  );
  const legacyPrefilterStorageKey = React.useMemo(
    () => `voa-prefilters:${tableKey}:${screenName || 'default'}`,
    [screenName, tableKey],
  );
  const prefilterAutoAppliedRef = React.useRef<string>('');
  const prefilterAutoApplyDebugRef = React.useRef<string>('');
  const prefilterManualApplyRef = React.useRef(false);
  const prefilterDirtyRef = React.useRef(false);
  const prefilterClearedRef = React.useRef(false);
  const prefilterHydratingRef = React.useRef(false);
  const prefilterHydrationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefilterAutoApplyInFlightRef = React.useRef(false);
  const prefilterAutoApplyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const schedulePrefilterHydrationClear = React.useCallback(() => {
    if (prefilterHydrationTimeoutRef.current !== undefined) {
      clearTimeout(prefilterHydrationTimeoutRef.current);
    }
    prefilterHydrationTimeoutRef.current = setTimeout(() => {
      prefilterHydrationTimeoutRef.current = undefined;
      prefilterHydratingRef.current = false;
    }, 0);
  }, []);
  const markPrefilterHydrating = React.useCallback(() => {
    prefilterHydratingRef.current = true;
    schedulePrefilterHydrationClear();
  }, [schedulePrefilterHydrationClear]);
  const clearAutoApplyInFlight = React.useCallback(() => {
    prefilterAutoApplyInFlightRef.current = false;
    if (prefilterAutoApplyTimeoutRef.current !== undefined) {
      clearTimeout(prefilterAutoApplyTimeoutRef.current);
      prefilterAutoApplyTimeoutRef.current = undefined;
    }
  }, []);
  const markAutoApplyInFlight = React.useCallback(() => {
    prefilterAutoApplyInFlightRef.current = true;
    if (prefilterAutoApplyTimeoutRef.current !== undefined) {
      clearTimeout(prefilterAutoApplyTimeoutRef.current);
    }
    prefilterAutoApplyTimeoutRef.current = setTimeout(() => {
      prefilterAutoApplyTimeoutRef.current = undefined;
      prefilterAutoApplyInFlightRef.current = false;
    }, 1000);
  }, []);
  const getPrefiltersForStorage = React.useCallback(
    (state: ManagerPrefilterState): ManagerPrefilterState => {
      const userId = (currentUserId ?? '').trim();
      if (!userId) return state;
      if (isCaseworkerView && state.searchBy === 'caseworker' && state.caseworkers.length === 0) {
        return { ...state, caseworkers: [userId] };
      }
      if (isQcView && state.searchBy === 'qcUser' && state.caseworkers.length === 0) {
        return { ...state, caseworkers: [userId] };
      }
      return state;
    },
    [currentUserId, isCaseworkerView, isQcView],
  );
  React.useEffect(() => {
    prefilterAutoAppliedRef.current = '';
    prefilterAutoApplyDebugRef.current = '';
    prefilterDirtyRef.current = false;
    prefilterClearedRef.current = false;
    prefilterHydratingRef.current = false;
    prefilterAutoApplyInFlightRef.current = false;
    if (prefilterHydrationTimeoutRef.current !== undefined) {
      clearTimeout(prefilterHydrationTimeoutRef.current);
      prefilterHydrationTimeoutRef.current = undefined;
    }
    if (prefilterAutoApplyTimeoutRef.current !== undefined) {
      clearTimeout(prefilterAutoApplyTimeoutRef.current);
      prefilterAutoApplyTimeoutRef.current = undefined;
    }
  }, [prefilterStorageKey]);

  React.useEffect(() => {
    if (!prefilterApplied) {
      prefilterAutoAppliedRef.current = '';
    } else {
      prefilterManualApplyRef.current = false;
      clearAutoApplyInFlight();
    }
  }, [clearAutoApplyInFlight, prefilterApplied]);

  React.useEffect(() => {
    if (columnFilters) {
      setColumnFilters(columnFilters);
    }
  }, [columnFilters]);

  const isPrefilterDefault = React.useCallback((state: ManagerPrefilterState): boolean => {
    if (isCaseworkerView) {
      const expectedUser = (currentUserId ?? '').trim();
      const hasExpectedUser = expectedUser
        ? state.caseworkers.length === 1 && state.caseworkers[0] === expectedUser
        : state.caseworkers.length === 0;
      return state.searchBy === 'caseworker'
        && state.billingAuthorities.length === 0
        && hasExpectedUser
        && state.workThat === CASEWORKER_PREFILTER_DEFAULT.workThat
        && !state.completedFrom
        && !state.completedTo;
    }
    if (isQcView) {
      const expectedUser = (currentUserId ?? '').trim();
      const hasExpectedUser = expectedUser
        ? state.caseworkers.length === 1 && state.caseworkers[0] === expectedUser
        : state.caseworkers.length === 0;
      return state.searchBy === 'qcUser'
        && state.billingAuthorities.length === 0
        && hasExpectedUser
        && state.workThat === QC_VIEW_PREFILTER_DEFAULT.workThat
        && !state.completedFrom
        && !state.completedTo;
    }
    if (isQcAssign) {
      return state.searchBy === QC_PREFILTER_DEFAULT.searchBy
        && state.billingAuthorities.length === 0
        && state.caseworkers.length === 0
        && !state.workThat
        && !state.completedFrom
        && !state.completedTo;
    }
    return state.searchBy === 'billingAuthority'
      && state.billingAuthorities.length === 0
      && state.caseworkers.length === 0
      && !state.workThat
      && !state.completedFrom
      && !state.completedTo;
  }, [currentUserId, isCaseworkerView, isQcAssign, isQcView]);
  const markPrefilterDirty = React.useCallback(() => {
    if (prefilterHydratingRef.current || prefilterAutoApplyInFlightRef.current) return;
    prefilterDirtyRef.current = true;
    onPrefilterDirty?.();
  }, [onPrefilterDirty]);

  const lastScreenKindRef = React.useRef<GridScreenKind | undefined>(undefined);

  React.useEffect(() => {
    setSearchPanelExpanded(true);
  }, [derivedScreenKind]);

  React.useEffect(() => {
    if (!useAssignmentLayout) return;
    if (prefilterDirtyRef.current) return;
    if (shouldSkipPrefilterAutoApply(prefilterManualApplyRef.current, !!prefilterApplied)) {
      console.debug('[Prefilter] auto-apply skipped (manual apply pending)', {
        screen: derivedScreenKind,
        prefilterApplied,
      });
      return;
    }
    try {
      let raw = localStorage.getItem(prefilterStorageKey);
      let migratedFromLegacy = false;
      if (!raw && legacyPrefilterStorageKey !== prefilterStorageKey) {
        raw = localStorage.getItem(legacyPrefilterStorageKey);
        migratedFromLegacy = !!raw;
      }
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredPrefilterState;
      const next: ManagerPrefilterState = {
        searchBy: normalizePrefilterSearchBy(parsed.searchBy, derivedScreenKind),
        billingAuthorities: normalizePrefilterArray(parsed.billingAuthorities),
        caseworkers: normalizePrefilterArray(parsed.caseworkers),
        workThat: parsed.workThat,
        completedFrom: typeof parsed.completedFrom === 'string' ? parsed.completedFrom : undefined,
        completedTo: typeof parsed.completedTo === 'string' ? parsed.completedTo : undefined,
      };
      const normalizedNext = getPrefiltersForStorage(next);
      markPrefilterHydrating();
      setPrefilters(normalizedNext);

      const storedApplied = typeof parsed.applied === 'boolean' ? parsed.applied : undefined;
      const needsCompleted = (isQcAssign || isQcView)
        ? isQcCompletedWorkThat(normalizedNext.workThat)
        : isManagerCompletedWorkThat(normalizedNext.workThat);
      const hasOwner = (isCaseworkerView || isQcView)
        ? normalizedNext.caseworkers.length > 0
        : isQcAssign
          ? (normalizedNext.searchBy === 'task' ? true : normalizedNext.caseworkers.length > 0)
          : normalizedNext.searchBy === 'billingAuthority'
            ? normalizedNext.billingAuthorities.length > 0
            : normalizedNext.caseworkers.length > 0;
      const hasWorkThat = !!normalizedNext.workThat;
      const hasFromDate = !needsCompleted || !!normalizedNext.completedFrom;
      const userResolutionReady = isPrefilterUserAutoApplyReady({
        screenKind: derivedScreenKind,
        searchBy: normalizedNext.searchBy,
        selectedUsers: normalizedNext.caseworkers,
        caseworkerOptionsLoading,
        caseworkerOptionsError,
        caseworkerOptions,
        qcUserOptionsLoading,
        qcUserOptionsError,
        qcUserOptions,
      });
      const canAutoApply = hasOwner && hasWorkThat && hasFromDate && userResolutionReady;
      const shouldAutoApply = storedApplied === false ? false : canAutoApply;
      const autoKey = `${prefilterStorageKey}|${derivedScreenKind}`;
      if (prefilterAutoApplyDebugRef.current !== autoKey) {
        prefilterAutoApplyDebugRef.current = autoKey;
        // Debugging aid for auto-apply behavior.
        console.debug('[Prefilter] auto-apply check', {
          screen: derivedScreenKind,
          storedApplied,
          hasOwner,
          hasWorkThat,
          hasFromDate,
          userResolutionReady,
          canAutoApply,
          shouldAutoApply,
          prefilterApplied,
          prefilterStorageKey,
          prefilters: normalizedNext,
        });
      }
      if (shouldAutoApply && onPrefilterApply && !prefilterApplied) {
        if (prefilterAutoAppliedRef.current !== autoKey) {
          prefilterAutoAppliedRef.current = autoKey;
          markAutoApplyInFlight();
          console.debug('[Prefilter] auto-apply fire', {
            screen: derivedScreenKind,
            prefilters: normalizedNext,
            onPrefilterApplyType: typeof onPrefilterApply,
          });
          try {
            onPrefilterApply(normalizedNext, { source: 'auto' });
            console.debug('[Prefilter] auto-apply done', { screen: derivedScreenKind });
          } catch (err) {
            console.error('[Prefilter] auto-apply failed', err);
          }
        }
      }
      if (migratedFromLegacy) {
        try {
          localStorage.setItem(prefilterStorageKey, raw);
          localStorage.removeItem(legacyPrefilterStorageKey);
        } catch {
          // ignore storage failures
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [
    derivedScreenKind,
    isCaseworkerView,
    isQcAssign,
    isQcView,
    markAutoApplyInFlight,
    onPrefilterApply,
    prefilterApplied,
    prefilterStorageKey,
    caseworkerOptions,
    caseworkerOptionsError,
    caseworkerOptionsLoading,
    qcUserOptions,
    qcUserOptionsError,
    qcUserOptionsLoading,
    markPrefilterHydrating,
    useAssignmentLayout,
  ]);

  React.useEffect(() => {
    if (!useAssignmentLayout) return;
    try {
      const storedPrefilters = getPrefiltersForStorage(prefilters);
      const shouldRemove = shouldRemoveStoredPrefilter(
        isPrefilterDefault(storedPrefilters),
        !!prefilterApplied,
        prefilterClearedRef.current,
      );
      if (shouldRemove) {
        localStorage.removeItem(prefilterStorageKey);
      } else if (prefilterApplied) {
        const payload: StoredPrefilterState = { ...storedPrefilters, applied: true };
        localStorage.setItem(prefilterStorageKey, JSON.stringify(payload));
      } else if (!isPrefilterDefault(storedPrefilters) && prefilterDirtyRef.current) {
        const payload: StoredPrefilterState = { ...storedPrefilters, applied: false };
        localStorage.setItem(prefilterStorageKey, JSON.stringify(payload));
      }
    } catch {
      // ignore storage failures
    } finally {
      prefilterClearedRef.current = false;
    }
  }, [isPrefilterDefault, prefilterApplied, prefilterStorageKey, prefilters, useAssignmentLayout]);

  React.useEffect(() => {
    const element = topRef.current;
    if (!element) return;
    const updateMetrics = (width: number, height: number) => {
      if (!Number.isFinite(width) || !Number.isFinite(height)) return;
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);
      setViewportMetrics((prev) => (
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      ));
      if (useAssignmentLayout) {
        setPrefilterContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      }
    };
    const updateFromElement = () => updateMetrics(element.clientWidth, element.clientHeight);
    updateFromElement();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const { width, height } = entries[0].contentRect;
        updateMetrics(width, height);
      });
      observer.observe(element);
      return () => observer.disconnect();
    }
    const handleResize = () => updateFromElement();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [useAssignmentLayout]);

  const updateHorizontalOverflowState = React.useCallback(() => {
    const element = resultsRef.current;
    if (!element) {
      setHorizontalOverflowState((prev) => (
        prev.hasOverflow || prev.canScrollLeft || prev.canScrollRight
          ? { hasOverflow: false, canScrollLeft: false, canScrollRight: false }
          : prev
      ));
      return;
    }
    const maxScrollLeft = Math.max(element.scrollWidth - element.clientWidth, 0);
    const hasOverflow = maxScrollLeft > 1;
    const canScrollLeft = hasOverflow && element.scrollLeft > 1;
    const canScrollRight = hasOverflow && element.scrollLeft < maxScrollLeft - 1;
    setHorizontalOverflowState((prev) => (
      prev.hasOverflow === hasOverflow
      && prev.canScrollLeft === canScrollLeft
      && prev.canScrollRight === canScrollRight
        ? prev
        : { hasOverflow, canScrollLeft, canScrollRight }
    ));
  }, []);

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
      invalidInputErrorMessage: 'Invalid date format. Use DD/MM/YYYY.',
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

  const prefilterFromDateError = React.useMemo(
    () => getPrefilterFromDateError(prefilters.completedFrom, today),
    [prefilters.completedFrom, today],
  );

  const caseworkerPrefilterDefaults = React.useMemo<ManagerPrefilterState>(
    () => ({
      ...CASEWORKER_PREFILTER_DEFAULT,
      caseworkers: currentUserId ? [currentUserId] : [],
    }),
    [currentUserId],
  );
  const qcViewPrefilterDefaults = React.useMemo<ManagerPrefilterState>(
    () => ({
      ...QC_VIEW_PREFILTER_DEFAULT,
      caseworkers: currentUserId ? [currentUserId] : [],
    }),
    [currentUserId],
  );

  React.useEffect(() => {
    if (!isCaseworkerView) return;
    markPrefilterHydrating();
    setPrefilters((prev) => {
      if (prev.searchBy !== 'caseworker') {
        return caseworkerPrefilterDefaults;
      }
      const needsUser = caseworkerPrefilterDefaults.caseworkers.length > 0
        && (prev.caseworkers.length !== 1 || prev.caseworkers[0] !== caseworkerPrefilterDefaults.caseworkers[0]);
      const needsWorkThat = !prev.workThat;
      const needsCleanup = prev.billingAuthorities.length > 0;
      if (!needsUser && !needsWorkThat && !needsCleanup) return prev;
      return {
        ...prev,
        searchBy: 'caseworker',
        billingAuthorities: [],
        caseworkers: needsUser ? caseworkerPrefilterDefaults.caseworkers : prev.caseworkers,
        workThat: needsWorkThat ? caseworkerPrefilterDefaults.workThat : prev.workThat,
      };
    });
  }, [caseworkerPrefilterDefaults, isCaseworkerView, markPrefilterHydrating]);
  React.useEffect(() => {
    if (!isQcView) return;
    markPrefilterHydrating();
    setPrefilters((prev) => {
      if (prev.searchBy !== 'qcUser') {
        return qcViewPrefilterDefaults;
      }
      const needsUser = qcViewPrefilterDefaults.caseworkers.length > 0
        && (prev.caseworkers.length !== 1 || prev.caseworkers[0] !== qcViewPrefilterDefaults.caseworkers[0]);
      const needsWorkThat = !prev.workThat;
      const needsCleanup = prev.billingAuthorities.length > 0;
      if (!needsUser && !needsWorkThat && !needsCleanup) return prev;
      return {
        ...prev,
        searchBy: 'qcUser',
        billingAuthorities: [],
        caseworkers: needsUser ? qcViewPrefilterDefaults.caseworkers : prev.caseworkers,
        workThat: needsWorkThat ? qcViewPrefilterDefaults.workThat : prev.workThat,
      };
    });
  }, [isQcView, markPrefilterHydrating, qcViewPrefilterDefaults]);

  React.useEffect(() => {
    const prev = lastScreenKindRef.current;
    const next = derivedScreenKind;

    let hasStoredPrefilter = false;
    try {
      hasStoredPrefilter = !!localStorage.getItem(prefilterStorageKey);
    } catch {
      hasStoredPrefilter = false;
    }
    if (shouldResetPrefiltersOnScreenChange(prev, next, hasStoredPrefilter)) {
      markPrefilterHydrating();
      if (next === 'managerAssign') {
        setPrefilters(MANAGER_PREFILTER_DEFAULT);
        setPrefilterExpanded(true);
      } else if (next === 'caseworkerView') {
        setPrefilters(caseworkerPrefilterDefaults);
        setPrefilterExpanded(true);
      } else if (next === 'qcAssign') {
        setPrefilters(QC_PREFILTER_DEFAULT);
        setPrefilterExpanded(true);
      } else if (next === 'qcView') {
        setPrefilters(qcViewPrefilterDefaults);
        setPrefilterExpanded(true);
      }
    }

    lastScreenKindRef.current = next;
  }, [caseworkerPrefilterDefaults, derivedScreenKind, markPrefilterHydrating, prefilterStorageKey, qcViewPrefilterDefaults]);

  const onPrefilterSearchByChange = React.useCallback(
    (_: React.FormEvent<IComboBox>, option?: IComboBoxOption, _index?: number, value?: string) => {
      const options = (isQcAssign ? QC_SEARCH_BY_OPTIONS : MANAGER_SEARCH_BY_OPTIONS) as IComboBoxOption[];
      const resolvedKey = option?.key ?? resolveComboOptionKey(options, value);
      if (!resolvedKey) return;
      let showResetNotice = false;
      if (isQcAssign) {
        const next = String(resolvedKey) as ManagerSearchBy;
        setPrefilters((prev) => {
          const sameSearchBy = prev.searchBy === next;
          const keepUsers = sameSearchBy && (next === 'qcUser' || next === 'caseworker');
          const nextState: ManagerPrefilterState = {
            ...prev,
            searchBy: next,
            billingAuthorities: [],
            caseworkers: keepUsers ? prev.caseworkers : [],
            workThat: undefined,
            completedFrom: undefined,
            completedTo: undefined,
          };
          showResetNotice = prev.searchBy !== next && (
            prev.billingAuthorities.length > 0
            || (!keepUsers && prev.caseworkers.length > 0)
            || !!prev.workThat
            || !!prev.completedFrom
            || !!prev.completedTo
          );
          return nextState;
        });
      } else {
        const next = resolvedKey === 'caseworker' ? 'caseworker' : 'billingAuthority';
        setPrefilters((prev) => {
          const nextState: ManagerPrefilterState = {
            ...prev,
            searchBy: next as ManagerSearchBy,
            billingAuthorities: next === 'billingAuthority' ? prev.billingAuthorities : [],
            caseworkers: next === 'caseworker' ? prev.caseworkers : [],
            workThat: undefined,
            completedFrom: undefined,
            completedTo: undefined,
          };
          showResetNotice = prev.searchBy !== next && (
            (next !== 'billingAuthority' && prev.billingAuthorities.length > 0)
            || (next !== 'caseworker' && prev.caseworkers.length > 0)
            || !!prev.workThat
            || !!prev.completedFrom
            || !!prev.completedTo
          );
          return nextState;
        });
      }
      setPrefilterResetNotice(showResetNotice ? PREFILTER_RESET_NOTICE : undefined);
      setComboEditingFor('prefilterWorkThat', false);
      setPrefilterWorkThatSearch('');
      markPrefilterDirty();
    },
    [isQcAssign, markPrefilterDirty, setComboEditingFor],
  );

  const normalizedCaseworkerOptions = React.useMemo<IDropdownOption[]>(() => {
    const seen = new Set<string>();
    return (Array.isArray(caseworkerOptions) ? caseworkerOptions : [])
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      })
      .map((value) => ({ key: value, text: value }));
  }, [caseworkerOptions]);

  const normalizedQcUserOptions = React.useMemo<IDropdownOption[]>(() => {
    const seen = new Set<string>();
    return (Array.isArray(qcUserOptions) ? qcUserOptions : [])
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      })
      .map((value) => ({ key: value, text: value }));
  }, [qcUserOptions]);

  const caseworkerOptionsList = React.useMemo<IDropdownOption[]>(() => {
    if (caseworkerOptionsLoading) {
      return [{ key: '__loading__', text: 'Loading caseworkers...', disabled: true }];
    }
    if (caseworkerOptionsError) {
      return [{ key: '__error__', text: caseworkerOptionsError, disabled: true }];
    }
    if (normalizedCaseworkerOptions.length === 0) {
      return [{ key: '__empty__', text: 'No caseworkers found', disabled: true }];
    }
    return [{ key: CASEWORKER_ALL_KEY, text: 'All' }, ...normalizedCaseworkerOptions];
  }, [caseworkerOptionsError, caseworkerOptionsLoading, normalizedCaseworkerOptions]);

  const qcUserOptionsList = React.useMemo<IDropdownOption[]>(() => {
    if (qcUserOptionsLoading) {
      return [{ key: '__loading__', text: 'Loading QC users...', disabled: true }];
    }
    if (qcUserOptionsError) {
      return [{ key: '__error__', text: qcUserOptionsError, disabled: true }];
    }
    if (normalizedQcUserOptions.length === 0) {
      return [{ key: '__empty__', text: 'No QC users found', disabled: true }];
    }
    return isQcAssign
      ? [{ key: CASEWORKER_ALL_KEY, text: 'All' }, ...normalizedQcUserOptions]
      : normalizedQcUserOptions;
  }, [isQcAssign, normalizedQcUserOptions, qcUserOptionsError, qcUserOptionsLoading]);

  const filteredCaseworkerOptionsList = React.useMemo(
    () => filterComboOptions(caseworkerOptionsList as IComboBoxOption[], caseworkerSearch),
    [caseworkerOptionsList, caseworkerSearch],
  );

  const filteredQcUserOptionsList = React.useMemo(
    () => filterComboOptions(qcUserOptionsList as IComboBoxOption[], caseworkerSearch),
    [caseworkerSearch, qcUserOptionsList],
  );

  const setComboSearchTextFor = React.useCallback((key: string, value?: string) => {
    setComboSearchText((prev) => ({
      ...prev,
      [key]: normalizeComboSearchText(value),
    }));
  }, []);

  const caseworkerSelectedKeys = React.useMemo<string[]>(() => {
    const selected = prefilters.caseworkers ?? [];
    if (selected.length === 0) return [];
    const withoutAll = selected.filter((v) => v !== CASEWORKER_ALL_KEY);
    if (withoutAll.length > 0) {
      return withoutAll;
    }
    return selected.includes(CASEWORKER_ALL_KEY) ? [CASEWORKER_ALL_KEY] : selected;
  }, [prefilters.caseworkers]);

  const onPrefilterCaseworkerChange = React.useCallback(
    (_: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
      if (!option || option.disabled) return;
      setPrefilterResetNotice(undefined);
      const key = String(option.key);
      if (key === CASEWORKER_ALL_KEY) {
        setPrefilters((prev) => ({
          ...prev,
          caseworkers: option.selected ? [CASEWORKER_ALL_KEY] : [],
        }));
        markPrefilterDirty();
        return;
      }
      if (key.startsWith('__')) return;
      setPrefilters((prev) => {
        const current = prev.caseworkers.filter((v) => v !== CASEWORKER_ALL_KEY);
        const next = option.selected ? [...current, key] : current.filter((v) => v !== key);
        return { ...prev, caseworkers: next };
      });
      markPrefilterDirty();
    },
    [markPrefilterDirty],
  );

  const onPrefilterWorkThatChange = React.useCallback(
    (_: React.FormEvent<IComboBox>, option?: IComboBoxOption, _index?: number, value?: string) => {
      const options = (
        isCaseworkerView
          ? CASEWORKER_WORKTHAT_SELF_OPTIONS
          : isQcView
            ? QC_WORKTHAT_SELF_OPTIONS
          : isQcAssign
            ? getQcWorkThatOptions(prefilters.searchBy as QcSearchBy)
            : getManagerWorkThatOptions(prefilters.searchBy)
      ) as IComboBoxOption[];
      const resolvedKey = option?.key ?? resolveComboOptionKey(options, value);
      const nextWork = resolvedKey as ManagerWorkThat | undefined;
      const needsCompleted = (isQcAssign || isQcView) ? isQcCompletedWorkThat(nextWork) : isManagerCompletedWorkThat(nextWork);
      setPrefilterResetNotice(undefined);
      setPrefilters((prev) => ({
        ...prev,
        workThat: nextWork,
        completedFrom: needsCompleted ? prev.completedFrom : undefined,
        completedTo: needsCompleted ? prev.completedTo : undefined,
      }));
      markPrefilterDirty();
    },
    [isCaseworkerView, isQcAssign, isQcView, markPrefilterDirty, prefilters.searchBy],
  );

  const onPrefilterFromDateChange = React.useCallback(
    (date?: Date | null) => {
      const fromIso = date ? toISODateString(date) : undefined;
      const toIso = computeCompletedToDateIso(date, today);
      setPrefilterResetNotice(undefined);
      setPrefilters((prev) => ({
        ...prev,
        completedFrom: fromIso,
        completedTo: toIso,
      }));
      markPrefilterDirty();
    },
    [markPrefilterDirty, toISODateString, today],
  );

  const handlePrefilterSearch = React.useCallback(() => {
    if (!onPrefilterApply) return;
    const needsCompleted = (isQcAssign || isQcView)
      ? isQcCompletedWorkThat(prefilters.workThat)
      : isManagerCompletedWorkThat(prefilters.workThat);
    const normalized: ManagerPrefilterState = {
      ...prefilters,
      completedFrom: needsCompleted ? prefilters.completedFrom : undefined,
      completedTo: needsCompleted ? prefilters.completedTo : undefined,
    };
    dismissResultMessages();
    prefilterManualApplyRef.current = true;
    try {
      const storedPrefilters = getPrefiltersForStorage(normalized);
      const payload: StoredPrefilterState = { ...storedPrefilters, applied: true };
      localStorage.setItem(prefilterStorageKey, JSON.stringify(payload));
    } catch {
      // ignore storage failures
    }
    onPrefilterApply(normalized, { source: 'user' });
    setPrefilterResetNotice(undefined);
    prefilterDirtyRef.current = false;
    clearAutoApplyInFlight();
    comboIgnoreNextInputRef.current = {};
    comboIgnoreNextChangeRef.current = {};
    comboExpectedSelectionRef.current = {};
    if (isPrefilterNarrow) {
      setPrefilterExpanded(false);
    }
  }, [clearAutoApplyInFlight, dismissResultMessages, isPrefilterNarrow, onPrefilterApply, prefilters]);

  const handlePrefilterClear = React.useCallback(() => {
    dismissResultMessages();
    setPrefilterResetNotice(undefined);
    prefilterDirtyRef.current = true;
    prefilterClearedRef.current = true;
    clearAutoApplyInFlight();
    comboIgnoreNextInputRef.current = {};
    comboIgnoreNextChangeRef.current = {};
    comboExpectedSelectionRef.current = {};
    if (isCaseworkerView) {
      setPrefilters(caseworkerPrefilterDefaults);
    } else if (isQcView) {
      setPrefilters(qcViewPrefilterDefaults);
    } else if (isQcAssign) {
      setPrefilters(QC_PREFILTER_DEFAULT);
    } else {
      setPrefilters(MANAGER_PREFILTER_DEFAULT);
    }
    setComboEditingFor('prefilterSearchBy', false);
    setComboEditingFor('prefilterWorkThat', false);
    setPrefilterSearchBySearch('');
    setPrefilterWorkThatSearch('');
    setManagerBillingSearch('');
    setCaseworkerSearch('');
    onPrefilterClear?.();
  }, [
    caseworkerPrefilterDefaults,
    clearAutoApplyInFlight,
    dismissResultMessages,
    isCaseworkerView,
    isQcAssign,
    isQcView,
    onPrefilterClear,
    qcViewPrefilterDefaults,
    setComboEditingFor,
  ]);

  const getLengthErrors = React.useCallback(
    (fs: GridFilterState) => {
      if (isSalesSearch) {
        return getSalesSearchErrors(fs);
      }

      const cfg = SEARCH_FIELD_CONFIGS[fs.searchBy];
      let searchField: string | undefined;
      if (cfg?.minLength && typeof cfg.stateKey === 'string') {
        const val = getFilterField(fs, cfg.stateKey);
        const text = typeof val === 'string' ? val.trim() : '';
        if (text.length > 0 && text.length < cfg.minLength) {
          searchField = `Enter at least ${cfg.minLength} characters`;
        }
      }
      const saleId = sanitizeAlphaNumHyphen(fs.saleId, ID_FIELD_MAX_LENGTH).trim();
      const saleIdError =
        fs.searchBy === 'saleId' && saleId.length > 0
          ? saleId.length < 3
            ? 'Enter at least 3 characters'
            : !SALE_ID_REGEX.test(saleId)
              ? 'Please enter a valid Sale ID'
              : undefined
          : undefined;
      const taskId = sanitizeTaskIdInput(fs.taskId, ID_FIELD_MAX_LENGTH).trim();
      const taskIdError =
        fs.searchBy === 'taskId' && taskId.length > 0
          ? taskId.length < TASK_ID_MIN_LENGTH
            ? `Enter at least ${TASK_ID_MIN_LENGTH} characters`
            : !TASK_ID_REGEX.test(taskId)
              ? 'Please enter a valid Task ID Use A- or M- prefix (e.g. A-1000001) or numbers only.'
              : undefined
          : undefined;
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
        saleId: saleIdError,
        taskId: taskIdError,
        searchField,
      };
    },
    [isSalesSearch, isValidUkPostcode, normalizeUkPostcode],
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
        !isSalesSearch &&
        sanitized.searchBy === 'uprn' &&
        sanitized.uprn &&
        (sanitized.uprn.length < 8 || sanitized.uprn.length > 10)
      ) {
        return;
      }
      setFilters(sanitized);
      onSearch(sanitized);
    }, 350);
  }, [autoSearchEnabled, filters, getLengthErrors, isSalesSearch, onSearch]);

  React.useEffect(() => () => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
  }, []);

  React.useEffect(() => {
    setFilters(searchFilters);
  }, [searchFilters]);

  React.useEffect(() => {
    setMenuFilterSearch('');
  }, [menuState]);

  const searchByOptions = React.useMemo<IDropdownOption[]>(() => {
    const keys = isSalesSearch ? SALES_SEARCH_OPTIONS : getSearchByOptionsFor(tableKey);
    return keys.map((k) => {
      const cfg = SEARCH_FIELD_CONFIGS[k];
      const label = cfg?.label ?? k.charAt(0).toUpperCase() + k.slice(1);
      return { key: k, text: label };
    });
  }, [isSalesSearch, tableKey]);
  const filteredSearchByOptions = React.useMemo(
    () => filterComboOptions(searchByOptions as IComboBoxOption[], searchBySearch),
    [searchByOptions, searchBySearch],
  );
  const searchByHint = comboEditing.searchBy
    ? getComboDisambiguationHint(filteredSearchByOptions, searchBySearch)
    : undefined;
  const searchByTitle = buildSelectedTooltip(
    [String(filters.searchBy)],
    searchByOptions as IComboBoxOption[],
    isSalesSearch ? salesSearchText.searchPanel.searchByLabel : commonText.labels.searchBy,
  );

  const lengthErrors = React.useMemo(() => getLengthErrors(filters), [filters, getLengthErrors]);
  const addressError = lengthErrors.address;
  const postcodeError = lengthErrors.postcode;
  const streetError = lengthErrors.street;
  const townError = lengthErrors.townCity;
  const saleIdError = lengthErrors.saleId;
  const taskIdError = lengthErrors.taskId;
  const billingAuthorityError = lengthErrors.billingAuthority;
  const billingAuthorityRefError = lengthErrors.bacode;
  const normalizedBillingAuthorityOptions = React.useMemo<IComboBoxOption[]>(() => {
    const seen = new Set<string>();
    return (Array.isArray(billingAuthorityOptions) ? billingAuthorityOptions : [])
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      })
      .map((value) => ({ key: value, text: value }));
  }, [billingAuthorityOptions]);

  const billingAuthorityOptionsList = React.useMemo<IComboBoxOption[]>(() => {
    if (billingAuthorityOptionsLoading) {
      return [{ key: '__loading__', text: 'Loading...', disabled: true }];
    }
    if (billingAuthorityOptionsError) {
      return [{ key: '__error__', text: billingAuthorityOptionsError, disabled: true }];
    }
    return normalizedBillingAuthorityOptions;
  }, [billingAuthorityOptionsError, billingAuthorityOptionsLoading, normalizedBillingAuthorityOptions]);

  const filteredBillingAuthorityOptionsList = React.useMemo(
    () => filterComboOptions(billingAuthorityOptionsList, billingAuthoritySearch),
    [billingAuthorityOptionsList, billingAuthoritySearch],
  );
  const salesSearchRequiredErrors = React.useMemo(() => {
    if (!isSalesSearch) {
      return {
        saleId: undefined,
        taskId: undefined,
        uprn: undefined,
        billingAuthority: undefined,
        bacode: undefined,
      };
    }

    const shouldShow = (key: SalesSearchFieldKey): boolean => salesSearchAttempted || !!salesSearchTouched[key];
    const saleIdValue = sanitizeAlphaNumHyphen(filters.saleId, ID_FIELD_MAX_LENGTH).trim();
    const taskIdValue = sanitizeTaskIdInput(filters.taskId, ID_FIELD_MAX_LENGTH).trim();
    const uprnValue = (filters.uprn ?? '').trim();
    const billingAuthorityValue = (filters.billingAuthority?.[0] ?? '').trim();
    const billingAuthorityRefValue = (filters.bacode ?? '').trim();

    return {
      saleId: filters.searchBy === 'saleId' && shouldShow('saleId') && saleIdValue.length === 0
        ? 'Sale ID is required'
        : undefined,
      taskId: filters.searchBy === 'taskId' && shouldShow('taskId') && taskIdValue.length === 0
        ? 'Task ID is required'
        : undefined,
      uprn: filters.searchBy === 'uprn' && shouldShow('uprn') && uprnValue.length === 0
        ? 'UPRN is required'
        : undefined,
      billingAuthority: filters.searchBy === 'billingAuthority' && shouldShow('billingAuthority') && billingAuthorityValue.length === 0
        ? 'Billing Authority is required'
        : undefined,
      bacode: filters.searchBy === 'billingAuthority'
        && shouldShow('bacode')
        && billingAuthorityValue.length > 0
        && billingAuthorityRefValue.length === 0
        ? 'Billing Authority Reference is required'
        : undefined,
    };
  }, [filters.bacode, filters.billingAuthority, filters.saleId, filters.searchBy, filters.taskId, filters.uprn, isSalesSearch, salesSearchAttempted, salesSearchTouched]);

  const managerBillingAuthorityOptions = React.useMemo<IDropdownOption[]>(() => {
    if (billingAuthorityOptionsLoading) {
      return [{ key: '__loading__', text: 'Loading...', disabled: true }];
    }
    if (billingAuthorityOptionsError) {
      return [{ key: '__error__', text: billingAuthorityOptionsError, disabled: true }];
    }
    const base = normalizedBillingAuthorityOptions;
    return base.length > 0 ? [{ key: BILLING_AUTHORITY_ALL_KEY, text: 'All' }, ...base] : base;
  }, [billingAuthorityOptionsError, billingAuthorityOptionsLoading, normalizedBillingAuthorityOptions]);

  const filteredManagerBillingAuthorityOptions = React.useMemo(
    () => filterComboOptions(managerBillingAuthorityOptions as IComboBoxOption[], managerBillingSearch),
    [managerBillingAuthorityOptions, managerBillingSearch],
  );
  const prefilterBillingHint = managerBillingSearch.trim()
    ? getComboDisambiguationHint(filteredManagerBillingAuthorityOptions, managerBillingSearch)
    : undefined;

  const prefilterSearchByOptions = React.useMemo(
    () => (isQcAssign ? QC_SEARCH_BY_OPTIONS : MANAGER_SEARCH_BY_OPTIONS),
    [isQcAssign],
  );
  const filteredPrefilterSearchByOptions = React.useMemo(
    () => filterComboOptions(
      prefilterSearchByOptions as IComboBoxOption[],
      prefilterSearchBySearch,
    ),
    [prefilterSearchByOptions, prefilterSearchBySearch],
  );
  const prefilterSearchByHint = comboEditing.prefilterSearchBy
    ? getComboDisambiguationHint(filteredPrefilterSearchByOptions, prefilterSearchBySearch)
    : undefined;
  const prefilterSearchByTitle = buildSelectedTooltip(
    [String(prefilters.searchBy)],
    prefilterSearchByOptions as IComboBoxOption[],
    prefilterTooltips.searchBy,
  );

  const managerBillingSelectedKeys = React.useMemo<string[]>(() => {
    const selected = prefilters.billingAuthorities ?? [];
    if (selected.length === 0) return [];
    const withoutAll = selected.filter((v) => v !== BILLING_AUTHORITY_ALL_KEY);
    if (withoutAll.length > 0) {
      return withoutAll;
    }
    return selected.includes(BILLING_AUTHORITY_ALL_KEY) ? [BILLING_AUTHORITY_ALL_KEY] : selected;
  }, [prefilters.billingAuthorities]);

  React.useEffect(() => {
    const selectionKey = managerBillingSelectedKeys.join('|');
    if (lastManagerBillingSelectionRef.current === selectionKey) return;
    lastManagerBillingSelectionRef.current = selectionKey;
    if (managerBillingSearch) {
      setManagerBillingSearch('');
    }
  }, [managerBillingSelectedKeys, managerBillingSearch]);

  React.useEffect(() => {
    const selectionKey = caseworkerSelectedKeys.join('|');
    if (lastCaseworkerSelectionRef.current === selectionKey) return;
    lastCaseworkerSelectionRef.current = selectionKey;
    if (caseworkerSearch) {
      setCaseworkerSearch('');
    }
  }, [caseworkerSelectedKeys, caseworkerSearch]);

  const onPrefilterBillingChange = React.useCallback(
    (_: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
      if (!option) return;
      setPrefilterResetNotice(undefined);
      const key = String(option.key);
      if (key === '__loading__' || key === '__error__') return;
      if (key === BILLING_AUTHORITY_ALL_KEY) {
        setPrefilters((prev) => ({
          ...prev,
          billingAuthorities: option.selected ? [BILLING_AUTHORITY_ALL_KEY] : [],
        }));
        markPrefilterDirty();
        return;
      }
      setPrefilters((prev) => {
        const current = prev.billingAuthorities.filter((v) => v !== BILLING_AUTHORITY_ALL_KEY);
        const next = option.selected ? [...current, key] : current.filter((v) => v !== key);
        return { ...prev, billingAuthorities: next };
      });
      markPrefilterDirty();
    },
    [markPrefilterDirty],
  );
  const summaryFlagError = lengthErrors.summaryFlag;
  const searchFieldError = lengthErrors.searchField;
  const resetSalesSearchValidationUi = React.useCallback(() => {
    setSalesSearchTouched({});
    setSalesSearchAttempted(false);
  }, []);
  const markSalesSearchFieldTouched = React.useCallback((key: SalesSearchFieldKey) => {
    setSalesSearchTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const updateFilters = React.useCallback(
    (key: keyof GridFilterState, value: GridFilterState[keyof GridFilterState]) => {
      if (key !== 'searchBy') {
        setSearchResetNotice(undefined);
      }
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onSearchByChange = React.useCallback(
    (_: React.FormEvent<IComboBox>, option?: IComboBoxOption, _index?: number, value?: string) => {
      const resolvedKey = option?.key ?? resolveComboOptionKey(searchByOptions as IComboBoxOption[], value);
      if (!resolvedKey) {
        return;
      }
      const selected = resolvedKey as SearchByOption;
      if (isSalesSearch) {
        onSearchDirty?.();
        resetSalesSearchValidationUi();
        const nextFilters = {
          ...createDefaultGridFilters(),
          searchBy: selected,
        };
        const hasSalesSearchValues =
          !!(filters.saleId ?? '').trim()
          || !!(filters.taskId ?? '').trim()
          || !!(filters.uprn ?? '').trim()
          || !!(filters.address ?? '').trim()
          || !!(filters.buildingNameNumber ?? '').trim()
          || !!(filters.street ?? '').trim()
          || !!(filters.townCity ?? '').trim()
          || !!(filters.postcode ?? '').trim()
          || (filters.billingAuthority?.length ?? 0) > 0
          || !!(filters.bacode ?? '').trim();
        setSearchResetNotice(
          filters.searchBy !== selected && hasSalesSearchValues
            ? SEARCH_BY_RESET_NOTICE
            : undefined,
        );
        setFilters({
          ...nextFilters,
        });
        return;
      }
      setSearchResetNotice(undefined);
      setFilters((prev) => ({
        ...prev,
        searchBy: selected,
      }));
    },
    [filters, isSalesSearch, onSearchDirty, resetSalesSearchValidationUi, searchByOptions],
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
    (key: keyof GridFilterState, option?: IComboBoxOption, limit?: number) => {
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
    (key: keyof GridFilterState, option?: IComboBoxOption) => {
      setFilters((prev) => ({ ...prev, [key]: (option?.key as string) ?? undefined }));
    },
    [],
  );

  const uprnError = React.useMemo(() => {
    if (isSalesSearch) {
      return lengthErrors.uprn;
    }
    if (filters.searchBy !== 'uprn' || !filters.uprn || filters.uprn.length === 0) {
      return undefined;
    }
    if (filters.uprn.length >= 8 && filters.uprn.length <= 10) {
      return undefined;
    }
    return 'UPRN must be 8 to 10 digits';
  }, [filters.searchBy, filters.uprn, isSalesSearch, lengthErrors.uprn]);
  const displaySaleIdError = salesSearchRequiredErrors.saleId ?? saleIdError;
  const displayTaskIdError = salesSearchRequiredErrors.taskId ?? taskIdError;
  const displayUprnError = salesSearchRequiredErrors.uprn ?? uprnError;
  const displayBillingAuthorityError = billingAuthorityOptionsError ?? salesSearchRequiredErrors.billingAuthority ?? billingAuthorityError;
  const displayBillingAuthorityRefError = salesSearchRequiredErrors.bacode ?? billingAuthorityRefError;

  const salesSearchCanSearch = React.useMemo(() => {
    if (!isSalesSearch) return true;
    const saleId = sanitizeAlphaNumHyphen(filters.saleId, ID_FIELD_MAX_LENGTH).trim();
    const taskId = sanitizeTaskIdInput(filters.taskId, ID_FIELD_MAX_LENGTH).trim();
    const uprnRaw = (filters.uprn ?? '').trim();
    const billingAuthority = (filters.billingAuthority?.[0] ?? '').trim();
    const billingAuthorityReference = (filters.bacode ?? '').trim();
    const building = (filters.buildingNameNumber ?? '').trim();
    const street = (filters.street ?? '').trim();
    const town = (filters.townCity ?? '').trim();
    const postcode = normalizeUkPostcode(filters.postcode ?? '').trim();

    switch (filters.searchBy) {
      case 'saleId':
        return saleId.length >= 3 && SALE_ID_REGEX.test(saleId);
      case 'taskId':
        return taskId.length >= TASK_ID_MIN_LENGTH && TASK_ID_REGEX.test(taskId);
      case 'uprn':
        return uprnRaw.length > 0 && uprnRaw.length <= UPRN_MAX_LENGTH && /^[0-9]+$/.test(uprnRaw);
      case 'billingAuthority':
        return billingAuthority.length > 0 && billingAuthorityReference.length > 0;
      case 'address': {
        const hasPostcode = postcode.length > 0;
        const postcodeValid = hasPostcode ? isValidUkPostcode(postcode, false) : false;
        if (hasPostcode) {
          return postcodeValid;
        }
        const buildingValid = building.length > 0;
        const streetValid = street.length >= MIN_ADDRESS_TEXT_LENGTH;
        const townValid = town.length >= MIN_ADDRESS_TEXT_LENGTH;
        const criteriaCount = (buildingValid ? 1 : 0) + (streetValid ? 1 : 0) + (townValid ? 1 : 0);
        return criteriaCount >= 2;
      }
      default:
        return false;
    }
  }, [filters, isSalesSearch, isValidUkPostcode, normalizeUkPostcode]);
  const getFirstInvalidSalesSearchFieldId = React.useCallback((): string | undefined => {
    if (!isSalesSearch) return undefined;

    const saleIdValue = sanitizeAlphaNumHyphen(filters.saleId, ID_FIELD_MAX_LENGTH).trim();
    const taskIdValue = sanitizeTaskIdInput(filters.taskId, ID_FIELD_MAX_LENGTH).trim();
    const uprnValue = (filters.uprn ?? '').trim();
    const billingAuthorityValue = (filters.billingAuthority?.[0] ?? '').trim();
    const billingAuthorityRefValue = (filters.bacode ?? '').trim();
    const postcodeValue = normalizeUkPostcode(filters.postcode ?? '').trim();

    switch (filters.searchBy) {
      case 'saleId':
        return saleIdValue.length === 0 || !!saleIdError ? 'sales-saleid' : undefined;
      case 'taskId':
        return taskIdValue.length === 0 || !!taskIdError ? 'sales-taskid' : undefined;
      case 'uprn':
        return uprnValue.length === 0 || !!uprnError ? 'sales-uprn' : undefined;
      case 'billingAuthority':
        if (!!billingAuthorityOptionsError || billingAuthorityValue.length === 0) {
          return 'sales-billingauthority';
        }
        if (billingAuthorityRefValue.length === 0) {
          return 'sales-bacode';
        }
        return undefined;
      case 'address': {
        if (postcodeValue.length > 0 && postcodeError) {
          return 'sales-postcode';
        }
        if (streetError) {
          return 'sales-street';
        }
        if (townError) {
          return 'sales-towncity';
        }
        if (addressError) {
          return 'sales-buildingnamenumber';
        }
        return undefined;
      }
      default:
        return undefined;
    }
  }, [addressError, billingAuthorityOptionsError, filters.bacode, filters.billingAuthority, filters.postcode, filters.saleId, filters.searchBy, filters.taskId, filters.uprn, isSalesSearch, normalizeUkPostcode, postcodeError, saleIdError, streetError, taskIdError, townError, uprnError]);
  const handleSalesSearchUnavailableAttempt = React.useCallback(() => {
    if (!isSalesSearch) return;
    setSalesSearchAttempted(true);
    const fieldId = getFirstInvalidSalesSearchFieldId();
    if (!fieldId) return;
    window.setTimeout(() => {
      focusSalesSearchFieldById(fieldId);
    }, 0);
  }, [getFirstInvalidSalesSearchFieldId, isSalesSearch]);

  const salesSearchHasErrors = React.useMemo(() => {
    if (!isSalesSearch) return false;
    return [
      saleIdError,
      taskIdError,
      uprnError,
      addressError,
      postcodeError,
      streetError,
      townError,
      billingAuthorityError,
      billingAuthorityRefError,
    ].some((err) => Boolean(err));
  }, [
    addressError,
    billingAuthorityError,
    billingAuthorityRefError,
    isSalesSearch,
    postcodeError,
    saleIdError,
    streetError,
    taskIdError,
    townError,
    uprnError,
  ]);

  const isSearchDisabled = React.useMemo(
    () => {
      if (isSalesSearch) {
        return salesSearchHasErrors || !salesSearchCanSearch;
      }
      return !!uprnError || !!addressError || !!postcodeError || !!summaryFlagError || !!saleIdError || !!taskIdError || !!searchFieldError;
    },
    [
      addressError,
      isSalesSearch,
      postcodeError,
      saleIdError,
      salesSearchCanSearch,
      salesSearchHasErrors,
      searchFieldError,
      summaryFlagError,
      taskIdError,
      uprnError,
    ],
  );

  const handleSearch = React.useCallback(() => {
    if (isSalesSearch) {
      if (salesSearchHasErrors || !salesSearchCanSearch) {
        return;
      }
      const sanitized = sanitizeFilters(filters);
      const next: GridFilterState = {
        ...sanitized,
        searchBy: filters.searchBy,
      };
      if (filters.searchBy === 'saleId') {
        next.saleId = sanitizeAlphaNumHyphen(filters.saleId, ID_FIELD_MAX_LENGTH).trim() || undefined;
      }
      if (filters.searchBy === 'taskId') {
        next.taskId = sanitizeTaskIdInput(filters.taskId, ID_FIELD_MAX_LENGTH).trim() || undefined;
      }
      if (filters.searchBy === 'uprn') {
        next.uprn = sanitizeDigits(filters.uprn, UPRN_MAX_LENGTH).trim() || undefined;
      }
      if (filters.searchBy === 'billingAuthority') {
        const authority = (filters.billingAuthority?.[0] ?? '').trim();
        next.billingAuthority = authority ? [authority] : undefined;
        next.bacode = (filters.bacode ?? '').trim() || undefined;
      }
      if (filters.searchBy === 'address') {
        next.buildingNameNumber = (filters.buildingNameNumber ?? '').trim() || undefined;
        next.street = (filters.street ?? '').trim() || undefined;
        next.townCity = (filters.townCity ?? '').trim() || undefined;
        next.postcode = normalizeUkPostcode(filters.postcode ?? '').trim() || undefined;
      }
      setFilters(next);
      setSearchResetNotice(undefined);
      setSalesSearchAttempted(false);
      dismissResultMessages();
      onSearch(next);
      return;
    }

    if (uprnError || addressError || postcodeError || summaryFlagError || saleIdError || taskIdError || searchFieldError) {
      return;
    }
    const sanitized = sanitizeFilters(filters);
    if (sanitized.searchBy === 'uprn' && sanitized.uprn && (sanitized.uprn.length < 8 || sanitized.uprn.length > 10)) {
      return;
    }
    setFilters(sanitized);
    setSearchResetNotice(undefined);
    dismissResultMessages();
    onSearch(sanitized);
  }, [
    addressError,
    dismissResultMessages,
    filters,
    isSalesSearch,
    normalizeUkPostcode,
    onSearch,
    postcodeError,
    saleIdError,
    salesSearchCanSearch,
    salesSearchHasErrors,
    searchFieldError,
    summaryFlagError,
    taskIdError,
    uprnError,
  ]);

  const handleClear = React.useCallback(() => {
    const defaults = isSalesSearch
      ? { ...createDefaultGridFilters(), searchBy: 'address' as SearchByOption }
      : createDefaultGridFilters();
    if (isSalesSearch) {
      resetSalesSearchValidationUi();
    }
    setFilters(defaults);
    setSearchResetNotice(undefined);
    dismissResultMessages();
    onSearch(defaults);
  }, [dismissResultMessages, isSalesSearch, onSearch, resetSalesSearchValidationUi]);

  const showPostcodeHint = React.useMemo(() => {
    if (isSalesSearch) {
      return false;
    }
    if (!filters.postcode || filters.postcode.length === 0) {
      return false;
    }
    return filters.searchBy === 'postcode' || filters.searchBy === 'address';
  }, [filters.postcode, filters.searchBy, isSalesSearch]);

  const handleNavigate = React.useCallback(
    async (
      item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
      column?: IColumn,
      _forceLoader = false,
    ) => {
      if (!item) return;
      if (viewSaleNavigationLockRef.current) {
        return;
      }
      viewSaleNavigationLockRef.current = true;
      viewSaleRequestSeq.current += 1;
      const requestId = viewSaleRequestSeq.current;
      setViewSaleNavigationPending(true);
      // Canvas owns the navigation loader for sales-record transitions.
      // Keep the PCF responsive but ignore repeat activations until the current
      // navigation attempt settles.
      try {
        await Promise.resolve(onNavigate(item));
      } finally {
        if (viewSaleRequestSeq.current === requestId) {
          viewSaleNavigationLockRef.current = false;
          setViewSaleNavigationPending(false);
          setViewSaleLoading(false);
        }
      }
    },
    [onNavigate],
  );

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
        const columnClassNames: string[] = [];
        let headerClassName: string | undefined;
        if (lowerName === 'saleid') {
          columnClassNames.push('voa-col-saleid-cell');
          headerClassName = 'voa-col-saleid-header';
        }
        if (lowerName === 'saleprice' || lowerName === 'ratio' || lowerName === 'outlierratio') {
          columnClassNames.push('voa-col-numeric-cell');
          headerClassName = headerClassName ? `${headerClassName} voa-col-numeric-header` : 'voa-col-numeric-header';
        }
        const usesTabularNumerals = [
          'saleid',
          'taskid',
          'uprn',
          'transactiondate',
          'saleprice',
          'ratio',
          'outlierratio',
          'assigneddate',
          'taskcompleteddate',
          'qcassigneddate',
          'qccompleteddate',
        ].includes(lowerName);
        if (usesTabularNumerals) {
          columnClassNames.push('voa-col-tabular-cell');
          headerClassName = headerClassName ? `${headerClassName} voa-col-tabular-header` : 'voa-col-tabular-header';
        }
        if (lowerName === 'ratio' || lowerName === 'outlierratio') {
          columnClassNames.push('voa-col-numeric-gap-right-cell');
          headerClassName = headerClassName
            ? `${headerClassName} voa-col-numeric-gap-right-header`
            : 'voa-col-numeric-gap-right-header';
        }
        if (lowerName === 'dwellingtype' || lowerName === 'overallflag') {
          columnClassNames.push('voa-col-gap-left-cell');
          headerClassName = headerClassName
            ? `${headerClassName} voa-col-gap-left-header`
            : 'voa-col-gap-left-header';
        }
        if (lowerName === 'reviewflags' || lowerName === 'overallflag' || lowerName === 'summaryflags' || lowerName === 'taskstatus') {
          columnClassNames.push('voa-col-tag-dense');
        }
        const col: IGridColumn = {
          key: c.name,
          name: cfg.ColDisplayName ?? c.displayName,
          fieldName: c.name,
          className: columnClassNames.length > 0 ? columnClassNames.join(' ') : undefined,
          headerClassName,
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
          format: cfg.ColFormat,
          childColumns: [],
        };
        const configuredHorizontalAlign = (cfg.ColHorizontalAlign ?? '').trim().toLowerCase();
        const hasConfiguredAlignment =
          configuredHorizontalAlign === 'left' ||
          configuredHorizontalAlign === 'center' ||
          configuredHorizontalAlign === 'right' ||
          !!cfg.ColVerticalAlign;
        const shouldUseGridCellRenderer =
          resolvedCellType === 'tag' ||
          resolvedCellType === 'indicatortag' ||
          resolvedCellType === 'link' ||
          resolvedCellType === 'image' ||
          resolvedCellType === 'clickableimage' ||
          resolvedCellType === 'expand' ||
          hasConfiguredAlignment ||
          !!cfg.ColFormat;
        if (shouldUseGridCellRenderer) {
          col.onRender = (
            item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
            _?: number,
            column?: IColumn,
          ) => (
            <GridCell item={item} column={column} onCellAction={(i, col) => void handleNavigate(i, col)} />
          );
        }
        return col;
      }),
    );
  }, [datasetColumns, sorting, columnConfigs, handleNavigate]);

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
    return mapped;
  }, [records, sortedRecordIds]);
  const pageItemCount = items.length;

  const applySelectionChange = React.useCallback((action: () => void) => {
    selection.setChangeEvents(false);
    action();
    selection.setChangeEvents(true);
  }, [selection]);

  const clearPageSelection = React.useCallback(() => {
    applySelectionChange(() => {
      selection.setItems(items, true);
    });
    setSelectFirstError(undefined);
  }, [applySelectionChange, items]);

  const selectFirstOnPage = React.useCallback(() => {
    if (pageItemCount === 0) return;
    const raw = selectFirstInput.trim();
    const parsed = Number(raw);
    const max = pageItemCount;
    if (!raw || Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
      const template = commonText.selectionControls.selectFirstErrorText;
      setSelectFirstError(formatTemplate(template, { max }));
      return;
    }
    const clamped = Math.min(Math.floor(parsed), max);
    if (clamped !== parsed) {
      setSelectFirstInput(String(clamped));
    }
    setSelectFirstError(undefined);
    applySelectionChange(() => {
      selection.setItems(items, true);
      for (let i = 0; i < clamped; i += 1) {
        selection.setIndexSelected(i, true, false);
      }
    });
  }, [applySelectionChange, commonText.selectionControls.selectFirstErrorText, items, pageItemCount, selectFirstInput, selection]);

  const lastPageRef = React.useRef(currentPage);
  React.useEffect(() => {
    if (lastPageRef.current !== currentPage) {
      lastPageRef.current = currentPage;
      applySelectionChange(() => {
        selection.setItems(items, true);
      });
      setSelectFirstError(undefined);
    }
  }, [applySelectionChange, currentPage, items, selection]);

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
      const hasActiveColumnState = sort !== undefined || activeFilter;
      const headerClassName = joinClassNames(
        c.headerClassName,
        hasActiveColumnState && 'voa-col-header--active',
        sort && 'voa-col-header--sorted',
        activeFilter && 'voa-col-header--filtered',
      );
      return {
        ...c,
        headerClassName,
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
    if (disableClientFiltering) {
      return items;
    }
    return filterItemsByColumnFilters(
      items,
      columnFiltersState,
      tableKey,
      getFilterableText,
      (item, field) => (item as unknown as Record<string, unknown>)[field],
    );
  }, [columnFiltersState, disableClientFiltering, getFilterableText, items, tableKey]);

  React.useEffect(() => {
    if (!showResults) {
      setHorizontalOverflowState((prev) => (
        prev.hasOverflow || prev.canScrollLeft || prev.canScrollRight
          ? { hasOverflow: false, canScrollLeft: false, canScrollRight: false }
          : prev
      ));
      return;
    }
    const element = resultsRef.current;
    if (!element) return;
    const handleScroll = () => updateHorizontalOverflowState();
    handleScroll();
    element.addEventListener('scroll', handleScroll, { passive: true });
    let observer: ResizeObserver | undefined;
    const content = element.querySelector('.voa-grid-list');
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => handleScroll());
      observer.observe(element);
      if (content instanceof HTMLElement) {
        observer.observe(content);
      }
    } else {
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      element.removeEventListener('scroll', handleScroll);
      observer?.disconnect();
      if (!observer) {
        window.removeEventListener('resize', handleScroll);
      }
    };
  }, [
    columnsWithIcons.length,
    currentPage,
    filteredItems.length,
    itemsLoading,
    shimmer,
    showResults,
    updateHorizontalOverflowState,
  ]);

  const resultTotal = React.useMemo(
    () => (typeof taskCount === 'number' ? taskCount : filteredItems.length),
    [filteredItems.length, taskCount],
  );

  const selectionSummaryText = React.useMemo(() => {
    const template = commonText.selectionControls.selectionSummaryText;
    return formatTemplate(template, {
      selected: selectedCount,
      pageTotal: pageItemCount,
      resultTotal,
    });
  }, [commonText.selectionControls.selectionSummaryText, pageItemCount, resultTotal, selectedCount]);

  const resultsSummaryText = React.useMemo(() => {
    if (resultTotal === 0 || pageItemCount === 0) {
      return commonText.selectionControls.resultsSummaryEmptyText;
    }
    const effectivePageSize = Math.max(pageSize ?? pageItemCount, pageItemCount);
    const from = currentPage * effectivePageSize + 1;
    const to = Math.min(from + pageItemCount - 1, resultTotal);
    return formatTemplate(commonText.selectionControls.resultsSummaryText, {
      from,
      to,
      total: resultTotal,
    });
  }, [
    commonText.selectionControls.resultsSummaryEmptyText,
    commonText.selectionControls.resultsSummaryText,
    currentPage,
    pageItemCount,
    pageSize,
    resultTotal,
  ]);

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
      const hasAllOrOther = hasAllOrOtherOption(combined);
      if (cfg.selectAll && !hasAllOrOther) {
        combined = [{ key: SELECT_ALL_KEY, text: commonText.selectionControls.selectAllText }, ...combined];
      }
      return combined;
    },
    [commonText.selectionControls.selectAllText, getDistinctOptions],
  );

  const renderSearchControl = React.useCallback(() => {
    const cfg = SEARCH_FIELD_CONFIGS[filters.searchBy];
    if (!cfg) return null;

    if (isSalesSearch) {
      if (filters.searchBy === 'address') {
        const buildingTitle = buildValueTooltip(filters.buildingNameNumber, salesSearchText.tooltips?.buildingNameNumber);
        const streetTitle = buildValueTooltip(filters.street, salesSearchText.tooltips?.street);
        const townTitle = buildValueTooltip(filters.townCity, salesSearchText.tooltips?.townCity);
        const postcodeTitle = buildValueTooltip(filters.postcode, salesSearchText.tooltips?.postcode);
        return (
          <>
            <Stack.Item styles={{ root: { minWidth: 220 } }}>
              <TextField
                id="sales-buildingnamenumber"
                label={salesSearchText.fields.buildingNameNumber}
                placeholder={salesSearchText.placeholders.buildingNameNumber}
                title={buildingTitle}
                value={filters.buildingNameNumber ?? ''}
                onChange={(_, v) => updateFilters('buildingNameNumber', (v ?? '').slice(0, ADDRESS_FIELD_MAX_LENGTH))}
                errorMessage={addressError}
                maxLength={ADDRESS_FIELD_MAX_LENGTH}
              />
            </Stack.Item>
            <Stack.Item styles={{ root: { minWidth: 220 } }}>
              <TextField
                id="sales-street"
                label={salesSearchText.fields.street}
                placeholder={salesSearchText.placeholders.street}
                title={streetTitle}
                value={filters.street ?? ''}
                onChange={(_, v) => updateFilters('street', (v ?? '').slice(0, ADDRESS_FIELD_MAX_LENGTH))}
                errorMessage={streetError}
                maxLength={ADDRESS_FIELD_MAX_LENGTH}
              />
            </Stack.Item>
            <Stack.Item styles={{ root: { minWidth: 220 } }}>
              <TextField
                id="sales-towncity"
                label={salesSearchText.fields.townCity}
                placeholder={salesSearchText.placeholders.townCity}
                title={townTitle}
                value={filters.townCity ?? ''}
                onChange={(_, v) => updateFilters('townCity', (v ?? '').slice(0, ADDRESS_FIELD_MAX_LENGTH))}
                errorMessage={townError}
                maxLength={ADDRESS_FIELD_MAX_LENGTH}
              />
            </Stack.Item>
            <Stack.Item styles={{ root: { minWidth: 200 } }}>
              <TextField
                id="sales-postcode"
                label={salesSearchText.fields.postcode}
                placeholder={salesSearchText.placeholders.postcode}
                title={postcodeTitle}
                value={filters.postcode ?? ''}
                onChange={(_, v) => {
                  const next = (v ?? '').toUpperCase().slice(0, 12);
                  updateFilters('postcode', next);
                }}
                errorMessage={postcodeError}
                maxLength={12}
              />
            </Stack.Item>
          </>
        );
      }

      if (filters.searchBy === 'billingAuthority') {
        const authority = filters.billingAuthority?.[0] ?? '';
        const billingAuthorityHint = comboEditing.salesBillingAuthority
          ? getComboDisambiguationHint(filteredBillingAuthorityOptionsList, billingAuthoritySearch)
          : undefined;
        const billingAuthorityHintId = 'voa-sales-billingauthority-hint';
        const billingAuthorityTitle = buildSelectedTooltip(
          authority ? [authority] : [],
          billingAuthorityOptionsList,
          salesSearchText.tooltips?.billingAuthority,
        );
        const billingAuthorityRefTitle = buildValueTooltip(filters.bacode, salesSearchText.tooltips?.billingAuthorityReference);
        return (
          <>
            <Stack.Item styles={{ root: { minWidth: 240 } }}>
              <ComboBox
                id="sales-billingauthority"
                label={salesSearchText.fields.billingAuthority}
                ariaLabel={formatRequiredAriaLabel(salesSearchText.fields.billingAuthority, true)}
                aria-describedby={buildAriaDescribedBy(billingAuthorityHint ? billingAuthorityHintId : undefined)}
                placeholder={salesSearchText.placeholders.billingAuthority}
                title={billingAuthorityTitle}
                onRenderLabel={() => renderSalesSearchLabel(salesSearchText.fields.billingAuthority, true)}
                options={filteredBillingAuthorityOptionsList}
                selectedKey={comboEditing.salesBillingAuthority ? null : authority}
                allowFreeform={false}
                allowFreeInput
                autoComplete="off"
                text={comboEditing.salesBillingAuthority ? billingAuthoritySearch : undefined}
                onChange={(event, opt, _index, value) => {
                  if (consumeComboIgnoreNextChange('salesBillingAuthority', opt)) return;
                  if (shouldIgnoreComboChange('salesBillingAuthority', opt)) return;
                  const searchValue = typeof value === 'string' ? value : billingAuthoritySearch;
                  const resolvedOptions = filterComboOptions(billingAuthorityOptionsList, searchValue);
                  const resolvedKey = opt?.key ?? resolveComboKeyFromSearch(resolvedOptions, searchValue, authority);
                  if (!resolvedKey || resolvedKey === '__loading__' || resolvedKey === '__error__') return;
                  const next = String(resolvedKey ?? '');
                  setComboCancelNextDismiss('salesBillingAuthority');
                  updateFilters('billingAuthority', next ? [next] : undefined);
                  setComboEditingFor('salesBillingAuthority', false);
                  setBillingAuthoritySearch('');
                }}
                onKeyDownCapture={(event) => {
                  if (event.key === 'Escape') {
                    setComboCancelNextDismiss('salesBillingAuthority');
                    return;
                  }
                  const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter';
                  if (!isEnter) return;
                  const inputValue = getComboInputValue(event) || billingAuthoritySearch;
                  if (!inputValue.trim()) return;
                  const resolvedOptions = filterComboOptions(billingAuthorityOptionsList, inputValue);
                  commitComboSingleSelect(
                    event,
                    inputValue,
                    resolvedOptions,
                    authority,
                    (opt) => {
                      if (!opt || opt.key === '__loading__' || opt.key === '__error__') return;
                      const next = String(opt.key ?? '');
                      updateFilters('billingAuthority', next ? [next] : undefined);
                      setComboEditingFor('salesBillingAuthority', false);
                      setBillingAuthoritySearch('');
                    },
                    'salesBillingAuthority',
                  );
                }}
                onInputValueChange={(value) => {
                  const next = normalizeSingleSelectSearchText(value, billingAuthorityOptionsList);
                  if (!next) {
                    setComboEditingFor('salesBillingAuthority', false);
                    setBillingAuthoritySearch('');
                    return;
                  }
                  setComboEditingFor('salesBillingAuthority', true);
                  setBillingAuthoritySearch(next);
                }}
                onKeyDown={(event) => {
                  if (event.defaultPrevented) return;
                  const inputValue = getComboInputValue(event) || billingAuthoritySearch;
                  if (!inputValue.trim()) return;
                  const resolvedOptions = filterComboOptions(billingAuthorityOptionsList, inputValue);
                  commitComboSingleSelect(
                    event,
                    inputValue,
                    resolvedOptions,
                    authority,
                    (opt) => {
                      if (!opt || opt.key === '__loading__' || opt.key === '__error__') return;
                      const next = String(opt.key ?? '');
                      updateFilters('billingAuthority', next ? [next] : undefined);
                      setComboEditingFor('salesBillingAuthority', false);
                      setBillingAuthoritySearch('');
                    },
                    'salesBillingAuthority',
                  );
                }}
                onMenuDismissed={() => {
                  if (!consumeComboCancelNextDismiss('salesBillingAuthority')) {
                    commitComboSingleSelectOnDismiss(
                      billingAuthoritySearch,
                      billingAuthorityOptionsList,
                      authority,
                      (opt) => {
                        if (!opt || opt.key === '__loading__' || opt.key === '__error__') return;
                        const next = String(opt.key ?? '');
                        updateFilters('billingAuthority', next ? [next] : undefined);
                      },
                    );
                  }
                  setComboEditingFor('salesBillingAuthority', false);
                  setBillingAuthoritySearch('');
                }}
                onBlur={() => markSalesSearchFieldTouched('billingAuthority')}
                errorMessage={displayBillingAuthorityError}
                styles={{
                  root: { width: '100%' },
                  callout: { minWidth: 240 },
                  optionsContainer: { minWidth: 240 },
                }}
              />
              {billingAuthorityHint && (
                <Text id={billingAuthorityHintId} variant="small" styles={{ root: { marginTop: 4 } }}>
                  {billingAuthorityHint}
                </Text>
              )}
            </Stack.Item>
            <Stack.Item styles={{ root: { minWidth: 240 } }}>
              <TextField
                id="sales-bacode"
                label={salesSearchText.fields.billingAuthorityReference}
                ariaLabel={formatRequiredAriaLabel(salesSearchText.fields.billingAuthorityReference, true)}
                placeholder={salesSearchText.placeholders.billingAuthorityReference}
                title={billingAuthorityRefTitle}
                onRenderLabel={() => renderSalesSearchLabel(salesSearchText.fields.billingAuthorityReference, true)}
                value={filters.bacode ?? ''}
                onChange={(_, v) => updateFilters('bacode', (v ?? '').slice(0, ADDRESS_FIELD_MAX_LENGTH))}
                onBlur={() => markSalesSearchFieldTouched('bacode')}
                errorMessage={displayBillingAuthorityRefError}
                maxLength={ADDRESS_FIELD_MAX_LENGTH}
              />
            </Stack.Item>
          </>
        );
      }

      if (filters.searchBy === 'saleId') {
        const saleIdTitle = buildValueTooltip(filters.saleId, salesSearchText.tooltips?.saleId);
        return (
          <Stack.Item styles={{ root: { minWidth: 260 } }}>
            <TextField
              id="sales-saleid"
              label={salesSearchText.fields.saleId}
              ariaLabel={formatRequiredAriaLabel(salesSearchText.fields.saleId, true)}
              placeholder={salesSearchText.placeholders.saleId}
              title={saleIdTitle}
              onRenderLabel={() => renderSalesSearchLabel(salesSearchText.fields.saleId, true)}
              value={filters.saleId ?? ''}
              onChange={(_, v) => updateFilters('saleId', sanitizeAlphaNumHyphen(v, ID_FIELD_MAX_LENGTH))}
              onBlur={() => markSalesSearchFieldTouched('saleId')}
              errorMessage={displaySaleIdError}
              maxLength={ID_FIELD_MAX_LENGTH}
            />
          </Stack.Item>
        );
      }

      if (filters.searchBy === 'taskId') {
        const taskIdTitle = buildValueTooltip(filters.taskId, salesSearchText.tooltips?.taskId);
        return (
          <Stack.Item styles={{ root: { minWidth: 260 } }}>
            <TextField
              id="sales-taskid"
              label={salesSearchText.fields.taskId}
              ariaLabel={formatRequiredAriaLabel(salesSearchText.fields.taskId, true)}
              placeholder={salesSearchText.placeholders.taskId}
              title={taskIdTitle}
              onRenderLabel={() => renderSalesSearchLabel(salesSearchText.fields.taskId, true)}
              value={filters.taskId ?? ''}
              onChange={(_, v) => updateFilters('taskId', sanitizeTaskIdInput(v, ID_FIELD_MAX_LENGTH))}
              onBlur={() => markSalesSearchFieldTouched('taskId')}
              errorMessage={displayTaskIdError}
              maxLength={ID_FIELD_MAX_LENGTH}
            />
          </Stack.Item>
        );
      }

      if (filters.searchBy === 'uprn') {
        const uprnTitle = buildValueTooltip(filters.uprn, salesSearchText.tooltips?.uprn);
        return (
          <Stack.Item styles={{ root: { minWidth: 260 } }}>
            <>
              <TextField
                id="sales-uprn"
                label={salesSearchText.fields.uprn}
                ariaLabel={formatRequiredAriaLabel(salesSearchText.fields.uprn, true)}
                placeholder={salesSearchText.placeholders.uprn}
                title={uprnTitle}
                onRenderLabel={() => renderSalesSearchLabel(salesSearchText.fields.uprn, true)}
                value={filters.uprn ?? ''}
                onChange={(_, v) => updateFilters('uprn', sanitizeDigits(v, UPRN_MAX_LENGTH))}
                onBlur={() => markSalesSearchFieldTouched('uprn')}
                errorMessage={displayUprnError}
                inputMode="numeric"
                maxLength={UPRN_MAX_LENGTH}
                aria-describedby={buildAriaDescribedBy('voa-sales-uprn-hint')}
              />
              <Text id="voa-sales-uprn-hint" variant="small" className="voa-search-field-hint">
                {salesSearchText.hints.uprnInput}
              </Text>
            </>
          </Stack.Item>
        );
      }

      return null;
    }

    const textError =
      cfg.key === 'address'
        ? addressError
        : cfg.key === 'postcode'
        ? postcodeError
        : cfg.key === 'summaryFlag'
        ? summaryFlagError
        : cfg.key === 'saleId'
        ? saleIdError
        : cfg.key === 'taskId'
        ? taskIdError
        : cfg.key === 'uprn'
        ? uprnError
        : filters.searchBy === cfg.key
        ? searchFieldError
        : undefined;

    if (cfg.control === 'text' || cfg.control === 'textContains' || cfg.control === 'textPrefix') {
      const val = getFilterField(filters, cfg.stateKey);
      const value = typeof val === 'string' ? val : '';
      const hintText = cfg.tooltip ?? cfg.placeholder ?? cfg.label;
      const tooltip = buildValueTooltip(value, hintText);
      return (
        <Stack.Item styles={{ root: { minWidth: cfg.control === 'textContains' ? 260 : 200 } }}>
          <TextField
            label={cfg.label}
            placeholder={cfg.placeholder}
            title={tooltip}
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
              {commonText.hints.postcodePartial}
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
      const numericModeOptions: IComboBoxOption[] = [
        { key: '>=', text: commonText.filters.numericModes.gte },
        { key: '<=', text: commonText.filters.numericModes.lte },
        { key: 'between', text: commonText.filters.numericModes.between },
      ];
      const modeTitle = buildSelectedTooltip([mode], numericModeOptions, commonText.labels.options);
      const minLabel = mode === '<=' ? commonText.labels.max : commonText.labels.min;
      const minTitle = buildValueTooltip(minValue === undefined ? '' : String(minValue), minLabel);
      const maxTitle = buildValueTooltip(maxValue === undefined ? '' : String(maxValue), commonText.labels.max);
      return (
        <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
          <Stack.Item styles={{ root: { minWidth: 140 } }}>
            <ComboBox
              label={commonText.labels.options}
              options={numericModeOptions}
              title={modeTitle}
              selectedKey={mode}
              allowFreeform={false}
              autoComplete="off"
              onChange={(_, o) =>
                updateNumericFilter(numericKey, 'mode', typeof o?.key === 'string' ? o.key : mode)
              }
              styles={{
                root: { width: '100%' },
                callout: { minWidth: 240 },
                optionsContainer: { minWidth: 200 },
              }}
            />
          </Stack.Item>
          <Stack.Item styles={{ root: { minWidth: 140 } }}>
            <TextField
              label={minLabel}
              type="number"
              title={minTitle}
              value={String(minValue ?? '')}
              onChange={(_, v) => updateNumericFilter(numericKey, mode === '<=' ? 'max' : 'min', v ?? '')}
            />
          </Stack.Item>
          {mode === 'between' && (
            <Stack.Item styles={{ root: { minWidth: 140 } }}>
              <TextField
                label={commonText.labels.max}
                type="number"
                title={maxTitle}
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
      const fromTitle = buildValueTooltip(from ? formatDisplayDate(from) : '', `${cfg.label} start`);
      const toTitle = buildValueTooltip(to ? formatDisplayDate(to) : '', `${cfg.label} end`);
      return (
        <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
          <Stack.Item styles={{ root: { minWidth: 160 } }}>
            <DatePicker
              label={`${cfg.label} start`}
              firstDayOfWeek={DayOfWeek.Monday}
              strings={dateStrings}
              value={from}
              formatDate={formatDisplayDate}
              allowTextInput
              parseDateFromString={parseDateInput}
              title={fromTitle}
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
              allowTextInput
              parseDateFromString={parseDateInput}
              title={toTitle}
              onSelectDate={(d) => updateDateRange(cfg.stateKey as 'transactionDate', 'to', d)}
            />
          </Stack.Item>
        </Stack>
      );
    }

    if (cfg.control === 'singleSelect') {
      const options = buildDropdownOptions(cfg);
      const selectedKey = getFilterField<string>(filters, cfg.stateKey);
      const searchText = comboSearchText[cfg.key] ?? '';
      const isEditing = comboEditing[cfg.key] === true;
      const filteredOptions = filterComboOptions(
        options,
        searchText,
      );
      const disambiguationHint = isEditing ? getComboDisambiguationHint(filteredOptions, searchText) : undefined;
      const hintId = `voa-search-${cfg.key}-hint`;
      const singleSelectTitle = buildSelectedTooltip(
        selectedKey ? [String(selectedKey)] : [],
        options,
        cfg.tooltip ?? cfg.placeholder ?? cfg.label,
      );
      return (
        <Stack.Item styles={{ root: { minWidth: 200 } }}>
          <ComboBox
            label={cfg.label}
            aria-describedby={buildAriaDescribedBy(disambiguationHint ? hintId : undefined)}
            title={singleSelectTitle}
            options={filteredOptions}
            selectedKey={isEditing ? null : selectedKey}
            allowFreeform={false}
            allowFreeInput
            autoComplete="off"
            text={isEditing ? searchText : undefined}
            onChange={(event, opt, _index, value) => {
              if (consumeComboIgnoreNextChange(cfg.key, opt)) return;
              if (shouldIgnoreComboChange(cfg.key, opt)) return;
              const searchValue = typeof value === 'string' ? value : searchText;
              const resolvedOptions = filterComboOptions(options, searchValue);
              const resolvedKey = opt?.key ?? resolveComboKeyFromSearch(resolvedOptions, searchValue, selectedKey);
              if (!resolvedKey) return;
              setComboCancelNextDismiss(cfg.key);
              updateFilters(cfg.stateKey, String(resolvedKey));
              setComboEditingFor(cfg.key, false);
              setComboSearchTextFor(cfg.key, '');
            }}
            onKeyDownCapture={(event) => {
              if (event.key === 'Escape') {
                setComboCancelNextDismiss(cfg.key);
                return;
              }
              const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter';
              if (!isEnter) return;
              const inputValue = getComboInputValue(event) || searchText;
              if (!inputValue.trim()) return;
              const resolvedOptions = filterComboOptions(options, inputValue);
              commitComboSingleSelect(event, inputValue, resolvedOptions, selectedKey, (opt) => {
                updateSingleSelect(cfg.stateKey, opt);
                setComboEditingFor(cfg.key, false);
                setComboSearchTextFor(cfg.key, '');
              }, cfg.key);
            }}
            onInputValueChange={(value) => {
              const next = normalizeSingleSelectSearchText(value, options);
              if (!next) {
                setComboEditingFor(cfg.key, false);
                setComboSearchTextFor(cfg.key, '');
                return;
              }
              setComboEditingFor(cfg.key, true);
              setComboSearchTextFor(cfg.key, next);
            }}
            onKeyDown={(event) => {
              if (event.defaultPrevented) return;
              const inputValue = getComboInputValue(event) || searchText;
              if (!inputValue.trim()) return;
              const resolvedOptions = filterComboOptions(options, inputValue);
              commitComboSingleSelect(event, inputValue, resolvedOptions, selectedKey, (opt) => {
                updateSingleSelect(cfg.stateKey, opt);
                setComboEditingFor(cfg.key, false);
                setComboSearchTextFor(cfg.key, '');
              }, cfg.key);
            }}
            onMenuDismissed={() => {
              if (!consumeComboCancelNextDismiss(cfg.key)) {
                commitComboSingleSelectOnDismiss(
                  searchText,
                  options,
                  selectedKey,
                  (opt) => {
                    updateSingleSelect(cfg.stateKey, opt);
                  },
                );
              }
              setComboEditingFor(cfg.key, false);
              setComboSearchTextFor(cfg.key, '');
            }}
            styles={{
              root: { width: '100%' },
              callout: { minWidth: 240 },
              optionsContainer: { minWidth: 200 },
            }}
          />
          {disambiguationHint && (
            <Text id={hintId} variant="small" styles={{ root: { marginTop: 4 } }}>
              {disambiguationHint}
            </Text>
          )}
        </Stack.Item>
      );
    }

    if (cfg.control === 'multiSelect') {
      const options = buildDropdownOptions(cfg);
      const selected = getFilterField<string[]>(filters, cfg.stateKey);
      const searchText = comboSearchText[cfg.key] ?? '';
      const selectedKeys = (selected ?? []).map((key) => String(key));
      const hasSelectAll = options.some((opt) => String(opt.key) === SELECT_ALL_KEY);
      const filteredOptions = filterComboOptions(options, searchText);
      const disambiguationHint = searchText.trim()
        ? getComboDisambiguationHint(filteredOptions, searchText)
        : undefined;
      const hintId = `voa-search-${cfg.key}-hint`;
      const multiSelectTitle = buildSelectedTooltip(
        selectedKeys,
        options,
        cfg.tooltip ?? cfg.placeholder ?? cfg.label,
      );
      const handleMultiSelectChange = (opt?: IComboBoxOption) => {
        if (!opt) return;
        if (hasSelectAll && String(opt.key) === SELECT_ALL_KEY) {
          const values =
            cfg.selectAllValues ??
            options
              .filter((o) => String(o.key) !== SELECT_ALL_KEY)
              .map((o) => String(o.key));
          updateFilters(cfg.stateKey, cfg.multiLimit ? values.slice(Math.max(0, values.length - cfg.multiLimit)) : values);
          setComboIgnoreNextInput(cfg.key);
          setComboSearchTextFor(cfg.key, '');
          return;
        }
        updateMultiSelect(cfg.stateKey, opt, cfg.multiLimit);
        setComboIgnoreNextInput(cfg.key);
        setComboSearchTextFor(cfg.key, '');
      };
      return (
        <Stack.Item styles={{ root: { minWidth: 200 } }}>
          <ComboBox
            label={cfg.label}
            aria-describedby={buildAriaDescribedBy(disambiguationHint ? hintId : undefined)}
            multiSelect
            allowFreeform={false}
            allowFreeInput
            autoComplete="on"
            text={searchText.trim() ? searchText : undefined}
            persistMenu
            options={filteredOptions}
            selectedKey={selectedKeys}
            title={multiSelectTitle}
            onChange={(_, opt) => handleMultiSelectChange(opt)}
            onInputValueChange={(value) => {
              if (consumeComboIgnoreNextInput(cfg.key)) {
                return;
              }
              setComboSearchTextFor(
                cfg.key,
                normalizeMultiSelectSearchText(
                  value,
                  options,
                  selectedKeys,
                ),
              );
            }}
            onKeyDown={(event) => {
              if (!searchText.trim()) return;
              commitPrefilterMultiSelect(
                event,
                searchText,
                filteredOptions,
                selectedKeys,
                (_, opt) => handleMultiSelectChange(opt),
                cfg.key,
                (value) => setComboSearchTextFor(cfg.key, value),
              );
            }}
            onMenuDismissed={() => setComboSearchTextFor(cfg.key, '')}
            styles={{
              root: { width: '100%' },
              callout: { minWidth: 240 },
              optionsContainer: { minWidth: 200 },
            }}
          />
          {disambiguationHint && (
            <Text id={hintId} variant="small" styles={{ root: { marginTop: 4 } }}>
              {disambiguationHint}
            </Text>
          )}
        </Stack.Item>
      );
    }

    return null;
  }, [
    filters,
    addressError,
    billingAuthorityError,
    billingAuthorityOptionsError,
    filteredBillingAuthorityOptionsList,
    billingAuthorityOptionsList,
    billingAuthorityOptionsLoading,
    billingAuthorityRefError,
    postcodeError,
    saleIdError,
    summaryFlagError,
    searchFieldError,
    streetError,
    taskIdError,
    townError,
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
    commonText,
    isSalesSearch,
    normalizeUkPostcode,
    salesSearchText,
    updateSingleSelect,
    updateMultiSelect,
    comboSearchText,
    comboEditing,
    billingAuthoritySearch,
    setComboSearchTextFor,
    setComboEditingFor,
    setComboIgnoreNextInput,
    setComboCancelNextDismiss,
    consumeComboIgnoreNextInput,
    consumeComboIgnoreNextChange,
    consumeComboCancelNextDismiss,
    shouldIgnoreComboChange,
    commitComboSingleSelect,
    commitComboSingleSelectOnDismiss,
    commitPrefilterMultiSelect,
    parseDateInput,
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
    if (disableViewSalesRecordAction) {
      return;
    }
    const selected = selection.getSelection();
    if (selected.length !== 1) return;
    const first = selected[0] as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord | undefined;
    if (first) {
      void handleNavigate(first, undefined, true);
    }
  }, [disableViewSalesRecordAction, handleNavigate, selection]);

  const onItemInvoked = React.useCallback(
    (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => {
      void handleNavigate(item);
    },
    [handleNavigate],
  );

  const handleSort = React.useCallback(
    (column: IGridColumn, descending: boolean) => {
      if (column.sortable === false) {
        return;
      }
      const sortField = column.sortBy ?? column.key;
      dismissResultMessages();
      onSort(sortField, descending);
      setMenuState(undefined);
    },
    [dismissResultMessages, onSort],
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
      (cfg?.options ?? []).forEach((o) => {
        if (typeof o === 'string') {
          push(o, o);
          return;
        }
        push(String(o.key ?? ''), o.text);
      });
      if (cfg?.optionFields) {
        if (menuExtraOptions.length > 0) {
          menuExtraOptions
            .map((o) => String(o).trim())
            .filter((o) => o !== '')
            .forEach((o) => push(o, o));
        } else {
          getDistinctOptions(cfg.optionFields).forEach((o) => push(String(o.key), o.text));
        }
      }
      if (cfg?.selectAllValues) {
        const isSingleAll = cfg.selectAllValues.length === 1
          && String(cfg.selectAllValues[0] ?? '').toUpperCase() === 'ALL';
        const hasAll = hasAllOption(opts);
        const hasOther = hasOtherOption(opts);
        if (isSingleAll) {
          if (!hasAll) {
            const allKey = String(cfg.selectAllValues[0] ?? 'ALL');
            opts.unshift({ key: allKey, text: 'All' });
          }
        } else if (!hasAll && !hasOther) {
          opts.unshift({ key: SELECT_ALL_KEY, text: 'Select all' });
        }
      }
      return opts;
    },
    [getDistinctOptions, menuExtraOptions],
  );

  const openMenuForColumn = React.useCallback(
    (gridCol: IGridColumn, target?: HTMLElement) => {
      if (!target) {
        return;
      }
      const fieldName = (gridCol.fieldName ?? gridCol.key) ?? '';
      const menuFilterKey = `menuFilter-${gridCol.key ?? gridCol.fieldName ?? 'column'}`;
      const cfg = getColumnFilterConfigFor(tableKey, fieldName);
      const normalizedField = String(fieldName ?? '').toLowerCase();
      menuOptionsFieldRef.current = normalizedField;
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
      setMenuFilterSearch('');
      comboIgnoreNextInputRef.current[menuFilterKey] = false;
      comboIgnoreNextChangeRef.current[menuFilterKey] = false;
      delete comboExpectedSelectionRef.current[menuFilterKey];
      setMenuFilterError(undefined);
      setMenuExtraOptions([]);
      setMenuState({ target, column: gridCol });
      if (onLoadFilterOptions && (cfg?.control === 'singleSelect' || cfg?.control === 'multiSelect')) {
        void onLoadFilterOptions(fieldName ?? '', '')
          .then((vals) => {
            if (menuOptionsFieldRef.current !== normalizedField) return;
            setMenuExtraOptions(vals ?? []);
            return undefined;
          })
          .catch(() => {
            if (menuOptionsFieldRef.current !== normalizedField) return;
            setMenuExtraOptions([]);
            return undefined;
          });
      }
    },
    [columnFiltersState, onLoadFilterOptions, tableKey],
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
    if (normalizedField === 'taskid') {
      const trimmed = sanitizeTaskIdInput(menuFilterText, ID_FIELD_MAX_LENGTH).trim();
      if (trimmed && trimmed.length < TASK_ID_MIN_LENGTH) {
        setMenuFilterError(`Enter at least ${TASK_ID_MIN_LENGTH} characters`);
        return;
      }
      if (trimmed && !TASK_ID_REGEX.test(trimmed)) {
        setMenuFilterError('Use A- or M- prefix (e.g. A-1000001) or numbers only.');
        return;
      }
    }
    dismissResultMessages();
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
          const trimmed = normalizedField === 'taskid'
            ? sanitizeTaskIdInput(menuFilterText, ID_FIELD_MAX_LENGTH).trim()
            : normalizedField === 'postcode'
              ? normalizeUkPostcode(String(menuFilterText ?? ''))
              : String(menuFilterText ?? '').trim();
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
          const isSingleAll = cfg.selectAllValues
            && cfg.selectAllValues.length === 1
            && String(cfg.selectAllValues[0] ?? '').toUpperCase() === 'ALL';
          const allKey = isSingleAll ? String(cfg.selectAllValues?.[0] ?? 'ALL') : '';
          const normalizedVals = allKey && vals.includes(allKey) ? [allKey] : vals;
          if (normalizedVals.length === 0) delete updated[fieldName];
          else updated[fieldName] = normalizedVals;
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
  }, [
    dismissResultMessages,
    isValidUkPostcode,
    menuFilterError,
    menuFilterText,
    menuFilterValue,
    menuState,
    normalizeUkPostcode,
    onColumnFiltersChange,
    tableKey,
  ]);

  const clearFilter = React.useCallback(() => {
    if (!menuState) {
      return;
    }
    const fieldName = (menuState.column.fieldName ?? menuState.column.key) ?? '';
    setColumnFilters((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, fieldName)) {
        return prev;
      }
      const updated: Record<string, ColumnFilterValue> = { ...prev };
      delete updated[fieldName];
      onColumnFiltersChange?.(updated);
      return updated;
    });
    const cfg: ColumnFilterConfig | undefined = getColumnFilterConfigFor(tableKey, fieldName);
    if (!cfg) {
      setMenuFilterValue('');
      setMenuFilterText('');
      setMenuFilterSearch('');
      setMenuFilterError(undefined);
      return;
    }
    switch (cfg.control) {
      case 'textEq':
      case 'textPrefix':
      case 'textContains':
      case 'singleSelect':
        setMenuFilterValue('');
        setMenuFilterText('');
        break;
      case 'multiSelect':
        setMenuFilterValue([]);
        setMenuFilterText('');
        break;
      case 'numeric': {
        const current = (menuFilterValue as NumericFilter) ?? { mode: '>=' };
        setMenuFilterValue({ mode: current.mode ?? '>=', min: undefined, max: undefined });
        setMenuFilterText('');
        break;
      }
      case 'dateRange': {
        const current = (menuFilterValue as DateRangeFilter) ?? {};
        setMenuFilterValue({ ...current, from: undefined, to: undefined });
        setMenuFilterText('');
        break;
      }
      default:
        setMenuFilterValue('');
        setMenuFilterText('');
        break;
    }
    setMenuFilterSearch('');
    setMenuFilterError(undefined);
    setMenuExtraOptions([]);
    setMenuState(undefined);
    menuState.target?.focus?.();
  }, [menuFilterValue, menuState, tableKey]);

  const onGoToTop = React.useCallback(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    topRef.current?.focus?.();
  }, []);

  const assignUsers = React.useMemo(() => assignUsersProp ?? [], [assignUsersProp]);
  const selectedAssignmentRecords = React.useMemo(
    () => (selection.getSelection() as Record<string, unknown>[]),
    [selectedCount, selection],
  );
  const disabledAssignUserIds = React.useMemo(
    () => new Set(resolveAssignedUserIdsToDisable(selectedAssignmentRecords, assignUsers, derivedScreenKind)),
    [assignUsers, derivedScreenKind, selectedAssignmentRecords],
  );
  const assignAlreadyAssignedReason = isQcAssign
    ? 'User is already QC assigned to at least one selected task.'
    : 'User is already assigned to at least one selected task.';
  const isAssignUserDisabled = React.useCallback(
    (userId: string): boolean => disabledAssignUserIds.has(userId),
    [disabledAssignUserIds],
  );
  const assignFilteredUsers = React.useMemo(() => {
    const term = assignSearch.trim().toLowerCase();
    return assignUsers.filter((u) => {
      if (!term) return true;
      return (
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [assignUsers, assignSearch]);
  const assignListItems = React.useMemo(() => {
    if (assignUsersLoading) {
      return [{
        id: ASSIGN_LOADING_ROW_ID,
        firstName: assignTasksText.loadingUsersText,
        lastName: '',
        email: '',
        team: '',
        role: '',
      }];
    }
    return assignFilteredUsers;
  }, [assignFilteredUsers, assignTasksText.loadingUsersText, assignUsersLoading]);

  const selectedAssignUser = React.useMemo(
    () => assignUsers.find((u) => u.id === assignSelectedUserId),
    [assignSelectedUserId, assignUsers],
  );

  React.useEffect(() => {
    if (!assignSelectedUserId) return;
    if (!isAssignUserDisabled(assignSelectedUserId)) return;
    setAssignSelectedUserId(undefined);
  }, [assignSelectedUserId, isAssignUserDisabled]);

  const handleAssignUserSelect = React.useCallback((userId: string) => {
    if (assignLoading || isAssignUserDisabled(userId)) return;
    setAssignSelectedUserId(userId);
  }, [assignLoading, isAssignUserDisabled]);

  const handleAssignClick = React.useCallback(async (user: AssignUser) => {
    if (!onAssignTasks || assignLoading || isAssignUserDisabled(user.id)) return;
    setAssignSelectedUserId(user.id);
    setAssignLoading(true);
    try {
      const ok = await onAssignTasks(user);
      if (ok) {
        closeAssignPanel();
        return;
      }
      closeAssignPanel();
    } finally {
      setAssignLoading(false);
    }
  }, [assignLoading, closeAssignPanel, isAssignUserDisabled, onAssignTasks]);

  const handleMarkPassedQcClick = React.useCallback(async () => {
    if (!onMarkPassedQc || markPassedQcLoading) return;
    setMarkPassedQcLoading(true);
    try {
      await onMarkPassedQc();
    } finally {
      setMarkPassedQcLoading(false);
    }
  }, [markPassedQcLoading, onMarkPassedQc]);

  const assignColumns = React.useMemo<IColumn[]>(
    () => [
      {
        key: 'select',
        name: '',
        ariaLabel: 'Select user',
        minWidth: 40,
        maxWidth: 40,
        onRender: (item: AssignUser) => (
          item.id === ASSIGN_LOADING_ROW_ID
            ? null
            : (() => {
              const disabled = assignLoading || isAssignUserDisabled(item.id);
              const disabledReason = assignLoading ? assignLoadingText : assignAlreadyAssignedReason;
              const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
              const selectLabel = disabled
                ? `Select ${fullName}. Unavailable. ${disabledReason}`
                : `Select ${fullName}`;
              return (
              <input
                className={joinClassNames('voa-assign-radio', disabled ? 'voa-focusable-disabled-radio' : undefined)}
                type="radio"
                name="assign-user"
                aria-label={selectLabel}
                disabled={disabled}
                checked={assignSelectedUserId === item.id}
                title={disabled ? disabledReason : undefined}
                onChange={() => {
                  if (disabled) return;
                  handleAssignUserSelect(item.id);
                }}
              />
              );
            })()
        ),
      },
      { key: 'firstName', name: 'First Name', fieldName: 'firstName', minWidth: 140, isResizable: true },
      { key: 'lastName', name: 'Last Name', fieldName: 'lastName', minWidth: 140, isResizable: true },
      { key: 'email', name: 'Email', fieldName: 'email', minWidth: 240, isResizable: true },
    ],
    [assignAlreadyAssignedReason, assignLoading, assignSelectedUserId, handleAssignUserSelect, isAssignUserDisabled],
  );
  const onRenderAssignUserRow = React.useCallback(
    (
      rowProps?: IDetailsRowProps,
      defaultRender?: (props?: IDetailsRowProps) => JSX.Element | null,
    ): JSX.Element | null => {
      if (!rowProps || !defaultRender) return null;
      const record = rowProps.item as AssignUser | undefined;
      const isLoadingRow = record?.id === ASSIGN_LOADING_ROW_ID;
      const isDisabled = !!record && !isLoadingRow && isAssignUserDisabled(record.id);
      const nextProps = {
        ...rowProps,
        className: joinClassNames(
          rowProps.className,
          isDisabled ? 'voa-assign-row-disabled' : undefined,
        ),
      } as IDetailsRowProps & { 'aria-disabled'?: boolean };
      if (isDisabled) {
        nextProps['aria-disabled'] = true;
      }
      return defaultRender(nextProps);
    },
    [isAssignUserDisabled],
  );

  const prefilterWorkThatOptions = React.useMemo(() => {
    if (isCaseworkerView) {
      return CASEWORKER_WORKTHAT_SELF_OPTIONS;
    }
    if (isQcView) {
      return QC_WORKTHAT_SELF_OPTIONS;
    }
    if (isQcAssign) {
      return getQcWorkThatOptions(prefilters.searchBy as QcSearchBy);
    }
    return getManagerWorkThatOptions(prefilters.searchBy);
  }, [isCaseworkerView, isQcAssign, isQcView, prefilters.searchBy]);
  const filteredPrefilterWorkThatOptions = React.useMemo(
    () => filterComboOptions(
      prefilterWorkThatOptions as IComboBoxOption[],
      prefilterWorkThatSearch,
    ),
    [prefilterWorkThatOptions, prefilterWorkThatSearch],
  );
  const prefilterWorkThatHint = comboEditing.prefilterWorkThat
    ? getComboDisambiguationHint(filteredPrefilterWorkThatOptions, prefilterWorkThatSearch)
    : undefined;
  React.useEffect(() => {
    if ((!isCaseworkerView && !isQcView) || prefilters.workThat) return;
    const firstOption = prefilterWorkThatOptions.find((opt) => opt?.key !== undefined);
    if (!firstOption) return;
    const nextWork = String(firstOption.key) as ManagerWorkThat;
    markPrefilterHydrating();
    setPrefilters((prev) => {
      if (prev.workThat) return prev;
      const needsCompleted = (isQcAssign || isQcView) ? isQcCompletedWorkThat(nextWork) : isManagerCompletedWorkThat(nextWork);
      return {
        ...prev,
        workThat: nextWork,
        completedFrom: needsCompleted ? prev.completedFrom : undefined,
        completedTo: needsCompleted ? prev.completedTo : undefined,
      };
    });
  }, [isCaseworkerView, isManagerAssign, isQcAssign, isQcView, markPrefilterHydrating, prefilterWorkThatOptions, prefilters.workThat]);
  const prefilterUserOptions = isQcAssign && prefilters.searchBy === 'qcUser'
    ? qcUserOptionsList
    : caseworkerOptionsList;
  const prefilterUserOptionsFiltered = isQcAssign && prefilters.searchBy === 'qcUser'
    ? filteredQcUserOptionsList
    : filteredCaseworkerOptionsList;
  const prefilterUserHint = caseworkerSearch.trim()
    ? getComboDisambiguationHint(prefilterUserOptionsFiltered, caseworkerSearch)
    : undefined;
  const prefilterUserOptionsError = isQcAssign && prefilters.searchBy === 'qcUser'
    ? qcUserOptionsError
    : caseworkerOptionsError;
  const prefilterUserLabel = isQcAssign && prefilters.searchBy === 'qcUser'
    ? qcText.prefilter.labels.qcUser
    : prefilterText.labels.caseworker;
  const prefilterUserPlaceholder = isQcAssign && prefilters.searchBy === 'qcUser'
    ? qcText.prefilter.placeholders.qcUser
    : prefilterText.placeholders.caseworker;
  const prefilterUserTooltip = isQcAssign && prefilters.searchBy === 'qcUser'
    ? prefilterTooltips.qcUser
    : prefilterTooltips.caseworker;
  const prefilterUserTitle = buildSelectedTooltip(caseworkerSelectedKeys, prefilterUserOptions as IComboBoxOption[], prefilterUserTooltip);
  const prefilterUserSelectionSummary = buildCompactSelectedSummary(
    caseworkerSelectedKeys,
    prefilterUserOptions as IComboBoxOption[],
  );
  const prefilterWorkThatTitle = buildSelectedTooltip(
    prefilters.workThat ? [String(prefilters.workThat)] : [],
    prefilterWorkThatOptions as IComboBoxOption[],
    prefilterTooltips.workThat,
  );
  const prefilterBillingTitle = buildSelectedTooltip(
    managerBillingSelectedKeys,
    managerBillingAuthorityOptions as IComboBoxOption[],
    prefilterTooltips.billingAuthority,
  );
  const prefilterBillingSelectionSummary = buildCompactSelectedSummary(
    managerBillingSelectedKeys,
    managerBillingAuthorityOptions as IComboBoxOption[],
  );
  const prefilterFromTitle = buildValueTooltip(
    formatDisplayDate(parseISODate(prefilters.completedFrom)),
    prefilterTooltips.fromDate,
  );
  const prefilterToTitle = buildValueTooltip(
    formatDisplayDate(parseISODate(prefilters.completedTo)),
    prefilterTooltips.toDate,
  );
  const prefilterUserId = isQcAssign && prefilters.searchBy === 'qcUser' ? 'prefilter-qcuser' : 'prefilter-caseworker';
  const prefilterOwnerHidden = isQcView || (isQcAssign && prefilters.searchBy === 'task');
  const prefilterNeedsCompletedDates = (isQcAssign || isQcView)
    ? isQcCompletedWorkThat(prefilters.workThat)
    : isManagerCompletedWorkThat(prefilters.workThat);
  const hasImplicitOwner = !!currentUserId?.trim();
  const prefilterHasOwner = (isCaseworkerView || isQcView)
    ? prefilters.caseworkers.length > 0 || hasImplicitOwner
    : isQcAssign
      ? (prefilters.searchBy === 'task' ? true : prefilters.caseworkers.length > 0)
      : prefilters.searchBy === 'billingAuthority'
        ? prefilters.billingAuthorities.length > 0
        : prefilters.caseworkers.length > 0;
  const prefilterHasWorkThat = !!prefilters.workThat;
  const prefilterHasFromDate = !prefilterNeedsCompletedDates || !!prefilters.completedFrom;
  const prefilterSearchDisabled = !onPrefilterApply
    || !prefilterHasOwner
    || !prefilterHasWorkThat
    || !prefilterHasFromDate
    || !!prefilterFromDateError;
  const prefilterRequiredLegendId = 'voa-prefilter-required-key';
  const prefilterIsDefault = isPrefilterDefault(prefilters);
  const hasColumnFilters = Object.keys(columnFiltersState).length > 0;
  const showViewSalesRecord = isViewSalesRecordEnabledFor(tableKey);
  const showPrefilterToggle = useAssignmentLayout && !!showResults && !!prefilterApplied;
  const prefilterToggleText = prefilterExpanded ? commonText.toggles.hidePrefilter : commonText.toggles.showPrefilter;
  const showSearchPanelToggle = showSearchPanel && !useAssignmentLayout;
  const searchPanelToggleText = searchPanelExpanded ? commonText.toggles.hideFilters : commonText.toggles.showFilters;
  const showSelectionControls = !!showResults && selectionType === SelectionMode.multiple;
  const selectionToolbarLabel = commonText.selectionControls.toolbarAriaLabel;
  const selectionGroupLabel = commonText.selectionControls.groupAriaLabel;
  const clearSelectionText = commonText.selectionControls.clearSelectionText;
  const selectFirstLabel = commonText.selectionControls.selectFirstLabel;
  const selectFirstPlaceholder = commonText.selectionControls.selectFirstPlaceholder;
  const selectFirstSuffix = commonText.selectionControls.selectFirstSuffix;
  const selectFirstButtonText = commonText.selectionControls.selectFirstButtonText;
  const selectFirstHelperText = commonText.selectionControls.selectFirstHelperText;
  const assignLoadingText = assignTasksText.loadingText;
  const selectionControlsDisabled = pageItemCount === 0;
  const selectionControlsUnavailableReason = selectionControlsDisabled ? 'No rows are available on this page.' : undefined;
  const clearSelectionUnavailableReason = selectionControlsDisabled
    ? selectionControlsUnavailableReason
    : selectedCount === 0
      ? 'No rows are currently selected.'
      : undefined;
  const viewSalesRecordUnavailableReason = viewSaleNavigationPending
    ? 'Opening the sales record. Please wait.'
    : disableViewSalesRecordAction
    ? 'Viewing the sales record is not available in this context.'
    : selectedCount !== 1
      ? 'Select exactly one row to view its sales record.'
      : undefined;
  const assignActionUnavailableReason = assignButtonState.tooltip;
  const markPassedQcUnavailableReason = markPassedQcLoading
    ? 'Mark Passed QC is currently in progress. Please wait.'
    : markPassedQcButtonState.tooltip;
  const previousPageUnavailableReason = canPrev ? undefined : 'You are already on the first page.';
  const nextPageUnavailableReason = canNext ? undefined : 'You are already on the last page.';
  const assignSearchUnavailableReason = assignLoading
    ? assignTasksText.loadingAssignText
    : assignUsersLoading
      ? assignTasksText.loadingUsersText
      : undefined;
  const assignConfirmUnavailableReason = assignLoading
    ? 'Assignment is currently in progress. Please wait.'
    : !selectedAssignUser
      ? 'Select a user before assigning tasks.'
      : undefined;
  const prefilterSearchUnavailableReason = React.useMemo(() => {
    if (!prefilterSearchDisabled) return undefined;
    if (!onPrefilterApply) return 'Prefilter search is not available on this screen.';
    if (!prefilterHasOwner) {
      if (isManagerAssign && prefilters.searchBy === 'billingAuthority') {
        return `Select ${managerText.prefilter.labels.billingAuthority} before searching.`;
      }
      return `Select ${prefilterUserLabel} before searching.`;
    }
    if (!prefilterHasWorkThat) {
      return `Select ${prefilterText.labels.workThat} before searching.`;
    }
    if (!prefilterHasFromDate) {
      return `Select ${prefilterText.labels.fromDate} before searching.`;
    }
    if (prefilterFromDateError) {
      return prefilterFromDateError;
    }
    return 'Complete the required prefilter fields before searching.';
  }, [
    isManagerAssign,
    managerText.prefilter.labels.billingAuthority,
    onPrefilterApply,
    prefilterFromDateError,
    prefilterHasFromDate,
    prefilterHasOwner,
    prefilterHasWorkThat,
    prefilterSearchDisabled,
    prefilterText.labels.fromDate,
    prefilterText.labels.workThat,
    prefilterUserLabel,
    prefilters.searchBy,
  ]);
  const searchUnavailableReason = React.useMemo(() => {
    if (!isSearchDisabled) return undefined;
    if (isSalesSearch) {
      const validationMessage = displaySaleIdError
        ?? displayTaskIdError
        ?? displayUprnError
        ?? addressError
        ?? postcodeError
        ?? streetError
        ?? townError
        ?? displayBillingAuthorityError
        ?? displayBillingAuthorityRefError;
      if (validationMessage) {
        return validationMessage;
      }
      switch (filters.searchBy) {
        case 'saleId':
          return 'Enter a valid Sale ID before searching.';
        case 'taskId':
          return 'Enter a valid Task ID before searching.';
        case 'uprn':
          return 'Enter a valid UPRN before searching.';
        case 'billingAuthority':
          return 'Select a Billing Authority and enter a Billing Authority Reference before searching.';
        case 'address':
          return 'Enter a valid postcode, or at least two address fields, before searching.';
        default:
          return 'Enter valid search criteria before searching.';
      }
    }
    return uprnError
      ?? addressError
      ?? postcodeError
      ?? summaryFlagError
      ?? saleIdError
      ?? taskIdError
      ?? searchFieldError
      ?? 'Enter valid search criteria before searching.';
  }, [
    addressError,
    displayBillingAuthorityError,
    displayBillingAuthorityRefError,
    displaySaleIdError,
    displayTaskIdError,
    displayUprnError,
    filters.searchBy,
    isSalesSearch,
    isSearchDisabled,
    postcodeError,
    searchFieldError,
    streetError,
    summaryFlagError,
    townError,
  ]);
  const salesSearchShowsRequiredFields = React.useMemo(
    () => isSalesSearch && ['billingAuthority', 'saleId', 'taskId', 'uprn'].includes(filters.searchBy),
    [filters.searchBy, isSalesSearch],
  );
  const showSalesSearchUnavailableNote = isSalesSearch && isSearchDisabled && !!searchUnavailableReason;
  const compactViewport = viewportMetrics.width > 0
    && (viewportMetrics.width <= 980 || viewportMetrics.height <= 700);
  const ultraCompactViewport = viewportMetrics.width > 0
    && (viewportMetrics.width <= 640 || viewportMetrics.height <= 520);
  const microViewport = viewportMetrics.width > 0
    && (viewportMetrics.width <= 420 || viewportMetrics.height <= 360);
  const showBulkSelectionControls = showSelectionControls && !compactViewport;
  const showCompactClearSelection = showSelectionControls && compactViewport && !microViewport && selectedCount > 0;
  const showClearFiltersButton = hasColumnFilters && !microViewport;
  const showViewSalesRecordButton = !microViewport
    && showResults
    && showViewSalesRecord
    && (!compactViewport || (!viewSaleNavigationPending && !disableViewSalesRecordAction && selectedCount === 1));
  const showAssignButton = !microViewport && Boolean(showAssign
    && (!compactViewport || !assignButtonState.disabled));
  const showMarkPassedQcButton = !microViewport && Boolean(showMarkPassedQc
    && (!compactViewport || (!markPassedQcButtonState.disabled && !markPassedQcLoading)));
  const compactActionMenuItems = React.useMemo<IContextualMenuItem[]>(() => {
    if (!microViewport) return [];
    const items: IContextualMenuItem[] = [];
    if (selectedCount > 0) {
      items.push({
        key: 'clearSelection',
        text: clearSelectionText,
        iconProps: { iconName: 'Clear' },
        onClick: clearPageSelection,
      });
    }
    if (hasColumnFilters) {
      items.push({
        key: 'clearFilters',
        text: commonText.buttons.clearFilters,
        iconProps: { iconName: 'ClearFilter' },
        onClick: () => clearAllColumnFilters(),
      });
    }
    if (showResults && showViewSalesRecord && !viewSaleNavigationPending && !disableViewSalesRecordAction && selectedCount === 1) {
      items.push({
        key: 'viewSalesRecord',
        text: commonText.tableActions.viewSalesRecord,
        iconProps: { iconName: 'View' },
        onClick: onViewSelected,
      });
    }
    if (showAssign && !assignButtonState.disabled) {
      items.push({
        key: 'assignTasks',
        text: assignActionText,
        iconProps: { iconName: 'AddFriend' },
        onClick: openAssignPanel,
      });
    }
    if (showMarkPassedQc && !markPassedQcButtonState.disabled && !markPassedQcLoading) {
      items.push({
        key: 'markPassedQc',
        text: markPassedQcText.buttonText,
        iconProps: { iconName: 'CompletedSolid' },
        onClick: () => { void handleMarkPassedQcClick(); },
      });
    }
    return items;
  }, [
    assignActionText,
    assignButtonState.disabled,
    clearPageSelection,
    clearSelectionText,
    clearAllColumnFilters,
    commonText.buttons.clearFilters,
    commonText.tableActions.viewSalesRecord,
    disableViewSalesRecordAction,
    handleMarkPassedQcClick,
    hasColumnFilters,
    markPassedQcButtonState.disabled,
    markPassedQcLoading,
    markPassedQcText.buttonText,
    microViewport,
    onViewSelected,
    openAssignPanel,
    selectedCount,
    showAssign,
    showMarkPassedQc,
    showResults,
    showViewSalesRecord,
    viewSaleNavigationPending,
  ]);
  const showCompactActionMenu = microViewport && compactActionMenuItems.length > 0;
  const showGridToolbar = !!showResults
    && [
      showBulkSelectionControls,
      showCompactClearSelection,
      showClearFiltersButton,
      showViewSalesRecordButton,
      showAssignButton,
      showMarkPassedQcButton,
    ].some(Boolean);

  const renderPrefilterLabel = React.useCallback((
    text: string,
    options?: {
      htmlFor?: string;
      id?: string;
      className?: string;
      required?: boolean;
    },
  ) => renderLabelWithRequired(text, options), []);

  const renderSalesSearchLabel = React.useCallback((
    text: string,
    required?: boolean,
  ) => renderLabelWithRequired(text, { required: required ?? false }), []);

  const menuItems = React.useMemo<IContextualMenuItem[]>(() => {
    if (!menuState) return [];
    const fieldName = (menuState.column.fieldName ?? menuState.column.key) ?? '';
    const cfg = getColumnFilterConfigFor(tableKey, fieldName);
    const options = cfg?.control === 'multiSelect' || cfg?.control === 'singleSelect'
      ? buildColumnFilterOptions(fieldName, cfg)
      : [];
    const filteredColumnOptions = cfg?.control === 'multiSelect' || cfg?.control === 'singleSelect'
      ? filterComboOptions(
        options,
        menuFilterSearch,
      )
      : options;
    const textVal = typeof menuFilterValue === 'string' ? menuFilterValue : '';
    const numVal = (menuFilterValue as NumericFilter) ?? { mode: '>=' };
    const dateVal = (menuFilterValue as DateRangeFilter) ?? {};
    const minLen = cfg?.minLength ?? 1;
    const normalizedField = fieldName.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const isPostcodeField = normalizedField === 'postcode';
    const isTaskIdField = normalizedField === 'taskid';
    const existingFilter = columnFiltersState[fieldName];
    const hasExistingFilter = (() => {
      if (existingFilter === undefined || existingFilter === null) return false;
      if (Array.isArray(existingFilter)) return existingFilter.length > 0;
      if (typeof existingFilter === 'string') return existingFilter.trim().length > 0;
      if (typeof existingFilter === 'object') {
        const maybeRange = existingFilter as DateRangeFilter;
        if (typeof maybeRange.from === 'string' || typeof maybeRange.to === 'string') {
          return !!(maybeRange.from ?? maybeRange.to);
        }
        const maybeNumeric = existingFilter as NumericFilter;
        if (typeof maybeNumeric.mode === 'string') {
          if (maybeNumeric.mode === 'between') return maybeNumeric.min !== undefined || maybeNumeric.max !== undefined;
          if (maybeNumeric.mode === '<=') return maybeNumeric.max !== undefined;
          return maybeNumeric.min !== undefined;
        }
        return JSON.stringify(existingFilter) !== '{}';
      }
      return false;
    })();

    const isApplyDisabled = () => {
      if (!cfg) {
        const len = isPostcodeField
          ? normalizeUkPostcode(String(menuFilterText ?? '')).length
          : (menuFilterText ?? '').trim().length;
        return len < minLen && !hasExistingFilter;
      }
      switch (cfg.control) {
        case 'textEq':
        case 'textPrefix':
        case 'textContains': {
          const len = isPostcodeField
            ? normalizeUkPostcode(String(menuFilterText ?? '')).length
            : (menuFilterText ?? '').trim().length;
          return len < minLen && !hasExistingFilter;
        }
        case 'singleSelect': {
          const val = typeof menuFilterValue === 'string' ? menuFilterValue.trim() : '';
          return val.length < minLen && !hasExistingFilter;
        }
        case 'multiSelect': {
          const vals = Array.isArray(menuFilterValue)
            ? menuFilterValue.map((v) => String(v).trim()).filter((v) => v !== '')
            : [];
          return vals.length < minLen && !hasExistingFilter;
        }
        case 'numeric': {
          const v = (menuFilterValue as NumericFilter) ?? { mode: '>=' };
          if (v.mode === 'between') return v.min === undefined && v.max === undefined && !hasExistingFilter;
          if (v.mode === '<=') return v.max === undefined && !hasExistingFilter;
          return v.min === undefined && !hasExistingFilter;
        }
        case 'dateRange': {
          const v = (menuFilterValue as DateRangeFilter) ?? {};
          return !(v.from ?? v.to) && !hasExistingFilter;
        }
        default:
          return false;
      }
    };
    const applyDisabled = isApplyDisabled();

    const renderControl = () => {
      if (!cfg) {
        return (
          <>
            <TextField
              label={`Filter ${menuState.column.name}`}
              placeholder={`Filter ${menuState.column.name}`}
              value={textVal}
              onChange={(_, v) => {
                const next = isTaskIdField ? sanitizeTaskIdInput(v, ID_FIELD_MAX_LENGTH) : (v ?? '');
                setMenuFilterValue(next);
                setMenuFilterText(next);
                if (menuFilterError) setMenuFilterError(undefined);
              }}
              errorMessage={(isPostcodeField || isTaskIdField) ? menuFilterError : undefined}
            />
            {isTaskIdField && (
              <Text variant="small" styles={{ root: { marginTop: 4 } }}>
                Use A- or M- prefix (e.g. A-1000001) or numbers only.
              </Text>
            )}
          </>
        );
      }
      switch (cfg.control) {
        case 'textEq':
        case 'textPrefix':
        case 'textContains':
            return (
              <>
                <TextField
                  label={`Filter ${menuState.column.name}`}
                  placeholder={`Filter ${menuState.column.name}`}
                  value={textVal}
                  onChange={(_, v) => {
                    const next = isTaskIdField ? sanitizeTaskIdInput(v, ID_FIELD_MAX_LENGTH) : (v ?? '');
                    setMenuFilterValue(next);
                    setMenuFilterText(next);
                    if (menuFilterError) setMenuFilterError(undefined);
                  }}
                  errorMessage={(isPostcodeField || isTaskIdField) ? menuFilterError : undefined}
                />
                {isTaskIdField && (
                  <Text variant="small" styles={{ root: { marginTop: 4 } }}>
                    Use A- or M- prefix (e.g. A-1000001) or numbers only.
                  </Text>
                )}
              </>
            );
          case 'singleSelect':
            return (() => {
              const menuFilterKey = `menuFilter-${menuState.column.key ?? menuState.column.fieldName ?? 'column'}`;
              const isEditing = comboEditing[menuFilterKey] === true;
              const menuHint = isEditing ? getComboDisambiguationHint(filteredColumnOptions, menuFilterSearch) : undefined;
              const menuHintId = `${menuFilterKey}-hint`;
              return (
                <>
                  <ComboBox
                    label={`Filter ${menuState.column.name}`}
                    placeholder={`Select ${menuState.column.name}`}
                    aria-describedby={buildAriaDescribedBy(menuHint ? menuHintId : undefined)}
                    options={filteredColumnOptions}
                    allowFreeform={false}
                    allowFreeInput
                    autoComplete="off"
                    text={isEditing ? menuFilterSearch : undefined}
                    selectedKey={isEditing ? null : typeof menuFilterValue === 'string' ? menuFilterValue : undefined}
                    calloutProps={{ directionalHint: DirectionalHint.bottomLeftEdge, directionalHintFixed: true }}
                    onChange={(event, opt, _index, value) => {
                      if (consumeComboIgnoreNextChange(menuFilterKey, opt)) return;
                      if (shouldIgnoreComboChange(menuFilterKey, opt)) return;
                      const searchValue = typeof value === 'string' ? value : menuFilterSearch;
                      const resolvedOptions = filterComboOptions(options, searchValue);
                      const resolvedKey = opt?.key ?? resolveComboKeyFromSearch(
                        resolvedOptions,
                        searchValue,
                        typeof menuFilterValue === 'string' ? menuFilterValue : undefined,
                      );
                      if (!resolvedKey) return;
                      setMenuFilterValue(String(resolvedKey));
                      setComboEditingFor(menuFilterKey, false);
                      setMenuFilterSearch('');
                    }}
                    onKeyDownCapture={(event) => {
                      const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter';
                      if (!isEnter) return;
                      const inputValue = getComboInputValue(event) || menuFilterSearch;
                      if (!inputValue.trim()) return;
                      const resolvedOptions = filterComboOptions(options, inputValue);
                      commitComboSingleSelect(
                        event,
                        inputValue,
                        resolvedOptions,
                        typeof menuFilterValue === 'string' ? menuFilterValue : undefined,
                        (opt) => {
                          setMenuFilterValue((opt?.key as string) ?? '');
                          setComboEditingFor(menuFilterKey, false);
                          setMenuFilterSearch('');
                        },
                        menuFilterKey,
                      );
                    }}
                    onInputValueChange={(value) => {
                      const next = normalizeSingleSelectSearchText(
                        value,
                        options,
                      );
                      if (!next) {
                        setComboEditingFor(menuFilterKey, false);
                        setMenuFilterSearch('');
                        return;
                      }
                      setComboEditingFor(menuFilterKey, true);
                      setMenuFilterSearch(next);
                    }}
                    onKeyDown={(event) => {
                      if (event.defaultPrevented) return;
                      const inputValue = getComboInputValue(event) || menuFilterSearch;
                      if (!inputValue.trim()) return;
                      const resolvedOptions = filterComboOptions(options, inputValue);
                      commitComboSingleSelect(
                        event,
                        inputValue,
                        resolvedOptions,
                        typeof menuFilterValue === 'string' ? menuFilterValue : undefined,
                        (opt) => {
                          setMenuFilterValue((opt?.key as string) ?? '');
                          setComboEditingFor(menuFilterKey, false);
                          setMenuFilterSearch('');
                        },
                        menuFilterKey,
                      );
                    }}
                  onMenuDismissed={() => {
                    setComboEditingFor(menuFilterKey, false);
                    setMenuFilterSearch('');
                  }}
                    styles={{
                      root: { width: '100%' },
                      callout: { minWidth: 240 },
                      optionsContainer: { minWidth: 200 },
                    }}
                  />
                  {menuHint && (
                    <Text id={menuHintId} variant="small" styles={{ root: { marginTop: 4 } }}>
                      {menuHint}
                    </Text>
                  )}
                </>
              );
            })();
        case 'multiSelect':
            return (
              (() => {
                const selectAllValues = cfg.selectAllValues ?? [];
                const hasAll = hasAllOption(options);
                const hasOther = hasOtherOption(options);
                const isSingleAll = selectAllValues.length === 1
                  && String(selectAllValues[0] ?? '').toUpperCase() === 'ALL';
                const hasSelectAll = selectAllValues.length > 0 && (isSingleAll || (!hasAll && !hasOther));
                const allKey = isSingleAll ? (resolveAllOptionKey(options) ?? String(selectAllValues[0] ?? 'ALL')) : '';
                const selectAllKey = hasSelectAll
                  ? (isSingleAll ? allKey : SELECT_ALL_KEY)
                  : '';
                const menuFilterKey = `menuFilter-${menuState.column.key ?? menuState.column.fieldName ?? 'column'}`;
                const selectedKeys = Array.isArray(menuFilterValue) ? menuFilterValue.map((key) => String(key)) : [];
                const rawSearch = menuFilterSearch ?? '';
                const normalizedSearch = normalizeMultiSelectSearchText(
                  rawSearch,
                  options,
                  selectedKeys,
                );
                const filteredMultiOptions = filterComboOptions(
                  options,
                  normalizedSearch,
                );
                const exactMatchKey = normalizedSearch.trim()
                  ? resolveComboOptionKey(options, normalizedSearch)
                  : undefined;
                const highlightBorder = theme.semanticColors.focusBorder ?? theme.palette.themePrimary;
                const exactMatchOptions = exactMatchKey
                  ? filteredMultiOptions.map((opt) => {
                    if (String(opt.key) !== String(exactMatchKey)) return opt;
                    const highlight = {
                      backgroundColor: theme.semanticColors.menuItemBackgroundHovered,
                      outline: `2px solid ${highlightBorder}`,
                      outlineOffset: '-2px',
                    };
                    return {
                      ...opt,
                      styles: {
                        ...opt.styles,
                        root: [opt.styles?.root, highlight],
                        rootHovered: [opt.styles?.rootHovered, highlight],
                        rootFocused: [opt.styles?.rootFocused, highlight],
                        rootPressed: [opt.styles?.rootPressed, highlight],
                      },
                    };
                  })
                  : filteredMultiOptions;
                const menuHint = normalizedSearch.trim()
                  ? getComboDisambiguationHint(filteredMultiOptions, normalizedSearch)
                  : undefined;
                const menuHintId = `${menuFilterKey}-hint`;
                const handleMenuFilterMultiChange = (opt?: IComboBoxOption) => {
                  if (!opt) return;
                  if (hasSelectAll && String(opt.key) === selectAllKey) {
                    setMenuFilterValue(isSingleAll ? [selectAllKey] : selectAllValues);
                    setComboIgnoreNextInput(menuFilterKey);
                    setMenuFilterSearch('');
                    return;
                  }
                  setMenuFilterValue((prev) => {
                    const current = Array.isArray(prev)
                      ? prev.slice().filter((key) => !hasSelectAll || String(key) !== selectAllKey)
                      : [];
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
                  setComboIgnoreNextInput(menuFilterKey);
                  setMenuFilterSearch('');
                };
                return (
                  <>
                    <ComboBox
                      label={`Filter ${menuState.column.name}`}
                      placeholder={`Select ${menuState.column.name}`}
                      aria-describedby={buildAriaDescribedBy(menuHint ? menuHintId : undefined)}
                      options={exactMatchOptions}
                      multiSelect
                      allowFreeform={false}
                      allowFreeInput
                      autoComplete="off"
                      text={normalizedSearch.trim() ? normalizedSearch : undefined}
                      persistMenu
                      selectedKey={selectedKeys}
                      calloutProps={{ directionalHint: DirectionalHint.bottomLeftEdge, directionalHintFixed: true }}
                      onChange={(_, opt) => handleMenuFilterMultiChange(opt)}
                      onInputValueChange={(value) => {
                        if (consumeComboIgnoreNextInput(menuFilterKey)) {
                          return;
                        }
                        const next = normalizeMultiSelectSearchText(
                          value,
                          options,
                          selectedKeys,
                        );
                        setMenuFilterSearch(next);
                      }}
                      onKeyDown={(event) => {
                        if (!normalizedSearch.trim()) return;
                        commitPrefilterMultiSelect(
                          event,
                          normalizedSearch,
                          filteredMultiOptions,
                          selectedKeys,
                          (_, opt) => handleMenuFilterMultiChange(opt),
                          menuFilterKey,
                          (value) => setMenuFilterSearch(value),
                        );
                      }}
                      onMenuDismissed={() => setMenuFilterSearch('')}
                      styles={{
                        root: { width: '100%' },
                        callout: { minWidth: 240 },
                        optionsContainer: { minWidth: 200 },
                      }}
                    />
                    {menuHint && (
                      <Text id={menuHintId} variant="small" styles={{ root: { marginTop: 4 } }}>
                        {menuHint}
                      </Text>
                    )}
                  </>
                );
              })()
            );
        case 'numeric':
          return (
            <Stack tokens={{ childrenGap: 8 }}>
              <ComboBox
                label={commonText.labels.options}
                options={[
                  { key: '>=', text: commonText.filters.numericModes.gte },
                  { key: '<=', text: commonText.filters.numericModes.lte },
                  { key: 'between', text: commonText.filters.numericModes.between },
                ]}
                selectedKey={numVal.mode ?? '>='}
                allowFreeform={false}
                autoComplete="off"
                onChange={(_, opt) =>
                  setMenuFilterValue((prev) => {
                    const current = (prev as NumericFilter) ?? { mode: '>=' };
                    const mode = typeof opt?.key === 'string' ? (opt.key as NumericFilter['mode']) : current.mode ?? '>=';
                    return { ...current, mode };
                  })
                }
                styles={{
                  root: { width: '100%' },
                  callout: { minWidth: 240 },
                  optionsContainer: { minWidth: 200 },
                }}
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
                allowTextInput
                parseDateFromString={parseDateInput}
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
                allowTextInput
                parseDateFromString={parseDateInput}
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
        text: commonText.columnMenu.sortAscending,
        iconProps: { iconName: 'SortUp' },
        onClick: () => handleSort(menuState.column, false),
      },
      {
        key: 'sortDesc',
        text: commonText.columnMenu.sortDescending,
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
              <FocusableActionButton
                buttonType="primary"
                text={commonText.columnMenu.apply}
                onClick={applyFilter}
                unavailable={applyDisabled}
                unavailableReason="Enter or select a filter value before applying."
                unavailableReasonId="voa-column-filter-apply-unavailable"
                ariaLabel={`Apply filter for ${columnName}`}
              />
              <DefaultButton text={commonText.columnMenu.clear} onClick={clearFilter} ariaLabel={`Clear filter for ${columnName}`} />
            </Stack>
          </div>
        ),
      },
    ];
  }, [
    menuState,
    tableKey,
    commonText,
    menuFilterError,
    menuFilterValue,
    menuFilterText,
    menuFilterSearch,
    columnFiltersState,
    comboEditing,
    handleSort,
    buildColumnFilterOptions,
    applyFilter,
    clearFilter,
    setComboEditingFor,
    setComboIgnoreNextInput,
    consumeComboIgnoreNextInput,
    consumeComboIgnoreNextChange,
    shouldIgnoreComboChange,
    commitComboSingleSelect,
    commitPrefilterMultiSelect,
    dateStrings,
    parseDateInput,
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
        className={joinClassNames(
          'voa-grid-shell',
          useAssignmentLayout && 'voa-grid-shell--assignment',
          hasSelectionColumn && 'voa-grid-shell--selection',
          compactViewport && 'voa-grid-shell--compact',
        )}
        style={{ height, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}
        ref={topRef}
        tabIndex={-1}
        aria-label={commonText.aria.resultsTable}
        data-view-sale-loading={viewSaleLoading ? 'true' : 'false'}
      >
        <div className="voa-skip-links">
          <a href="#voa-grid-results">{commonText.aria.skipToResults}</a>
          <a href="#voa-grid-pagination">{commonText.aria.skipToPagination}</a>
        </div>
        {viewSaleNavigationPending && (
          <div className="voa-view-sale-pending-note" role="status" aria-live="polite" aria-label={viewSaleLoadingText}>
            <Spinner size={SpinnerSize.small} aria-hidden />
            <span>{viewSaleLoadingText}</span>
          </div>
        )}
        {viewSaleLoading && (
          <div className="voa-view-sale-overlay" role="status" aria-live="polite" aria-label={viewSaleLoadingText}>
            <Spinner size={SpinnerSize.large} label={viewSaleLoadingText} />
          </div>
        )}
        {columnDatasetNotDefined && !dismissedColumnConfigMessage && (
          <MessageBar
            messageBarType={MessageBarType.error}
            style={{ marginBottom: 16 }}
            onDismiss={() => setDismissedColumnConfigMessage(true)}
            dismissButtonAriaLabel={commonText.buttons.clear}
          >
            {commonText.messages.columnConfigMissing}
          </MessageBar>
        )}
        {errorMessage && !dismissedErrorMessage && (
          <MessageBar
            messageBarType={MessageBarType.error}
            style={{ marginBottom: 16 }}
            onDismiss={() => setDismissedErrorMessage(true)}
            dismissButtonAriaLabel={commonText.buttons.clear}
          >
            {errorMessage}
          </MessageBar>
        )}
        {statusMessage && (
          <MessageBar
            messageBarType={statusMessage.type}
            style={{ marginBottom: 16 }}
            onDismiss={onStatusMessageDismiss}
            dismissButtonAriaLabel={commonText.buttons.clear}
          >
            {statusMessage.text}
          </MessageBar>
        )}
          {pageHeaderText && (
            <div className="voa-command-bar">
              <div className="voa-command-bar__left">
                {onBackRequested && (
                  <DefaultButton
                    className="voa-back-button"
                    text={commonText.buttons.back}
                    iconProps={{ iconName: 'Back' }}
                    ariaLabel={commonText.aria.back}
                    title={commonText.buttons.back}
                    onClick={onBackRequested}
                  />
                )}
                <div className="voa-command-bar__title-group">
                  <Text as="h1" variant={ultraCompactViewport ? 'mediumPlus' : 'large'} className="voa-command-bar__title">
                    {pageHeaderText}
                  </Text>
                  {!compactViewport && (
                    <Text variant="small" className="voa-command-bar__meta" role="status" aria-live="polite">
                      {selectionSummaryText}
                    </Text>
                  )}
                </div>
              </div>
              <div className="voa-command-bar__actions">
                {showSearchPanelToggle && (
                  <DefaultButton
                    className="voa-prefilter-toggle"
                    text={searchPanelToggleText}
                    iconProps={{ iconName: searchPanelExpanded ? 'FilterSolid' : 'Filter' }}
                    ariaLabel={searchPanelToggleText}
                    title={searchPanelToggleText}
                    aria-expanded={searchPanelExpanded}
                    onClick={toggleSearchPanel}
                  />
                )}
                {useAssignmentLayout && showPrefilterToggle && (
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
                {showCompactActionMenu && (
                  <DefaultButton
                    className="voa-compact-actions-toggle"
                    text={commonText.buttons.moreActions}
                    iconProps={{ iconName: 'More' }}
                    ariaLabel={commonText.buttons.moreActions}
                    title={commonText.buttons.moreActions}
                    menuProps={{
                      items: compactActionMenuItems,
                      directionalHint: DirectionalHint.bottomRightEdge,
                    }}
                  />
                )}
              </div>
            </div>
          )}
          {(isManagerAssign || isCaseworkerView || isQcAssign || isQcView) && prefilterExpanded && (
        <div id="voa-prefilter-panel">
        <Text id={prefilterRequiredLegendId} variant="small" className="voa-prefilter-required-key">
          {prefilterText.accessibility.requiredFieldKey}
        </Text>
        {prefilterResetNotice && (
          <Text variant="small" className="voa-prefilter-reset-note">
            {prefilterResetNotice}
          </Text>
        )}
        <Stack
          horizontal
          wrap
          verticalAlign="end"
          tokens={{ childrenGap: 16 }}
          className={`voa-prefilter-bar${useAssignmentLayout ? ' voa-prefilter-bar--inline' : ''}${prefilterNeedsCompletedDates ? '' : ' voa-prefilter-bar--no-date'}${isCaseworkerView ? ' voa-prefilter-bar--caseworker' : ''}${prefilterOwnerHidden ? ' voa-prefilter-bar--no-owner' : ''}${isQcView ? ' voa-prefilter-bar--qcview' : ''}`}
        >
          {(isManagerAssign || isQcAssign) && (
            <>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-searchby-label">
                <div className="voa-prefilter-field">
                  {renderPrefilterLabel(prefilterText.labels.searchBy, {
                    htmlFor: 'prefilter-searchby',
                    className: 'voa-prefilter-label',
                  })}
                </div>
              </Stack.Item>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-searchby-field">
                <div className="voa-prefilter-field">
                  <ComboBox
                    id="prefilter-searchby"
                    ariaLabel={prefilterText.labels.searchBy}
                    aria-describedby={buildAriaDescribedBy(prefilterSearchByHint ? 'prefilter-searchby-hint' : undefined)}
                    placeholder={prefilterText.placeholders.searchBy}
                    title={prefilterSearchByTitle}
                    options={filteredPrefilterSearchByOptions}
                    selectedKey={comboEditing.prefilterSearchBy ? null : prefilters.searchBy}
                    onChange={(event, option, _index, value) => {
                      if (consumeComboIgnoreNextChange('prefilterSearchBy', option)) return;
                      if (shouldIgnoreComboChange('prefilterSearchBy', option)) return;
                      const searchValue = typeof value === 'string' ? value : prefilterSearchBySearch;
                      const resolvedOptions = filterComboOptions(
                        prefilterSearchByOptions as IComboBoxOption[],
                        searchValue,
                      );
                      const resolvedKey = option?.key ?? resolveComboKeyFromSearch(resolvedOptions, searchValue, prefilters.searchBy);
                      if (!resolvedKey) return;
                      setComboCancelNextDismiss('prefilterSearchBy');
                      onPrefilterSearchByChange(event, { key: resolvedKey } as IComboBoxOption);
                      setComboEditingFor('prefilterSearchBy', false);
                      setPrefilterSearchBySearch('');
                    }}
                    onKeyDownCapture={(event) => {
                      if (event.key === 'Escape') {
                        setComboCancelNextDismiss('prefilterSearchBy');
                        return;
                      }
                      const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter';
                      if (!isEnter) return;
                      const inputValue = getComboInputValue(event) || prefilterSearchBySearch;
                      if (!inputValue.trim()) return;
                      const resolvedOptions = filterComboOptions(
                        prefilterSearchByOptions as IComboBoxOption[],
                        inputValue,
                      );
                      commitComboSingleSelect(
                        event,
                        inputValue,
                        resolvedOptions,
                        prefilters.searchBy,
                        (opt) => {
                          onPrefilterSearchByChange(event as unknown as React.FormEvent<IComboBox>, opt);
                          setComboEditingFor('prefilterSearchBy', false);
                          setPrefilterSearchBySearch('');
                        },
                        'prefilterSearchBy',
                      );
                    }}
                    allowFreeform={false}
                    allowFreeInput
                    autoComplete="off"
                    text={comboEditing.prefilterSearchBy ? prefilterSearchBySearch : undefined}
                    onInputValueChange={(value) => {
                      const next = normalizeSingleSelectSearchText(
                        value,
                        prefilterSearchByOptions as IComboBoxOption[],
                      );
                      if (!next) {
                        setComboEditingFor('prefilterSearchBy', false);
                        setPrefilterSearchBySearch('');
                        return;
                      }
                      setComboEditingFor('prefilterSearchBy', true);
                      setPrefilterSearchBySearch(next);
                    }}
                    onKeyDown={(event) => {
                      if (event.defaultPrevented) return;
                      const inputValue = getComboInputValue(event) || prefilterSearchBySearch;
                      if (!inputValue.trim()) return;
                      const resolvedOptions = filterComboOptions(
                        prefilterSearchByOptions as IComboBoxOption[],
                        inputValue,
                      );
                      commitComboSingleSelect(
                        event,
                        inputValue,
                        resolvedOptions,
                        prefilters.searchBy,
                        (opt) => {
                          onPrefilterSearchByChange(event as unknown as React.FormEvent<IComboBox>, opt);
                          setComboEditingFor('prefilterSearchBy', false);
                          setPrefilterSearchBySearch('');
                        },
                        'prefilterSearchBy',
                      );
                    }}
                    onMenuDismissed={() => {
                      if (!consumeComboCancelNextDismiss('prefilterSearchBy')) {
                        commitComboSingleSelectOnDismiss(
                          prefilterSearchBySearch,
                          prefilterSearchByOptions as IComboBoxOption[],
                          prefilters.searchBy,
                          (opt) => onPrefilterSearchByChange({} as React.FormEvent<IComboBox>, opt),
                        );
                      }
                      setComboEditingFor('prefilterSearchBy', false);
                      setPrefilterSearchBySearch('');
                    }}
                    styles={{
                      root: { width: '100%' },
                      callout: { minWidth: 240 },
                      optionsContainer: { minWidth: 200 },
                    }}
                  />
                  {prefilterSearchByHint && (
                    <Text id="prefilter-searchby-hint" variant="small" styles={{ root: { marginTop: 4 } }}>
                      {prefilterSearchByHint}
                    </Text>
                  )}
                </div>
              </Stack.Item>
              {isManagerAssign && prefilters.searchBy === 'billingAuthority' && (
                <>
                  <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-label">
                    <div className="voa-prefilter-field">
                      {renderPrefilterLabel(managerText.prefilter.labels.billingAuthority, {
                        htmlFor: 'prefilter-billing',
                        className: 'voa-prefilter-label',
                        required: true,
                      })}
                    </div>
                  </Stack.Item>
                  <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-field">
                    <div className="voa-prefilter-field">
                      <ComboBox
                        id="prefilter-billing"
                        ariaLabel={formatRequiredAriaLabel(managerText.prefilter.labels.billingAuthority, true)}
                        aria-describedby={buildAriaDescribedBy(
                          prefilterBillingHint ? 'prefilter-billing-hint' : undefined,
                          billingAuthorityOptionsError ? 'prefilter-billing-error' : undefined,
                        )}
                        placeholder={managerText.prefilter.placeholders.billingAuthority}
                        title={prefilterBillingTitle}
                        multiSelect
                        options={filteredManagerBillingAuthorityOptions}
                        selectedKey={managerBillingSelectedKeys}
                        onChange={(event, option) => {
                          if (!option) return;
                          onPrefilterBillingChange(event, option);
                          setComboIgnoreNextInput('prefilterBilling');
                          setManagerBillingSearch('');
                        }}
                        allowFreeform={false}
                        allowFreeInput
                        autoComplete="off"
                        text={managerBillingSearch.trim() ? managerBillingSearch : undefined}
                        persistMenu
                        onKeyDown={(event) => {
                          if (!managerBillingSearch.trim()) return;
                          commitPrefilterMultiSelect(
                            event,
                            managerBillingSearch,
                            managerBillingAuthorityOptions as IComboBoxOption[],
                            managerBillingSelectedKeys.map((key) => String(key)),
                            onPrefilterBillingChange,
                            'prefilterBilling',
                            setManagerBillingSearch,
                          );
                        }}
                        onInputValueChange={(value) => {
                          if (consumeComboIgnoreNextInput('prefilterBilling')) {
                            return;
                          }
                          setManagerBillingSearch(
                            normalizeMultiSelectSearchText(
                              value,
                              managerBillingAuthorityOptions as IComboBoxOption[],
                              managerBillingSelectedKeys.map((key) => String(key)),
                            ),
                          );
                        }}
                        onMenuDismissed={() => setManagerBillingSearch('')}
                        styles={{
                          root: { width: '100%' },
                          callout: { minWidth: 240 },
                          optionsContainer: { minWidth: 240 },
                        }}
                      />
                      {prefilterBillingHint && (
                        <Text id="prefilter-billing-hint" variant="small" styles={{ root: { marginTop: 4 } }}>
                          {prefilterBillingHint}
                        </Text>
                      )}
                      {billingAuthorityOptionsError && (
                        <Text
                          id="prefilter-billing-error"
                          variant="small"
                          role="alert"
                          aria-live="assertive"
                          styles={{ root: { color: theme.palette.redDark, marginTop: 2 } }}
                        >
                          {billingAuthorityOptionsError}
                        </Text>
                      )}
                      {prefilterBillingSelectionSummary && (
                        <TooltipHost content={prefilterBillingTitle ?? prefilterBillingSelectionSummary}>
                          <Text variant="small" className="voa-prefilter-selection-summary">
                            {prefilterBillingSelectionSummary}
                          </Text>
                        </TooltipHost>
                      )}
                    </div>
                  </Stack.Item>
                </>
              )}
              {((isManagerAssign && prefilters.searchBy === 'caseworker') || (isQcAssign && prefilters.searchBy !== 'task')) && (
                <>
                  <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-label">
                    <div className="voa-prefilter-field">
                      {renderPrefilterLabel(prefilterUserLabel, {
                        htmlFor: prefilterUserId,
                        className: 'voa-prefilter-label',
                        required: true,
                      })}
                    </div>
                  </Stack.Item>
                  <Stack.Item className="voa-prefilter-col voa-prefilter-col-owner-field">
                    <div className="voa-prefilter-field">
                      <ComboBox
                        id={prefilterUserId}
                        ariaLabel={formatRequiredAriaLabel(prefilterUserLabel, true)}
                        aria-describedby={buildAriaDescribedBy(
                          prefilterUserHint ? 'prefilter-user-hint' : undefined,
                          prefilterUserOptionsError ? 'prefilter-user-error' : undefined,
                        )}
                        placeholder={prefilterUserPlaceholder}
                        title={prefilterUserTitle}
                        multiSelect
                        options={prefilterUserOptionsFiltered}
                        selectedKey={caseworkerSelectedKeys}
                        onChange={(event, option) => {
                          if (!option) return;
                          onPrefilterCaseworkerChange(event, option);
                          setComboIgnoreNextInput('prefilterCaseworker');
                          setCaseworkerSearch('');
                        }}
                        allowFreeform={false}
                        allowFreeInput
                        autoComplete="off"
                        text={caseworkerSearch.trim() ? caseworkerSearch : undefined}
                        persistMenu
                        onKeyDown={(event) => {
                          if (!caseworkerSearch.trim()) return;
                          commitPrefilterMultiSelect(
                            event,
                            caseworkerSearch,
                            prefilterUserOptions as IComboBoxOption[],
                            caseworkerSelectedKeys.map((key) => String(key)),
                            onPrefilterCaseworkerChange,
                            'prefilterCaseworker',
                            setCaseworkerSearch,
                          );
                        }}
                        onInputValueChange={(value) => {
                          if (consumeComboIgnoreNextInput('prefilterCaseworker')) {
                            return;
                          }
                          setCaseworkerSearch(
                            normalizeMultiSelectSearchText(
                              value,
                              prefilterUserOptions as IComboBoxOption[],
                              caseworkerSelectedKeys.map((key) => String(key)),
                            ),
                          );
                        }}
                        onMenuDismissed={() => setCaseworkerSearch('')}
                        styles={{
                          root: { width: '100%' },
                          callout: { minWidth: 240 },
                          optionsContainer: { minWidth: 240 },
                        }}
                      />
                      {prefilterUserHint && (
                        <Text id="prefilter-user-hint" variant="small" styles={{ root: { marginTop: 4 } }}>
                          {prefilterUserHint}
                        </Text>
                      )}
                      {prefilterUserSelectionSummary && (
                        <TooltipHost content={prefilterUserTitle ?? prefilterUserSelectionSummary}>
                          <Text variant="small" className="voa-prefilter-selection-summary">
                            {prefilterUserSelectionSummary}
                          </Text>
                        </TooltipHost>
                      )}
                      {prefilterUserOptionsError && (
                        <Text
                          id="prefilter-user-error"
                          variant="small"
                          role="alert"
                          aria-live="assertive"
                          styles={{ root: { color: theme.palette.redDark, marginTop: 2 } }}
                        >
                          {prefilterUserOptionsError}
                        </Text>
                      )}
                    </div>
                  </Stack.Item>
                </>
              )}
            </>
          )}
          <Stack.Item className="voa-prefilter-col voa-prefilter-col-workthat-label">
            <div className="voa-prefilter-field">
              {renderPrefilterLabel(prefilterText.labels.workThat, {
                htmlFor: 'prefilter-workthat',
                className: 'voa-prefilter-label',
                required: true,
              })}
            </div>
          </Stack.Item>
          <Stack.Item className="voa-prefilter-col voa-prefilter-col-workthat-field">
            <div className="voa-prefilter-field">
              <ComboBox
                id="prefilter-workthat"
                ariaLabel={formatRequiredAriaLabel(prefilterText.labels.workThat, true)}
                aria-describedby={buildAriaDescribedBy(prefilterWorkThatHint ? 'prefilter-workthat-hint' : undefined)}
                placeholder={prefilterText.placeholders.workThat}
                title={prefilterWorkThatTitle}
                options={filteredPrefilterWorkThatOptions}
                selectedKey={comboEditing.prefilterWorkThat ? null : (prefilters.workThat ?? null)}
                calloutProps={{ setInitialFocus: false }}
                onChange={(event, option, _index, value) => {
                  if (consumeComboIgnoreNextChange('prefilterWorkThat', option)) return;
                  if (shouldIgnoreComboChange('prefilterWorkThat', option)) return;
                  const searchValue = typeof value === 'string' ? value : prefilterWorkThatSearch;
                  const resolvedOptions = filterComboOptions(
                    prefilterWorkThatOptions as IComboBoxOption[],
                    searchValue,
                  );
                  const resolvedKey = option?.key ?? resolveComboKeyFromSearch(resolvedOptions, searchValue, prefilters.workThat);
                  if (!resolvedKey) return;
                  setComboCancelNextDismiss('prefilterWorkThat');
                  onPrefilterWorkThatChange(event, { key: resolvedKey } as IComboBoxOption);
                  setComboEditingFor('prefilterWorkThat', false);
                  setPrefilterWorkThatSearch('');
                }}
                allowFreeform={false}
                allowFreeInput
                autoComplete="off"
                text={comboEditing.prefilterWorkThat ? prefilterWorkThatSearch : undefined}
                onKeyDownCapture={(event) => {
                  if (event.key === 'Escape') {
                    setComboCancelNextDismiss('prefilterWorkThat');
                    return;
                  }
                  const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter';
                  if (!isEnter) return;
                  const inputValue = getComboInputValue(event) || prefilterWorkThatSearch;
                  if (!inputValue.trim()) return;
                  const resolvedOptions = filterComboOptions(
                    prefilterWorkThatOptions as IComboBoxOption[],
                    inputValue,
                  );
                  commitComboSingleSelect(
                    event,
                    inputValue,
                    resolvedOptions,
                    prefilters.workThat,
                    (opt) => {
                      onPrefilterWorkThatChange(event as unknown as React.FormEvent<IComboBox>, opt);
                      setComboEditingFor('prefilterWorkThat', false);
                      setPrefilterWorkThatSearch('');
                    },
                    'prefilterWorkThat',
                  );
                }}
                onInputValueChange={(value) => {
                      const next = normalizeSingleSelectSearchText(
                        value,
                        prefilterWorkThatOptions as IComboBoxOption[],
                      );
                  if (!next) {
                    setComboEditingFor('prefilterWorkThat', false);
                    setPrefilterWorkThatSearch('');
                    return;
                  }
                  setComboEditingFor('prefilterWorkThat', true);
                  setPrefilterWorkThatSearch(next);
                }}
                onKeyDown={(event) => {
                  if (event.defaultPrevented) return;
                  const inputValue = getComboInputValue(event) || prefilterWorkThatSearch;
                  if (!inputValue.trim()) return;
                  const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter';
                  if (isEnter) {
                    const enabledOptions = filteredPrefilterWorkThatOptions.filter((opt) => !opt.disabled);
                    if (enabledOptions.length === 1) {
                      event.preventDefault();
                      setComboCancelNextDismiss('prefilterWorkThat');
                      onPrefilterWorkThatChange(event as unknown as React.FormEvent<IComboBox>, enabledOptions[0]);
                      setComboEditingFor('prefilterWorkThat', false);
                      setPrefilterWorkThatSearch('');
                      return;
                    }
                  }
                  const resolvedOptions = filterComboOptions(
                    prefilterWorkThatOptions as IComboBoxOption[],
                    inputValue,
                  );
                  commitComboSingleSelect(
                    event,
                    inputValue,
                    resolvedOptions,
                    prefilters.workThat,
                    (opt) => {
                      onPrefilterWorkThatChange(event as unknown as React.FormEvent<IComboBox>, opt);
                      setComboEditingFor('prefilterWorkThat', false);
                      setPrefilterWorkThatSearch('');
                    },
                    'prefilterWorkThat',
                  );
                }}
                onMenuDismissed={() => {
                  if (!consumeComboCancelNextDismiss('prefilterWorkThat')) {
                    commitComboSingleSelectOnDismiss(
                      prefilterWorkThatSearch,
                      prefilterWorkThatOptions as IComboBoxOption[],
                      prefilters.workThat,
                      (opt) => onPrefilterWorkThatChange({} as React.FormEvent<IComboBox>, opt),
                    );
                  }
                  setComboEditingFor('prefilterWorkThat', false);
                  setPrefilterWorkThatSearch('');
                }}
                styles={{
                  root: { width: '100%' },
                  callout: { minWidth: 240 },
                  optionsContainer: { minWidth: 200 },
                }}
              />
              {prefilterWorkThatHint && (
                <Text id="prefilter-workthat-hint" variant="small" styles={{ root: { marginTop: 4 } }}>
                  {prefilterWorkThatHint}
                </Text>
              )}
            </div>
          </Stack.Item>
          {prefilterNeedsCompletedDates && (
            <>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-daterange-label">
                <div className="voa-prefilter-field">
                  {renderPrefilterLabel(prefilterText.labels.completedDateRange, {
                    id: 'voa-prefilter-date-range',
                    className: 'voa-prefilter-label voa-prefilter-label--daterange',
                    required: true,
                  })}
                </div>
              </Stack.Item>
              <Stack.Item className="voa-prefilter-col voa-prefilter-col-daterange-fields">
                <div role="group" aria-labelledby="voa-prefilter-date-range" className="voa-prefilter-field">
                  <div className="voa-prefilter-date-fields">
                    <DatePicker
                      placeholder={prefilterText.placeholders.completedFrom}
                      firstDayOfWeek={DayOfWeek.Monday}
                      strings={dateStrings}
                      value={parseISODate(prefilters.completedFrom)}
                      formatDate={formatDisplayDate}
                      allowTextInput
                      parseDateFromString={parseDateInput}
                      onSelectDate={onPrefilterFromDateChange}
                      maxDate={today}
                      styles={{ root: { width: 180 } }}
                      ariaLabel={formatRequiredAriaLabel(prefilterText.labels.fromDate, true)}
                      title={prefilterFromTitle}
                    />
                    {prefilterFromDateError && (
                      <Text
                        variant="small"
                        role="alert"
                        aria-live="assertive"
                        styles={{ root: { color: theme.palette.redDark, marginTop: -2 } }}
                      >
                        {prefilterFromDateError}
                      </Text>
                    )}
                    <span id="voa-prefilter-to-date-note" className="voa-sr-only">
                      {prefilterTooltips.toDate}
                    </span>
                    <TextField
                      value={formatDisplayDate(parseISODate(prefilters.completedTo))}
                      disabled
                      aria-describedby="voa-prefilter-to-date-note"
                      className="voa-focusable-disabled-field"
                      styles={{ root: { width: 180 } }}
                      ariaLabel={`${prefilterText.labels.toDate}, calculated automatically`}
                      title={prefilterToTitle}
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
                <FocusableActionButton
                  text={prefilterText.buttons.search}
                  iconProps={{ iconName: 'Search' }}
                  onClick={handlePrefilterSearch}
                  unavailable={prefilterSearchDisabled}
                  unavailableReason={prefilterSearchUnavailableReason}
                  unavailableReasonId="voa-prefilter-search-unavailable"
                  ariaLabel={prefilterText.buttons.search}
                />
                {!prefilterIsDefault && (
                  <DefaultButton
                    text={prefilterText.buttons.clearSearch}
                    iconProps={{ iconName: 'ClearFilter' }}
                    onClick={handlePrefilterClear}
                    aria-label={commonText.aria.clearSearchFilters}
                    className="voa-prefilter-clear"
                  />
                )}
              </Stack>
            </div>
          </Stack.Item>
        </Stack>
        </div>
        )}
        {showSearchPanel && searchPanelExpanded && (
        <>
        {searchResetNotice && (
          <Text variant="small" className="voa-search-reset-note">
            {searchResetNotice}
          </Text>
        )}
        <Stack
          className="voa-search-panel"
          horizontal
          wrap
          horizontalAlign="start"
          verticalAlign="start"
          tokens={{ childrenGap: 16 }}
          styles={{ root: { marginBottom: 16 } }}
        >
          <Stack.Item styles={{ root: { minWidth: 200 } }}>
            <Label htmlFor="searchby-input">{salesSearchText.searchPanel.searchByLabel}</Label>
            <ComboBox
              id="searchby"
              ariaLabel={salesSearchText.searchPanel.searchByLabel}
              aria-describedby={buildAriaDescribedBy(searchByHint ? 'voa-searchby-hint' : undefined)}
              title={searchByTitle}
              options={filteredSearchByOptions}
              selectedKey={comboEditing.searchBy ? null : filters.searchBy}
              onChange={(event, option, _index, value) => {
                if (consumeComboIgnoreNextChange('searchBy', option)) return;
                if (shouldIgnoreComboChange('searchBy', option)) return;
                const searchValue = typeof value === 'string' ? value : searchBySearch;
                const resolvedOptions = filterComboOptions(searchByOptions as IComboBoxOption[], searchValue);
                const resolvedKey = option?.key ?? resolveComboKeyFromSearch(resolvedOptions, searchValue, filters.searchBy);
                if (!resolvedKey) return;
                setComboCancelNextDismiss('searchBy');
                onSearchByChange(event, { key: resolvedKey } as IComboBoxOption);
                setComboEditingFor('searchBy', false);
                setSearchBySearch('');
              }}
              onKeyDownCapture={(event) => {
                if (event.key === 'Escape') {
                  setComboCancelNextDismiss('searchBy');
                  return;
                }
                const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter';
                if (!isEnter) return;
                const inputValue = getComboInputValue(event) || searchBySearch;
                if (!inputValue.trim()) return;
                const resolvedOptions = filterComboOptions(searchByOptions as IComboBoxOption[], inputValue);
                commitComboSingleSelect(event, inputValue, resolvedOptions, filters.searchBy, (opt) => {
                  onSearchByChange(event as unknown as React.FormEvent<IComboBox>, opt);
                  setComboEditingFor('searchBy', false);
                  setSearchBySearch('');
                }, 'searchBy');
              }}
              allowFreeform={false}
              allowFreeInput
              autoComplete="off"
              text={comboEditing.searchBy ? searchBySearch : undefined}
              onInputValueChange={(value) => {
                const next = normalizeSingleSelectSearchText(
                  value,
                  searchByOptions as IComboBoxOption[],
                );
                if (!next) {
                  setComboEditingFor('searchBy', false);
                  setSearchBySearch('');
                  return;
                }
                setComboEditingFor('searchBy', true);
                setSearchBySearch(next);
              }}
              onKeyDown={(event) => {
                if (event.defaultPrevented) return;
                const inputValue = getComboInputValue(event) || searchBySearch;
                if (!inputValue.trim()) return;
                const resolvedOptions = filterComboOptions(searchByOptions as IComboBoxOption[], inputValue);
                commitComboSingleSelect(event, inputValue, resolvedOptions, filters.searchBy, (opt) => {
                  onSearchByChange(event as unknown as React.FormEvent<IComboBox>, opt);
                  setComboEditingFor('searchBy', false);
                  setSearchBySearch('');
                }, 'searchBy');
              }}
              onMenuDismissed={() => {
                if (!consumeComboCancelNextDismiss('searchBy')) {
                  commitComboSingleSelectOnDismiss(
                    searchBySearch,
                    searchByOptions as IComboBoxOption[],
                    filters.searchBy,
                    (opt) => onSearchByChange({} as React.FormEvent<IComboBox>, opt),
                  );
                }
                setComboEditingFor('searchBy', false);
                setSearchBySearch('');
              }}
              styles={{
                root: { width: '100%' },
                callout: { minWidth: 240 },
                optionsContainer: { minWidth: 200 },
              }}
            />
            {searchByHint && (
              <Text id="voa-searchby-hint" variant="small" styles={{ root: { marginTop: 4 } }}>
                {searchByHint}
              </Text>
            )}
          </Stack.Item>
          {renderSearchControl()}
          <Stack.Item className="voa-search-panel__actions">
            <Stack horizontal wrap verticalAlign="center" tokens={{ childrenGap: 12 }}>
              {(shimmer || itemsLoading) && (
                <Spinner size={SpinnerSize.small} ariaLabel={commonText.aria.loadingFilterResults} />
              )}
              <FocusableActionButton
                text={commonText.buttons.search}
                iconProps={{ iconName: 'Search' }}
                onClick={handleSearch}
                onUnavailableClick={isSalesSearch ? handleSalesSearchUnavailableAttempt : undefined}
                unavailable={isSearchDisabled}
                unavailableReason={searchUnavailableReason}
                unavailableReasonId="voa-search-unavailable"
                ariaLabel={commonText.buttons.search}
              />
              <DefaultButton
                text={commonText.buttons.clearAll}
                iconProps={{ iconName: 'ClearFilter' }}
                onClick={handleClear}
                ariaLabel={commonText.aria.clearAllFilters}
                className="voa-prefilter-clear"
              />
            </Stack>
          </Stack.Item>
          {(salesSearchShowsRequiredFields || showSalesSearchUnavailableNote) && (
            <Stack.Item className="voa-search-panel__meta">
              {salesSearchShowsRequiredFields && (
                <div className="voa-search-required-key" role="note">
                  {salesSearchText.accessibility.requiredFieldKey}
                </div>
              )}
              {showSalesSearchUnavailableNote && (
                <div className="voa-search-unavailable-note" role="status" aria-live="polite">
                  {searchUnavailableReason}
                </div>
              )}
            </Stack.Item>
          )}
        </Stack>
        </>
        )}
          {showGridToolbar && (
            <div className="voa-grid-toolbar" role="toolbar" aria-label={selectionToolbarLabel}>
              <div className="voa-grid-toolbar__left">
                {showBulkSelectionControls && (
                  <div className="voa-selection-controls" role="group" aria-label={selectionGroupLabel}>
                    <div className="voa-selection-controls__field">
                      <Label htmlFor="voa-select-first" className="voa-selection-controls__label">
                        {selectFirstLabel}
                      </Label>
                      <TextField
                        id="voa-select-first"
                        ariaLabel={selectFirstLabel}
                        aria-describedby={buildAriaDescribedBy(
                          'voa-select-first-help',
                          selectionControlsDisabled ? 'voa-select-first-unavailable' : undefined,
                        )}
                        value={selectFirstInput}
                        placeholder={selectFirstPlaceholder}
                        type="number"
                        min={1}
                        max={pageItemCount}
                        inputMode="numeric"
                        disabled={selectionControlsDisabled}
                        className={selectionControlsDisabled ? 'voa-focusable-disabled-field' : undefined}
                        title={selectionControlsUnavailableReason}
                        onChange={(_, value) => {
                          if (selectionControlsDisabled) return;
                          setSelectFirstInput(value ?? '');
                          if (selectFirstError) {
                            setSelectFirstError(undefined);
                          }
                        }}
                        onKeyDown={(ev) => {
                          if (selectionControlsDisabled) return;
                          if (ev.key === 'Enter') {
                            ev.preventDefault();
                            selectFirstOnPage();
                          }
                        }}
                        errorMessage={selectFirstError}
                        styles={{ root: { maxWidth: 160 } }}
                      />
                      {selectionControlsDisabled && (
                        <span id="voa-select-first-unavailable" className="voa-sr-only">
                          {selectionControlsUnavailableReason}
                        </span>
                      )}
                      <span id="voa-select-first-help" className="voa-sr-only">
                        {selectFirstHelperText}
                      </span>
                      <Text variant="small" className="voa-selection-controls__suffix">
                        {selectFirstSuffix}
                      </Text>
                    </div>
                    <FocusableActionButton
                      text={selectFirstButtonText}
                      iconProps={{ iconName: 'Accept' }}
                      onClick={selectFirstOnPage}
                      unavailable={selectionControlsDisabled}
                      unavailableReason={selectionControlsUnavailableReason}
                      unavailableReasonId="voa-select-first-apply-unavailable"
                      ariaLabel={selectFirstButtonText}
                    />
                    <FocusableActionButton
                      text={clearSelectionText}
                      iconProps={{ iconName: 'Clear' }}
                      onClick={clearPageSelection}
                      unavailable={selectionControlsDisabled || selectedCount === 0}
                      unavailableReason={clearSelectionUnavailableReason}
                      unavailableReasonId="voa-clear-selection-unavailable"
                      ariaLabel={clearSelectionText}
                    />
                  </div>
                )}
                {showCompactClearSelection && (
                  <FocusableActionButton
                    text={clearSelectionText}
                    iconProps={{ iconName: 'Clear' }}
                    onClick={clearPageSelection}
                    unavailable={selectedCount === 0}
                    unavailableReason={clearSelectionUnavailableReason}
                    unavailableReasonId="voa-clear-selection-unavailable"
                    ariaLabel={clearSelectionText}
                  />
                )}
                {showClearFiltersButton && (
                  <DefaultButton
                    text={commonText.buttons.clearFilters}
                    iconProps={{ iconName: 'ClearFilter' }}
                    onClick={() => clearAllColumnFilters()}
                    ariaLabel={commonText.aria.clearColumnFilters}
                  />
                )}
              </div>
              <div className="voa-grid-toolbar__right">
                {showViewSalesRecordButton && (
                  <FocusableActionButton
                    text={commonText.tableActions.viewSalesRecord}
                    iconProps={{ iconName: 'View' }}
                    onClick={onViewSelected}
                    unavailable={viewSaleNavigationPending || disableViewSalesRecordAction || selectedCount !== 1}
                    unavailableReason={viewSalesRecordUnavailableReason}
                    unavailableReasonId="voa-view-sales-record-unavailable"
                    ariaLabel={commonText.aria.viewSelectedSalesRecord}
                  />
                )}
                {showAssignButton && (
                  <TooltipHost content={assignButtonState.tooltip}>
                    <FocusableActionButton
                      text={assignActionText}
                      iconProps={{ iconName: 'AddFriend' }}
                      onClick={openAssignPanel}
                      unavailable={assignButtonState.disabled}
                      unavailableReason={assignActionUnavailableReason}
                      unavailableReasonId="voa-assign-action-unavailable"
                      ariaLabel={assignActionText}
                    />
                  </TooltipHost>
                )}
                {showMarkPassedQcButton && (
                  <TooltipHost content={markPassedQcButtonState.tooltip}>
                    <FocusableActionButton
                      text={markPassedQcText.buttonText}
                      iconProps={{ iconName: 'CompletedSolid' }}
                      onClick={() => { void handleMarkPassedQcClick(); }}
                      unavailable={markPassedQcButtonState.disabled || markPassedQcLoading}
                      unavailableReason={markPassedQcUnavailableReason}
                      unavailableReasonId="voa-mark-passed-qc-unavailable"
                      ariaLabel={markPassedQcText.buttonText}
                    />
                  </TooltipHost>
                )}
              </div>
            </div>
          )}
          {showResults && (
            <>
              {horizontalOverflowState.hasOverflow && (
                <span id="voa-grid-results-scroll-hint" className="voa-sr-only">
                  This table scrolls horizontally. Use Shift and mouse wheel, a trackpad, or the scrollbar at the bottom to view more columns.
                </span>
              )}
              <div
                id="voa-grid-results"
                ref={resultsRef}
                className={joinClassNames(
                  'voa-grid-results',
                  horizontalOverflowState.canScrollLeft && 'voa-grid-results--scroll-left',
                  horizontalOverflowState.canScrollRight && 'voa-grid-results--scroll-right',
                )}
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
                aria-label={commonText.aria.resultsScrollRegion}
                aria-describedby={horizontalOverflowState.hasOverflow ? 'voa-grid-results-scroll-hint' : undefined}
                tabIndex={0}
              >
                {horizontalOverflowState.hasOverflow && horizontalOverflowState.canScrollRight && (
                  <div className="voa-grid-results__overflow-hint" aria-hidden="true">
                    {commonText.selectionControls.resultsScrollHintText}
                  </div>
                )}
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
                    onItemInvoked={rowInvokeEnabled ? onItemInvoked : undefined}
                    columnReorderOptions={props.allowColumnReorder ? columnReorderOptions : undefined}
                    compact={compact === true || compactViewport}
                    isHeaderVisible={isHeaderVisible}
                  />
                </div>
                {!itemsLoading && !shimmer && filteredItems.length === 0 && (
                  <div className="voa-empty-state" role="status" aria-live="polite">
                    <div className="voa-empty-state__icon" aria-hidden="true">
                      <Icon iconName="PageList" />
                    </div>
                    <Text variant="mediumPlus" className="voa-empty-state__title">
                      {emptyStateText.title}
                    </Text>
                    {!!emptyStateText.message && (
                      <Text variant="small" className="voa-empty-state__text">
                        {emptyStateText.message}
                      </Text>
                    )}
                  </div>
                )}
              </div>
            </>
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
        {showResults && (!compactViewport || totalPages > 1) && (
          <Stack
            id="voa-grid-pagination"
            horizontal
            wrap
            tokens={{ childrenGap: 6 }}
            className="voa-grid-pagination"
            style={{ width: '100%' }}
            verticalAlign="center"
            role="navigation"
            aria-label={commonText.aria.pagination}
            tabIndex={-1}
          >
            {!compactViewport && (
              <Text variant="small" className="voa-grid-pagination__summary">
                {resultsSummaryText}
              </Text>
            )}
            {totalPages > 1 && (
              <>
                <FocusableActionButton
                  text={commonText.buttons.previous}
                  iconProps={{ iconName: 'ChevronLeft' }}
                  onClick={onPrevPage}
                  unavailable={!canPrev}
                  unavailableReason={previousPageUnavailableReason}
                  unavailableReasonId="voa-pagination-previous-unavailable"
                  ariaLabel={commonText.aria.previousPage}
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
                <FocusableActionButton
                  text={commonText.buttons.next}
                  iconProps={{ iconName: 'ChevronRight' }}
                  onClick={onNextPage}
                  unavailable={!canNext}
                  unavailableReason={nextPageUnavailableReason}
                  unavailableReasonId="voa-pagination-next-unavailable"
                  ariaLabel={commonText.aria.nextPage}
                  styles={paginationButtonStyles}
                />
              </>
            )}
            {!compactViewport && (
              <Stack.Item styles={{ root: { marginLeft: 'auto' } }}>
                <DefaultButton
                  text={commonText.buttons.top}
                  iconProps={{ iconName: 'ChevronUp' }}
                  aria-label={commonText.aria.goToTop}
                  onClick={onGoToTop}
                  styles={paginationButtonStyles}
                />
              </Stack.Item>
            )}
          </Stack>
        )}
        {assignPanelOpen && (
          <div className="voa-assign-overlay" role="dialog" aria-modal="true" aria-labelledby="assign-screen-title">
            <FocusTrapZone>
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { minHeight: '100%', padding: 20 } }}>
                <Stack horizontal verticalAlign="center" styles={{ root: { borderBottom: '1px solid #e1e1e1', paddingBottom: 12 } }}>
                  <DefaultButton
                    text={commonText.buttons.back}
                    iconProps={{ iconName: 'Back' }}
                    onClick={closeAssignPanel}
                    disabled={assignLoading}
                    ariaLabel={assignTasksText.aria.backToManager}
                  />
                  <Text as="h1" id="assign-screen-title" variant="xLarge" styles={{ root: { marginLeft: 12, fontWeight: 600 } }}>
                    {assignHeaderText}
                  </Text>
                  <Stack.Item styles={{ root: { marginLeft: 'auto' } }}>
                    <DefaultButton
                      text={commonText.buttons.close}
                      iconProps={{ iconName: 'Cancel' }}
                      disabled={assignLoading}
                      ariaLabel={assignTasksText.aria.closeAssign}
                      onClick={closeAssignPanel}
                    />
                  </Stack.Item>
                </Stack>
                <SearchBox
                  placeholder={assignTasksText.searchPlaceholder}
                  ariaLabel={assignTasksText.searchPlaceholder}
                  aria-describedby={buildAriaDescribedBy(
                    assignSearchUnavailableReason ? 'voa-assign-search-unavailable' : undefined,
                  )}
                  disabled={!!assignSearchUnavailableReason}
                  value={assignSearch}
                  onChange={(_, v) => {
                    if (assignLoading || assignUsersLoading) return;
                    setAssignSearch(v ?? '');
                  }}
                  className={assignSearchUnavailableReason ? 'voa-focusable-disabled-field' : undefined}
                  title={assignSearchUnavailableReason}
                />
                {assignSearchUnavailableReason && (
                  <span id="voa-assign-search-unavailable" className="voa-sr-only">
                    {assignSearchUnavailableReason}
                  </span>
                )}
                {assignUsersLoading && <Spinner size={SpinnerSize.small} ariaLabel={assignTasksText.loadingUsersText} />}
                {assignLoading && (
                  <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                    <Spinner size={SpinnerSize.small} ariaLabel={assignTasksText.loadingAssignText} />
                    <Text>{assignLoadingText}</Text>
                  </Stack>
                )}
                {assignUsersInfo && !dismissedAssignUsersInfo && (
                  <MessageBar
                    messageBarType={MessageBarType.info}
                    onDismiss={() => setDismissedAssignUsersInfo(true)}
                    dismissButtonAriaLabel={commonText.buttons.clear}
                  >
                    {assignUsersInfo}
                  </MessageBar>
                )}
                {assignUsersError && !dismissedAssignUsersError && (
                  <MessageBar
                    messageBarType={MessageBarType.error}
                    onDismiss={() => setDismissedAssignUsersError(true)}
                    dismissButtonAriaLabel={commonText.buttons.clear}
                  >
                    {assignUsersError}
                  </MessageBar>
                )}
                <Text as="h2" variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                  {assignUserListTitle}
                </Text>
                {disabledAssignUserIds.size > 0 && (
                  <Text variant="small" className="voa-assign-disabled-note">
                    {assignAlreadyAssignedReason}
                  </Text>
                )}
                <DetailsList
                  items={assignListItems}
                  columns={assignColumns}
                  selectionMode={SelectionMode.none}
                  isHeaderVisible
                  onRenderRow={onRenderAssignUserRow}
                  onItemInvoked={(item) => {
                    const record = item as AssignUser | undefined;
                    if (!record || record.id === ASSIGN_LOADING_ROW_ID) return;
                    if (assignLoading || isAssignUserDisabled(record.id)) return;
                    handleAssignUserSelect(record.id);
                  }}
                />
                <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 12 }}>
                  <FocusableActionButton
                    text={assignActionText}
                    iconProps={{ iconName: 'AddFriend' }}
                    onClick={() => {
                      if (selectedAssignUser) {
                        void handleAssignClick(selectedAssignUser);
                      }
                    }}
                    unavailable={!selectedAssignUser || assignLoading}
                    unavailableReason={assignConfirmUnavailableReason}
                    unavailableReasonId="voa-assign-confirm-unavailable"
                    ariaLabel={assignActionText}
                  />
                </Stack>
              </Stack>
            </FocusTrapZone>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
});

Grid.displayName = 'Grid';
