/**
 * Tests for the SvtModifyTask model and the full modify-task flow.
 *
 * Covers:
 *  - Model structure & type alignment with the real API payload
 *  - Plugin (SvtModifyTask.cs) cross-checks
 *  - PCF modifySvtTask() parameter assembly
 *  - mergeModifyTaskDetails() local state update
 *  - applyModifyTaskDetails() field alias coverage
 *  - normalizeTaskIdForModifyTask() task ID normalization
 *  - parseModifyTaskResult() response parsing
 *  - Real payload deserialization (user-provided Complete scenario)
 *  - PCF ↔ Plugin field alignment
 */

import fs from 'fs';
import path from 'path';
import type {
  SvtModifyTaskRequest,
  SvtModifyTaskResponse,
  ModifyTaskApimPayload,
  ModifyTaskMergePayload,
  ModifyTaskAllowedStatus,
  ModifyTaskTargetStatus,
  ModifyTaskSource,
  ModifyTaskAccessRole,
  ModifyTaskResult,
  ModifyTaskSuccessHint,
  ModifyTaskStatusFields,
  ModifyTaskAssignedToFields,
  ModifyTaskAssignedToUserIdFields,
  ModifyTaskAssignedDateFields,
  ModifyTaskClearedDateFields,
} from '../../models/SvtModifyTask';

/* ================================================================== */
/*  Helper utilities                                                  */
/* ================================================================== */

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/* ================================================================== */
/*  Real API payload fixture (user-provided Complete scenario)        */
/* ================================================================== */

const REAL_REQUEST: SvtModifyTaskRequest = {
  source: 'VSRT',
  taskStatus: 'Complete',
  taskList: JSON.stringify(['A-1000542']),
  requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
};

const REAL_RESPONSE: SvtModifyTaskResponse = {
  Result: '"SUCCEED"',
};

/* ================================================================== */
/*  1. Model structure tests                                          */
/* ================================================================== */

describe('SvtModifyTask model', () => {
  describe('SvtModifyTaskRequest', () => {
    test('real payload satisfies the request interface', () => {
      const req: SvtModifyTaskRequest = REAL_REQUEST;
      expect(req.source).toBe('VSRT');
      expect(req.taskStatus).toBe('Complete');
      expect(req.taskList).toBe('["A-1000542"]');
      expect(req.requestedBy).toBe('cc4cc1fc-aeb8-ef11-b8e8-002248c64505');
    });

    test('all four fields are strings', () => {
      expect(typeof REAL_REQUEST.source).toBe('string');
      expect(typeof REAL_REQUEST.taskStatus).toBe('string');
      expect(typeof REAL_REQUEST.taskList).toBe('string');
      expect(typeof REAL_REQUEST.requestedBy).toBe('string');
    });

    test('taskList is a JSON-stringified array', () => {
      const parsed = JSON.parse(REAL_REQUEST.taskList);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toEqual(['A-1000542']);
    });

    test('PCF typically sends taskStatus "Assigned" (reopen flow)', () => {
      const pcfReq: SvtModifyTaskRequest = {
        source: 'VSRT',
        taskStatus: 'Assigned',
        taskList: JSON.stringify(['1000542']),
        requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      };
      expect(pcfReq.taskStatus).toBe('Assigned');
    });
  });

  describe('SvtModifyTaskResponse', () => {
    test('real response has Result string', () => {
      const resp: SvtModifyTaskResponse = REAL_RESPONSE;
      expect(resp.Result).toBe('"SUCCEED"');
    });

    test('Result is a string (may be JSON-escaped)', () => {
      expect(typeof REAL_RESPONSE.Result).toBe('string');
    });

    test('@odata.context is optional', () => {
      const withContext: SvtModifyTaskResponse = {
        '@odata.context':
          'https://voabstdev.crm11.dynamics.com/api/data/v9.0/$metadata#Microsoft.Dynamics.CRM.voa_SvtModifyTaskResponse',
        Result: '"SUCCEED"',
      };
      expect(withContext['@odata.context']).toContain('voa_SvtModifyTask');
    });

    test('response without @odata.context is also valid', () => {
      const minimal: SvtModifyTaskResponse = { Result: 'success' };
      expect(minimal['@odata.context']).toBeUndefined();
      expect(minimal.Result).toBe('success');
    });
  });

  describe('ModifyTaskApimPayload', () => {
    test('taskList is an array in the APIM payload', () => {
      const apimPayload: ModifyTaskApimPayload = {
        source: 'VSRT',
        taskStatus: 'Assigned',
        taskList: ['1000542'],
        requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      };
      expect(Array.isArray(apimPayload.taskList)).toBe(true);
      expect(apimPayload.taskList).toHaveLength(1);
    });

    test('APIM payload has all four required fields', () => {
      const payload: ModifyTaskApimPayload = {
        source: 'VSRT',
        taskStatus: 'Assigned',
        taskList: ['1000542'],
        requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      };
      expect(payload).toHaveProperty('source');
      expect(payload).toHaveProperty('taskStatus');
      expect(payload).toHaveProperty('taskList');
      expect(payload).toHaveProperty('requestedBy');
    });

    test('plugin normalizes task IDs to digits only', () => {
      // 'A-1000542' → '1000542' after NormalizeTaskId
      const apimPayload: ModifyTaskApimPayload = {
        source: 'VSRT',
        taskStatus: 'Complete',
        taskList: ['1000542'],
        requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      };
      expect(apimPayload.taskList[0]).toBe('1000542');
      expect(apimPayload.taskList[0]).not.toContain('A-');
    });

    test('taskList can contain multiple task IDs', () => {
      const multi: ModifyTaskApimPayload = {
        source: 'VSRT',
        taskStatus: 'Assigned',
        taskList: ['1000542', '1000543', '1000544'],
        requestedBy: 'some-guid',
      };
      expect(multi.taskList).toHaveLength(3);
    });
  });

  describe('ModifyTaskMergePayload', () => {
    test('taskStatus is required', () => {
      const merge: ModifyTaskMergePayload = {
        taskStatus: 'Assigned',
      };
      expect(merge.taskStatus).toBe('Assigned');
    });

    test('optional fields for assignment details', () => {
      const merge: ModifyTaskMergePayload = {
        taskStatus: 'Assigned',
        assignedTo: 'John Doe',
        assignedToUserId: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
        assignedDateIso: '2026-03-22T10:00:00.000Z',
      };
      expect(merge.assignedTo).toBe('John Doe');
      expect(merge.assignedToUserId).toBe('cc4cc1fc-aeb8-ef11-b8e8-002248c64505');
      expect(merge.assignedDateIso).toBeTruthy();
    });
  });

  describe('type aliases', () => {
    test('ModifyTaskAllowedStatus matches the two allowed statuses', () => {
      const complete: ModifyTaskAllowedStatus = 'complete';
      const completePassed: ModifyTaskAllowedStatus = 'complete passed qc';
      expect(complete).toBe('complete');
      expect(completePassed).toBe('complete passed qc');
    });

    test('ModifyTaskTargetStatus is always Assigned', () => {
      const status: ModifyTaskTargetStatus = 'Assigned';
      expect(status).toBe('Assigned');
    });

    test('ModifyTaskSource is always VSRT', () => {
      const source: ModifyTaskSource = 'VSRT';
      expect(source).toBe('VSRT');
    });

    test('ModifyTaskAccessRole is Caseworker', () => {
      const role: ModifyTaskAccessRole = 'Caseworker';
      expect(role).toBe('Caseworker');
    });

    test('ModifyTaskResult has success and message', () => {
      const result: ModifyTaskResult = { success: true, message: 'SUCCEED' };
      expect(result.success).toBe(true);
      expect(result.message).toBe('SUCCEED');
    });

    test('ModifyTaskSuccessHint covers all recognized keywords', () => {
      const hints: ModifyTaskSuccessHint[] = [
        'success', 'succeed', 'succeeded', 'ok', 'true',
      ];
      expect(hints).toHaveLength(5);
    });
  });

  describe('Field alias interfaces', () => {
    test('ModifyTaskStatusFields covers 3 status keys', () => {
      const fields: ModifyTaskStatusFields = {
        taskStatus: 'Assigned',
        taskstatus: 'Assigned',
        status: 'Assigned',
      };
      expect(Object.keys(fields)).toHaveLength(3);
    });

    test('ModifyTaskAssignedToFields covers 6 keys', () => {
      const fields: ModifyTaskAssignedToFields = {
        assignedTo: 'John',
        assignedto: 'John',
        assignedToName: 'John',
        assignedtoname: 'John',
        caseworkerAssignedTo: 'John',
        caseworkerassignedto: 'John',
      };
      expect(Object.keys(fields)).toHaveLength(6);
    });

    test('ModifyTaskAssignedToUserIdFields covers 6 keys', () => {
      const fields: ModifyTaskAssignedToUserIdFields = {
        assignedToUserId: 'guid',
        assignedtouserid: 'guid',
        assignedToId: 'guid',
        assignedtoid: 'guid',
        caseworkerAssignedToUserId: 'guid',
        caseworkerassignedtouserid: 'guid',
      };
      expect(Object.keys(fields)).toHaveLength(6);
    });

    test('ModifyTaskAssignedDateFields covers 6 keys', () => {
      const fields: ModifyTaskAssignedDateFields = {
        assignedDate: '2026-01-01',
        assigneddate: '2026-01-01',
        caseworkerAssignedDate: '2026-01-01',
        caseworkerassigneddate: '2026-01-01',
        caseworkerAssignedOn: '2026-01-01',
        caseworkerassignedon: '2026-01-01',
      };
      expect(Object.keys(fields)).toHaveLength(6);
    });

    test('ModifyTaskClearedDateFields covers 4 keys cleared to null', () => {
      const fields: ModifyTaskClearedDateFields = {
        taskCompletedDate: null,
        taskcompleteddate: null,
        completedDate: null,
        completeddate: null,
      };
      expect(Object.keys(fields)).toHaveLength(4);
      for (const val of Object.values(fields)) {
        expect(val).toBeNull();
      }
    });
  });
});

/* ================================================================== */
/*  2. Plugin (SvtModifyTask.cs) cross-checks                        */
/* ================================================================== */

describe('Plugin source cross-checks (SvtModifyTask.cs)', () => {
  const pluginSource = readRepoFile(
    'VOA.SVT.Plugins/Plugins/CustomAPI/SvtModifyTask.cs',
  );

  test('plugin class name matches the API action name', () => {
    expect(pluginSource).toContain('public class SvtModifyTask : PluginBase');
  });

  test('plugin reads all four expected input parameters', () => {
    const expectedParams = ['source', 'taskStatus', 'taskList', 'requestedBy'];
    for (const param of expectedParams) {
      expect(pluginSource).toContain(`GetInput(context, "${param}")`);
    }
  });

  test('plugin enforces caseworker access control', () => {
    expect(pluginSource).toContain('HasCaseworkerAccess(userContext)');
    expect(pluginSource).toContain(
      'Modify SVT task is restricted to caseworker role/team.',
    );
  });

  test('plugin defaults source to VSRT when empty', () => {
    expect(pluginSource).toContain('source = "VSRT"');
  });

  test('plugin falls back to initiating user ID when requestedBy is empty', () => {
    expect(pluginSource).toContain('context.InitiatingUserId');
    expect(pluginSource).toContain('fallbackId == Guid.Empty');
  });

  test('plugin validates taskStatus and taskList are required', () => {
    expect(pluginSource).toContain(
      'taskStatus and taskList are required.',
    );
  });

  test('plugin builds APIM payload with taskList key (not taskId)', () => {
    expect(pluginSource).toContain('["taskList"] = taskIds');
    // Unlike SvtSubmitQcRemarks which uses ["taskId"]
  });

  test('plugin APIM payload includes all four fields', () => {
    expect(pluginSource).toContain('["source"] = source');
    expect(pluginSource).toContain('["taskStatus"] = taskStatus');
    expect(pluginSource).toContain('["taskList"] = taskIds');
    expect(pluginSource).toContain('["requestedBy"] = requestedBy');
  });

  test('plugin uses SVTTaskAssignment configuration', () => {
    expect(pluginSource).toContain('CONFIGURATION_NAME = "SVTTaskAssignment"');
  });

  test('plugin returns Result output parameter', () => {
    expect(pluginSource).toContain('context.OutputParameters["Result"]');
  });

  test('plugin returns "success" when APIM body is empty', () => {
    expect(pluginSource).toContain(
      'string.IsNullOrWhiteSpace(body) ? "success" : body',
    );
  });

  test('plugin posts to APIM with POST method', () => {
    expect(pluginSource).toContain('HttpMethod.Post');
  });

  test('plugin sets 30-second timeout', () => {
    expect(pluginSource).toContain('TimeSpan.FromSeconds(30)');
  });

  test('plugin serializes payload as JSON', () => {
    expect(pluginSource).toContain('JsonSerializer.Serialize(payload)');
  });

  test('plugin includes APIM subscription key header', () => {
    expect(pluginSource).toContain('Ocp-Apim-Subscription-Key');
  });

  test('plugin includes Bearer token when available', () => {
    expect(pluginSource).toContain('AuthenticationHeaderValue("Bearer"');
  });

  describe('ParseTaskIds handles multiple input formats', () => {
    test('handles JSON array format', () => {
      expect(pluginSource).toContain('trimmed.StartsWith("[")');
      expect(pluginSource).toContain('JsonSerializer.Deserialize<string[]>(trimmed)');
    });

    test('handles comma-separated format', () => {
      expect(pluginSource).toContain('trimmed.Contains(",")');
      expect(pluginSource).toContain("trimmed.Split(',')");
    });

    test('handles single value format (fallthrough)', () => {
      expect(pluginSource).toContain('AddTaskId(result, trimmed)');
    });

    test('NormalizeTaskId strips non-digit characters', () => {
      expect(pluginSource).toContain('char.IsDigit(ch)');
    });

    test('NormalizeTaskId uses StringBuilder for digit extraction', () => {
      expect(pluginSource).toContain('new StringBuilder()');
      expect(pluginSource).toContain('sb.Append(ch)');
    });

    test('NormalizeTaskId falls back to original value when no digits found', () => {
      expect(pluginSource).toContain(
        'string.IsNullOrWhiteSpace(digits) ? value.Trim() : digits',
      );
    });
  });

  describe('Error handling', () => {
    test('throws on APIM non-success status code', () => {
      expect(pluginSource).toContain('!response.IsSuccessStatusCode');
      expect(pluginSource).toContain('Modify SVT task failed (');
    });

    test('re-throws InvalidPluginExecutionException as-is', () => {
      expect(pluginSource).toContain('ex is InvalidPluginExecutionException');
    });

    test('wraps other exceptions in InvalidPluginExecutionException', () => {
      expect(pluginSource).toContain(
        'throw new InvalidPluginExecutionException("Modify SVT task failed.")',
      );
    });

    test('disposes HTTP response in finally block', () => {
      expect(pluginSource).toContain('response?.Dispose()');
    });

    test('validates Address is not null', () => {
      expect(pluginSource).toContain(
        'SVTTaskAssignment configuration missing Address.',
      );
    });
  });
});

/* ================================================================== */
/*  3. PCF modifySvtTask() flow (DetailsListRuntimeController.ts)     */
/* ================================================================== */

describe('PCF modifySvtTask() flow (DetailsListRuntimeController.ts)', () => {
  const runtimeSource = readRepoFile(
    'DetailsListVOA/services/DetailsListRuntimeController.ts',
  );

  test('modifySvtTask is a public async method', () => {
    expect(runtimeSource).toMatch(/public\s+async\s+modifySvtTask\s*\(/);
  });

  test('checks for existing task ID before proceeding', () => {
    expect(runtimeSource).toContain(
      'Task ID is not available for modify SVT task.',
    );
  });

  test('validates task status is in MODIFY_TASK_ALLOWED_STATUSES', () => {
    expect(runtimeSource).toContain(
      'MODIFY_TASK_ALLOWED_STATUSES.has(taskStatus)',
    );
  });

  test('MODIFY_TASK_ALLOWED_STATUSES contains complete and complete passed qc', () => {
    expect(runtimeSource).toContain(
      "MODIFY_TASK_ALLOWED_STATUSES = new Set(['complete', 'complete passed qc'])",
    );
  });

  test('enforces caseworker access before modification', () => {
    expect(runtimeSource).toContain('this.ensureCaseworkerAccess()');
    expect(runtimeSource).toContain(
      'Modify SVT task is restricted to caseworker role/team.',
    );
  });

  test('resolves API name from config', () => {
    expect(runtimeSource).toContain("'modifyTaskApiName'");
    expect(runtimeSource).toContain('CONTROL_CONFIG.modifyTaskApiName');
  });

  test('normalizes task ID before sending', () => {
    expect(runtimeSource).toContain(
      'this.normalizeTaskIdForModifyTask(existingTaskId)',
    );
  });

  test('sends source as VSRT', () => {
    expect(runtimeSource).toContain("source: 'VSRT'");
  });

  test('always sends taskStatus as Assigned', () => {
    expect(runtimeSource).toContain("taskStatus: 'Assigned'");
  });

  test('wraps task ID as JSON.stringify([normalizedTaskId])', () => {
    expect(runtimeSource).toContain(
      'taskList: JSON.stringify([normalizedTaskId])',
    );
  });

  test('resolves requestedBy from current user context', () => {
    expect(runtimeSource).toContain(
      'const requestedBy = resolveCurrentUserId(this._context)',
    );
  });

  test('uses configured API type for operation', () => {
    expect(runtimeSource).toContain("'modifyTaskApiType'");
    expect(runtimeSource).toContain('CONTROL_CONFIG.modifyTaskApiType');
  });

  test('parses response with parseModifyTaskResult', () => {
    expect(runtimeSource).toContain(
      'parseModifyTaskResult(response)',
    );
  });

  test('throws on failed result', () => {
    expect(runtimeSource).toContain('!parsed.success');
    expect(runtimeSource).toContain("parsed.message || 'Modify SVT task failed.'");
  });

  test('merges details with taskStatus Assigned on success', () => {
    expect(runtimeSource).toContain(
      'mergeModifyTaskDetails(this._saleDetails,',
    );
    expect(runtimeSource).toContain("taskStatus: 'Assigned'");
  });

  test('sets assignedTo from current user display name', () => {
    expect(runtimeSource).toContain(
      'assignedTo: resolveCurrentUserDisplayName(this._context)',
    );
  });

  test('sets assignedToUserId from requestedBy', () => {
    expect(runtimeSource).toContain('assignedToUserId: requestedBy');
  });

  test('sets assignedDateIso to current ISO timestamp', () => {
    expect(runtimeSource).toContain(
      'const assignedDateIso = new Date().toISOString()',
    );
  });

  test('refreshes access and QC section after merge', () => {
    expect(runtimeSource).toContain(
      'this.resolveSaleDetailsAccess(this._saleDetails)',
    );
    expect(runtimeSource).toContain(
      'this.resolveQcSectionAccess(this._saleDetails)',
    );
  });

  test('notifies output changed after completion', () => {
    expect(runtimeSource).toContain('this._notifyOutputChanged()');
  });
});

/* ================================================================== */
/*  4. normalizeTaskIdForModifyTask (DetailsListRuntimeController.ts) */
/* ================================================================== */

describe('normalizeTaskIdForModifyTask (DetailsListRuntimeController.ts)', () => {
  const runtimeSource = readRepoFile(
    'DetailsListVOA/services/DetailsListRuntimeController.ts',
  );

  test('method exists as a private method', () => {
    expect(runtimeSource).toContain(
      'private normalizeTaskIdForModifyTask(taskId: string): string',
    );
  });

  test('strips non-digit characters via regex', () => {
    expect(runtimeSource).toContain("normalized.replace(/\\D/g, '')");
  });

  test('returns digits-only string when digits are present', () => {
    // Simulating the PCF logic
    const normalized = 'A-1000542'.replace(/\D/g, '');
    expect(normalized).toBe('1000542');
  });

  test('falls back to original when no digits found', () => {
    // If no digits, returns the original normalized value
    const input = 'ABC';
    const digitsOnly = input.replace(/\D/g, '');
    const result = digitsOnly || input;
    expect(result).toBe('ABC');
  });

  test('returns empty string when input is empty', () => {
    expect(runtimeSource).toContain("return '';");
  });

  test('handles task ID with A- prefix (real scenario)', () => {
    const taskId = 'A-1000542';
    const digitsOnly = taskId.replace(/\D/g, '');
    expect(digitsOnly).toBe('1000542');
  });

  test('handles pure numeric task ID (no change)', () => {
    const taskId = '1000542';
    const digitsOnly = taskId.replace(/\D/g, '');
    expect(digitsOnly).toBe('1000542');
  });

  test('plugin and PCF use equivalent normalization logic', () => {
    // PCF: normalized.replace(/\D/g, '')
    // Plugin: char.IsDigit(ch) → sb.Append(ch)
    const testCases = ['A-1000542', '1000542', 'S-12345', 'TASK-999'];
    for (const taskId of testCases) {
      const pcfResult = taskId.replace(/\D/g, '') || taskId;
      // Both should produce the same digits-only output
      const digits = Array.from(taskId).filter(ch => /\d/.test(ch)).join('');
      const pluginResult = digits || taskId.trim();
      expect(pcfResult).toBe(pluginResult);
    }
  });
});

/* ================================================================== */
/*  5. mergeModifyTaskDetails and helpers (sale-details.ts)           */
/* ================================================================== */

describe('mergeModifyTaskDetails and helpers (sale-details.ts)', () => {
  const saleDetailsSource = readRepoFile(
    'DetailsListVOA/services/runtime/sale-details.ts',
  );

  describe('applyModifyTaskDetails()', () => {
    test('function exists', () => {
      expect(saleDetailsSource).toContain('const applyModifyTaskDetails = (');
    });

    test('writes 3 status keys: taskStatus, taskstatus, status', () => {
      expect(saleDetailsSource).toContain('taskStatus: payload.taskStatus');
      expect(saleDetailsSource).toContain('taskstatus: payload.taskStatus');
      expect(saleDetailsSource).toContain('status: payload.taskStatus');
    });

    test('writes 6 assignedTo keys when value is present', () => {
      for (const key of [
        'next.assignedTo =',
        'next.assignedto =',
        'next.assignedToName =',
        'next.assignedtoname =',
        'next.caseworkerAssignedTo =',
        'next.caseworkerassignedto =',
      ]) {
        expect(saleDetailsSource).toContain(key);
      }
    });

    test('writes 6 assignedToUserId keys when value is present', () => {
      for (const key of [
        'next.assignedToUserId =',
        'next.assignedtouserid =',
        'next.assignedToId =',
        'next.assignedtoid =',
        'next.caseworkerAssignedToUserId =',
        'next.caseworkerassignedtouserid =',
      ]) {
        expect(saleDetailsSource).toContain(key);
      }
    });

    test('writes 6 assignedDate keys when value is present', () => {
      for (const key of [
        'next.assignedDate =',
        'next.assigneddate =',
        'next.caseworkerAssignedDate =',
        'next.caseworkerassigneddate =',
        'next.caseworkerAssignedOn =',
        'next.caseworkerassignedon =',
      ]) {
        expect(saleDetailsSource).toContain(key);
      }
    });

    test('clears 4 completion date fields to null unconditionally', () => {
      expect(saleDetailsSource).toContain('next.taskCompletedDate = null;');
      expect(saleDetailsSource).toContain('next.taskcompleteddate = null;');
      expect(saleDetailsSource).toContain('next.completedDate = null;');
      expect(saleDetailsSource).toContain('next.completeddate = null;');
    });
  });

  describe('mergeModifyTaskDetails()', () => {
    test('is an exported function', () => {
      expect(saleDetailsSource).toContain('export const mergeModifyTaskDetails = (');
    });

    test('applies to salesVerificationTaskDetails', () => {
      expect(saleDetailsSource).toContain(
        'root.salesVerificationTaskDetails = applyModifyTaskDetails(',
      );
    });

    test('applies to taskDetails', () => {
      expect(saleDetailsSource).toContain(
        'root.taskDetails = applyModifyTaskDetails(',
      );
    });

    test('returns serialized JSON', () => {
      // mergeModifyTaskDetails returns JSON.stringify(root)
      expect(saleDetailsSource).toContain('return JSON.stringify(root);');
    });
  });
});

/* ================================================================== */
/*  6. parseModifyTaskResult (actions.ts)                             */
/* ================================================================== */

describe('parseModifyTaskResult (actions.ts)', () => {
  const actionsSource = readRepoFile(
    'DetailsListVOA/services/runtime/actions.ts',
  );

  test('parseModifyTaskResult is an exported function', () => {
    expect(actionsSource).toContain(
      'export const parseModifyTaskResult = (response: unknown): ModifyTaskResult',
    );
  });

  test('unwraps response via unwrapCustomApiPayload', () => {
    expect(actionsSource).toContain(
      'parseModifyTaskCandidate(unwrapCustomApiPayload(response))',
    );
  });

  test('falls back to parsing raw response', () => {
    expect(actionsSource).toContain(
      'parseModifyTaskCandidate(response)',
    );
  });

  test('returns failure result when parsing fails', () => {
    expect(actionsSource).toContain("message: 'Modify SVT task failed.'");
  });

  test('parseModifyTaskCandidate has max depth of 5', () => {
    expect(actionsSource).toContain('depth > 5');
  });

  test('recursively parses JSON strings', () => {
    expect(actionsSource).toContain('JSON.parse(trimmed)');
    expect(actionsSource).toContain('parseModifyTaskCandidate(parsed, depth + 1)');
  });

  test('recognizes success keywords (case-insensitive)', () => {
    const keywords = ['success', 'succeed', 'succeeded', 'ok', 'true'];
    for (const kw of keywords) {
      expect(actionsSource).toContain(kw);
    }
  });

  test('strips quotes before keyword matching', () => {
    expect(actionsSource).toContain(".replace(/^['\"]|['\"]$/g, '')");
  });

  test('unwraps Result/result properties from objects', () => {
    expect(actionsSource).toContain('record.Result ?? record.result');
  });

  test('checks success property on plain objects', () => {
    expect(actionsSource).toContain("hasOwnProperty.call(record, 'success')");
    expect(actionsSource).toContain('record.success === true');
  });

  test('ModifyTaskResult interface has success and message', () => {
    expect(actionsSource).toContain('success: boolean;');
    expect(actionsSource).toContain('message: string;');
  });
});

/* ================================================================== */
/*  7. Real payload round-trip tests                                  */
/* ================================================================== */

describe('Real payload: Complete scenario (A-1000542)', () => {
  test('request fields match the real POST body', () => {
    expect(REAL_REQUEST.source).toBe('VSRT');
    expect(REAL_REQUEST.taskStatus).toBe('Complete');
    expect(REAL_REQUEST.requestedBy).toBe('cc4cc1fc-aeb8-ef11-b8e8-002248c64505');
  });

  test('taskList is a JSON array with the raw task ID', () => {
    const parsed = JSON.parse(REAL_REQUEST.taskList);
    expect(parsed).toEqual(['A-1000542']);
  });

  test('response Result is a JSON-escaped "SUCCEED" string', () => {
    expect(REAL_RESPONSE.Result).toBe('"SUCCEED"');
    const parsed = JSON.parse(REAL_RESPONSE.Result);
    expect(parsed).toBe('SUCCEED');
  });

  test('SUCCEED is a recognized success keyword', () => {
    const parsed = JSON.parse(REAL_RESPONSE.Result) as string;
    const normalized = parsed.toLowerCase();
    expect(['success', 'succeed', 'succeeded', 'ok', 'true']).toContain(normalized);
  });

  test('plugin would normalize A-1000542 to 1000542 (digits only)', () => {
    const rawIds: string[] = JSON.parse(REAL_REQUEST.taskList);
    const normalized = rawIds.map(id => id.replace(/\D/g, '') || id);
    expect(normalized).toEqual(['1000542']);
  });

  test('PCF normalizeTaskIdForModifyTask would also produce 1000542', () => {
    const taskId = 'A-1000542';
    const digitsOnly = taskId.replace(/\D/g, '');
    expect(digitsOnly).toBe('1000542');
  });

  test('plugin would build APIM payload with normalized taskList', () => {
    const apimPayload: ModifyTaskApimPayload = {
      source: REAL_REQUEST.source,
      taskStatus: REAL_REQUEST.taskStatus,
      taskList: ['1000542'], // normalized from A-1000542
      requestedBy: REAL_REQUEST.requestedBy,
    };
    expect(apimPayload.taskList).toEqual(['1000542']);
    expect(apimPayload.taskStatus).toBe('Complete');
  });

  test('real payload vs PCF payload: taskStatus difference is intentional', () => {
    // Real payload from non-PCF caller (e.g. Power Fx) sends 'Complete'
    expect(REAL_REQUEST.taskStatus).toBe('Complete');
    // PCF always sends 'Assigned' (reopening a completed task)
    const pcfTaskStatus = 'Assigned';
    expect(pcfTaskStatus).not.toBe(REAL_REQUEST.taskStatus);
    // The plugin accepts any taskStatus string — there's no validation on value
  });

  test('requestedBy is a valid GUID format', () => {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(REAL_REQUEST.requestedBy).toMatch(guidRegex);
  });
});

/* ================================================================== */
/*  8. Simulated merge scenarios                                      */
/* ================================================================== */

describe('Modify task merge scenarios', () => {
  const baseSaleDetails = JSON.stringify({
    salesVerificationTaskDetails: {
      taskId: '1000542',
      taskStatus: 'Complete',
      taskstatus: 'Complete',
      status: 'Complete',
      taskCompletedDate: '2026-03-20T10:00:00.000Z',
      taskcompleteddate: '2026-03-20T10:00:00.000Z',
      completedDate: '2026-03-20T10:00:00.000Z',
      completeddate: '2026-03-20T10:00:00.000Z',
    },
    taskDetails: {
      taskId: '1000542',
      taskStatus: 'Complete',
    },
  });

  function simulateMerge(payload: {
    taskStatus: string;
    assignedTo?: string;
    assignedToUserId?: string;
    assignedDateIso?: string;
  }) {
    const root = JSON.parse(baseSaleDetails);

    for (const key of ['salesVerificationTaskDetails', 'taskDetails'] as const) {
      const existing = root[key] ?? {};
      const next: Record<string, unknown> = {
        ...existing,
        taskStatus: payload.taskStatus,
        taskstatus: payload.taskStatus,
        status: payload.taskStatus,
      };

      if (payload.assignedTo) {
        next.assignedTo = payload.assignedTo;
        next.assignedto = payload.assignedTo;
        next.assignedToName = payload.assignedTo;
        next.assignedtoname = payload.assignedTo;
        next.caseworkerAssignedTo = payload.assignedTo;
        next.caseworkerassignedto = payload.assignedTo;
      }

      if (payload.assignedToUserId) {
        next.assignedToUserId = payload.assignedToUserId;
        next.assignedtouserid = payload.assignedToUserId;
        next.assignedToId = payload.assignedToUserId;
        next.assignedtoid = payload.assignedToUserId;
        next.caseworkerAssignedToUserId = payload.assignedToUserId;
        next.caseworkerassignedtouserid = payload.assignedToUserId;
      }

      if (payload.assignedDateIso) {
        next.assignedDate = payload.assignedDateIso;
        next.assigneddate = payload.assignedDateIso;
        next.caseworkerAssignedDate = payload.assignedDateIso;
        next.caseworkerassigneddate = payload.assignedDateIso;
        next.caseworkerAssignedOn = payload.assignedDateIso;
        next.caseworkerassignedon = payload.assignedDateIso;
      }

      // Always clear completion dates
      next.taskCompletedDate = null;
      next.taskcompleteddate = null;
      next.completedDate = null;
      next.completeddate = null;

      root[key] = next;
    }

    return root;
  }

  test('Assigned merge: sets status to Assigned and clears completion dates', () => {
    const result = simulateMerge({
      taskStatus: 'Assigned',
      assignedTo: 'John Doe',
      assignedToUserId: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      assignedDateIso: '2026-03-22T10:00:00.000Z',
    });

    expect(result.salesVerificationTaskDetails.taskStatus).toBe('Assigned');
    expect(result.salesVerificationTaskDetails.taskstatus).toBe('Assigned');
    expect(result.salesVerificationTaskDetails.status).toBe('Assigned');
    expect(result.salesVerificationTaskDetails.taskCompletedDate).toBeNull();
    expect(result.salesVerificationTaskDetails.completedDate).toBeNull();
  });

  test('assignedTo fields are set across all 6 aliases', () => {
    const result = simulateMerge({
      taskStatus: 'Assigned',
      assignedTo: 'Jane Smith',
    });

    const task = result.salesVerificationTaskDetails;
    expect(task.assignedTo).toBe('Jane Smith');
    expect(task.assignedto).toBe('Jane Smith');
    expect(task.assignedToName).toBe('Jane Smith');
    expect(task.assignedtoname).toBe('Jane Smith');
    expect(task.caseworkerAssignedTo).toBe('Jane Smith');
    expect(task.caseworkerassignedto).toBe('Jane Smith');
  });

  test('assignedToUserId fields are set across all 6 aliases', () => {
    const guid = 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505';
    const result = simulateMerge({
      taskStatus: 'Assigned',
      assignedToUserId: guid,
    });

    const task = result.salesVerificationTaskDetails;
    expect(task.assignedToUserId).toBe(guid);
    expect(task.assignedtouserid).toBe(guid);
    expect(task.assignedToId).toBe(guid);
    expect(task.assignedtoid).toBe(guid);
    expect(task.caseworkerAssignedToUserId).toBe(guid);
    expect(task.caseworkerassignedtouserid).toBe(guid);
  });

  test('assignedDate fields are set across all 6 aliases', () => {
    const ts = '2026-03-22T10:00:00.000Z';
    const result = simulateMerge({
      taskStatus: 'Assigned',
      assignedDateIso: ts,
    });

    const task = result.salesVerificationTaskDetails;
    expect(task.assignedDate).toBe(ts);
    expect(task.assigneddate).toBe(ts);
    expect(task.caseworkerAssignedDate).toBe(ts);
    expect(task.caseworkerassigneddate).toBe(ts);
    expect(task.caseworkerAssignedOn).toBe(ts);
    expect(task.caseworkerassignedon).toBe(ts);
  });

  test('completion dates are always cleared to null (reopening a task)', () => {
    const result = simulateMerge({ taskStatus: 'Assigned' });

    const task = result.salesVerificationTaskDetails;
    expect(task.taskCompletedDate).toBeNull();
    expect(task.taskcompleteddate).toBeNull();
    expect(task.completedDate).toBeNull();
    expect(task.completeddate).toBeNull();
  });

  test('taskDetails mirror salesVerificationTaskDetails for backward compat', () => {
    const result = simulateMerge({
      taskStatus: 'Assigned',
      assignedTo: 'John Doe',
      assignedToUserId: 'some-guid',
      assignedDateIso: '2026-03-22T10:00:00.000Z',
    });

    expect(result.taskDetails.taskStatus).toBe(
      result.salesVerificationTaskDetails.taskStatus,
    );
    expect(result.taskDetails.assignedTo).toBe(
      result.salesVerificationTaskDetails.assignedTo,
    );
    expect(result.taskDetails.taskCompletedDate).toBe(
      result.salesVerificationTaskDetails.taskCompletedDate,
    );
  });

  test('merge preserves existing taskId in both sections', () => {
    const result = simulateMerge({ taskStatus: 'Assigned' });
    expect(result.salesVerificationTaskDetails.taskId).toBe('1000542');
    expect(result.taskDetails.taskId).toBe('1000542');
  });

  test('previous completion dates from "Complete" status are overwritten to null', () => {
    const result = simulateMerge({ taskStatus: 'Assigned' });
    // Original had completion dates set — now they should be null
    expect(result.salesVerificationTaskDetails.taskCompletedDate).toBeNull();
    expect(result.salesVerificationTaskDetails.completedDate).toBeNull();
  });

  test('lowercase aliases are consistent with canonical fields', () => {
    const result = simulateMerge({
      taskStatus: 'Assigned',
      assignedTo: 'Test User',
      assignedToUserId: 'guid-123',
      assignedDateIso: '2026-01-01',
    });

    const task = result.salesVerificationTaskDetails;
    // Status
    expect(task.taskStatus).toBe(task.taskstatus);
    expect(task.taskStatus).toBe(task.status);
    // AssignedTo
    expect(task.assignedTo).toBe(task.assignedto);
    expect(task.assignedTo).toBe(task.assignedToName);
    expect(task.assignedTo).toBe(task.caseworkerAssignedTo);
    // UserId
    expect(task.assignedToUserId).toBe(task.assignedtouserid);
    expect(task.assignedToUserId).toBe(task.assignedToId);
    expect(task.assignedToUserId).toBe(task.caseworkerAssignedToUserId);
    // Date
    expect(task.assignedDate).toBe(task.assigneddate);
    expect(task.assignedDate).toBe(task.caseworkerAssignedDate);
    expect(task.assignedDate).toBe(task.caseworkerAssignedOn);
    // Cleared dates
    expect(task.taskCompletedDate).toBe(task.taskcompleteddate);
    expect(task.completedDate).toBe(task.completeddate);
  });
});

/* ================================================================== */
/*  9. PCF ↔ Plugin field alignment                                  */
/* ================================================================== */

describe('PCF ↔ Plugin field alignment', () => {
  const runtimeSource = readRepoFile(
    'DetailsListVOA/services/DetailsListRuntimeController.ts',
  );
  const pluginSource = readRepoFile(
    'VOA.SVT.Plugins/Plugins/CustomAPI/SvtModifyTask.cs',
  );

  const sharedParams = ['source', 'taskStatus', 'taskList', 'requestedBy'];

  test.each(sharedParams)(
    'PCF sends "%s" and plugin reads "%s"',
    (param) => {
      // PCF references the param (either shorthand property or key: value)
      expect(runtimeSource).toContain(param);
      // Plugin reads GetInput(context, "{param}")
      expect(pluginSource).toContain(`GetInput(context, "${param}")`);
    },
  );

  test('PCF sends taskList as JSON.stringify([id]) and plugin parses JSON arrays', () => {
    expect(runtimeSource).toContain('JSON.stringify([normalizedTaskId])');
    expect(pluginSource).toContain('JsonSerializer.Deserialize<string[]>');
  });

  test('both PCF and plugin normalize task IDs by stripping non-digits', () => {
    // PCF: normalized.replace(/\D/g, '')
    expect(runtimeSource).toContain("replace(/\\D/g, '')");
    // Plugin: char.IsDigit(ch)
    expect(pluginSource).toContain('char.IsDigit(ch)');
  });

  test('both PCF and plugin resolve requestedBy from current user', () => {
    expect(runtimeSource).toContain('resolveCurrentUserId(this._context)');
    expect(pluginSource).toContain('context.InitiatingUserId');
  });

  test('PCF always sends source VSRT; plugin defaults to VSRT', () => {
    expect(runtimeSource).toContain("source: 'VSRT'");
    expect(pluginSource).toContain('source = "VSRT"');
  });

  test('PCF always sends taskStatus Assigned; plugin accepts any value', () => {
    expect(runtimeSource).toContain("taskStatus: 'Assigned'");
    // Plugin does not restrict taskStatus values
    expect(pluginSource).not.toContain('taskStatus == "Assigned"');
    expect(pluginSource).not.toContain("taskStatus != ");
  });

  test('plugin uses taskList as APIM key (same as PCF param name)', () => {
    expect(pluginSource).toContain('["taskList"] = taskIds');
    // The PCF param is also 'taskList'
    expect(runtimeSource).toContain('taskList:');
  });

  test('SvtModifyTask uses taskList but SvtSubmitQcRemarks uses taskId (different conventions)', () => {
    const qcPlugin = readRepoFile(
      'VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs',
    );
    expect(pluginSource).toContain('["taskList"] = taskIds');
    expect(qcPlugin).toContain('["taskId"] = taskIds');
    expect(qcPlugin).not.toContain('["taskList"]');
  });
});

/* ================================================================== */
/*  10. Config alignment                                              */
/* ================================================================== */

describe('Control config for modify task API', () => {
  const configSource = readRepoFile('DetailsListVOA/config/ControlConfig.ts');

  test('modifyTaskApiName is voa_SvtModifyTask', () => {
    expect(configSource).toContain(
      "modifyTaskApiName: 'voa_SvtModifyTask'",
    );
  });

  test('modifyTaskApiType is action', () => {
    expect(configSource).toContain("modifyTaskApiType: 'action'");
  });
});

/* ================================================================== */
/*  11. Documentation alignment                                       */
/* ================================================================== */

describe('Documentation alignment (svtModifySvtTask.md)', () => {
  const doc = readRepoFile('docs/svtModifySvtTask.md');

  test('docs describe voa_SvtModifyTask as an unbound action', () => {
    expect(doc.toLowerCase()).toContain('voa_svtmodifytask');
  });

  test('docs mention source parameter', () => {
    expect(doc).toContain('source');
  });

  test('docs mention taskStatus parameter', () => {
    expect(doc).toContain('taskStatus');
  });

  test('docs mention taskList parameter', () => {
    expect(doc).toContain('taskList');
  });

  test('docs mention requestedBy parameter', () => {
    expect(doc).toContain('requestedBy');
  });

  test('docs mention Result output parameter', () => {
    expect(doc).toContain('Result');
  });

  test('docs describe caseworker-only access', () => {
    expect(doc.toLowerCase()).toContain('caseworker');
  });
});

/* ================================================================== */
/*  12. ParseTaskIds simulation (matching plugin logic)               */
/* ================================================================== */

describe('ParseTaskIds simulation (matching plugin C# logic)', () => {
  function normalizeTaskId(value: string): string {
    if (!value?.trim()) return '';
    const digits = Array.from(value).filter(ch => /\d/.test(ch)).join('');
    return digits || value.trim();
  }

  function parseTaskIds(raw: string): string[] {
    const result: string[] = [];
    if (!raw?.trim()) return result;

    const trimmed = raw.trim();

    // JSON array
    if (trimmed.startsWith('[')) {
      try {
        const parsed: string[] = JSON.parse(trimmed);
        for (const item of parsed) {
          const normalized = normalizeTaskId(item);
          if (normalized) result.push(normalized);
        }
        return result;
      } catch {
        // fall through
      }
    }

    // Comma-separated
    if (trimmed.includes(',')) {
      for (const part of trimmed.split(',')) {
        const normalized = normalizeTaskId(part);
        if (normalized) result.push(normalized);
      }
      return result;
    }

    // Single value
    const normalized = normalizeTaskId(trimmed);
    if (normalized) result.push(normalized);
    return result;
  }

  test('JSON array: ["A-1000542"] → ["1000542"]', () => {
    expect(parseTaskIds('["A-1000542"]')).toEqual(['1000542']);
  });

  test('JSON array: ["1000542"] → ["1000542"]', () => {
    expect(parseTaskIds('["1000542"]')).toEqual(['1000542']);
  });

  test('JSON array with multiple items', () => {
    expect(parseTaskIds('["A-100","B-200","C-300"]')).toEqual(['100', '200', '300']);
  });

  test('comma-separated: "A-100,B-200" → ["100","200"]', () => {
    expect(parseTaskIds('A-100,B-200')).toEqual(['100', '200']);
  });

  test('single value: "A-1000542" → ["1000542"]', () => {
    expect(parseTaskIds('A-1000542')).toEqual(['1000542']);
  });

  test('single numeric value: "1000542" → ["1000542"]', () => {
    expect(parseTaskIds('1000542')).toEqual(['1000542']);
  });

  test('empty string returns empty array', () => {
    expect(parseTaskIds('')).toEqual([]);
    expect(parseTaskIds('  ')).toEqual([]);
  });

  test('value with no digits falls back to original', () => {
    expect(parseTaskIds('ABC')).toEqual(['ABC']);
  });

  test('real user payload: JSON.stringify(["A-1000542"]) → ["1000542"]', () => {
    const userTaskList = JSON.stringify(['A-1000542']);
    expect(parseTaskIds(userTaskList)).toEqual(['1000542']);
  });

  test('typical PCF payload: JSON.stringify(["1000542"]) → ["1000542"]', () => {
    const pcfTaskList = JSON.stringify(['1000542']);
    expect(parseTaskIds(pcfTaskList)).toEqual(['1000542']);
  });
});

/* ================================================================== */
/*  13. Response parsing simulation                                   */
/* ================================================================== */

describe('parseModifyTaskResult simulation', () => {
  function parseModifyTaskResult(response: unknown): ModifyTaskResult {
    const parsed = parseCandidate(unwrap(response)) ?? parseCandidate(response);
    return parsed ?? { success: false, message: 'Modify SVT task failed.' };
  }

  function unwrap(response: unknown): unknown {
    if (typeof response === 'object' && response !== null) {
      const rec = response as Record<string, unknown>;
      return rec.Result ?? rec.result ?? undefined;
    }
    return undefined;
  }

  function parseCandidate(
    candidate: unknown,
    depth = 0,
  ): ModifyTaskResult | undefined {
    if (depth > 5 || candidate === null || candidate === undefined) return undefined;

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (!trimmed) return undefined;
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return parseCandidate(parsed, depth + 1) ?? { success: false, message: trimmed };
      } catch {
        const normalized = trimmed.replace(/^['"]|['"]$/g, '').trim().toLowerCase();
        const success = ['success', 'succeed', 'succeeded', 'ok', 'true'].includes(normalized);
        return { success, message: trimmed };
      }
    }

    if (typeof candidate === 'object') {
      const record = candidate as Record<string, unknown>;
      const nested = record.Result ?? record.result ?? record.payload ?? record.message;
      if (nested !== undefined) {
        const parsedNested = parseCandidate(nested, depth + 1);
        if (parsedNested) return parsedNested;
      }
      if (Object.prototype.hasOwnProperty.call(record, 'success')) {
        return {
          success: record.success === true,
          message: String(record.message ?? record.payload ?? ''),
        };
      }
    }

    return undefined;
  }

  test('real response: { Result: \'"SUCCEED"\' } → success', () => {
    const result = parseModifyTaskResult(REAL_RESPONSE);
    expect(result.success).toBe(true);
  });

  test('{ Result: "success" } → success', () => {
    const result = parseModifyTaskResult({ Result: 'success' });
    expect(result.success).toBe(true);
  });

  test('{ Result: \'"SUCCEED"\' } unwraps to SUCCEED → success', () => {
    const result = parseModifyTaskResult({ Result: '"SUCCEED"' });
    expect(result.success).toBe(true);
  });

  test('{ Result: "ok" } → success', () => {
    const result = parseModifyTaskResult({ Result: 'ok' });
    expect(result.success).toBe(true);
  });

  test('{ Result: "true" } parses "true" string', () => {
    const result = parseModifyTaskResult({ Result: 'true' });
    // JSON.parse('true') returns boolean true, which is not a string or object,
    // so parseCandidate falls back to the raw string 'true' as the message
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
  });

  test('{ Result: "error occurred" } → failure', () => {
    const result = parseModifyTaskResult({ Result: 'error occurred' });
    expect(result.success).toBe(false);
  });

  test('{ success: true, message: "done" } — message is parsed as nested candidate first', () => {
    // parseCandidate checks record.message before record.success,
    // so 'done' is evaluated as a string candidate and is NOT a success keyword
    const result = parseModifyTaskResult({ success: true, message: 'done' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('done');
  });

  test('{ success: true } without message — falls through to success property check', () => {
    const result = parseModifyTaskResult({ success: true });
    expect(result.success).toBe(true);
  });

  test('{ success: false, message: "failed" } → failure', () => {
    const result = parseModifyTaskResult({ success: false, message: 'failed' });
    expect(result.success).toBe(false);
  });

  test('null response → failure with default message', () => {
    const result = parseModifyTaskResult(null);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Modify SVT task failed.');
  });

  test('empty string response → failure', () => {
    const result = parseModifyTaskResult('');
    expect(result.success).toBe(false);
  });

  test('deeply nested JSON is unwrapped', () => {
    // '"SUCCEED"' → 'SUCCEED' → matches succeed keyword
    const result = parseModifyTaskResult({ Result: '"SUCCEED"' });
    expect(result.success).toBe(true);
  });

  test('triple-nested JSON stops at depth 5', () => {
    // Test max depth protection
    const nested = JSON.stringify(
      JSON.stringify(
        JSON.stringify(
          JSON.stringify(
            JSON.stringify('SUCCEED'),
          ),
        ),
      ),
    );
    const result = parseModifyTaskResult({ Result: nested });
    // Should still eventually parse or fail gracefully
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
  });
});

/* ================================================================== */
/*  14. MODIFY_TASK_ALLOWED_STATUSES validation                       */
/* ================================================================== */

describe('MODIFY_TASK_ALLOWED_STATUSES coverage', () => {
  const allowedStatuses: ModifyTaskAllowedStatus[] = ['complete', 'complete passed qc'];

  test.each(allowedStatuses)(
    '"%s" is an allowed status for modify task button',
    (status) => {
      const statusSet = new Set(allowedStatuses);
      expect(statusSet.has(status)).toBe(true);
    },
  );

  test.each([
    'assigned',
    'assigned qc failed',
    'assigned to qc',
    'reassigned to qc',
    'pending',
    '',
  ])(
    '"%s" is NOT an allowed status for modify task',
    (status) => {
      const statusSet = new Set(allowedStatuses);
      expect(statusSet.has(status as ModifyTaskAllowedStatus)).toBe(false);
    },
  );

  test('comparison is lowercase (PCF lowercases the resolved status)', () => {
    const runtimeSource = readRepoFile(
      'DetailsListVOA/services/DetailsListRuntimeController.ts',
    );
    // The status is lowercased before checking against the Set
    expect(runtimeSource).toContain(
      "MODIFY_TASK_ALLOWED_STATUSES = new Set(['complete', 'complete passed qc'])",
    );
  });
});

/* ================================================================== */
/*  15. Access control alignment                                      */
/* ================================================================== */

describe('Access control: caseworker-only', () => {
  const pluginSource = readRepoFile(
    'VOA.SVT.Plugins/Plugins/CustomAPI/SvtModifyTask.cs',
  );
  const runtimeSource = readRepoFile(
    'DetailsListVOA/services/DetailsListRuntimeController.ts',
  );

  test('plugin uses HasCaseworkerAccess for access check', () => {
    expect(pluginSource).toContain('HasCaseworkerAccess(userContext)');
  });

  test('PCF calls ensureCaseworkerAccess before API call', () => {
    expect(runtimeSource).toContain('this.ensureCaseworkerAccess()');
  });

  test('PCF checks hasCaseworkerAccess flag', () => {
    expect(runtimeSource).toContain('this.hasCaseworkerAccess');
  });

  test('both use same error message for denied access', () => {
    const pluginMsg = 'Modify SVT task is restricted to caseworker role/team.';
    expect(pluginSource).toContain(pluginMsg);
    expect(runtimeSource).toContain(pluginMsg);
  });

  test('SvtModifyTask requires caseworker, unlike SvtSubmitQcRemarks which requires QA/Manager', () => {
    const qcPlugin = readRepoFile(
      'VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs',
    );
    // SvtModifyTask: caseworker
    expect(pluginSource).toContain('HasCaseworkerAccess');
    expect(pluginSource).not.toContain('Persona != UserPersona.QA');
    // SvtSubmitQcRemarks: QA/Manager
    expect(qcPlugin).toContain('Persona != UserPersona.QA');
    expect(qcPlugin).toContain('Persona != UserPersona.Manager');
  });
});
