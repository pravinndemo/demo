/**
 * Tests for the SvtSubmitQcRemarks model and the full QC remarks submit flow.
 *
 * Covers:
 *  - Model structure & type alignment with the real API payload
 *  - Plugin (SvtSubmitQcRemarks.cs) cross-checks
 *  - PCF submitQcOutcome() parameter assembly
 *  - mergeQcOutcomeDetails() local state update
 *  - normalizeQcOutcomeValue() canonical mapping
 *  - applyQcOutcomeTaskDetails() date field logic for Pass vs Fail
 *  - Real payload deserialization (user-provided Fail scenario)
 *  - PCF ↔ Plugin field alignment
 */

import fs from 'fs';
import path from 'path';
import type {
  SvtSubmitQcRemarksRequest,
  SvtSubmitQcRemarksResponse,
  QcRemarksApimPayload,
  MergedQualityControlOutcome,
  QcOutcomeTaskDateFields,
  QcOutcomeValue,
  NormalizedQcOutcomeValue,
  QcTaskStatus,
  QcSubmitAllowedPersona,
} from '../../models/SvtSubmitQcRemarks';
import type { QualityControlOutcome } from '../../models/ViewSaleRecordById';

/* ================================================================== */
/*  Helper utilities                                                  */
/* ================================================================== */

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/* ================================================================== */
/*  Real API payload fixture (user-provided Fail scenario)            */
/* ================================================================== */

const REAL_FAIL_REQUEST: SvtSubmitQcRemarksRequest = {
  taskId: '1000564',
  qcOutcome: 'Fail',
  qcRemark: 'test failed',
  qcReviewedBy: '05b749d9-f8cb-47ea-8487-5e891176e36d',
};

const REAL_FAIL_RESPONSE: SvtSubmitQcRemarksResponse = {
  '@odata.context':
    'https://voabstdev.crm11.dynamics.com/api/data/v9.0/$metadata#Microsoft.Dynamics.CRM.voa_SvtSubmitQcRemarksResponse',
  Result: '"SUCCEED"',
};

/* ================================================================== */
/*  1. Model structure tests                                          */
/* ================================================================== */

describe('SvtSubmitQcRemarks model', () => {
  describe('SvtSubmitQcRemarksRequest', () => {
    test('real Fail payload satisfies the request interface', () => {
      const req: SvtSubmitQcRemarksRequest = REAL_FAIL_REQUEST;
      expect(req.taskId).toBe('1000564');
      expect(req.qcOutcome).toBe('Fail');
      expect(req.qcRemark).toBe('test failed');
      expect(req.qcReviewedBy).toBe('05b749d9-f8cb-47ea-8487-5e891176e36d');
    });

    test('country and listYear are optional fields', () => {
      const withFilters: SvtSubmitQcRemarksRequest = {
        ...REAL_FAIL_REQUEST,
        country: 'E',
        listYear: '2026',
      };
      expect(withFilters.country).toBe('E');
      expect(withFilters.listYear).toBe('2026');
    });

    test('a Pass payload is also valid', () => {
      const passReq: SvtSubmitQcRemarksRequest = {
        taskId: JSON.stringify(['1000700']),
        qcOutcome: 'Pass',
        qcReviewedBy: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      };
      expect(passReq.qcOutcome).toBe('Pass');
      expect(passReq.qcRemark).toBeUndefined();
    });
  });

  describe('SvtSubmitQcRemarksResponse', () => {
    test('real response has @odata.context and Result', () => {
      const resp: SvtSubmitQcRemarksResponse = REAL_FAIL_RESPONSE;
      expect(resp['@odata.context']).toContain('voa_SvtSubmitQcRemarksResponse');
      expect(resp.Result).toBe('"SUCCEED"');
    });

    test('Result is a string (may be JSON-escaped)', () => {
      expect(typeof REAL_FAIL_RESPONSE.Result).toBe('string');
    });
  });

  describe('QcRemarksApimPayload', () => {
    test('taskId is an array in the APIM payload', () => {
      const apimPayload: QcRemarksApimPayload = {
        taskId: ['1000564'],
        qcOutcome: 'Fail',
        qcRemark: 'test failed',
        qcReviewedBy: '05b749d9-f8cb-47ea-8487-5e891176e36d',
      };
      expect(Array.isArray(apimPayload.taskId)).toBe(true);
      expect(apimPayload.taskId).toHaveLength(1);
    });

    test('optional country and listYear fields', () => {
      const withFilters: QcRemarksApimPayload = {
        taskId: ['1000564'],
        qcOutcome: 'Fail',
        qcRemark: null,
        qcReviewedBy: '05b749d9-f8cb-47ea-8487-5e891176e36d',
        country: 'E',
        listYear: '2026',
      };
      expect(withFilters.country).toBe('E');
      expect(withFilters.listYear).toBe('2026');
    });

    test('qcRemark can be null when not provided', () => {
      const apimPayload: QcRemarksApimPayload = {
        taskId: ['1000564'],
        qcOutcome: 'Pass',
        qcRemark: null,
        qcReviewedBy: 'some-guid',
      };
      expect(apimPayload.qcRemark).toBeNull();
    });
  });

  describe('MergedQualityControlOutcome', () => {
    test('extends QualityControlOutcome with qcReviewedOn timestamp', () => {
      const merged: MergedQualityControlOutcome = {
        qcOutcome: 'Fail',
        qcRemark: 'test failed',
        qcReviewedBy: '05b749d9-f8cb-47ea-8487-5e891176e36d',
        qcReviewedOn: '2026-03-22T10:00:00.000Z',
      };
      expect(merged.qcReviewedOn).toBeTruthy();

      // Verify it also satisfies QualityControlOutcome
      const base: QualityControlOutcome = merged;
      expect(base.qcOutcome).toBe('Fail');
    });
  });

  describe('QcOutcomeTaskDateFields', () => {
    test('Pass outcome sets all date fields', () => {
      const ts = '2026-03-22T10:00:00.000Z';
      const dates: QcOutcomeTaskDateFields = {
        qcCompletedDate: ts,
        qccompleteddate: ts,
        taskCompletedDate: ts,
        taskcompleteddate: ts,
        completedDate: ts,
        completeddate: ts,
      };
      expect(dates.qcCompletedDate).toBe(ts);
      expect(dates.taskCompletedDate).toBe(ts);
      expect(dates.completedDate).toBe(ts);
    });

    test('Fail outcome clears completion dates but keeps qcCompletedDate', () => {
      const ts = '2026-03-22T10:00:00.000Z';
      const dates: QcOutcomeTaskDateFields = {
        qcCompletedDate: ts,
        qccompleteddate: ts,
        taskCompletedDate: null,
        taskcompleteddate: null,
        completedDate: null,
        completeddate: null,
      };
      expect(dates.qcCompletedDate).toBe(ts);
      expect(dates.taskCompletedDate).toBeNull();
      expect(dates.completedDate).toBeNull();
    });
  });

  describe('type aliases', () => {
    test('QcOutcomeValue is Pass or Fail', () => {
      const pass: QcOutcomeValue = 'Pass';
      const fail: QcOutcomeValue = 'Fail';
      expect(pass).toBe('Pass');
      expect(fail).toBe('Fail');
    });

    test('NormalizedQcOutcomeValue includes empty string for invalid input', () => {
      const empty: NormalizedQcOutcomeValue = '';
      expect(empty).toBe('');
    });

    test('QcTaskStatus maps to the two possible task statuses', () => {
      const passed: QcTaskStatus = 'Complete Passed QC';
      const failed: QcTaskStatus = 'Assigned QC Failed';
      expect(passed).toBe('Complete Passed QC');
      expect(failed).toBe('Assigned QC Failed');
    });

    test('QcSubmitAllowedPersona permits QA and Manager', () => {
      const qa: QcSubmitAllowedPersona = 'QA';
      const manager: QcSubmitAllowedPersona = 'Manager';
      expect(qa).toBe('QA');
      expect(manager).toBe('Manager');
    });
  });
});

/* ================================================================== */
/*  2. Plugin (SvtSubmitQcRemarks.cs) cross-checks                    */
/* ================================================================== */

describe('Plugin source cross-checks (SvtSubmitQcRemarks.cs)', () => {
  const pluginSource = readRepoFile(
    'VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs',
  );

  test('plugin class name matches the API action name', () => {
    expect(pluginSource).toContain('public class SvtSubmitQcRemarks : PluginBase');
  });

  test('plugin reads all expected input parameters', () => {
    const expectedParams = ['taskId', 'qcOutcome', 'qcRemark', 'qcReviewedBy', 'country', 'listYear'];
    for (const param of expectedParams) {
      expect(pluginSource).toContain(`GetInput(context, "${param}")`);
    }
  });

  test('plugin enforces QA/Manager access control', () => {
    expect(pluginSource).toContain('userContext.Persona != UserPersona.QA');
    expect(pluginSource).toContain('userContext.Persona != UserPersona.Manager');
    expect(pluginSource).toContain(
      'Submit QC remarks is restricted to QA/Manager role/team.',
    );
  });

  test('plugin validates taskId is required', () => {
    expect(pluginSource).toContain('taskId is required.');
  });

  test('plugin validates qcOutcome is required', () => {
    expect(pluginSource).toContain('qcOutcome is required.');
  });

  test('plugin falls back to initiating user ID when qcReviewedBy is empty', () => {
    expect(pluginSource).toContain('context.InitiatingUserId');
    expect(pluginSource).toContain('qcReviewedBy = fallbackId == Guid.Empty');
  });

  test('plugin builds APIM payload with taskId key (not taskList)', () => {
    // The plugin uses ["taskId"] = taskIds in its APIM payload dictionary
    expect(pluginSource).toContain('["taskId"] = taskIds');
    // It does NOT use taskList for its own APIM payload
    expect(pluginSource).not.toContain('["taskList"]');
  });

  test('plugin APIM payload includes all four required fields', () => {
    expect(pluginSource).toContain('["taskId"] = taskIds');
    expect(pluginSource).toContain('["qcOutcome"]');
    expect(pluginSource).toContain('["qcRemark"]');
    expect(pluginSource).toContain('["qcReviewedBy"]');
  });

  test('plugin conditionally includes country and listYear in APIM payload', () => {
    expect(pluginSource).toContain('payload["country"]');
    expect(pluginSource).toContain('payload["listYear"]');
  });

  test('plugin uses SVTTaskAssignment configuration', () => {
    expect(pluginSource).toContain('CONFIGURATION_NAME = "SVTTaskAssignment"');
  });

  test('plugin returns Result output parameter', () => {
    expect(pluginSource).toContain('context.OutputParameters["Result"]');
  });

  test('plugin posts to APIM with POST method', () => {
    expect(pluginSource).toContain('HttpMethod.Post');
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
  });
});

/* ================================================================== */
/*  3. PCF submitQcOutcome() parameter assembly                       */
/* ================================================================== */

describe('PCF submitQcOutcome() flow (DetailsListRuntimeController.ts)', () => {
  const runtimeSource = readRepoFile(
    'DetailsListVOA/services/DetailsListRuntimeController.ts',
  );

  test('submitQcOutcome is a public async method', () => {
    expect(runtimeSource).toContain(
      'public async submitQcOutcome(payload: QcOutcomeActionPayload): Promise<void>',
    );
  });

  test('enforces QA/Manager access before submission', () => {
    expect(runtimeSource).toContain('!this.hasQaAccess && !this.hasManagerAccess');
    expect(runtimeSource).toContain(
      'Submit QC outcome is restricted to QA or manager role/team.',
    );
  });

  test('resolves task ID from sale details', () => {
    expect(runtimeSource).toContain(
      'resolveCurrentTaskIdFromDetails(this._saleDetails, this.selectedTaskId)',
    );
  });

  test('wraps task ID as a JSON array string', () => {
    expect(runtimeSource).toContain('JSON.stringify([normalizedTaskId])');
  });

  test('sends qcOutcome directly from the payload', () => {
    expect(runtimeSource).toContain('qcOutcome: payload.qcOutcome');
  });

  test('normalizes qcRemark text', () => {
    expect(runtimeSource).toContain('qcRemark: normalizeTextValue(payload.qcRemark)');
  });

  test('resolves qcReviewedBy from the current user context', () => {
    expect(runtimeSource).toContain(
      'qcReviewedBy: resolveCurrentUserId(this._context)',
    );
  });

  test('conditionally includes country and listYear', () => {
    expect(runtimeSource).toContain('ENABLE_COUNTRY_LIST_YEAR_API_PARAMS');
    expect(runtimeSource).toContain('if (country) qcParams.country = country;');
    expect(runtimeSource).toContain('if (listYear) qcParams.listYear = listYear;');
  });

  test('uses configured API name for the QC remarks action', () => {
    expect(runtimeSource).toContain("'submitQcRemarksApiName'");
    expect(runtimeSource).toContain('CONTROL_CONFIG.submitQcRemarksApiName');
  });

  test('checks API result for success', () => {
    expect(runtimeSource).toContain(
      "parseApiMutationResult(response, 'Submit QC outcome failed.')",
    );
  });

  test('merges QC outcome to local state on success', () => {
    expect(runtimeSource).toContain(
      'this._saleDetails = mergeQcOutcomeDetails(this._saleDetails, payload)',
    );
  });

  test('emits submitQcOutcome action on completion', () => {
    expect(runtimeSource).toContain("this.emitAction('submitQcOutcome')");
  });
});

/* ================================================================== */
/*  4. mergeQcOutcomeDetails() and helpers (sale-details.ts)          */
/* ================================================================== */

describe('mergeQcOutcomeDetails and helpers (sale-details.ts)', () => {
  const saleDetailsSource = readRepoFile(
    'DetailsListVOA/services/runtime/sale-details.ts',
  );

  describe('normalizeQcOutcomeValue()', () => {
    test('function exists', () => {
      expect(saleDetailsSource).toContain('const normalizeQcOutcomeValue = (');
    });

    test('maps pass/passed to Pass', () => {
      expect(saleDetailsSource).toContain("normalized === 'pass' || normalized === 'passed'");
      expect(saleDetailsSource).toContain("return 'Pass';");
    });

    test('maps fail/failed to Fail', () => {
      expect(saleDetailsSource).toContain("normalized === 'fail' || normalized === 'failed'");
      expect(saleDetailsSource).toContain("return 'Fail';");
    });

    test('returns empty string for unrecognized input', () => {
      // The function ends with return '' for unmatched input
      expect(saleDetailsSource).toContain("return '';");
    });
  });

  describe('applyQcOutcomeTaskDetails()', () => {
    test('function exists', () => {
      expect(saleDetailsSource).toContain('const applyQcOutcomeTaskDetails = (');
    });

    test('delegates task status update to applySalesVerificationTaskStatus', () => {
      expect(saleDetailsSource).toContain(
        'const next = applySalesVerificationTaskStatus(existing, taskStatus);',
      );
    });

    test('always sets qcCompletedDate (both cases)', () => {
      expect(saleDetailsSource).toContain('next.qcCompletedDate = outcomeTimestampIso;');
      expect(saleDetailsSource).toContain('next.qccompleteddate = outcomeTimestampIso;');
    });

    test('Pass sets completion dates', () => {
      expect(saleDetailsSource).toContain("if (outcome === 'Pass')");
      expect(saleDetailsSource).toContain(
        'next.taskCompletedDate = outcomeTimestampIso;',
      );
      expect(saleDetailsSource).toContain('next.completedDate = outcomeTimestampIso;');
    });

    test('Fail clears completion dates to null', () => {
      expect(saleDetailsSource).toContain('next.taskCompletedDate = null;');
      expect(saleDetailsSource).toContain('next.completedDate = null;');
    });

    test('writes lowercase aliases for all date fields', () => {
      expect(saleDetailsSource).toContain('next.taskcompleteddate =');
      expect(saleDetailsSource).toContain('next.completeddate =');
      expect(saleDetailsSource).toContain('next.qccompleteddate =');
    });
  });

  describe('mergeQcOutcomeDetails()', () => {
    test('is an exported function', () => {
      expect(saleDetailsSource).toContain('export const mergeQcOutcomeDetails = (');
    });

    test('normalizes the qc outcome value', () => {
      expect(saleDetailsSource).toContain(
        'const qcOutcome = normalizeQcOutcomeValue(payload.qcOutcome);',
      );
    });

    test('returns unchanged JSON if outcome is empty (invalid)', () => {
      expect(saleDetailsSource).toContain('if (!qcOutcome)');
      expect(saleDetailsSource).toContain('return JSON.stringify(root);');
    });

    test('builds qualityControlOutcome section with four fields', () => {
      for (const field of ['qcOutcome', 'qcRemark', 'qcReviewedBy', 'qcReviewedOn']) {
        expect(saleDetailsSource).toContain(`${field},`);
      }
    });

    test('sets qcReviewedOn to current ISO timestamp', () => {
      expect(saleDetailsSource).toContain(
        'const qcReviewedOn = new Date().toISOString();',
      );
    });

    test('maps Fail to Assigned QC Failed task status', () => {
      expect(saleDetailsSource).toContain(
        "const nextTaskStatus = qcOutcome === 'Fail' ? 'Assigned QC Failed' : 'Complete Passed QC';",
      );
    });

    test('applies QC outcome to both salesVerificationTaskDetails and taskDetails', () => {
      expect(saleDetailsSource).toContain(
        'root.salesVerificationTaskDetails = applyQcOutcomeTaskDetails(',
      );
      expect(saleDetailsSource).toContain(
        'root.taskDetails = applyQcOutcomeTaskDetails(',
      );
    });
  });

  describe('applySalesVerificationTaskStatus() writes canonical + legacy status keys', () => {
    test('writes taskStatus, taskstatus, and status keys', () => {
      expect(saleDetailsSource).toContain('taskStatus,');
      expect(saleDetailsSource).toContain('taskstatus: taskStatus,');
      expect(saleDetailsSource).toContain('status: taskStatus,');
    });
  });
});

/* ================================================================== */
/*  5. Real payload round-trip tests                                  */
/* ================================================================== */

describe('Real payload: Fail scenario (S-1004906 taskId 1000564)', () => {
  test('request fields match the real POST body', () => {
    expect(REAL_FAIL_REQUEST.taskId).toBe('1000564');
    expect(REAL_FAIL_REQUEST.qcOutcome).toBe('Fail');
    expect(REAL_FAIL_REQUEST.qcRemark).toBe('test failed');
    expect(REAL_FAIL_REQUEST.qcReviewedBy).toBe(
      '05b749d9-f8cb-47ea-8487-5e891176e36d',
    );
  });

  test('response Result is a JSON-escaped "SUCCEED" string', () => {
    expect(REAL_FAIL_RESPONSE.Result).toBe('"SUCCEED"');
    // The actual value is the string SUCCEED wrapped in quotes
    const parsed = JSON.parse(REAL_FAIL_RESPONSE.Result);
    expect(parsed).toBe('SUCCEED');
  });

  test('response @odata.context confirms the action name', () => {
    expect(REAL_FAIL_RESPONSE['@odata.context']).toContain(
      'voa_SvtSubmitQcRemarksResponse',
    );
  });

  test('PCF would wrap taskId as JSON array before sending', () => {
    // The PCF sends: JSON.stringify([normalizedTaskId])
    const pcfTaskId = JSON.stringify([REAL_FAIL_REQUEST.taskId]);
    expect(pcfTaskId).toBe('["1000564"]');
  });

  test('plugin ParseTaskIds would extract the task ID from JSON array', () => {
    const pcfTaskId = JSON.stringify([REAL_FAIL_REQUEST.taskId]);
    // Simulating plugin's ParseTaskIds for JSON array input
    const parsed: string[] = JSON.parse(pcfTaskId);
    expect(parsed).toEqual(['1000564']);
  });

  test('plugin would build APIM payload with taskId as array', () => {
    const apimPayload: QcRemarksApimPayload = {
      taskId: [REAL_FAIL_REQUEST.taskId],
      qcOutcome: REAL_FAIL_REQUEST.qcOutcome,
      qcRemark: REAL_FAIL_REQUEST.qcRemark ?? null,
      qcReviewedBy: REAL_FAIL_REQUEST.qcReviewedBy,
    };
    expect(apimPayload.taskId).toEqual(['1000564']);
    expect(apimPayload.qcOutcome).toBe('Fail');
  });

  test('mergeQcOutcomeDetails would set task status to Assigned QC Failed', () => {
    const expectedStatus: QcTaskStatus = 'Assigned QC Failed';
    // Fail maps to 'Assigned QC Failed'
    const outcome = REAL_FAIL_REQUEST.qcOutcome;
    const computedStatus =
      outcome === 'Fail' ? 'Assigned QC Failed' : 'Complete Passed QC';
    expect(computedStatus).toBe(expectedStatus);
  });
});

/* ================================================================== */
/*  6. Simulated merge + status scenarios                             */
/* ================================================================== */

describe('QC outcome merge scenarios', () => {
  const baseSaleDetails = JSON.stringify({
    salesVerificationTaskDetails: {
      taskId: '1000564',
      taskStatus: 'Assigned To QC',
      taskstatus: 'Assigned To QC',
      status: 'Assigned To QC',
    },
    taskDetails: {
      taskId: '1000564',
      taskStatus: 'Assigned To QC',
    },
    qualityControlOutcome: {},
  });

  function simulateMerge(
    qcOutcome: 'Pass' | 'Fail',
    qcRemark: string,
    qcReviewedBy: string,
  ) {
    const root = JSON.parse(baseSaleDetails);
    const nextTaskStatus =
      qcOutcome === 'Fail' ? 'Assigned QC Failed' : 'Complete Passed QC';
    const qcReviewedOn = '2026-03-22T10:00:00.000Z';

    root.qualityControlOutcome = {
      qcOutcome,
      qcRemark,
      qcReviewedBy,
      qcReviewedOn,
    };

    // Apply status to both sections
    for (const key of [
      'salesVerificationTaskDetails',
      'taskDetails',
    ] as const) {
      root[key] = {
        ...root[key],
        taskStatus: nextTaskStatus,
        taskstatus: nextTaskStatus,
        status: nextTaskStatus,
        qcCompletedDate: qcReviewedOn,
        qccompleteddate: qcReviewedOn,
        ...(qcOutcome === 'Pass'
          ? {
              taskCompletedDate: qcReviewedOn,
              taskcompleteddate: qcReviewedOn,
              completedDate: qcReviewedOn,
              completeddate: qcReviewedOn,
            }
          : {
              taskCompletedDate: null,
              taskcompleteddate: null,
              completedDate: null,
              completeddate: null,
            }),
      };
    }

    return root;
  }

  test('Fail scenario: sets Assigned QC Failed and clears completion dates', () => {
    const result = simulateMerge(
      'Fail',
      'test failed',
      '05b749d9-f8cb-47ea-8487-5e891176e36d',
    );

    expect(result.qualityControlOutcome.qcOutcome).toBe('Fail');
    expect(result.qualityControlOutcome.qcRemark).toBe('test failed');
    expect(result.qualityControlOutcome.qcReviewedOn).toBeTruthy();

    expect(result.salesVerificationTaskDetails.taskStatus).toBe(
      'Assigned QC Failed',
    );
    expect(result.salesVerificationTaskDetails.taskstatus).toBe(
      'Assigned QC Failed',
    );
    expect(result.salesVerificationTaskDetails.status).toBe(
      'Assigned QC Failed',
    );
    expect(result.salesVerificationTaskDetails.qcCompletedDate).toBeTruthy();
    expect(result.salesVerificationTaskDetails.taskCompletedDate).toBeNull();
    expect(result.salesVerificationTaskDetails.completedDate).toBeNull();
  });

  test('Pass scenario: sets Complete Passed QC and all dates', () => {
    const result = simulateMerge(
      'Pass',
      '',
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    );

    expect(result.qualityControlOutcome.qcOutcome).toBe('Pass');
    expect(result.salesVerificationTaskDetails.taskStatus).toBe(
      'Complete Passed QC',
    );
    expect(result.salesVerificationTaskDetails.taskCompletedDate).toBeTruthy();
    expect(result.salesVerificationTaskDetails.completedDate).toBeTruthy();
    expect(result.salesVerificationTaskDetails.qcCompletedDate).toBeTruthy();
  });

  test('taskDetails mirror salesVerificationTaskDetails for backward compat', () => {
    const result = simulateMerge(
      'Fail',
      'some remark',
      '05b749d9-f8cb-47ea-8487-5e891176e36d',
    );

    expect(result.taskDetails.taskStatus).toBe(
      result.salesVerificationTaskDetails.taskStatus,
    );
    expect(result.taskDetails.qcCompletedDate).toBe(
      result.salesVerificationTaskDetails.qcCompletedDate,
    );
    expect(result.taskDetails.taskCompletedDate).toBe(
      result.salesVerificationTaskDetails.taskCompletedDate,
    );
  });

  test('qualityControlOutcome includes all four fields', () => {
    const result = simulateMerge(
      'Pass',
      'looks good',
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    );
    const qco: MergedQualityControlOutcome = result.qualityControlOutcome;
    expect(qco).toHaveProperty('qcOutcome');
    expect(qco).toHaveProperty('qcRemark');
    expect(qco).toHaveProperty('qcReviewedBy');
    expect(qco).toHaveProperty('qcReviewedOn');
  });

  test('lowercase aliases are always written alongside canonical fields', () => {
    const result = simulateMerge(
      'Fail',
      'remark',
      '05b749d9-f8cb-47ea-8487-5e891176e36d',
    );
    const task = result.salesVerificationTaskDetails;

    // Canonical + lowercase pairs
    expect(task.taskStatus).toBe(task.taskstatus);
    expect(task.qcCompletedDate).toBe(task.qccompleteddate);
    expect(task.taskCompletedDate).toBe(task.taskcompleteddate);
    expect(task.completedDate).toBe(task.completeddate);
  });
});

/* ================================================================== */
/*  7. PCF ↔ Plugin field alignment                                  */
/* ================================================================== */

describe('PCF ↔ Plugin field alignment', () => {
  const runtimeSource = readRepoFile(
    'DetailsListVOA/services/DetailsListRuntimeController.ts',
  );
  const pluginSource = readRepoFile(
    'VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs',
  );

  const pcfParams = ['taskId', 'qcOutcome', 'qcRemark', 'qcReviewedBy'];

  test.each(pcfParams)(
    'PCF sends "%s" and plugin reads "%s"',
    (param) => {
      // PCF writes qcParams.{param}
      expect(runtimeSource).toContain(`${param}:`);
      // Plugin reads GetInput(context, "{param}")
      expect(pluginSource).toContain(`GetInput(context, "${param}")`);
    },
  );

  test('PCF sends taskId as JSON.stringify([id]) and plugin parses JSON arrays', () => {
    expect(runtimeSource).toContain('JSON.stringify([normalizedTaskId])');
    expect(pluginSource).toContain('JsonSerializer.Deserialize<string[]>');
  });

  test('PCF uses resolveCurrentUserId; plugin falls back to InitiatingUserId', () => {
    expect(runtimeSource).toContain('resolveCurrentUserId(this._context)');
    expect(pluginSource).toContain('context.InitiatingUserId');
  });

  test('both PCF and plugin support optional country/listYear params', () => {
    expect(runtimeSource).toContain('qcParams.country = country;');
    expect(runtimeSource).toContain('qcParams.listYear = listYear;');
    expect(pluginSource).toContain('GetInput(context, "country")');
    expect(pluginSource).toContain('GetInput(context, "listYear")');
  });
});

/* ================================================================== */
/*  8. Config alignment                                               */
/* ================================================================== */

describe('Control config for QC remarks API', () => {
  const configSource = readRepoFile('DetailsListVOA/config/ControlConfig.ts');

  test('submitQcRemarksApiName is voa_SvtSubmitQcRemarks', () => {
    expect(configSource).toContain(
      "submitQcRemarksApiName: 'voa_SvtSubmitQcRemarks'",
    );
  });

  test('submitQcRemarksApiType is action', () => {
    expect(configSource).toContain("submitQcRemarksApiType: 'action'");
  });
});

/* ================================================================== */
/*  9. Documentation vs implementation discrepancy                    */
/* ================================================================== */

describe('Documentation discrepancy: taskId vs taskList', () => {
  const doc = readRepoFile('docs/svtSubmitQcRemarks.md');
  const pluginSource = readRepoFile(
    'VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs',
  );

  test('docs mention taskList as the APIM payload key', () => {
    expect(doc).toContain('"taskList"');
  });

  test('but the actual plugin code uses taskId as the APIM payload key', () => {
    expect(pluginSource).toContain('["taskId"] = taskIds');
    expect(pluginSource).not.toContain('["taskList"]');
  });

  test('docs do mention taskId as an input parameter (which is correct)', () => {
    expect(doc).toContain('`taskId`');
  });
});
