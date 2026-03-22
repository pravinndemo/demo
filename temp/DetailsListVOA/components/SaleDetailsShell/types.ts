export type SaleDetailsRecord = Record<string, unknown>;

export type StatusTone = 'critical' | 'warning' | 'ok' | 'neutral';

export type MasterSaleSource = 'WLTT' | 'LRPPD';

export interface PromotedMasterRecordViewModel {
  source: MasterSaleSource;
  id: string;
  salePrice: string;
  transactionDate: string;
  hpiAdjustedPrice: string;
  ratio: string;
}

export type AttributeTone =
  | 'sky'
  | 'amber'
  | 'red'
  | 'violet'
  | 'teal'
  | 'purple'
  | 'indigo'
  | 'magenta'
  | 'slate'
  | 'bluegray';


export interface SalesParticularDraftPayload {
  reviewStatusKey?: SalesParticularReviewStatus;
  linkParticulars: string;
  kitchenAge: string;
  kitchenSpecification: string;
  bathroomAge: string;
  bathroomSpecification: string;
  glazing: string;
  heating: string;
  decorativeFinishes: string;
  conditionScore: string;
  conditionCategory: string;
  particularsNotes: string;
}
export interface SalesVerificationActionPayload {
  isSaleUseful: string;
  whyNotUseful: string;
  additionalNotes: string;
  remarks?: string;
  promotedMasterRecord?: PromotedMasterRecordViewModel;
  salesParticularDraft?: SalesParticularDraftPayload;
  padConfirmationKey?: string;
}

export interface QcOutcomeActionPayload {
  qcOutcome: 'Pass' | 'Fail';
  qcRemark?: string;
  qcReviewedBy: string;
}

export interface AuditHistoryChangeViewModel {
  fieldName: string;
  oldValue: string;
  newValue: string;
}

export interface AuditHistoryEntryViewModel {
  changeId: string;
  changedBy: string;
  changedOn: string;
  eventType: string;
  changes: AuditHistoryChangeViewModel[];
}

export interface AuditHistoryViewModel {
  taskId: string;
  entries: AuditHistoryEntryViewModel[];
  errorMessage: string;
}

export interface SharePointCatalogChunks {
  optionsJson: string;
  recordsJson1: string;
  recordsJson2: string;
}

export interface SaleDetailsShellProps {
  saleDetailsJson: string;
  sharePointCatalogChunks?: SharePointCatalogChunks;
  fxEnvironmentUrl?: string;
  vmsBaseUrl?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  canCreateManualTask?: boolean;
  canModifyTask?: boolean;
  canProgressTask?: boolean;
  canSubmitQcOutcome?: boolean;
  showQcSection?: boolean;
  currentUserDisplayName?: string;
  loading?: boolean;
  userLookup?: Record<string, string>;
  onBack: () => void;
  onRefresh: () => void | Promise<void>;
  onCreateManualTask?: (saleId: string) => void | Promise<void>;
  onModifySvtTask?: () => void | Promise<void>;
  onCompleteSalesVerificationTask?: (payload: SalesVerificationActionPayload) => void | Promise<void>;
  onSubmitSalesVerificationTaskForQc?: (payload: SalesVerificationActionPayload) => void | Promise<void>;
  onSubmitQcOutcome?: (payload: QcOutcomeActionPayload) => void | Promise<void>;
  onOpenQcLog?: () => void | Promise<void>;
  onOpenAuditHistory?: () => void | Promise<void>;
}

export interface ExternalLinkItem {
  key: string;
  title: string;
  subtitle: string;
  url: string;
  iconName: string;
  disabledReason?: string;
}

export interface AttributeChip {
  key: string;
  value: string;
  tone: AttributeTone;
  tooltip?: string;
  color?: string;
}

export interface MasterSaleViewModel {
  salePrice: string;
  transactionDate: string;
  modelValue: string;
  saleSource: string;
  overallFlag: string;
  ratio: string;
  reviewFlags: string;
  hpiAdjustedPrice: string;
  summaryFlags: string;
  previousRatioRange: string;
  latestRatioRange: string;
}

export interface WlttRecordViewModel {
  wlttId: string;
  transactionPrice: string;
  transactionPremium: string;
  transactionDate: string;
  groundRent: string;
  vendors: string;
  vendees: string;
  vendorAgents: string;
  vendeeAgents: string;
  typeOfProperty: string;
  tenureType: string;
  leaseFrom: string;
  leaseTerm: string;
  hpiAdjustedPrice: string;
  ratio: string;
}

export interface LrppdRecordViewModel {
  lrppdId: string;
  address: string;
  transactionPrice: string;
  typeOfProperty: string;
  tenureType: string;
  pricePaidCategory: string;
  oldNew: string;
  transactionDate: string;
  hpiAdjustedPrice: string;
  ratio: string;
}

export type SalesParticularReviewStatus = 'details-available' | 'details-not-available' | 'not-reviewed';

export type SalesParticularAttributeKey =
  | 'kitchenAge'
  | 'kitchenSpecification'
  | 'bathroomAge'
  | 'bathroomSpecification'
  | 'glazing'
  | 'heating'
  | 'decorativeFinishes';

export interface SalesParticularScoringModelRow {
  componentName: string;
  componentKey: SalesParticularAttributeKey;
  conditionCategory: string;
  scoreInComponent: number;
  componentWeight: number;
  componentScore: number;
}

export type SalesParticularOptionsByAttribute = Record<SalesParticularAttributeKey, string[]>;

export interface SalesParticularReferenceImageViewModel {
  id: string;
  attributeKey: string;
  category: string;
  title: string;
  imageUrl: string;
  sourceUrl: string;
}

export interface SalesParticularViewModel {
  reviewStatusKey?: SalesParticularReviewStatus;
  linkParticulars: string;
  kitchenAge: string;
  kitchenSpecification: string;
  bathroomAge: string;
  bathroomSpecification: string;
  glazing: string;
  heating: string;
  decorativeFinishes: string;
  conditionScore: string;
  conditionCategory: string;
  particularsNotes: string;
  attributeTooltips: Record<SalesParticularAttributeKey, string>;
  optionsByAttribute: SalesParticularOptionsByAttribute;
  scoringRows: SalesParticularScoringModelRow[];
  referenceImages: SalesParticularReferenceImageViewModel[];
}

export interface SalesVerificationViewModel {
  isSaleUseful: string;
  whyNotUseful: string;
  additionalNotes: string;
  remarks: string;
  qcOutcome: string;
  qcRemark: string;
  qcReviewedBy: string;
}

export interface SaleDetailsViewModel {
  saleId: string;
  taskId: string;
  statusText: string;
  statusTone: StatusTone;
  assignedTo: string;
  qcAssignedTo: string;
  externalLinks: ExternalLinkItem[];
  address: string;
  addressLink: string;
  billingAuthority: string;
  band: string;
  bandingEffectiveDate: string;
  composite: string;
  padStatusDisplay: string;
  padStatusLabel: string;
  isActiveRequestPresent: boolean;
  effectiveDate: string;
  effectiveTo: string;
  plotSize: string;
  attributeGroups: AttributeChip[][];
  vscCodes: string[];
  sourceCodes: string[];
  initialPadConfirmationKey?: string;
  masterSale: MasterSaleViewModel;
  wlttRecords: WlttRecordViewModel[];
  lrppdRecords: LrppdRecordViewModel[];
  initialPromotedMasterRecord?: PromotedMasterRecordViewModel;
  salesParticular: SalesParticularViewModel;
  salesVerification: SalesVerificationViewModel;
  mainAuditHistory: AuditHistoryViewModel;
  qcAuditHistory: AuditHistoryViewModel;
}









