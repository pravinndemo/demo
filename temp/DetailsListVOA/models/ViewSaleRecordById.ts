/**
 * Typed model for the ViewSaleRecordById API response.
 *
 * All fields are optional to tolerate partial / evolving payloads.  The
 * runtime view-model builder (useSaleDetailsViewModel) still falls back
 * through Record<string, unknown> accessors so existing null-safe
 * behaviour is preserved — these types purely document the contract and
 * enable compile-time checks in tests & future code.
 */

/* ------------------------------------------------------------------ */
/*  Envelope                                                          */
/* ------------------------------------------------------------------ */

export interface ViewSaleRecordByIdResponse {
  salesVerificationTaskDetails?: SalesVerificationTaskDetails;
  links?: ExternalLinks;
  propertyAndBandingDetails?: PropertyAndBandingDetails;
  masterSale?: MasterSaleDetails;
  repeatSaleInfo?: RepeatSaleInfo;
  welshLandTax?: WelshLandTaxRecord[];
  landRegistryData?: LandRegistryRecord[];
  salesParticularDetails?: SalesParticularDetails;
  salesVerificationDetails?: SalesVerificationDetails;
  qualityControlOutcome?: QualityControlOutcome;
}

/* ------------------------------------------------------------------ */
/*  Section: salesVerificationTaskDetails                             */
/* ------------------------------------------------------------------ */

export interface SalesVerificationTaskDetails {
  saleId?: string;
  taskId?: string;
  taskStatus?: string;
  assignedTo?: string;
  /** GUID — Welsh Land Transaction Tax record id */
  wlttId?: string | null;
  /** GUID — Land Registry PPD record id */
  lrppdId?: string | null;
  /** Master sale source indicator (e.g. "LRPPD", "WLTT") */
  salesSource?: string | null;
  /** GUID — user who requested the task */
  requestedBy?: string | null;
  /** GUID — quality control assigned user */
  qcAssignedTo?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Section: links                                                    */
/* ------------------------------------------------------------------ */

export interface ExternalLinks {
  epc?: string;
  zoopla?: string;
  rightMove?: string;
  /** VMS easting coordinate */
  vmsX?: string;
  /** VMS northing coordinate */
  vmsY?: string;
  /** Legacy full VMS URL (deprecated in favour of vmsX/vmsY) */
  vms?: string;
}

/* ------------------------------------------------------------------ */
/*  Section: propertyAndBandingDetails                                */
/* ------------------------------------------------------------------ */

export interface PropertyAndBandingDetails {
  address?: string;
  band?: string;
  bandingEffectiveDate?: string;
  billingAuthority?: string;
  billingAuthorityName?: string;
  composite?: boolean;
  /** System Unit ID (hereditament GUID) */
  suId?: string;
  padStatus?: string;
  effectiveDate?: string;
  effectiveTo?: string | null;
  status?: string | null;

  /* PAD attribute codes */
  dwellingGroup?: string;
  dwellingType?: string;
  dwellingArea?: string;
  ageCode?: string;
  heating?: string;
  mainroomCount?: number;
  bedroomCount?: number;
  bathroomCount?: number;
  floorCount?: number;
  floorLevel?: string | null;
  parkingCode?: string;
  conservatoryArea?: string | null;
  conservatoryType?: string | null;
  reasonCode?: string;
  valueSignificantCodes?: string | null;
  /** Plural "sourceCodes" — may be CSV in some payloads */
  sourceCodes?: string | null;
  /** Singular "sourceCode" — current API sends this */
  sourceCode?: string;
  plotSize?: string | null;
  padConfirmation?: string | null;

  /* Description / tooltip fields — value explains the corresponding code */
  sourceCodeDescription?: string | null;
  dwellingGroupDescription?: string | null;
  dwellingTypeDescription?: string | null;
  ageCodeDescription?: string | null;
  parkingCodeDescription?: string | null;
  conservatoryTypeDescription?: string | null;
  reasonCodeDescription?: string | null;

  /** Optional colour map for attribute chips (backend-driven) */
  attributeColors?: Record<string, string>;
  /** Optional tooltip map for attribute chips (backend-driven) */
  attributeTooltips?: Record<string, string>;

  /** Whether an active VOS request exists for this hereditament */
  activeRequestInVos?: boolean;

  /** Legacy / alternate key names (kept for backward compat) */
  valueSignificantCodeName?: string | null;
  valueSignificantDescription?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Section: masterSale                                               */
/* ------------------------------------------------------------------ */

export interface MasterSaleDetails {
  salePrice?: number;
  transactionDate?: string;
  ratio?: number | null;
  salesSource?: string;
  hpiAdjustedPrice?: number;
  reviewFlags?: string;
  overallFlag?: string;
  summaryFlags?: string;
  modelValue?: string;
}

/* ------------------------------------------------------------------ */
/*  Section: repeatSaleInfo                                           */
/* ------------------------------------------------------------------ */

export interface RepeatSaleInfo {
  previousRatioRange?: string | null;
  laterRatioRange?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Section: welshLandTax                                             */
/* ------------------------------------------------------------------ */

export interface WelshLandTaxRecord {
  wlttId?: string;
  transactionPrice?: number;
  transactionPremium?: number | null;
  transactionDate?: string;
  groundRent?: number | null;
  vendors?: string;
  vendees?: string;
  vendorAgents?: string;
  vendeeAgents?: string;
  typeOfProperty?: string;
  tenureType?: string;
  leaseFrom?: string | null;
  leaseTerm?: string | null;
  hpiAdjustedPrice?: number;
  ratio?: number | null;
}

/* ------------------------------------------------------------------ */
/*  Section: landRegistryData                                         */
/* ------------------------------------------------------------------ */

export interface LandRegistryRecord {
  lrppdId?: string;
  address?: string;
  transactionPrice?: number;
  typeOfProperty?: string;
  tenureType?: string;
  oldNew?: string;
  transactionDate?: string;
  pricePaidCategory?: string;
  hpiAdjustedPrice?: number;
  ratio?: number | null;
}

/* ------------------------------------------------------------------ */
/*  Section: salesParticularDetails                                   */
/* ------------------------------------------------------------------ */

export interface SalesParticularDetails {
  salesParticular?: string | null;
  linkParticulars?: string | null;
  kitchenAge?: string | null;
  kitchenSpecification?: string | null;
  bathroomAge?: string | null;
  bathroomSpecification?: string | null;
  glazing?: string | null;
  heating?: string | null;
  decorativeFinishes?: string | null;
  conditionScore?: string | null;
  conditionCategory?: string | null;
  particularNotes?: string | null;
  padConfirmation?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Section: salesVerificationDetails                                 */
/* ------------------------------------------------------------------ */

export interface SalesVerificationDetails {
  isSaleUseful?: string | null;
  whyNotUseful?: string | null;
  additionalNotes?: string | null;
  remarks?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Section: qualityControlOutcome                                    */
/* ------------------------------------------------------------------ */

export interface QualityControlOutcome {
  qcOutcome?: string | null;
  qcRemark?: string | null;
  /** GUID or display name of the QC reviewer */
  qcReviewedBy?: string | null;
}
