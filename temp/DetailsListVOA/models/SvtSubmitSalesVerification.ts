/**
 * Typed model for the SvtSubmitSalesVerification custom API.
 *
 * POST  /api/data/v9.0/voa_SvtSubmitSalesVerification
 *
 * All fields are optional to tolerate partial / evolving payloads.
 *
 * ──────────────────────────────────────────────────────────────────
 *  Flow summary
 * ──────────────────────────────────────────────────────────────────
 *  PCF (DetailsListRuntimeController)
 *    → mergeSalesVerificationDetails()  (services/runtime/sale-details.ts)
 *    → buildSalesVerificationSubmitPayload()
 *    → executeUnboundCustomApi("voa_SvtSubmitSalesVerification",
 *        { saleId, payload: <stringified SubmitPayloadBody> })
 *
 *  Plugin (SvtSubmitSalesVerification.cs)
 *    → reads "saleSubmitPayload" (or "payload" fallback)
 *    → reads "saleSubmitRemarks" (if provided, injects into payload)
 *    → forwards body as PUT /sales/{saleId} to APIM
 * ──────────────────────────────────────────────────────────────────
 */

import type {
  SalesParticularDetails,
  SalesVerificationDetails,
} from './ViewSaleRecordById';

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API input parameters (outer envelope)             */
/* ------------------------------------------------------------------ */

/** Parameters sent to voa_SvtSubmitSalesVerification in Dynamics. */
export interface SvtSubmitSalesVerificationRequest {
  /** Sale record ID, e.g. "S-1004906" */
  saleId?: string;
  /**
   * Stringified JSON body — see {@link SubmitPayloadBody}.
   *
   * PCF passes this as "payload"; the plugin also accepts "saleSubmitPayload".
   */
  saleSubmitPayload?: string;
  /**
   * Optional remarks string.  When present, the plugin injects it into
   * `salesVerificationDetails.remarks` inside the payload body.
   *
   * PCF embeds remarks directly in the payload JSON, so this is typically
   * empty-string when called from the PCF.
   */
  saleSubmitRemarks?: string;
}

/* ------------------------------------------------------------------ */
/*  Inner payload body (stringified inside saleSubmitPayload)         */
/* ------------------------------------------------------------------ */

/** JSON body inside `saleSubmitPayload`. Three sections only. */
export interface SubmitPayloadBody {
  salesVerificationTaskDetails?: SubmitTaskDetails;
  salesParticularDetails?: SalesParticularDetails;
  salesVerificationDetails?: SalesVerificationDetails;
}

/* ------------------------------------------------------------------ */
/*  Task details sent in submit                                       */
/* ------------------------------------------------------------------ */

/**
 * Subset of salesVerificationTaskDetails included in the submit payload.
 *
 * NOTE: The PCF also writes legacy field-name variants (`wltId`, `lrpddId`,
 * `saleSource`, `taskstatus`, `status`) for backward compatibility with
 * older plugin paths.  Those are intentionally omitted from this model —
 * the canonical field names are used here.
 */
export interface SubmitTaskDetails {
  /** Task record ID, e.g. "1000555" */
  taskId?: string;
  /**
   * Resolved by {@link resolveTaskStatusForSalesVerificationAction}:
   * - `"Complete"` — completeSalesVerificationTask action
   * - `"QC Requested"` — first submitSalesVerificationTaskForQc
   * - `"Reassigned To QC"` — resubmit after "Assigned QC Failed"
   */
  taskStatus?: string;
  /**
   * Master sale source promoted by the caseworker.
   * `"WLTT"` | `"LRPPD"` | `""` (empty when unchanged)
   */
  salesSource?: string | null;
  /** GUID — Welsh Land Transaction Tax record selected as master */
  wlttId?: string | null;
  /** GUID — Land Registry PPD record selected as master */
  lrppdId?: string | null;
  /** GUID — user who requested the task */
  requestedBy?: string | null;

  /* ---- Legacy / duplicate field names (written by PCF for compat) ---- */
  /** @deprecated alias of wlttId — written for older plugin fallback */
  wltId?: string | null;
  /** @deprecated alias of lrppdId — written for older plugin fallback */
  lrpddId?: string | null;
  /** @deprecated alias of salesSource */
  saleSource?: string | null;
  /** @deprecated lowercase alias of taskStatus */
  taskstatus?: string;
  /** @deprecated alias of taskStatus */
  status?: string;
}

/* ------------------------------------------------------------------ */
/*  Task status constants                                             */
/* ------------------------------------------------------------------ */

/**
 * Known task-status values written by the PCF submit flow.
 *
 * These match the output of `resolveTaskStatusForSalesVerificationAction`
 * in `services/runtime/sale-details.ts`.
 */
export type SubmitTaskStatus =
  | 'Complete'
  | 'QC Requested'
  | 'Reassigned To QC';

/**
 * The action types accepted by `handleSalesVerificationTaskAction`.
 *
 * Mirrors `SalesVerificationTaskActionType` in sale-details.ts.
 */
export type SalesVerificationActionType =
  | 'completeSalesVerificationTask'
  | 'submitSalesVerificationTaskForQc';

/* ------------------------------------------------------------------ */
/*  Plugin fallback mode — individual parameter names                 */
/* ------------------------------------------------------------------ */

/**
 * When `saleSubmitPayload` is NOT provided, the C# plugin reads
 * individual input parameters to build the three sections.
 *
 * Known differences from the canonical field names:
 * - Plugin reads `wltId`  (not `wlttId`)
 * - Plugin reads `lrpddId` (not `lrppdId`)
 * - Plugin does NOT read `requestedBy`
 *
 * This interface documents those parameter names for reference.
 */
export interface PluginFallbackParameters {
  saleId?: string;
  taskId?: string;
  taskStatus?: string;
  salesSource?: string;
  /** @note Plugin uses `wltId` not `wlttId` */
  wltId?: string;
  /** @note Plugin uses `lrpddId` not `lrppdId` */
  lrpddId?: string;

  /* salesParticularDetails fields */
  salesParticular?: string;
  linkParticulars?: string;
  kitchenAge?: string;
  kitchenSpecification?: string;
  bathroomAge?: string;
  bathroomSpecification?: string;
  glazing?: string;
  heating?: string;
  decorativeFinishes?: string;
  conditionScore?: string;
  conditionCategory?: string;
  /** @note Plugin reads `particularNotes` (singular) */
  particularNotes?: string;

  /* salesVerificationDetails fields */
  isSaleUseful?: string;
  whyNotUseful?: string;
  additionalNotes?: string;
  remarks?: string;
}
