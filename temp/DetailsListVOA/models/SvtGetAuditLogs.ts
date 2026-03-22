/**
 * Typed model for the SvtGetAuditLogs custom API.
 *
 * GET  /api/data/v9.0/voa_SvtGetAuditLogs
 *
 * All fields are optional to tolerate partial / evolving payloads.
 *
 * ──────────────────────────────────────────────────────────────────
 *  Flow summary
 * ──────────────────────────────────────────────────────────────────
 *  PCF (DetailsListRuntimeController)
 *    → openAuditHistory() → handleAuditHistoryOpen('SL')
 *    → openQcLog()        → handleAuditHistoryOpen('QC')
 *    → fetchAuditHistory(auditType)
 *    → resolveTaskIdForAuditLogs() → taskId
 *    → executeUnboundCustomApi("voa_SvtGetAuditLogs", { taskId, auditType })
 *
 *  Plugin (SvtGetAuditLogs.cs)
 *    → No access control check (any authenticated user)
 *    → Reads: taskId, auditType
 *    → NormalizeAuditType: must be "QC" or "SL" (case-insensitive)
 *    → voa_CredentialProvider("SVTAuditLogs") → Address, credentials
 *    → BuildUrl: GET {Address}?taskId={encoded}&auditType={encoded}
 *    → TransformAuditLogPayload: resolves GUID tokens → user display names
 *      - ChangedBy: direct GUID replacement
 *      - Assignee fields (assignedto, qcassignedto, *assignedto):
 *        replaces GUID tokens in OldValue / NewValue
 *    → Output: context.OutputParameters["Result"] as JSON string
 *
 *  After response:
 *    → unwrapCustomApiPayload() → toRecord()
 *    → mergeAuditHistoryDetails(saleDetailsJson, auditType, payload)
 *      stores under auditLogs.qc or auditLogs.sl + legacy keys
 *    → mapAuditHistoryModel() in useSaleDetailsViewModel:
 *      - Extracts history from keys: auditHistory, history, records, items
 *      - Sorts by changedOn (latest first)
 *      - Normalizes field labels via AUDIT_FIELD_LABEL_BY_KEY
 *      - Resolves changedBy display names
 *      - Formats dates to UK format (DD/MM/YYYY HH:mm:ss)
 * ──────────────────────────────────────────────────────────────────
 */

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API input parameters (sent to Dataverse)          */
/* ------------------------------------------------------------------ */

/**
 * The outer Dynamics Custom API request parameters.
 *
 * PCF sends these via
 * `executeUnboundCustomApi("voa_SvtGetAuditLogs", { taskId, auditType })`.
 */
export interface SvtGetAuditLogsRequest {
  /** Task identifier for audit log lookup. */
  taskId: string;

  /**
   * Types of audit log to fetch.
   * Must be `'QC'` or `'SL'`.
   */
  auditType: AuditType;
}

/* ------------------------------------------------------------------ */
/*  Audit type                                                        */
/* ------------------------------------------------------------------ */

/**
 * The two valid audit type values.
 * - `'QC'` — Quality Control log
 * - `'SL'` — Sales Log (main audit history)
 */
export type AuditType = 'QC' | 'SL';

/* ------------------------------------------------------------------ */
/*  APIM response payload (after plugin transformation)               */
/* ------------------------------------------------------------------ */

/**
 * Top-level APIM response returned by the audit logs endpoint.
 *
 * Matches the C# `AuditLogsPayload` model.
 */
export interface AuditLogsResponse {
  /** The task identifier this audit relates to. */
  taskId?: string;

  /** Array of audit history entries. */
  auditHistory?: AuditHistoryRecord[];

  /** Error message if the call failed. */
  errorMessage?: string;
}

/**
 * A single audit history entry.
 *
 * Matches the C# `AuditHistoryRecord` model.
 */
export interface AuditHistoryRecord {
  /** Sequential change identifier. */
  changeID?: number;

  /**
   * Who made the change.
   * Plugin resolves GUID tokens → display names.
   */
  changedBy?: string;

  /** Type of event (e.g. "Update"). */
  eventType?: string;

  /**
   * When the change occurred.
   * UK date format: "DD/MM/YYYY HH:mm:ss"
   */
  changedOn?: string;

  /** Individual field changes within this entry. */
  changes?: AuditFieldChange[];
}

/**
 * A single field change within an audit history record.
 *
 * Matches the C# `AuditFieldChange` model.
 */
export interface AuditFieldChange {
  /** Name of the field that was changed. */
  fieldName?: string;

  /**
   * Previous value.
   * For assignee fields, GUIDs are replaced with display names by plugin.
   */
  oldValue?: string;

  /**
   * New value.
   * For assignee fields, GUIDs are replaced with display names by plugin.
   */
  newValue?: string;
}

/* ------------------------------------------------------------------ */
/*  Error payload                                                     */
/* ------------------------------------------------------------------ */

/**
 * Error payload returned by plugin when validation fails or the API
 * call errors out.
 *
 * Shape: `{ items: [], errorMessage: "..." }`
 */
export interface AuditLogsErrorPayload {
  items: unknown[];
  errorMessage: string;
}

/* ------------------------------------------------------------------ */
/*  Merge payload                                                     */
/* ------------------------------------------------------------------ */

/**
 * The payload passed to `mergeAuditHistoryDetails()`.
 *
 * Stored under `auditLogs.qc` or `auditLogs.sl` and also
 * under legacy keys `qcAuditHistory` or `auditHistory`.
 */
export interface AuditLogsMergePayload {
  taskId: string;
  auditHistory: AuditHistoryRecord[];
  errorMessage?: string;
}

/* ------------------------------------------------------------------ */
/*  PCF view model types                                              */
/* ------------------------------------------------------------------ */

/**
 * A field change mapped for display in the audit modal.
 *
 * Matches `AuditHistoryChangeViewModel` in SaleDetailsShell/types.ts.
 */
export interface AuditHistoryChangeViewModel {
  fieldName: string;
  oldValue: string;
  newValue: string;
}

/**
 * A processed audit entry for display.
 *
 * Matches `AuditHistoryEntryViewModel` in SaleDetailsShell/types.ts.
 */
export interface AuditHistoryEntryViewModel {
  changeId: string;
  changedBy: string;
  changedOn: string;
  eventType: string;
  changes: AuditHistoryChangeViewModel[];
}

/**
 * The full view model for the audit history modal.
 *
 * Matches `AuditHistoryViewModel` in SaleDetailsShell/types.ts.
 */
export interface AuditHistoryViewModel {
  taskId: string;
  entries: AuditHistoryEntryViewModel[];
  errorMessage: string;
}

/* ------------------------------------------------------------------ */
/*  Merge scope key                                                   */
/* ------------------------------------------------------------------ */

/**
 * Scope key used inside `auditLogs` in saleDetails JSON.
 * `'qc'` for QC audit type, `'sl'` for SL (sales log).
 */
export type AuditLogsScopeKey = 'qc' | 'sl';

/* ------------------------------------------------------------------ */
/*  Legacy payload keys                                               */
/* ------------------------------------------------------------------ */

/**
 * Legacy root-level keys used for backward compatibility.
 * - `'qcAuditHistory'` for QC type
 * - `'auditHistory'` for SL type
 */
export type AuditLogsLegacyKey = 'qcAuditHistory' | 'auditHistory';

/* ------------------------------------------------------------------ */
/*  Audit field label keys                                            */
/* ------------------------------------------------------------------ */

/**
 * Known audit field keys that are mapped to friendly labels
 * in `AUDIT_FIELD_LABEL_BY_KEY` in the view model.
 */
export type AuditFieldLabelKey =
  | 'taskstatus'
  | 'status'
  | 'assignedto'
  | 'caseworkerassignedto'
  | 'padconfirmation'
  | 'salesource'
  | 'source'
  | 'wlttid'
  | 'wltid'
  | 'lrppdid'
  | 'lrpddid'
  | 'hpiadjustedprice'
  | 'hpiadjustedsaleprice'
  | 'salesparticular'
  | 'salesparticulars'
  | 'linkparticulars'
  | 'kitchenage'
  | 'kitchenspecification'
  | 'bathroomage'
  | 'bathroomspecification'
  | 'glazing'
  | 'heating'
  | 'decorativefinishes'
  | 'conditionscore'
  | 'conditioncategory'
  | 'particularnotes'
  | 'particularsnotes'
  | 'reasonnotes'
  | 'issaleuseful'
  | 'isthissaleuseful'
  | 'whynotuseful'
  | 'whyisthesalenotuseful'
  | 'additionalnotes'
  | 'assigneddate'
  | 'assignedat'
  | 'caseworkerassigneddate'
  | 'caseworkerassignedon'
  | 'qcassigneddate'
  | 'qcassignedat'
  | 'qcassignedto'
  | 'qcremarks'
  | 'outcome'
  | 'completedat';

/**
 * Mapping of friendly display labels used in the audit modal.
 */
export type AuditFieldDisplayLabel =
  | 'Task Status'
  | 'Assigned to'
  | 'PAD Confirmation'
  | 'Sale Source'
  | 'WLTT ID'
  | 'LRPPD ID'
  | 'HPI adjusted Price'
  | 'Sales Particular'
  | 'Link Particulars'
  | 'Kitchen Age'
  | 'Kitchen Specification'
  | 'Bathroom Age'
  | 'Bathroom Specification'
  | 'Glazing'
  | 'Heating'
  | 'Decorative finishes'
  | 'Condition Score'
  | 'Condition Category'
  | 'Particular Notes'
  | 'Is this Sale Useful?'
  | 'Why is the sale not useful?'
  | 'Additional Notes'
  | 'Assigned Date'
  | 'QC Assigned Date'
  | 'QC Assigned to'
  | 'QC Remarks'
  | 'Outcome'
  | 'Completed At';

/* ------------------------------------------------------------------ */
/*  Plugin configuration                                              */
/* ------------------------------------------------------------------ */

/** Credential provider configuration name used by the plugin. */
export type AuditLogsConfigurationName = 'SVTAuditLogs';

/** Plugin GUID regex pattern for extracting user IDs. */
export type AuditLogsGuidRegex = string;

/** Batch size for user lookup queries in the plugin. */
export type AuditLogsUserLookupBatchSize = 200;

/* ------------------------------------------------------------------ */
/*  Assignee field detection                                          */
/* ------------------------------------------------------------------ */

/**
 * Known assignee field names that trigger GUID → name resolution.
 *
 * Plugin method `ShouldResolveAssigneeField`:
 * - exact: `'assignedto'`, `'qcassignedto'`
 * - suffix: any field ending with `'assignedto'`
 */
export type AssigneeFieldMatch = 'assignedto' | 'qcassignedto';

/* ------------------------------------------------------------------ */
/*  Resolve audit payload fallback keys                               */
/* ------------------------------------------------------------------ */

/**
 * Fallback keys used by `resolveAuditPayload()` to find audit data
 * when namespaced data is not available.
 *
 * Main: `'auditHistory'`, `'salesAuditHistory'`, `'mainAuditHistory'`
 * QC:   `'qcAuditHistory'`, `'qualityControlAuditHistory'`, `'qualityControlHistory'`
 */
export type AuditPayloadFallbackKeyMain = 'auditHistory' | 'salesAuditHistory' | 'mainAuditHistory';
export type AuditPayloadFallbackKeyQc = 'qcAuditHistory' | 'qualityControlAuditHistory' | 'qualityControlHistory';

/* ------------------------------------------------------------------ */
/*  History array extraction keys                                     */
/* ------------------------------------------------------------------ */

/**
 * Keys used by `mapAuditHistoryModel()` to extract the history array
 * from the payload: `'auditHistory'`, `'history'`, `'records'`, `'items'`.
 */
export type AuditHistoryArrayKey = 'auditHistory' | 'history' | 'records' | 'items';
