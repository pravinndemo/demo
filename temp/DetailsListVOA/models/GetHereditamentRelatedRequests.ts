/**
 * Typed model for the voa_GetHereditamentRelatedRequests custom Dataverse API.
 *
 * POST  /api/data/v9.0/voa_GetHereditamentRelatedRequests
 *
 * All response fields are optional to tolerate partial / evolving payloads.
 *
 * ──────────────────────────────────────────────────────────────────
 *  Flow summary
 * ──────────────────────────────────────────────────────────────────
 *  Caller (server-side, called by GetViewSaleRecordById plugin)
 *    → POST voa_GetHereditamentRelatedRequests
 *    → Input: hereditamentId (Guid) — the Statutory Spatial Unit ID
 *
 *  Plugin (voa_GetHereditamentRelatedRequests.cs)
 *    → Extends PluginBase (no APIM, no HTTP — direct Dataverse query)
 *    → Validates hereditamentId is present and is a Guid
 *    → FetchXML on voa_requestlineitem entity:
 *        - top='1' (existence check only)
 *        - statecode = 0 (active records)
 *        - voa_statutoryspatialunitid = {hereditamentId}
 *    → Output: hereditamentActiveRequest (boolean)
 *        - true  → active request line items exist
 *        - false → no active request line items
 *
 *  After response (embedded in ViewSaleRecordById):
 *    → propertyAndBandingDetails.activeRequestInVos carries the value
 *    → useSaleDetailsViewModel maps via isTrueLike + firstNonEmpty:
 *        isActiveRequestPresent = isTrueLike(firstNonEmpty(
 *          propertyAndBandingDetails.activeRequestInVos,
 *          propertyAndBandingDetails.isActiveRequestPresent,
 *          details.activeRequestInVos,
 *          details.isActiveRequestPresent,
 *        ))
 *    → PadSection renders:
 *        - Synced tag (blue pill):       "PAD Status: Synced"
 *          when padStatus.toLowerCase() === 'committed'
 *        - Warning tag (amber pill):     "Active request/job in VOS"
 *          when isActiveRequestPresent is true
 * ──────────────────────────────────────────────────────────────────
 */

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API input parameter                               */
/* ------------------------------------------------------------------ */

/**
 * The outer Dynamics Custom API request parameter.
 *
 * The plugin expects `hereditamentId` as a **Guid** InputParameter
 * (not a string like most other SVT custom APIs).
 */
export interface GetHereditamentRelatedRequestsRequest {
  /**
   * Statutory Spatial Unit (hereditament) GUID.
   *
   * Represented as a string in the PCF / JSON layer, but the plugin
   * validates it as `System.Guid` at runtime.
   *
   * Example: `"92270465-0c7e-6978-d915-07931616525a"`
   */
  hereditamentId: string;
}

/* ------------------------------------------------------------------ */
/*  Dynamics Custom API output / response                             */
/* ------------------------------------------------------------------ */

/**
 * The Dynamics Custom API response returned by the plugin.
 *
 * The single output parameter is `hereditamentActiveRequest`.
 */
export interface GetHereditamentRelatedRequestsResponse {
  /** OData context URL (present in raw Dynamics response). */
  '@odata.context'?: string;

  /**
   * Whether one or more **active** (statecode = 0) request line items
   * exist for the given hereditament.
   *
   * - `false` → PAD status is "Synced"
   * - `true`  → PAD status is "Active request/job in VOS"
   */
  hereditamentActiveRequest?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Plugin error messages                                             */
/* ------------------------------------------------------------------ */

/**
 * Known error messages thrown by the plugin as
 * `InvalidPluginExecutionException`.
 */
export type PluginErrorMessage =
  | 'hereditamentId is required.'
  | 'Unable to get hereditament related requests.';

/* ------------------------------------------------------------------ */
/*  FetchXML query metadata                                           */
/* ------------------------------------------------------------------ */

/** The Dataverse entity queried by the plugin. */
export type QueryEntityName = 'voa_requestlineitem';

/** The single attribute retrieved in the FetchXML. */
export type QueryAttribute = 'voa_requestlineitemid';

/**
 * The two filter conditions applied in the FetchXML.
 *
 * - `statecode = 0` — only active records
 * - `voa_statutoryspatialunitid = {hereditamentId}` — matching SSU
 */
export interface FetchXmlFilterCondition {
  attribute: 'statecode' | 'voa_statutoryspatialunitid';
  operator: 'eq';
  value: string;
}

/* ------------------------------------------------------------------ */
/*  PAD status display mapping                                        */
/* ------------------------------------------------------------------ */

/**
 * The padStatusLabel derivation rule.
 *
 * - When `padStatusDisplay.toLowerCase() === 'committed'` → `"PAD Status: Synced"`
 * - Otherwise → `"PAD Status: ${padStatusDisplay}"`
 */
export type PadStatusSyncedValue = 'Committed';

/** The label text shown in the synced pill tag. */
export type PadStatusSyncedLabel = 'PAD Status: Synced';

/** The warning tag text shown when an active request exists. */
export type ActiveRequestWarningText = 'Active request/job in VOS';

/* ------------------------------------------------------------------ */
/*  isTrueLike accepted values                                        */
/* ------------------------------------------------------------------ */

/**
 * Values that {@link isTrueLike} evaluates to `true`
 * (case-insensitive, trimmed).
 */
export type TrueLikeValue = 'true' | 'yes' | '1' | 'y';

/* ------------------------------------------------------------------ */
/*  View-model fallback keys                                          */
/* ------------------------------------------------------------------ */

/**
 * The four fallback keys tried by `firstNonEmpty()` in
 * `useSaleDetailsViewModel` when resolving `isActiveRequestPresent`.
 *
 * Order:
 * 1. `propertyAndBandingDetails.activeRequestInVos`
 * 2. `propertyAndBandingDetails.isActiveRequestPresent`
 * 3. `details.activeRequestInVos`
 * 4. `details.isActiveRequestPresent`
 */
export type ActiveRequestFallbackKey = 'activeRequestInVos' | 'isActiveRequestPresent';

/* ------------------------------------------------------------------ */
/*  CSS class names                                                   */
/* ------------------------------------------------------------------ */

/** The CSS class for the synced (blue) pill tag. */
export type PadSyncedCssClass = 'voa-pad-top-tag--synced';

/** The CSS class for the active-request warning (amber) pill tag. */
export type PadWarningCssClass = 'voa-pad-top-tag--warning';

/* ------------------------------------------------------------------ */
/*  Plugin class metadata                                             */
/* ------------------------------------------------------------------ */

/** The C# class name of the plugin. */
export type PluginClassName = 'voa_GetHereditamentRelatedRequests';

/** The C# namespace of the plugin. */
export type PluginNamespace = 'VOA.SVT.Plugins.CustomAPI';

/** The base class the plugin extends. */
export type PluginBaseClass = 'PluginBase';
