/**
 * Typed model for the SvtSubmitQcRemarks custom API.
 *
 * POST  /api/data/v9.0/voa_SvtSubmitQcRemarks
 *
 * All fields are optional to tolerate partial / evolving payloads.
 *
 * ──────────────────────────────────────────────────────────────────
 *  Flow summary
 * ──────────────────────────────────────────────────────────────────
 *  PCF (DetailsListRuntimeController)
 *    → submitQcOutcome(payload: QcOutcomeActionPayload)
 *    → Builds qcParams: { taskId (JSON array), qcOutcome, qcRemark,
 *        qcReviewedBy, country?, listYear? }
 *    → executeUnboundCustomApi("voa_SvtSubmitQcRemarks", qcParams)
 *
 *  Plugin (SvtSubmitQcRemarks.cs)
 *    → Access control: QA/Manager only
 *    → Reads: taskId, qcOutcome, qcRemark, qcReviewedBy, country, listYear
 *    → ParseTaskIds: JSON array / comma-separated / single value
 *    → POST to APIM with { taskId[], qcOutcome, qcRemark, qcReviewedBy,
 *        country?, listYear? }
 *
 *  After success:
 *    → mergeQcOutcomeDetails() updates local sale-details JSON
 *    → Sets qualityControlOutcome { qcOutcome, qcRemark, qcReviewedBy,
 *        qcReviewedOn }
 *    → Task status: 'Complete Passed QC' (Pass) / 'Assigned QC Failed' (Fail)
 * ──────────────────────────────────────────────────────────────────
 */

import type { QualityControlOutcome } from './ViewSaleRecordById';

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API input parameters (sent to Dataverse)          */
/* ------------------------------------------------------------------ */

/**
 * The outer Dynamics Custom API request parameters.
 *
 * PCF sends these as `Record<string, string>` via
 * `executeUnboundCustomApi("voa_SvtSubmitQcRemarks", qcParams)`.
 */
export interface SvtSubmitQcRemarksRequest {
  /**
   * Task ID(s) — PCF sends a JSON-serialized array:
   *   `JSON.stringify([normalizedTaskId])`
   *
   * Plugin accepts: JSON array string, comma-separated, or single value.
   */
  taskId: string;

  /** QC outcome: 'Pass' or 'Fail'. Required. */
  qcOutcome: QcOutcomeValue;

  /** Free-text remark from the QC reviewer. Optional but required for Fail. */
  qcRemark?: string;

  /**
   * GUID of the QC reviewer.
   * PCF resolves via `resolveCurrentUserId(this._context)`.
   * Plugin falls back to `context.InitiatingUserId` if empty.
   */
  qcReviewedBy: string;

  /** Country filter — optional, only sent when ENABLE_COUNTRY_LIST_YEAR_API_PARAMS is true. */
  country?: string;

  /** List year filter — optional, only sent when ENABLE_COUNTRY_LIST_YEAR_API_PARAMS is true. */
  listYear?: string;
}

/* ------------------------------------------------------------------ */
/*  APIM payload (what the plugin POSTs to the backend)               */
/* ------------------------------------------------------------------ */

/**
 * The JSON body the plugin POSTs to the APIM backend.
 *
 * The plugin builds this from the parsed Dynamics input parameters.
 * Note: `taskId` becomes a `string[]` (parsed from the JSON/CSV input).
 *
 * IMPORTANT: Despite the docs mentioning `taskList`, the actual plugin
 * code (SvtSubmitQcRemarks.cs L107-113) uses `taskId` as the APIM key.
 * Other plugins (SvtTaskAssignment, SvtModifyTask) use `taskList`.
 */
export interface QcRemarksApimPayload {
  /** Parsed task ID(s) as an array. */
  taskId: string[];

  /** 'Pass' or 'Fail' (or 'Passed'/'Failed' from external callers). */
  qcOutcome: string;

  /** QC remark text. `null` if not provided. */
  qcRemark: string | null;

  /** GUID of the reviewer. */
  qcReviewedBy: string;

  /** Country filter — only present when provided. */
  country?: string;

  /** List year filter — only present when provided. */
  listYear?: string;
}

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API response                                      */
/* ------------------------------------------------------------------ */

/**
 * Response from the Dynamics Custom API.
 * The plugin returns the raw APIM response body, or `"success"` if empty.
 */
export interface SvtSubmitQcRemarksResponse {
  '@odata.context'?: string;
  Result: string;
}

/* ------------------------------------------------------------------ */
/*  QC outcome value types                                            */
/* ------------------------------------------------------------------ */

/** Canonical QC outcome values accepted by the PCF UI. */
export type QcOutcomeValue = 'Pass' | 'Fail';

/**
 * Normalized QC outcome values produced by `normalizeQcOutcomeValue()`.
 * Accepts 'pass'/'passed' → 'Pass', 'fail'/'failed' → 'Fail'.
 */
export type NormalizedQcOutcomeValue = 'Pass' | 'Fail' | '';

/* ------------------------------------------------------------------ */
/*  QC task status mapping                                            */
/* ------------------------------------------------------------------ */

/**
 * Task status values set by `mergeQcOutcomeDetails()` after QC submission.
 *
 * - Pass → 'Complete Passed QC'
 * - Fail → 'Assigned QC Failed'
 */
export type QcTaskStatus = 'Complete Passed QC' | 'Assigned QC Failed';

/* ------------------------------------------------------------------ */
/*  Local merge output (qualityControlOutcome section)                */
/* ------------------------------------------------------------------ */

/**
 * Extended QC outcome written to local sale-details JSON by
 * `mergeQcOutcomeDetails()`. Extends the GET model's
 * `QualityControlOutcome` with the review timestamp.
 */
export interface MergedQualityControlOutcome extends QualityControlOutcome {
  /** ISO timestamp set at merge time: `new Date().toISOString()` */
  qcReviewedOn?: string | null;
}

/* ------------------------------------------------------------------ */
/*  QC task details (date fields applied by applyQcOutcomeTaskDetails)*/
/* ------------------------------------------------------------------ */

/**
 * Date fields written to `salesVerificationTaskDetails` and `taskDetails`
 * by `applyQcOutcomeTaskDetails()`.
 *
 * - Pass: all dates set to the outcome timestamp
 * - Fail: completedDate/taskCompletedDate cleared to `null`
 */
export interface QcOutcomeTaskDateFields {
  /** ISO timestamp — always set on outcome submission */
  qcCompletedDate?: string | null;
  /** @deprecated Lowercase alias written for backward compatibility */
  qccompleteddate?: string | null;

  /** ISO timestamp — set on Pass, cleared to `null` on Fail */
  taskCompletedDate?: string | null;
  /** @deprecated Lowercase alias */
  taskcompleteddate?: string | null;

  /** ISO timestamp — set on Pass, cleared to `null` on Fail */
  completedDate?: string | null;
  /** @deprecated Lowercase alias */
  completeddate?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Plugin access control                                             */
/* ------------------------------------------------------------------ */

/** User personas permitted to call `SvtSubmitQcRemarks`. */
export type QcSubmitAllowedPersona = 'QA' | 'Manager';
