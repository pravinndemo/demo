export type HomeJourneyPersona = 'manager' | 'qa' | 'user' | 'none' | 'unknown';
export type HomeJourneyTileKey = 'salesSearch' | 'managerAssign' | 'caseworkerView' | 'qcAssign' | 'qcView';

export interface HomeJourneyTileDefinition {
  key: HomeJourneyTileKey;
  title: string;
  description: string;
  iconName: string;
  canvasScreenName: string;
  tableKey: string;
}

export const HOME_JOURNEY_COUNTRY_BASE_VALUES = ['England', 'Welsh'];

export const HOME_JOURNEY_LIST_YEAR_RANGE = {
  min: 2020,
  max: 2035,
};

export const HOME_JOURNEY_AUTOMATION_IDS = {
  contextStage: 'voa-home-context-stage',
  contextCountryField: 'voa-home-context-country-field',
  contextCountryInput: 'voa-home-context-country-input',
  contextListYearField: 'voa-home-context-listyear-field',
  contextListYearInput: 'voa-home-context-listyear-input',
  contextContinueButton: 'voa-home-context-continue-button',
  tilesStage: 'voa-home-tiles-stage',
  tilesChangeContextButton: 'voa-home-tiles-change-context-button',
  tileButtonPrefix: 'voa-home-tile-button',
  tableStage: 'voa-home-table-stage',
  tableBackToWorkspacesButton: 'voa-home-table-back-to-workspaces-button',
  tableChangeContextButton: 'voa-home-table-change-context-button',
} as const;

export const HOME_JOURNEY_SCREEN_LABELS = {
  salesSearch: {
    tileTitle: 'Sales Record Search',
    canvasScreenName: 'Sales Record Search',
    tableTitle: 'Sales Record Search',
  },
  managerAssign: {
    tileTitle: 'Manager Assignment',
    canvasScreenName: 'Manager Assignment',
    tableTitle: 'Manager Assignment',
  },
  caseworkerView: {
    tileTitle: 'Caseworker View',
    canvasScreenName: 'Caseworker View',
    tableTitle: 'My Allocated Sales',
  },
  qcAssign: {
    tileTitle: 'Quality Control Assignment',
    canvasScreenName: 'Quality Control Assignment',
    tableTitle: 'QC Assignment',
  },
  qcView: {
    tileTitle: 'Quality Control View',
    canvasScreenName: 'Quality Control View',
    tableTitle: 'Quality Control View',
  },
} as const;

export const HOME_JOURNEY_TILE_DEFINITIONS: HomeJourneyTileDefinition[] = [
  {
    key: 'salesSearch',
    title: HOME_JOURNEY_SCREEN_LABELS.salesSearch.tileTitle,
    description: 'Find sales records by address, identifier, and filters.',
    iconName: 'Search',
    canvasScreenName: HOME_JOURNEY_SCREEN_LABELS.salesSearch.canvasScreenName,
    tableKey: 'sales',
  },
  {
    key: 'managerAssign',
    title: HOME_JOURNEY_SCREEN_LABELS.managerAssign.tileTitle,
    description: 'Allocate queue work to caseworkers.',
    iconName: 'PeopleAdd',
    canvasScreenName: HOME_JOURNEY_SCREEN_LABELS.managerAssign.canvasScreenName,
    tableKey: 'manager',
  },
  {
    key: 'caseworkerView',
    title: HOME_JOURNEY_SCREEN_LABELS.caseworkerView.tileTitle,
    description: 'Open and review your allocated sales.',
    iconName: 'Contact',
    canvasScreenName: HOME_JOURNEY_SCREEN_LABELS.caseworkerView.canvasScreenName,
    tableKey: 'myassignment',
  },
  {
    key: 'qcAssign',
    title: HOME_JOURNEY_SCREEN_LABELS.qcAssign.tileTitle,
    description: 'Assign records ready for quality control.',
    iconName: 'TaskGroup',
    canvasScreenName: HOME_JOURNEY_SCREEN_LABELS.qcAssign.canvasScreenName,
    tableKey: 'qaassign',
  },
  {
    key: 'qcView',
    title: HOME_JOURNEY_SCREEN_LABELS.qcView.tileTitle,
    description: 'Review QC outcomes, remarks, and follow-up actions.',
    iconName: 'CompletedSolid',
    canvasScreenName: HOME_JOURNEY_SCREEN_LABELS.qcView.canvasScreenName,
    tableKey: 'qaview',
  },
];

export const HOME_JOURNEY_VISIBLE_TILE_KEYS_BY_PERSONA: Record<HomeJourneyPersona, HomeJourneyTileKey[]> = {
  manager: ['salesSearch', 'managerAssign', 'caseworkerView', 'qcAssign', 'qcView'],
  qa: ['salesSearch', 'qcAssign', 'qcView'],
  user: ['salesSearch', 'caseworkerView'],
  none: ['salesSearch'],
  unknown: [],
};

export const HOME_JOURNEY_PERSONA_LABELS: Record<HomeJourneyPersona, string> = {
  manager: 'Manager',
  qa: 'QA',
  user: 'User',
  none: 'No SVT persona',
  unknown: 'Unknown',
};

export const HOME_JOURNEY_COPY = {
  headerTitle: 'Sales Verification Tool',
  headerMeta: 'Workspace launcher',
  loadingUserContext: 'Loading user context...',
  contextStageTitle: 'Set your working context',
  contextStageDescription:
    'Choose country and list year. This context is applied across searches, task lists, and record details.',
  requiredFieldHint: 'Country and list year are required.',
  countryLabel: 'Country',
  countryPlaceholder: 'Choose country',
  listYearLabel: 'List year',
  listYearPlaceholder: 'Choose list year',
  continueToTilesButton: 'Continue to workspaces',
  contextValidationMessage: 'Choose both country and list year to continue.',
  contextSummaryPrefix: 'Context',
  contextInlineHint: 'Choose country and list year to enable workspace tiles.',
  personaSummaryPrefix: 'Role',
  changeContextButton: 'Edit context',
  tilesStageTitle: 'Choose a workspace',
  tilesStageDescription: 'Workspaces are shown based on your role.',
  noTilesMessage: 'No workspaces are available for your role. Contact your service administrator.',
  allTilesButton: 'All workspaces',
  tableAriaLabelSuffix: 'workspace table',
  userContextApiMissingMessage: 'User context service is not configured. Manager workspaces are shown by default.',
  noSvtAccessMessage: 'You do not currently have access to the Sales Verification Tool. Contact your service administrator.',
  userContextFallbackMessage: 'We could not verify your user context at this time. Manager workspaces are shown by default.',
} as const;

export const HOME_JOURNEY_HOME_SCREEN_HINTS = ['home', 'dashboard'];
export const HOME_JOURNEY_WORKSPACE_SCREEN_HINTS = HOME_JOURNEY_TILE_DEFINITIONS
  .map((tile) => tile.canvasScreenName.toLowerCase());



