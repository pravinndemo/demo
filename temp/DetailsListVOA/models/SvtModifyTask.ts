/**
 * Typed model for the SvtModifyTask custom API.
 *
 * POST  /api/data/v9.0/voa_SvtModifyTask
 *
 * All fields are optional to tolerate partial / evolving payloads.
 *
 * ──────────────────────────────────────────────────────────────────
 *  Flow summary
 * ──────────────────────────────────────────────────────────────────
 *  PCF (DetailsListRuntimeController)
 *    → modifySvtTask()
 *    → Builds payload: { source: 'VSRT', taskStatus: 'Assigned',
 *        taskList: JSON.stringify([normalizedTaskId]), requestedBy }
 *    → executeUnboundCustomApi("voa_SvtModifyTask", payload)
 *
 *  Plugin (SvtModifyTask.cs)
 *    → Access control: Caseworker only (HasCaseworkerAccess)
 *    → Reads: source, taskStatus, taskList, requestedBy
 *    → ParseTaskIds: JSON array / comma-separated / single value
 *    → NormalizeTaskId: strips non-digit chars, keeps original if no digits
 *    → POST to APIM with { source, taskStatus, taskList[], requestedBy }
 *
 *  After success:
 *    → mergeModifyTaskDetails() updates local sale-details JSON
 *    → Sets taskStatus to 'Assigned', assignedTo/UserId, assignedDate
 *    → Clears taskCompletedDate, completedDate → null
 * ──────────────────────────────────────────────────────────────────
 */

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API input parameters (sent to Dataverse)          */
/* ------------------------------------------------------------------ */

/**
 * The outer Dynamics Custom API request parameters.
 *
 * PCF sends these as `Record<string, string>` via
 * `executeUnboundCustomApi("voa_SvtModifyTask", payload)`.
 */
export interface SvtModifyTaskRequest {
  /**
   * Source system identifier.
   * PCF always sends `'VSRT'`.
   * Plugin defaults to `'VSRT'` if empty.
   */
  source: string;

  /**
   * Target task status.
   * PCF always sends `'Assigned'` (reopening a completed task).
   * Required by the plugin.
   */
  taskStatus: string;

  /**
   * Task ID(s) — PCF sends a JSON-serialized array:
   *   `JSON.stringify([normalizedTaskId])`
   *
   * Plugin accepts: JSON array string, comma-separated, or single value.
   * Plugin normalizes each ID by stripping non-digit characters.
   */
  taskList: string;

  /**
   * GUID of the user requesting the modification.
   * PCF resolves via `resolveCurrentUserId(this._context)`.
   * Plugin falls back to `context.InitiatingUserId` if empty.
   */
  requestedBy: string;
}

/* ------------------------------------------------------------------ */
/*  APIM payload (what the plugin POSTs to the backend)               */
/* ------------------------------------------------------------------ */

/**
 * The JSON body the plugin POSTs to the APIM backend.
 *
 * Note: `taskList` becomes a `string[]` (parsed from the JSON/CSV input).
 * Note: the plugin uses `taskList` as the APIM key (unlike SvtSubmitQcRemarks
 * which uses `taskId`).
 */
export interface ModifyTaskApimPayload {
  /** Source system — typically 'VSRT'. */
  source: string;

  /** Target task status. */
  taskStatus: string;

  /** Parsed task ID(s) as an array (digits only after normalization). */
  taskList: string[];

  /** GUID of the requesting user. */
  requestedBy: string;
}

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API response                                      */
/* ------------------------------------------------------------------ */

/**
 * Response from the Dynamics Custom API.
 * The plugin returns the raw APIM response body, or `"success"` if empty.
 */
export interface SvtModifyTaskResponse {
  '@odata.context'?: string;
  Result: string;
}

/* ------------------------------------------------------------------ */
/*  PCF-specific constants                                            */
/* ------------------------------------------------------------------ */

/**
 * Task statuses that allow the Modify SVT Task action.
 * The button is only shown when current task status matches one of these
 * (case-insensitive comparison in the PCF).
 */
export type ModifyTaskAllowedStatus = 'complete' | 'complete passed qc';

/**
 * The target task status the PCF always sends when modifying a task.
 * This reopens a completed task back to 'Assigned'.
 */
export type ModifyTaskTargetStatus = 'Assigned';

/**
 * The hardcoded source value the PCF sends.
 */
export type ModifyTaskSource = 'VSRT';

/* ------------------------------------------------------------------ */
/*  Local merge payload (what mergeModifyTaskDetails applies)         */
/* ------------------------------------------------------------------ */

/**
 * Payload passed to `mergeModifyTaskDetails()` to update local state
 * after a successful modify task API call.
 */
export interface ModifyTaskMergePayload {
  /** Target status — always 'Assigned' for PCF modify flow. */
  taskStatus: string;

  /** Display name of the current user. */
  assignedTo?: string;

  /** GUID of the current user. */
  assignedToUserId?: string;

  /** ISO timestamp of the assignment. */
  assignedDateIso?: string;
}

/* ------------------------------------------------------------------ */
/*  Fields written by applyModifyTaskDetails()                        */
/* ------------------------------------------------------------------ */

/**
 * Status fields written to both `salesVerificationTaskDetails` and
 * `taskDetails` by `applyModifyTaskDetails()`.
 *
 * Writes canonical + lowercase aliases for backward compatibility.
 */
export interface ModifyTaskStatusFields {
  taskStatus?: string;
  /** @deprecated Lowercase alias */
  taskstatus?: string;
  /** @deprecated Lowercase alias */
  status?: string;
}

/**
 * AssignedTo fields written when the assignedTo value is provided.
 * Six fields: canonical + lowercase + caseworker-prefixed variants.
 */
export interface ModifyTaskAssignedToFields {
  assignedTo?: string;
  /** @deprecated Lowercase alias */
  assignedto?: string;
  assignedToName?: string;
  /** @deprecated Lowercase alias */
  assignedtoname?: string;
  caseworkerAssignedTo?: string;
  /** @deprecated Lowercase alias */
  caseworkerassignedto?: string;
}

/**
 * AssignedToUserId fields written when the user ID is provided.
 * Six fields: canonical + lowercase + caseworker-prefixed variants.
 */
export interface ModifyTaskAssignedToUserIdFields {
  assignedToUserId?: string;
  /** @deprecated Lowercase alias */
  assignedtouserid?: string;
  assignedToId?: string;
  /** @deprecated Lowercase alias */
  assignedtoid?: string;
  caseworkerAssignedToUserId?: string;
  /** @deprecated Lowercase alias */
  caseworkerassignedtouserid?: string;
}

/**
 * AssignedDate fields written when the date value is provided.
 * Six fields: canonical + lowercase + caseworker-prefixed variants.
 */
export interface ModifyTaskAssignedDateFields {
  assignedDate?: string;
  /** @deprecated Lowercase alias */
  assigneddate?: string;
  caseworkerAssignedDate?: string;
  /** @deprecated Lowercase alias */
  caseworkerassigneddate?: string;
  caseworkerAssignedOn?: string;
  /** @deprecated Lowercase alias */
  caseworkerassignedon?: string;
}

/**
 * Completion date fields cleared to `null` by applyModifyTaskDetails()
 * when reopening a task.
 */
export interface ModifyTaskClearedDateFields {
  taskCompletedDate?: string | null;
  /** @deprecated Lowercase alias */
  taskcompleteddate?: string | null;
  completedDate?: string | null;
  /** @deprecated Lowercase alias */
  completeddate?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Plugin access control                                             */
/* ------------------------------------------------------------------ */

/** Access is controlled by caseworker role/team membership. */
export type ModifyTaskAccessRole = 'Caseworker';

/* ------------------------------------------------------------------ */
/*  Response parsing                                                  */
/* ------------------------------------------------------------------ */

/**
 * Parsed result from `parseModifyTaskResult()`.
 */
export interface ModifyTaskResult {
  success: boolean;
  message: string;
}

/**
 * Success keyword hints used by `parseModifyTaskCandidate()` for
 * raw string matching (case-insensitive).
 */
export type ModifyTaskSuccessHint =
  | 'success'
  | 'succeed'
  | 'succeeded'
  | 'ok'
  | 'true';
