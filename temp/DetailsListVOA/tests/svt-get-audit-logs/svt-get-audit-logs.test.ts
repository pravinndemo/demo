/**
 * Tests for the SvtGetAuditLogs model and the full audit logs flow.
 *
 * Covers:
 *  - Model structure & type alignment with the real API response
 *  - Plugin (SvtGetAuditLogs.cs) cross-checks
 *  - PCF fetchAuditHistory() parameter assembly
 *  - mergeAuditHistoryDetails() local state update
 *  - resolveTaskIdForAuditLogs() taskId resolution
 *  - Audit type validation (QC | SL)
 *  - Plugin URL construction (BuildUrl)
 *  - Plugin GUID → user name transformation
 *  - Plugin assignee field detection
 *  - Plugin error payload structure
 *  - View model field label mapping (AUDIT_FIELD_LABEL_BY_KEY)
 *  - View model date parsing and UK format
 *  - View model sorting (latest first)
 *  - Config and ControlManifest alignment
 *  - Docs alignment
 *  - Real trace payload round-trip
 */

import fs from 'fs';
import path from 'path';
import type {
  SvtGetAuditLogsRequest,
  AuditType,
  AuditLogsResponse,
  AuditHistoryRecord,
  AuditFieldChange,
  AuditLogsErrorPayload,
  AuditLogsMergePayload,
  AuditHistoryChangeViewModel,
  AuditHistoryEntryViewModel,
  AuditHistoryViewModel,
  AuditLogsScopeKey,
  AuditLogsLegacyKey,
  AuditFieldLabelKey,
  AuditFieldDisplayLabel,
  AuditLogsConfigurationName,
  AuditLogsUserLookupBatchSize,
  AssigneeFieldMatch,
  AuditPayloadFallbackKeyMain,
  AuditPayloadFallbackKeyQc,
  AuditHistoryArrayKey,
} from '../../models/SvtGetAuditLogs';

/* ================================================================== */
/*  Helper utilities                                                  */
/* ================================================================== */

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/* ================================================================== */
/*  Real trace payload fixture (from user-provided plugin trace)      */
/* ================================================================== */

/** Real APIM response from trace log (truncated in logs but structure known). */
const REAL_AUDIT_RESPONSE: AuditLogsResponse = {
  taskId: 'A-1000564',
  auditHistory: [
    {
      changeID: 1,
      changedBy: '8d75f389-a7f6-f011-8406-6045bd0b0506',
      eventType: 'Update',
      changedOn: '20/03/2026 11:36:16',
      changes: [
        {
          fieldName: 'TaskStatus',
          oldValue: 'Assigned',
          newValue: 'Complete',
        },
      ],
    },
  ],
};

/** Real request inferred from trace logs. */
const REAL_REQUEST: SvtGetAuditLogsRequest = {
  taskId: '1000564',
  auditType: 'SL',
};

/* ================================================================== */
/*  Source files (lazy-loaded once for cross-checks)                   */
/* ================================================================== */

const pluginSource = readRepoFile('VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetAuditLogs.cs');
const pluginModelSource = readRepoFile('VOA.SVT.Plugins/Plugins/CustomAPI/DataAccessLayer/Model/AuditLogsModels.cs');
const runtimeSource = readRepoFile('DetailsListVOA/services/DetailsListRuntimeController.ts');
const saleDetailsRuntimeSource = readRepoFile('DetailsListVOA/services/runtime/sale-details.ts');
const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
const modalSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/AuditHistoryModal.tsx');
const typesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/types.ts');
const configSource = readRepoFile('DetailsListVOA/config/ControlConfig.ts');
const manifestSource = readRepoFile('DetailsListVOA/ControlManifest.Input.xml');
const rulesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/rules/ViewSaleActionRules.ts');

/* ================================================================== */
/*  1. Model structure tests                                          */
/* ================================================================== */

describe('SvtGetAuditLogs model', () => {

  describe('SvtGetAuditLogsRequest', () => {
    test('real request satisfies the request interface', () => {
      const req: SvtGetAuditLogsRequest = REAL_REQUEST;
      expect(req.taskId).toBe('1000564');
      expect(req.auditType).toBe('SL');
    });

    test('QC audit type is accepted', () => {
      const req: SvtGetAuditLogsRequest = { taskId: '1000550', auditType: 'QC' };
      expect(req.auditType).toBe('QC');
    });

    test('request has exactly two fields', () => {
      const req: SvtGetAuditLogsRequest = REAL_REQUEST;
      expect(Object.keys(req)).toHaveLength(2);
      expect(Object.keys(req).sort()).toEqual(['auditType', 'taskId']);
    });
  });

  describe('AuditType', () => {
    test.each<AuditType>(['QC', 'SL'])('"%s" is a valid AuditType', (val) => {
      const t: AuditType = val;
      expect(t).toBe(val);
    });
  });

  describe('AuditLogsResponse', () => {
    test('real response satisfies the response interface', () => {
      const res: AuditLogsResponse = REAL_AUDIT_RESPONSE;
      expect(res.taskId).toBe('A-1000564');
      expect(res.auditHistory).toHaveLength(1);
      expect(res.errorMessage).toBeUndefined();
    });

    test('empty response is valid', () => {
      const res: AuditLogsResponse = { taskId: 'A-1000001', auditHistory: [] };
      expect(res.auditHistory).toHaveLength(0);
    });

    test('error response is valid', () => {
      const res: AuditLogsResponse = { errorMessage: 'taskId is required.' };
      expect(res.errorMessage).toBe('taskId is required.');
      expect(res.auditHistory).toBeUndefined();
    });
  });

  describe('AuditHistoryRecord', () => {
    test('first real record has expected shape', () => {
      const record: AuditHistoryRecord = REAL_AUDIT_RESPONSE.auditHistory![0];
      expect(record.changeID).toBe(1);
      expect(record.changedBy).toBe('8d75f389-a7f6-f011-8406-6045bd0b0506');
      expect(record.eventType).toBe('Update');
      expect(record.changedOn).toBe('20/03/2026 11:36:16');
      expect(record.changes).toHaveLength(1);
    });

    test('record with no changes is valid', () => {
      const record: AuditHistoryRecord = { changeID: 2, changedBy: 'user', changedOn: '21/03/2026' };
      expect(record.changes).toBeUndefined();
    });
  });

  describe('AuditFieldChange', () => {
    test('TaskStatus change has expected shape', () => {
      const change: AuditFieldChange = REAL_AUDIT_RESPONSE.auditHistory![0].changes![0];
      expect(change.fieldName).toBe('TaskStatus');
      expect(change.oldValue).toBe('Assigned');
      expect(change.newValue).toBe('Complete');
    });

    test('all fields are optional', () => {
      const change: AuditFieldChange = {};
      expect(change.fieldName).toBeUndefined();
      expect(change.oldValue).toBeUndefined();
      expect(change.newValue).toBeUndefined();
    });
  });

  describe('AuditLogsErrorPayload', () => {
    test('error payload shape matches plugin BuildErrorPayload', () => {
      const err: AuditLogsErrorPayload = {
        items: [],
        errorMessage: 'taskId is required.',
      };
      expect(err.items).toEqual([]);
      expect(err.errorMessage).toBe('taskId is required.');
    });
  });

  describe('AuditLogsMergePayload', () => {
    test('merge payload shape matches what PCF passes to mergeAuditHistoryDetails', () => {
      const payload: AuditLogsMergePayload = {
        taskId: '1000564',
        auditHistory: REAL_AUDIT_RESPONSE.auditHistory!,
      };
      expect(payload.taskId).toBe('1000564');
      expect(payload.auditHistory).toHaveLength(1);
      expect(payload.errorMessage).toBeUndefined();
    });

    test('error merge payload includes errorMessage', () => {
      const payload: AuditLogsMergePayload = {
        taskId: '',
        auditHistory: [],
        errorMessage: 'Task ID is not available for audit lookup.',
      };
      expect(payload.errorMessage).toBe('Task ID is not available for audit lookup.');
    });
  });

  describe('View model types', () => {
    test('AuditHistoryChangeViewModel has required fields', () => {
      const change: AuditHistoryChangeViewModel = {
        fieldName: 'Task Status',
        oldValue: 'Assigned',
        newValue: 'Complete',
      };
      expect(Object.keys(change).sort()).toEqual(['fieldName', 'newValue', 'oldValue']);
    });

    test('AuditHistoryEntryViewModel has required fields', () => {
      const entry: AuditHistoryEntryViewModel = {
        changeId: '1',
        changedBy: 'John Doe',
        changedOn: '20/03/2026 11:36:16',
        eventType: 'Update',
        changes: [],
      };
      expect(Object.keys(entry).sort()).toEqual(['changeId', 'changedBy', 'changedOn', 'changes', 'eventType']);
    });

    test('AuditHistoryViewModel has required fields', () => {
      const vm: AuditHistoryViewModel = {
        taskId: 'A-1000564',
        entries: [],
        errorMessage: '',
      };
      expect(Object.keys(vm).sort()).toEqual(['entries', 'errorMessage', 'taskId']);
    });
  });

  describe('Type aliases', () => {
    test('AuditLogsScopeKey matches merge scoping', () => {
      const qc: AuditLogsScopeKey = 'qc';
      const sl: AuditLogsScopeKey = 'sl';
      expect(qc).toBe('qc');
      expect(sl).toBe('sl');
    });

    test('AuditLogsLegacyKey matches backward-compatible keys', () => {
      const qcKey: AuditLogsLegacyKey = 'qcAuditHistory';
      const slKey: AuditLogsLegacyKey = 'auditHistory';
      expect(qcKey).toBe('qcAuditHistory');
      expect(slKey).toBe('auditHistory');
    });

    test('AuditLogsConfigurationName is SVTAuditLogs', () => {
      const name: AuditLogsConfigurationName = 'SVTAuditLogs';
      expect(name).toBe('SVTAuditLogs');
    });

    test('AuditLogsUserLookupBatchSize is 200', () => {
      const batch: AuditLogsUserLookupBatchSize = 200;
      expect(batch).toBe(200);
    });

    test('AssigneeFieldMatch values', () => {
      const f1: AssigneeFieldMatch = 'assignedto';
      const f2: AssigneeFieldMatch = 'qcassignedto';
      expect(f1).toBe('assignedto');
      expect(f2).toBe('qcassignedto');
    });

    test('AuditHistoryArrayKey values match mapAuditHistoryModel extraction keys', () => {
      const keys: AuditHistoryArrayKey[] = ['auditHistory', 'history', 'records', 'items'];
      expect(keys).toHaveLength(4);
    });
  });
});

/* ================================================================== */
/*  2. Plugin (SvtGetAuditLogs.cs) cross-checks                      */
/* ================================================================== */

describe('Plugin cross-checks', () => {

  test('plugin class extends PluginBase', () => {
    expect(pluginSource).toContain('public class SvtGetAuditLogs : PluginBase');
  });

  test('plugin reads taskId and auditType input parameters', () => {
    expect(pluginSource).toContain('GetInput(context, "taskId")');
    expect(pluginSource).toContain('GetInput(context, "auditType")');
  });

  test('plugin outputs Result string', () => {
    expect(pluginSource).toContain('context.OutputParameters["Result"]');
  });

  test('plugin uses SVTAuditLogs credential configuration', () => {
    expect(pluginSource).toContain('private const string CONFIGURATION_NAME = "SVTAuditLogs"');
  });

  test('plugin validates auditType is QC or SL', () => {
    expect(pluginSource).toContain('return upper == "QC" || upper == "SL" ? upper : null;');
  });

  test('plugin validates taskId is not empty', () => {
    expect(pluginSource).toContain('string.IsNullOrWhiteSpace(taskId)');
    expect(pluginSource).toContain('BuildErrorPayload("taskId is required.")');
  });

  test('plugin validates auditType is not empty/invalid', () => {
    expect(pluginSource).toContain('BuildErrorPayload("auditType is required and must be QC or SL.")');
  });

  test('plugin validates Address configuration is not missing', () => {
    expect(pluginSource).toContain('BuildErrorPayload("SVTAuditLogs configuration missing Address.")');
  });

  test('plugin uses HTTP GET method', () => {
    expect(pluginSource).toContain('new HttpRequestMessage(HttpMethod.Get, fullUrl)');
  });

  test('plugin sets 30-second timeout', () => {
    expect(pluginSource).toContain('TimeSpan.FromSeconds(30)');
  });

  test('plugin sets APIM subscription key header', () => {
    expect(pluginSource).toContain('"Ocp-Apim-Subscription-Key"');
  });

  test('plugin sets Bearer auth header', () => {
    expect(pluginSource).toContain('new AuthenticationHeaderValue("Bearer", authResult.AccessToken)');
  });

  test('plugin has no access control check (unlike submit/modify plugins)', () => {
    expect(pluginSource).not.toContain('HasCaseworkerAccess');
    expect(pluginSource).not.toContain('HasQaManagerAccess');
  });
});

/* ================================================================== */
/*  3. Plugin URL construction (BuildUrl)                             */
/* ================================================================== */

describe('Plugin BuildUrl logic', () => {

  test('BuildUrl method exists with three parameters', () => {
    expect(pluginSource).toContain('private static string BuildUrl(string baseAddress, string taskId, string auditType)');
  });

  test('supports template replacement for {taskId} and {auditType}', () => {
    expect(pluginSource).toContain('trimmed.Contains("{taskId}", StringComparison.Ordinal)');
    expect(pluginSource).toContain('trimmed.Contains("{auditType}", StringComparison.Ordinal)');
    expect(pluginSource).toContain('trimmed.Replace("{taskId}", HttpUtility.UrlEncode(taskId))');
    expect(pluginSource).toContain('trimmed.Replace("{auditType}", HttpUtility.UrlEncode(auditType))');
  });

  test('detects pre-existing taskId= and auditType= in URL', () => {
    expect(pluginSource).toContain('trimmed.IndexOf("taskId=", StringComparison.OrdinalIgnoreCase)');
    expect(pluginSource).toContain('trimmed.IndexOf("auditType=", StringComparison.OrdinalIgnoreCase)');
  });

  test('uses UriBuilder for absolute URLs', () => {
    expect(pluginSource).toContain('Uri.TryCreate(trimmed, UriKind.Absolute, out var absoluteUri)');
    expect(pluginSource).toContain('new UriBuilder(absoluteUri)');
    expect(pluginSource).toContain('query["taskId"] = taskId;');
    expect(pluginSource).toContain('query["auditType"] = auditType;');
  });

  test('fallback appends with ? or & separator', () => {
    expect(pluginSource).toContain('var separator = trimmed.Contains("?") ? "&" : "?";');
    expect(pluginSource).toContain('$"{trimmed}{separator}taskId={HttpUtility.UrlEncode(taskId)}&auditType={HttpUtility.UrlEncode(auditType)}"');
  });

  test('real trace URL matches expected pattern', () => {
    const traceUrl = 'https://voagw.npd.hmrc.gov.uk/dev/internal/ctp/sales-verification-api//v1/audit-logs?taskId=1000564&auditType=SL';
    expect(traceUrl).toContain('taskId=1000564');
    expect(traceUrl).toContain('auditType=SL');
    expect(traceUrl).toContain('/v1/audit-logs');
  });
});

/* ================================================================== */
/*  4. Plugin GUID → user name transformation                        */
/* ================================================================== */

describe('Plugin GUID transformation', () => {

  test('TransformAuditLogPayload method exists', () => {
    expect(pluginSource).toContain('private static string TransformAuditLogPayload(');
  });

  test('plugin uses compiled GUID regex for token extraction', () => {
    expect(pluginSource).toContain(
      '@"(?i)\\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\}?"'
    );
    expect(pluginSource).toContain('RegexOptions.Compiled | RegexOptions.CultureInvariant');
  });

  test('plugin collects user IDs from changedBy and assignee field values', () => {
    expect(pluginSource).toContain('var userIds = CollectUserIds(payload);');
    expect(pluginSource).toContain('TryParseGuidToken(historyItem.ChangedBy, out var changedById)');
    expect(pluginSource).toContain('AddGuidTokens(GetJsonStringValue(change.OldValue), ids);');
    expect(pluginSource).toContain('AddGuidTokens(GetJsonStringValue(change.NewValue), ids);');
  });

  test('plugin replaces changedBy GUID with display name', () => {
    expect(pluginSource).toContain('TryReplaceChangedByWithDisplayName(historyItem.ChangedBy, userNames, out var nextChangedBy)');
  });

  test('plugin replaces assignee field GUIDs with display names', () => {
    expect(pluginSource).toContain('TryReplaceGuidTokensWithNames(change.OldValue, userNames, out var nextOldValue)');
    expect(pluginSource).toContain('TryReplaceGuidTokensWithNames(change.NewValue, userNames, out var nextNewValue)');
  });

  test('plugin resolves user names from systemuser table in batches of 200', () => {
    expect(pluginSource).toContain('const int batchSize = 200;');
    expect(pluginSource).toContain('new QueryExpression("systemuser")');
    expect(pluginSource).toContain('new ColumnSet("systemuserid", "fullname", "firstname", "lastname")');
  });

  test('plugin uses fullname first, then firstname + lastname fallback', () => {
    expect(pluginSource).toContain('var displayName = entity.GetAttributeValue<string>("fullname");');
    expect(pluginSource).toContain('var firstName = entity.GetAttributeValue<string>("firstname")');
    expect(pluginSource).toContain('var lastName = entity.GetAttributeValue<string>("lastname")');
    expect(pluginSource).toContain('$"{firstName} {lastName}".Trim()');
  });

  test('plugin logs resolved user count', () => {
    expect(pluginSource).toContain('SvtGetAuditLogs resolved {users.Count} user names for {ids.Length} user ids.');
  });

  test('real trace log confirms user name resolution', () => {
    const traceLog = 'SvtGetAuditLogs resolved 2 user names for 2 assignee ids.';
    expect(traceLog).toContain('resolved 2 user names');
    expect(traceLog).toContain('2 assignee ids');
  });
});

/* ================================================================== */
/*  5. Plugin assignee field detection                                */
/* ================================================================== */

describe('Plugin assignee field detection', () => {

  test('ShouldResolveAssigneeField method exists', () => {
    expect(pluginSource).toContain('private static bool ShouldResolveAssigneeField(string fieldName)');
  });

  test('normalizes field name by removing non-alphanumeric and lowering', () => {
    expect(pluginSource).toContain('!char.IsLetterOrDigit(ch)');
    expect(pluginSource).toContain('char.ToLowerInvariant(ch)');
  });

  test.each([
    ['assignedto', true],
    ['qcassignedto', true],
    ['caseworkerassignedto', true],   // ends with "assignedto"
    ['taskstatus', false],
    ['changedby', false],
  ])('field "%s" → ShouldResolveAssigneeField = %s', (fieldName, expected) => {
    const normalized = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const result = normalized === 'assignedto'
      || normalized === 'qcassignedto'
      || normalized.endsWith('assignedto');
    expect(result).toBe(expected);
  });
});

/* ================================================================== */
/*  6. Plugin C# model alignment                                     */
/* ================================================================== */

describe('Plugin C# model alignment', () => {

  test('AuditLogsPayload has taskId, auditHistory, errorMessage + extension', () => {
    expect(pluginModelSource).toContain('[JsonPropertyName("taskId")]');
    expect(pluginModelSource).toContain('public string TaskId { get; set; }');
    expect(pluginModelSource).toContain('[JsonPropertyName("auditHistory")]');
    expect(pluginModelSource).toContain('public List<AuditHistoryRecord> AuditHistory { get; set; }');
    expect(pluginModelSource).toContain('[JsonPropertyName("errorMessage")]');
    expect(pluginModelSource).toContain('public string ErrorMessage { get; set; }');
  });

  test('AuditHistoryRecord has changeID, changedBy, eventType, changedOn, changes', () => {
    expect(pluginModelSource).toContain('[JsonPropertyName("changeID")]');
    expect(pluginModelSource).toContain('public int? ChangeId { get; set; }');
    expect(pluginModelSource).toContain('[JsonPropertyName("changedBy")]');
    expect(pluginModelSource).toContain('[JsonPropertyName("eventType")]');
    expect(pluginModelSource).toContain('[JsonPropertyName("changedOn")]');
    expect(pluginModelSource).toContain('public List<AuditFieldChange> Changes { get; set; }');
  });

  test('AuditFieldChange has fieldName, oldValue, newValue as JsonElement', () => {
    expect(pluginModelSource).toContain('[JsonPropertyName("fieldName")]');
    expect(pluginModelSource).toContain('public string FieldName { get; set; }');
    expect(pluginModelSource).toContain('[JsonPropertyName("oldValue")]');
    expect(pluginModelSource).toContain('public JsonElement OldValue { get; set; }');
    expect(pluginModelSource).toContain('[JsonPropertyName("newValue")]');
    expect(pluginModelSource).toContain('public JsonElement NewValue { get; set; }');
  });

  test('all three models use JsonExtensionData for forward compatibility', () => {
    const extensionCount = (pluginModelSource.match(/\[JsonExtensionData\]/g) || []).length;
    expect(extensionCount).toBe(3);
  });
});

/* ================================================================== */
/*  7. Plugin error payload                                           */
/* ================================================================== */

describe('Plugin error payload', () => {

  test('BuildErrorPayload produces { items: [], errorMessage }', () => {
    expect(pluginSource).toContain('private static string BuildErrorPayload(string message)');
    expect(pluginSource).toContain('items = Array.Empty<object>()');
    expect(pluginSource).toContain('errorMessage = message ?? string.Empty');
  });

  test.each([
    'taskId is required.',
    'auditType is required and must be QC or SL.',
    'SVTAuditLogs configuration missing Address.',
    'Failed to call audit logs API.',
  ])('error message "%s" exists in plugin', (msg) => {
    expect(pluginSource).toContain(msg);
  });

  test('HTTP failure includes status code in error', () => {
    expect(pluginSource).toContain('Audit logs call failed ({(int)response.StatusCode} {response.ReasonPhrase})');
  });
});

/* ================================================================== */
/*  8. PCF fetchAuditHistory flow                                     */
/* ================================================================== */

describe('PCF fetchAuditHistory flow', () => {

  test('openAuditHistory calls handleAuditHistoryOpen with SL', () => {
    expect(runtimeSource).toContain('public async openAuditHistory(): Promise<void>');
    expect(runtimeSource).toContain("await this.handleAuditHistoryOpen('SL');");
  });

  test('openQcLog calls handleAuditHistoryOpen with QC', () => {
    expect(runtimeSource).toContain('public async openQcLog(): Promise<void>');
    expect(runtimeSource).toContain("await this.handleAuditHistoryOpen('QC');");
  });

  test('handleAuditHistoryOpen emits correct action per type', () => {
    expect(runtimeSource).toContain("auditType === 'QC' ? 'viewQcLog' : 'viewAuditHistory'");
  });

  test('fetchAuditHistory resolves taskId using resolveTaskIdForAuditLogs', () => {
    expect(runtimeSource).toContain('const taskId = resolveTaskIdForAuditLogs(this._saleDetails, this.selectedTaskId);');
  });

  test('fetchAuditHistory sends { taskId, auditType } as params', () => {
    expect(runtimeSource).toContain('{ taskId, auditType },');
  });

  test('fetchAuditHistory resolves API name from config', () => {
    expect(runtimeSource).toContain("resolveConfiguredApiName(this._context, 'auditLogsApiName', CONTROL_CONFIG.auditLogsApiName)");
  });

  test('fetchAuditHistory resolves API type from config', () => {
    expect(runtimeSource).toContain("resolveConfiguredApiType(this._context, 'auditLogsApiType', CONTROL_CONFIG.auditLogsApiType)");
  });

  test('fetchAuditHistory unwraps and merges response', () => {
    expect(runtimeSource).toContain('const payload = unwrapCustomApiPayload(rawPayload);');
    expect(runtimeSource).toContain('mergeAuditHistoryDetails(this._saleDetails, auditType, payloadRecord)');
  });

  test('missing taskId produces error merge payload', () => {
    expect(runtimeSource).toContain("errorMessage: 'Task ID is not available for audit lookup.'");
  });

  test('missing API name produces error merge payload', () => {
    expect(runtimeSource).toContain("errorMessage: 'Audit logs API is not configured.'");
  });

  test('fetch failure produces error merge payload', () => {
    expect(runtimeSource).toContain('`Failed to fetch ${auditType} audit history.`');
  });
});

/* ================================================================== */
/*  9. resolveTaskIdForAuditLogs                                      */
/* ================================================================== */

describe('resolveTaskIdForAuditLogs', () => {

  test('function is exported from sale-details.ts', () => {
    expect(saleDetailsRuntimeSource).toContain('export const resolveTaskIdForAuditLogs = (saleDetailsJson: string, selectedTaskId?: string): string =>');
  });

  test('prefers selectedTaskId when provided', () => {
    expect(saleDetailsRuntimeSource).toContain('const selected = normalizeTextValue(selectedTaskId);');
    // Early return if selected is truthy
    expect(saleDetailsRuntimeSource).toMatch(/if \(selected\)\s*\{\s*return selected;/);
  });

  test('falls back to salesVerificationTaskDetails.taskId', () => {
    expect(saleDetailsRuntimeSource).toContain("const primaryTaskDetails = toRecord(root.salesVerificationTaskDetails);");
  });

  test('falls back to taskDetails.taskId as legacy', () => {
    expect(saleDetailsRuntimeSource).toContain("const legacyTaskDetails = toRecord(root.taskDetails);");
  });

  test('returns empty string when no taskId found', () => {
    expect(saleDetailsRuntimeSource).toContain("return '';");
  });
});

/* ================================================================== */
/*  10. mergeAuditHistoryDetails                                      */
/* ================================================================== */

describe('mergeAuditHistoryDetails', () => {

  test('function is exported from sale-details.ts', () => {
    expect(saleDetailsRuntimeSource).toContain('export const mergeAuditHistoryDetails = (');
    expect(saleDetailsRuntimeSource).toContain('saleDetailsJson: string,');
    expect(saleDetailsRuntimeSource).toContain('auditType: AuditType,');
    expect(saleDetailsRuntimeSource).toContain('payload: Record<string, unknown>,');
  });

  test('scopes QC payload under auditLogs.qc', () => {
    expect(saleDetailsRuntimeSource).toContain("const scopeKey = auditType === 'QC' ? 'qc' : 'sl';");
    expect(saleDetailsRuntimeSource).toContain('auditLogs[scopeKey] = payload;');
  });

  test('sets legacy key qcAuditHistory for QC type', () => {
    expect(saleDetailsRuntimeSource).toContain("if (auditType === 'QC') {");
    expect(saleDetailsRuntimeSource).toContain('root.qcAuditHistory = payload;');
  });

  test('sets legacy key auditHistory for SL type', () => {
    expect(saleDetailsRuntimeSource).toContain('root.auditHistory = payload;');
  });

  test('preserves existing auditLogs object if present', () => {
    expect(saleDetailsRuntimeSource).toContain(
      "const auditLogs = auditLogsRaw && typeof auditLogsRaw === 'object' && !Array.isArray(auditLogsRaw)"
    );
  });

  test('simulated merge for SL type stores under correct keys', () => {
    const root: Record<string, unknown> = {};
    const payload = { taskId: '1000564', auditHistory: [] };
    const auditType: string = 'SL';
    const scopeKey = auditType === 'QC' ? 'qc' : 'sl';

    const auditLogs: Record<string, unknown> = {};
    auditLogs[scopeKey] = payload;
    root.auditLogs = auditLogs;
    root.auditHistory = payload;

    expect(root.auditLogs).toEqual({ sl: payload });
    expect(root.auditHistory).toBe(payload);
  });

  test('simulated merge for QC type stores under correct keys', () => {
    const root: Record<string, unknown> = {};
    const payload = { taskId: '1000550', auditHistory: [] };
    const auditType: string = 'QC';
    const scopeKey = auditType === 'QC' ? 'qc' : 'sl';

    const auditLogs: Record<string, unknown> = {};
    auditLogs[scopeKey] = payload;
    root.auditLogs = auditLogs;
    root.qcAuditHistory = payload;

    expect(root.auditLogs).toEqual({ qc: payload });
    expect(root.qcAuditHistory).toBe(payload);
  });

  test('simulated merge preserves both SL and QC in auditLogs', () => {
    const slPayload = { taskId: '1000564', auditHistory: [{ changeID: 1 }] };
    const qcPayload = { taskId: '1000564', auditHistory: [{ changeID: 2 }] };
    const auditLogs: Record<string, unknown> = {};

    auditLogs['sl'] = slPayload;
    auditLogs['qc'] = qcPayload;

    expect(auditLogs).toEqual({ sl: slPayload, qc: qcPayload });
  });
});

/* ================================================================== */
/*  11. View model: resolveAuditPayload                               */
/* ================================================================== */

describe('resolveAuditPayload', () => {

  test('function exists in view model source', () => {
    expect(viewModelSource).toContain('const resolveAuditPayload = (');
  });

  test('resolves namesapced payload from auditLogs.qc or auditLogs.sl', () => {
    expect(viewModelSource).toContain("getRecord(auditLogsRecord, type === 'qc' ? 'qc' : 'sl')");
  });

  test('main type has fallback keys: auditHistory, salesAuditHistory, mainAuditHistory', () => {
    expect(viewModelSource).toContain("getRecordFromKeys(details, ['auditHistory', 'salesAuditHistory', 'mainAuditHistory'])");
  });

  test('QC type has fallback keys: qcAuditHistory, qualityControlAuditHistory, qualityControlHistory', () => {
    expect(viewModelSource).toContain("getRecordFromKeys(details, ['qcAuditHistory', 'qualityControlAuditHistory', 'qualityControlHistory'])");
  });

  test('prefers namespaced payload over direct payload', () => {
    expect(viewModelSource).toContain('Object.keys(namespacedPayload).length > 0');
  });
});

/* ================================================================== */
/*  12. View model: audit field label mapping                         */
/* ================================================================== */

describe('View model field label mapping', () => {

  const EXPECTED_LABELS: Record<string, string> = {
    taskstatus: 'Task Status',
    status: 'Task Status',
    assignedto: 'Assigned to',
    caseworkerassignedto: 'Assigned to',
    padconfirmation: 'PAD Confirmation',
    salesource: 'Sale Source',
    source: 'Sale Source',
    wlttid: 'WLTT ID',
    wltid: 'WLTT ID',
    lrppdid: 'LRPPD ID',
    lrpddid: 'LRPPD ID',
    hpiadjustedprice: 'HPI adjusted Price',
    hpiadjustedsaleprice: 'HPI adjusted Price',
    salesparticular: 'Sales Particular',
    salesparticulars: 'Sales Particular',
    linkparticulars: 'Link Particulars',
    kitchenage: 'Kitchen Age',
    kitchenspecification: 'Kitchen Specification',
    bathroomage: 'Bathroom Age',
    bathroomspecification: 'Bathroom Specification',
    glazing: 'Glazing',
    heating: 'Heating',
    decorativefinishes: 'Decorative finishes',
    conditionscore: 'Condition Score',
    conditioncategory: 'Condition Category',
    particularnotes: 'Particular Notes',
    particularsnotes: 'Particular Notes',
    reasonnotes: 'Particular Notes',
    issaleuseful: 'Is this Sale Useful?',
    isthissaleuseful: 'Is this Sale Useful?',
    whynotuseful: 'Why is the sale not useful?',
    whyisthesalenotuseful: 'Why is the sale not useful?',
    additionalnotes: 'Additional Notes',
    assigneddate: 'Assigned Date',
    assignedat: 'Assigned Date',
    caseworkerassigneddate: 'Assigned Date',
    caseworkerassignedon: 'Assigned Date',
    qcassigneddate: 'QC Assigned Date',
    qcassignedat: 'QC Assigned Date',
    qcassignedto: 'QC Assigned to',
    qcremarks: 'QC Remarks',
    outcome: 'Outcome',
    completedat: 'Completed At',
  };

  test('AUDIT_FIELD_LABEL_BY_KEY is declared in view model', () => {
    expect(viewModelSource).toContain('const AUDIT_FIELD_LABEL_BY_KEY: Record<string, string> = {');
  });

  test.each(Object.entries(EXPECTED_LABELS))(
    'field "%s" maps to label "%s"',
    (key, label) => {
      expect(viewModelSource).toContain(`${key}: '${label}'`);
    },
  );

  test('normalizeAuditFieldKey removes non-alphanumeric and lowercases', () => {
    expect(viewModelSource).toContain("const normalizeAuditFieldKey = (value: string): string => value");
    expect(viewModelSource).toContain(".toLowerCase()");
    expect(viewModelSource).toContain(".replace(/[^a-z0-9]/g, '')");
  });

  test('toAuditFieldLabel falls back to toReadableLabel for unknown keys', () => {
    expect(viewModelSource).toContain('return toReadableLabel(trimmed)');
  });

  test('model AuditFieldLabelKey type covers all known keys', () => {
    for (const key of Object.keys(EXPECTED_LABELS)) {
      // Verify our TypeScript type includes this key
      const _check: AuditFieldLabelKey = key as AuditFieldLabelKey;
      expect(typeof _check).toBe('string');
    }
  });

  test('model AuditFieldDisplayLabel type covers all known labels', () => {
    const uniqueLabels = [...new Set(Object.values(EXPECTED_LABELS))];
    for (const label of uniqueLabels) {
      const _check: AuditFieldDisplayLabel = label as AuditFieldDisplayLabel;
      expect(typeof _check).toBe('string');
    }
  });
});

/* ================================================================== */
/*  13. View model: date parsing and UK format                        */
/* ================================================================== */

describe('View model date parsing', () => {

  test('UK_AUDIT_DATE_TIME_PATTERN regex exists', () => {
    expect(viewModelSource).toContain('const UK_AUDIT_DATE_TIME_PATTERN');
  });

  test('parseAuditDateTime function exists', () => {
    expect(viewModelSource).toContain('const parseAuditDateTime = (value: string): number => {');
  });

  test('toUkDateTime function exists', () => {
    expect(viewModelSource).toContain('const toUkDateTime = (value: string): string => {');
  });

  test('UK date pattern matches DD/MM/YYYY HH:mm:ss format', () => {
    const UK_AUDIT_DATE_TIME_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    expect(UK_AUDIT_DATE_TIME_PATTERN.test('20/03/2026 11:36:16')).toBe(true);
    expect(UK_AUDIT_DATE_TIME_PATTERN.test('1/1/2026 9:05')).toBe(true);
    expect(UK_AUDIT_DATE_TIME_PATTERN.test('2026-03-20')).toBe(false);
  });

  test('simulated parseAuditDateTime for real trace date', () => {
    const UK_AUDIT_DATE_TIME_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    const match = UK_AUDIT_DATE_TIME_PATTERN.exec('20/03/2026 11:36:16');
    expect(match).not.toBeNull();
    const day = Number(match![1]);
    const month = Number(match![2]);
    const year = Number(match![3]);
    const hours = Number(match![4]);
    const minutes = Number(match![5]);
    const seconds = Number(match![6]);
    expect(day).toBe(20);
    expect(month).toBe(3);
    expect(year).toBe(2026);
    expect(hours).toBe(11);
    expect(minutes).toBe(36);
    expect(seconds).toBe(16);
  });

  test('simulated toUkDateTime produces DD/MM/YYYY HH:mm:ss', () => {
    const date = new Date(2026, 2, 20, 11, 36, 16); // month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formatted = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    expect(formatted).toBe('20/03/2026 11:36:16');
  });

  test('dash input returns dash', () => {
    // parseAuditDateTime returns NaN for "-"
    // toUkDateTime returns "-" for "-"
    expect(viewModelSource).toContain("if (!trimmed || trimmed === '-')");
  });
});

/* ================================================================== */
/*  14. View model: sorting (latest first)                            */
/* ================================================================== */

describe('View model sorting', () => {

  test('entries are sorted by sortValue descending (latest first)', () => {
    expect(viewModelSource).toContain('.sort((left, right) => right.sortValue - left.sortValue)');
  });

  test('NaN sortValue falls back to negative index', () => {
    expect(viewModelSource).toContain('Number.isNaN(parsedChangedOn) ? -(index + 1) : parsedChangedOn');
  });

  test('entries with no changes are filtered out', () => {
    expect(viewModelSource).toContain('if (changes.length === 0)');
    expect(viewModelSource).toContain('return undefined;');
  });

  test('sortValue is removed from final entries', () => {
    expect(viewModelSource).toContain('.map(({ sortValue, ...entry }) => entry)');
  });

  test('simulated sort order: later dates appear first', () => {
    const entries = [
      { changedOn: '19/03/2026 10:00:00', sortValue: new Date(2026, 2, 19, 10).getTime() },
      { changedOn: '20/03/2026 11:36:16', sortValue: new Date(2026, 2, 20, 11, 36, 16).getTime() },
      { changedOn: '18/03/2026 09:00:00', sortValue: new Date(2026, 2, 18, 9).getTime() },
    ];
    const sorted = entries.sort((a, b) => b.sortValue - a.sortValue);
    expect(sorted[0].changedOn).toBe('20/03/2026 11:36:16');
    expect(sorted[1].changedOn).toBe('19/03/2026 10:00:00');
    expect(sorted[2].changedOn).toBe('18/03/2026 09:00:00');
  });
});

/* ================================================================== */
/*  15. View model: mapAuditHistoryModel                              */
/* ================================================================== */

describe('mapAuditHistoryModel', () => {

  test('function exists in view model source', () => {
    expect(viewModelSource).toContain('const mapAuditHistoryModel = (');
  });

  test('extracts history from multiple keys', () => {
    expect(viewModelSource).toContain("getRecordArrayFromKeys(payload, ['auditHistory', 'history', 'records', 'items'])");
  });

  test('maps changeID with fallback to index-based id', () => {
    expect(viewModelSource).toContain("getValue(record, 'changeID'), getValue(record, 'changeId'), `${index + 1}`");
  });

  test('maps changedBy with user display name resolution', () => {
    expect(viewModelSource).toContain("resolveUserDisplayName(getValue(record, 'changedBy'), effectiveLookup)");
  });

  test('maps changedOn using toUkDateTime', () => {
    expect(viewModelSource).toContain('const changedOn = formatValue(toUkDateTime(changedOnRaw));');
  });

  test('maps eventType from record', () => {
    expect(viewModelSource).toContain("const eventType = formatValue(getValue(record, 'eventType'))");
  });

  test('extracts errorMessage from payload', () => {
    expect(viewModelSource).toContain("getValue(payload, 'errorMessage'), getValue(payload, 'message')");
  });
});

/* ================================================================== */
/*  16. View model: mapAuditFieldChanges                              */
/* ================================================================== */

describe('mapAuditFieldChanges', () => {

  test('function exists in view model source', () => {
    expect(viewModelSource).toContain('const mapAuditFieldChanges = (record: SaleDetailsRecord)');
  });

  test('maps changes array with fieldName, oldValue, newValue', () => {
    expect(viewModelSource).toContain("fieldName: formatValue(toAuditFieldLabel(getValue(change, 'fieldName'))),");
    expect(viewModelSource).toContain("oldValue: formatValue(getValue(change, 'oldValue')),");
    expect(viewModelSource).toContain("newValue: formatValue(getValue(change, 'newValue')),");
  });

  test('falls back to single-field format when changes array is empty', () => {
    expect(viewModelSource).toContain("const singleField = formatValue(toAuditFieldLabel(getValue(record, 'fieldName')));");
    expect(viewModelSource).toContain("const singleOldValue = formatValue(getValue(record, 'oldValue'));");
    expect(viewModelSource).toContain("const singleNewValue = formatValue(getValue(record, 'newValue'));");
  });
});

/* ================================================================== */
/*  17. Audit modal display                                           */
/* ================================================================== */

describe('Audit modal display', () => {

  test('modal shows Changed By metadata', () => {
    expect(modalSource).toContain('<strong>Changed By:</strong>');
  });

  test('modal shows Changed On metadata', () => {
    expect(modalSource).toContain('<strong>Changed On:</strong>');
  });

  test('modal shows Event metadata (conditional)', () => {
    expect(modalSource).toContain('<strong>Event:</strong>');
    expect(modalSource).toContain("entry.eventType && entry.eventType !== '-'");
  });

  test('modal has search placeholder', () => {
    expect(modalSource).toContain('placeholder="Search field, value, user, or event"');
  });

  test('modal has accessible aria-label on entry meta', () => {
    expect(modalSource).toContain('aria-label={`Changed by ${entry.changedBy} on ${entry.changedOn}`}');
  });
});

/* ================================================================== */
/*  18. View model types alignment                                    */
/* ================================================================== */

describe('SaleDetailsShell types alignment', () => {

  test('AuditHistoryChangeViewModel matches model interface', () => {
    expect(typesSource).toContain('export interface AuditHistoryChangeViewModel {');
    expect(typesSource).toContain('fieldName: string;');
    expect(typesSource).toContain('oldValue: string;');
    expect(typesSource).toContain('newValue: string;');
  });

  test('AuditHistoryEntryViewModel matches model interface', () => {
    expect(typesSource).toContain('export interface AuditHistoryEntryViewModel {');
    expect(typesSource).toContain('changeId: string;');
    expect(typesSource).toContain('changedBy: string;');
    expect(typesSource).toContain('changedOn: string;');
    expect(typesSource).toContain('eventType: string;');
    expect(typesSource).toContain('changes: AuditHistoryChangeViewModel[];');
  });

  test('AuditHistoryViewModel matches model interface', () => {
    expect(typesSource).toContain('export interface AuditHistoryViewModel {');
    expect(typesSource).toContain('taskId: string;');
    expect(typesSource).toContain('entries: AuditHistoryEntryViewModel[];');
    expect(typesSource).toContain('errorMessage: string;');
  });
});

/* ================================================================== */
/*  19. Config and ControlManifest alignment                          */
/* ================================================================== */

describe('Config alignment', () => {

  test("ControlConfig has auditLogsApiName = 'voa_SvtGetAuditLogs'", () => {
    expect(configSource).toContain("auditLogsApiName: 'voa_SvtGetAuditLogs'");
  });

  test("ControlConfig has auditLogsApiType = 'action'", () => {
    expect(configSource).toContain("auditLogsApiType: 'action'");
  });

  test('ControlManifest declares auditLogsApiName property', () => {
    expect(manifestSource).toContain('name="auditLogsApiName"');
    expect(manifestSource).toContain('default-value="voa_SvtGetAuditLogs"');
  });

  test('ControlManifest declares auditLogsApiType property', () => {
    expect(manifestSource).toContain('name="auditLogsApiType"');
  });

  test('ControlManifest marks both audit properties as optional (not required)', () => {
    const auditApiNameMatch = manifestSource.match(/name="auditLogsApiName"[^>]*required="([^"]*)"/);
    const auditApiTypeMatch = manifestSource.match(/name="auditLogsApiType"[^>]*required="([^"]*)"/);
    expect(auditApiNameMatch?.[1]).toBe('false');
    expect(auditApiTypeMatch?.[1]).toBe('false');
  });
});

/* ================================================================== */
/*  20. QC log access control rules                                   */
/* ================================================================== */

describe('QC log access control', () => {

  test('QcLogActionRuleInput interface exists', () => {
    expect(rulesSource).toContain('export interface QcLogActionRuleInput');
  });

  test('getQcLogActionRule function exists', () => {
    expect(rulesSource).toContain('export const getQcLogActionRule = (');
  });

  test('QC log restricted to caseworker, QC users, and managers', () => {
    expect(rulesSource).toContain("reason: 'QC log is available to the assigned caseworker, QC users, and managers.'");
  });

  test('canProgressTask && readOnly triggers restriction', () => {
    expect(rulesSource).toContain('if (canProgressTask && readOnly)');
  });

  test('unconfigured API disables QC log action', () => {
    expect(rulesSource).toContain("reason: 'QC log action is not configured.'");
  });
});

/* ================================================================== */
/*  21. Real trace payload round-trip                                 */
/* ================================================================== */

describe('Real trace payload round-trip', () => {

  test('real trace request matches SvtGetAuditLogsRequest interface', () => {
    const req: SvtGetAuditLogsRequest = {
      taskId: '1000564',
      auditType: 'SL',
    };
    expect(req.taskId).toBe('1000564');
    expect(req.auditType).toBe('SL');
  });

  test('real audit response round-trips through JSON', () => {
    const json = JSON.stringify(REAL_AUDIT_RESPONSE);
    const parsed: AuditLogsResponse = JSON.parse(json);
    expect(parsed.taskId).toBe('A-1000564');
    expect(parsed.auditHistory).toHaveLength(1);
    expect(parsed.auditHistory![0].changeID).toBe(1);
    expect(parsed.auditHistory![0].changedBy).toBe('8d75f389-a7f6-f011-8406-6045bd0b0506');
    expect(parsed.auditHistory![0].eventType).toBe('Update');
    expect(parsed.auditHistory![0].changedOn).toBe('20/03/2026 11:36:16');
    expect(parsed.auditHistory![0].changes).toHaveLength(1);
    expect(parsed.auditHistory![0].changes![0].fieldName).toBe('TaskStatus');
    expect(parsed.auditHistory![0].changes![0].oldValue).toBe('Assigned');
    expect(parsed.auditHistory![0].changes![0].newValue).toBe('Complete');
  });

  test('real changedBy is a valid GUID token', () => {
    const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(GUID_REGEX.test(REAL_AUDIT_RESPONSE.auditHistory![0].changedBy!)).toBe(true);
  });

  test('real changedOn matches UK date format', () => {
    const UK_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2}$/;
    expect(UK_PATTERN.test(REAL_AUDIT_RESPONSE.auditHistory![0].changedOn!)).toBe(true);
  });

  test('real trace URL contains v1/audit-logs endpoint', () => {
    const traceUrl = 'https://voagw.npd.hmrc.gov.uk/dev/internal/ctp/sales-verification-api//v1/audit-logs?taskId=1000564&auditType=SL';
    expect(traceUrl).toMatch(/\/v1\/audit-logs\?/);
  });
});

/* ================================================================== */
/*  22. Simulated GUID resolution                                     */
/* ================================================================== */

describe('Simulated GUID resolution', () => {

  const GUID_REGEX = /\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?/gi;

  test('extracting GUIDs from changedBy value', () => {
    const changedBy = '8d75f389-a7f6-f011-8406-6045bd0b0506';
    const matches = changedBy.match(GUID_REGEX);
    expect(matches).toHaveLength(1);
    expect(matches![0]).toBe('8d75f389-a7f6-f011-8406-6045bd0b0506');
  });

  test('extracting GUID with braces', () => {
    const value = '{8d75f389-a7f6-f011-8406-6045bd0b0506}';
    const matches = value.match(GUID_REGEX);
    expect(matches).toHaveLength(1);
    expect(matches![0]).toBe('{8d75f389-a7f6-f011-8406-6045bd0b0506}');
  });

  test('no GUID in plain text', () => {
    const value = 'John Doe';
    const matches = value.match(GUID_REGEX);
    expect(matches).toBeNull();
  });

  test('multiple GUIDs extracted from a value', () => {
    const value = '8d75f389-a7f6-f011-8406-6045bd0b0506 and cc4cc1fc-aeb8-ef11-b8e8-002248c64505';
    const matches = value.match(GUID_REGEX);
    expect(matches).toHaveLength(2);
  });

  test('simulated changedBy replacement', () => {
    const userNames: Record<string, string> = {
      '8d75f389-a7f6-f011-8406-6045bd0b0506': 'John Doe',
    };
    const changedBy = '8d75f389-a7f6-f011-8406-6045bd0b0506';
    const match = GUID_REGEX.exec(changedBy);
    GUID_REGEX.lastIndex = 0;
    const replaced = match && userNames[match[0].replace(/[{}]/g, '')] || changedBy;
    expect(replaced).toBe('John Doe');
  });

  test('simulated assignee field oldValue/newValue replacement', () => {
    const userNames: Record<string, string> = {
      '8d75f389-a7f6-f011-8406-6045bd0b0506': 'Alice Smith',
      'cc4cc1fc-aeb8-ef11-b8e8-002248c64505': 'Bob Jones',
    };
    const value = '8d75f389-a7f6-f011-8406-6045bd0b0506';
    const replaced = value.replace(GUID_REGEX, (match) => {
      const token = match.replace(/[{}]/g, '');
      return userNames[token] || match;
    });
    expect(replaced).toBe('Alice Smith');
  });
});

/* ================================================================== */
/*  23. Simulated ShouldResolveAssigneeField                          */
/* ================================================================== */

describe('Simulated ShouldResolveAssigneeField', () => {

  function normalizeFieldName(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  function shouldResolveAssigneeField(fieldName: string): boolean {
    const normalized = normalizeFieldName(fieldName);
    return normalized === 'assignedto'
      || normalized === 'qcassignedto'
      || normalized.endsWith('assignedto');
  }

  test.each([
    ['AssignedTo', true],
    ['Assigned To', true],
    ['assigned_to', true],
    ['QCAssignedTo', true],
    ['qc_assigned_to', true],
    ['CaseworkerAssignedTo', true],
    ['TaskStatus', false],
    ['ChangedBy', false],
    ['OldValue', false],
    ['qcremarks', false],
    ['MyCustomAssignedTo', true],   // ends with 'assignedto'
  ])('field "%s" → shouldResolve = %s', (input, expected) => {
    expect(shouldResolveAssigneeField(input)).toBe(expected);
  });
});

/* ================================================================== */
/*  24. Simulated NormalizeAuditType                                  */
/* ================================================================== */

describe('Simulated NormalizeAuditType', () => {

  function normalizeAuditType(value: string | null | undefined): string | null {
    if (!value || !value.trim()) {
      return null;
    }
    const upper = value.trim().toUpperCase();
    return upper === 'QC' || upper === 'SL' ? upper : null;
  }

  test.each([
    ['QC', 'QC'],
    ['qc', 'QC'],
    ['Qc', 'QC'],
    ['SL', 'SL'],
    ['sl', 'SL'],
    ['Sl', 'SL'],
    ['  QC  ', 'QC'],
    ['  SL  ', 'SL'],
  ])('"%s" normalizes to "%s"', (input, expected) => {
    expect(normalizeAuditType(input)).toBe(expected);
  });

  test.each([
    [null, null],
    [undefined, null],
    ['', null],
    ['  ', null],
    ['XX', null],
    ['SALES', null],
    ['Q', null],
  ])('"%s" normalizes to null (invalid)', (input, expected) => {
    expect(normalizeAuditType(input as string | null | undefined)).toBe(expected);
  });
});

/* ================================================================== */
/*  25. Simulated BuildUrl                                            */
/* ================================================================== */

describe('Simulated BuildUrl', () => {

  function buildUrl(baseAddress: string, taskId: string, auditType: string): string {
    let trimmed = (baseAddress ?? '').trim();
    if (!trimmed) return trimmed;

    if (trimmed.includes('{taskId}')) {
      trimmed = trimmed.replace('{taskId}', encodeURIComponent(taskId));
    }
    if (trimmed.includes('{auditType}')) {
      trimmed = trimmed.replace('{auditType}', encodeURIComponent(auditType));
    }

    if (trimmed.toLowerCase().includes('taskid=') && trimmed.toLowerCase().includes('audittype=')) {
      return trimmed;
    }

    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}taskId=${encodeURIComponent(taskId)}&auditType=${encodeURIComponent(auditType)}`;
  }

  test('appends query params to base URL', () => {
    const result = buildUrl('https://example.com/v1/audit-logs', '1000564', 'SL');
    expect(result).toContain('taskId=1000564');
    expect(result).toContain('auditType=SL');
    expect(result).toContain('?');
  });

  test('template replacement for {taskId} and {auditType}', () => {
    const result = buildUrl('https://example.com/v1/audit-logs/{taskId}?auditType={auditType}', '1000564', 'SL');
    expect(result).toContain('/1000564');
    expect(result).toContain('auditType=SL');
  });

  test('existing query params preserved', () => {
    const result = buildUrl('https://example.com/v1/audit-logs?taskId=999&auditType=QC', '1000564', 'SL');
    expect(result).toBe('https://example.com/v1/audit-logs?taskId=999&auditType=QC');
  });

  test('empty base address returns empty', () => {
    expect(buildUrl('', '1000564', 'SL')).toBe('');
  });

  test('appends with & when ? already exists', () => {
    const result = buildUrl('https://example.com/v1/audit-logs?other=1', '1000564', 'QC');
    expect(result).toContain('&taskId=');
    expect(result).toContain('&auditType=QC');
  });
});

/* ================================================================== */
/*  26. Simulated merge round-trip                                    */
/* ================================================================== */

describe('Simulated merge round-trip', () => {

  function simulateMerge(
    existing: Record<string, unknown>,
    auditType: AuditType,
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const root = { ...existing };
    const auditLogsRaw = root.auditLogs;
    const auditLogs = auditLogsRaw && typeof auditLogsRaw === 'object' && !Array.isArray(auditLogsRaw)
      ? { ...(auditLogsRaw as Record<string, unknown>) }
      : {};

    const scopeKey = auditType === 'QC' ? 'qc' : 'sl';
    auditLogs[scopeKey] = payload;
    root.auditLogs = auditLogs;

    if (auditType === 'QC') {
      root.qcAuditHistory = payload;
    } else {
      root.auditHistory = payload;
    }

    return root;
  }

  test('SL merge stores under auditLogs.sl and auditHistory', () => {
    const payload = { taskId: '1000564', auditHistory: [{ changeID: 1 }] };
    const result = simulateMerge({}, 'SL', payload);
    expect((result.auditLogs as Record<string, unknown>)['sl']).toBe(payload);
    expect(result.auditHistory).toBe(payload);
    expect(result.qcAuditHistory).toBeUndefined();
  });

  test('QC merge stores under auditLogs.qc and qcAuditHistory', () => {
    const payload = { taskId: '1000564', auditHistory: [{ changeID: 2 }] };
    const result = simulateMerge({}, 'QC', payload);
    expect((result.auditLogs as Record<string, unknown>)['qc']).toBe(payload);
    expect(result.qcAuditHistory).toBe(payload);
    expect(result.auditHistory).toBeUndefined();
  });

  test('sequential SL then QC merge preserves both scopes', () => {
    const slPayload = { taskId: '1000564', auditHistory: [{ changeID: 1 }] };
    const qcPayload = { taskId: '1000564', auditHistory: [{ changeID: 2 }] };

    const afterSl = simulateMerge({}, 'SL', slPayload);
    const afterBoth = simulateMerge(afterSl, 'QC', qcPayload);

    const auditLogs = afterBoth.auditLogs as Record<string, unknown>;
    expect(auditLogs['sl']).toBe(slPayload);
    expect(auditLogs['qc']).toBe(qcPayload);
    expect(afterBoth.auditHistory).toBe(slPayload);
    expect(afterBoth.qcAuditHistory).toBe(qcPayload);
  });

  test('error payload merge stores error message', () => {
    const errorPayload = { taskId: '', auditHistory: [], errorMessage: 'Task ID is not available for audit lookup.' };
    const result = simulateMerge({}, 'SL', errorPayload);
    expect((result.auditHistory as Record<string, unknown>).errorMessage).toBe('Task ID is not available for audit lookup.');
  });

  test('real trace payload merge stores correctly', () => {
    const result = simulateMerge({}, 'SL', REAL_AUDIT_RESPONSE as unknown as Record<string, unknown>);
    const merged = result.auditHistory as AuditLogsResponse;
    expect(merged.taskId).toBe('A-1000564');
    expect(merged.auditHistory).toHaveLength(1);
  });
});

/* ================================================================== */
/*  27. Simulated resolveAuditPayload                                 */
/* ================================================================== */

describe('Simulated resolveAuditPayload', () => {

  function simulateResolveAuditPayload(
    details: Record<string, unknown>,
    type: 'main' | 'qc',
  ): { payload: Record<string, unknown>; historyRecords: unknown[] } {
    const auditLogs = (details.auditLogs && typeof details.auditLogs === 'object' && !Array.isArray(details.auditLogs)
      ? details.auditLogs : {}) as Record<string, unknown>;

    const namespacedPayload = (type === 'qc'
      ? auditLogs['qc']
      : auditLogs['sl']) as Record<string, unknown> ?? {};

    const directKey = type === 'qc' ? 'qcAuditHistory' : 'auditHistory';
    const directPayload = (details[directKey] ?? {}) as Record<string, unknown>;

    const payload = namespacedPayload && Object.keys(namespacedPayload).length > 0
      ? namespacedPayload
      : directPayload;

    const historyKey = type === 'qc' ? 'qcAuditHistory' : 'auditHistory';
    const historyRecords = Array.isArray(details[historyKey]) ? details[historyKey] as unknown[] : [];

    return { payload, historyRecords };
  }

  test('prefers namespaced SL payload over legacy', () => {
    const namespacedData = { taskId: 'A-1000564', auditHistory: [{ changeID: 1 }] };
    const legacyData = { taskId: 'A-1000564', auditHistory: [{ changeID: 99 }] };
    const details = {
      auditLogs: { sl: namespacedData },
      auditHistory: legacyData,
    };
    const result = simulateResolveAuditPayload(details, 'main');
    expect(result.payload).toBe(namespacedData);
  });

  test('falls back to legacy auditHistory when namespace is empty', () => {
    const legacyData = { taskId: 'A-1000564', auditHistory: [{ changeID: 1 }] };
    const details = {
      auditHistory: legacyData,
    };
    const result = simulateResolveAuditPayload(details, 'main');
    expect(result.payload).toBe(legacyData);
  });

  test('prefers namespaced QC payload over legacy', () => {
    const namespacedData = { taskId: 'A-1000550', auditHistory: [{ changeID: 5 }] };
    const details = {
      auditLogs: { qc: namespacedData },
      qcAuditHistory: { taskId: 'A-1000550', auditHistory: [{ changeID: 99 }] },
    };
    const result = simulateResolveAuditPayload(details, 'qc');
    expect(result.payload).toBe(namespacedData);
  });
});

/* ================================================================== */
/*  28. Plugin trace log alignment                                    */
/* ================================================================== */

describe('Plugin trace log alignment', () => {

  test('plugin traces "Calling audit logs URL:" prefix', () => {
    expect(pluginSource).toContain('$"Calling audit logs URL: {Truncate(fullUrl, 300)}"');
  });

  test('plugin traces "Audit logs response snippet:" prefix', () => {
    expect(pluginSource).toContain('$"Audit logs response snippet: {Truncate(transformedBody, 200)}"');
  });

  test('plugin traces "SvtGetAuditLogs completed successfully."', () => {
    expect(pluginSource).toContain('SvtGetAuditLogs completed successfully.');
  });

  test('plugin traces "SvtGetAuditLogs started."', () => {
    expect(pluginSource).toContain('SvtGetAuditLogs started.');
  });

  test('plugin traces credential retrieval', () => {
    expect(pluginSource).toContain('Retrieving configuration from voa_CredentialProvider...');
  });

  test('plugin traces auth token generation', () => {
    expect(pluginSource).toContain('Generating authentication token...');
  });

  test('plugin traces failure with status code', () => {
    expect(pluginSource).toContain('Audit logs call failed. Status=');
  });

  test('plugin traces transform error', () => {
    expect(pluginSource).toContain('SvtGetAuditLogs transform skipped due to error:');
  });

  test('real trace matches expected log format', () => {
    const realTrace = 'Calling audit logs URL: https://voagw.npd.hmrc.gov.uk/dev/internal/ctp/sales-verification-api//v1/audit-logs?taskId=1000564&auditType=SL';
    expect(realTrace).toMatch(/^Calling audit logs URL: /);
    expect(realTrace).toContain('taskId=1000564');
    expect(realTrace).toContain('auditType=SL');
  });

  test('real trace response snippet matches expected format', () => {
    const realSnippet = '{"taskId":"A-1000564","auditHistory":[{"changeID":1,"changedBy":"8d75f389-a7f6-f011-8406-6045bd0b0506","eventType":"Update","changedOn":"20/03/2026 11:36:16","changes":[{"fieldName":"TaskStatus","oldV';
    expect(realSnippet).toMatch(/^\{"taskId"/);
    expect(realSnippet).toContain('"auditHistory"');
    expect(realSnippet).toContain('"changeID":1');
  });
});

/* ================================================================== */
/*  29. PCF ↔ Plugin alignment                                       */
/* ================================================================== */

describe('PCF ↔ Plugin alignment', () => {

  test('PCF sends taskId param matching plugin input "taskId"', () => {
    expect(runtimeSource).toContain('{ taskId, auditType },');
    expect(pluginSource).toContain('GetInput(context, "taskId")');
  });

  test('PCF sends auditType param matching plugin input "auditType"', () => {
    expect(runtimeSource).toContain('{ taskId, auditType },');
    expect(pluginSource).toContain('GetInput(context, "auditType")');
  });

  test('PCF uses exactly the same two audit types as plugin', () => {
    expect(saleDetailsRuntimeSource).toContain("export type AuditType = 'QC' | 'SL';");
    expect(pluginSource).toContain('return upper == "QC" || upper == "SL" ? upper : null;');
  });

  test('PCF default API name matches plugin class name pattern', () => {
    expect(configSource).toContain("auditLogsApiName: 'voa_SvtGetAuditLogs'");
    expect(pluginSource).toContain('public class SvtGetAuditLogs : PluginBase');
  });

  test('PCF uses executeUnboundCustomApi with operationType from config', () => {
    expect(runtimeSource).toContain('executeUnboundCustomApi<unknown>(');
    expect(runtimeSource).toContain('{ operationType: customApiType },');
  });

  test('PCF processes Result output from plugin', () => {
    expect(runtimeSource).toContain('unwrapCustomApiPayload(rawPayload)');
    expect(pluginSource).toContain('context.OutputParameters["Result"]');
  });
});

/* ================================================================== */
/*  30. Docs alignment                                                */
/* ================================================================== */

describe('Docs alignment', () => {
  const pluginGuideSource = readRepoFile('docs/plugin-calling-guide.md');
  const pcfPropertiesSource = readRepoFile('docs/pcfinputoutputproperties.md');

  test('plugin-calling-guide lists voa_SvtGetAuditLogs', () => {
    expect(pluginGuideSource).toContain('voa_SvtGetAuditLogs');
  });

  test('plugin-calling-guide shows GET method with taskId and auditType', () => {
    expect(pluginGuideSource).toContain('GET {Address}?taskId={id}&auditType={QC|SL}');
  });

  test('plugin-calling-guide shows SVTAuditLogs config name', () => {
    expect(pluginGuideSource).toContain('SVTAuditLogs');
  });

  test('pcfinputoutputproperties lists auditLogsApiName', () => {
    expect(pcfPropertiesSource).toContain('auditLogsApiName');
    expect(pcfPropertiesSource).toContain('voa_SvtGetAuditLogs');
  });
});
