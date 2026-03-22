/**
 * Tests for the SvtSubmitSalesVerification model and the full
 * merge → build → submit payload flow.
 *
 * Uses the real API payloads from:
 *   POST /api/data/v9.0/voa_SvtSubmitSalesVerification
 */
import fs from 'fs';
import path from 'path';

import type {
  SvtSubmitSalesVerificationRequest,
  SubmitPayloadBody,
  SubmitTaskDetails,
} from '../../models/SvtSubmitSalesVerification';

import type { SalesParticularDetails, SalesVerificationDetails } from '../../models/ViewSaleRecordById';

import {
  mergeSalesVerificationDetails,
  getSaleDetailsRoot,
  toRecord,
  getEmptySaleRecord,
} from '../../services/runtime/sale-details';

import type { SalesVerificationActionPayload, SalesParticularDraftPayload } from '../../components/SaleDetailsShell/types';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/* ------------------------------------------------------------------ */
/*  Fixtures: real API payloads from the user                         */
/* ------------------------------------------------------------------ */

/** S-1004906 — Complete action, no remarks */
const REAL_PAYLOAD_COMPLETE: SvtSubmitSalesVerificationRequest = {
  saleId: 'S-1004906',
  saleSubmitPayload: JSON.stringify({
    salesParticularDetails: {
      bathroomAge: 'Mid-life',
      bathroomSpecification: 'Standard',
      conditionCategory: 'BELOW AVERAGE',
      conditionScore: '0.25',
      decorativeFinishes: 'Modern',
      glazing: 'Single',
      heating: 'None',
      kitchenAge: 'Dated',
      kitchenSpecification: 'Basic',
      linkParticulars: 'test',
      padConfirmation: 'Data enhancement job created',
      particularNotes: 'particular',
      salesParticular: 'Details available',
    },
    salesVerificationDetails: {
      additionalNotes: 'test particular',
      isSaleUseful: 'No',
      whyNotUseful: 'Special purchaser',
    },
    salesVerificationTaskDetails: {
      lrppdId: '',
      requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      salesSource: 'WLTT',
      taskId: '1000555',
      taskStatus: 'Complete',
      wlttId: '9AB75974-2A04-46D1-483E-D9C434E594B4',
    },
  }),
  saleSubmitRemarks: '',
};

/** S-1004839 — Reassigned To QC, with remarks */
const REAL_PAYLOAD_REASSIGN_QC: SvtSubmitSalesVerificationRequest = {
  saleId: 'S-1004839',
  saleSubmitPayload: JSON.stringify({
    salesParticularDetails: {
      bathroomAge: 'Modern',
      bathroomSpecification: null,
      conditionCategory: null,
      conditionScore: null,
      decorativeFinishes: null,
      glazing: null,
      heating: null,
      kitchenAge: 'Mid-life',
      kitchenSpecification: 'Standard',
      linkParticulars: null,
      padConfirmation: 'Data enhancement job not required',
      particularNotes: '',
      salesParticular: 'Details not available',
    },
    salesVerificationDetails: {
      additionalNotes: 'tst',
      isSaleUseful: 'No',
      whyNotUseful: 'Market value but not useful for modelling - Other',
    },
    salesVerificationTaskDetails: {
      lrppdId: '',
      requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      salesSource: 'WLTT',
      taskId: '1000549',
      taskStatus: 'Reassigned To QC',
      wlttId: '9AB75974-2A04-46D1-483E-D9C434E594B4',
    },
  }),
  saleSubmitRemarks: 'reassign',
};

/** S-1004899 — QC Requested, with remarks */
const REAL_PAYLOAD_QC_REQUESTED: SvtSubmitSalesVerificationRequest = {
  saleId: 'S-1004899',
  saleSubmitPayload: JSON.stringify({
    salesParticularDetails: {
      bathroomAge: 'Modern',
      bathroomSpecification: 'High',
      conditionCategory: null,
      conditionScore: null,
      decorativeFinishes: 'Standard',
      glazing: 'Single',
      heating: 'None',
      kitchenAge: 'Mid-life',
      kitchenSpecification: 'Standard',
      linkParticulars: 'testlink',
      padConfirmation: 'Data enhancement job created',
      particularNotes: 'sample notes',
      salesParticular: 'Details not available',
    },
    salesVerificationDetails: {
      additionalNotes: 'tstcomments',
      isSaleUseful: 'No',
      whyNotUseful: 'Sale linked to incorrect property',
    },
    salesVerificationTaskDetails: {
      lrppdId: '',
      requestedBy: 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      salesSource: 'WLTT',
      taskId: '1000554',
      taskStatus: 'QC Requested',
      wlttId: '9AB75974-2A04-46D1-483E-D9C434E594B4',
    },
  }),
  saleSubmitRemarks: 'qc test it',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Parse the inner saleSubmitPayload JSON string. */
function parseInnerPayload(request: SvtSubmitSalesVerificationRequest): SubmitPayloadBody {
  return JSON.parse(request.saleSubmitPayload!) as SubmitPayloadBody;
}

/**
 * Simulate `buildSalesVerificationSubmitPayload` from the controller.
 * Extracts the three sections from a full sale details root.
 */
function buildSubmitPayload(detailsJson: string): string {
  const root = getSaleDetailsRoot(detailsJson);
  const salesVerificationTaskDetails = toRecord(root.salesVerificationTaskDetails)
    ?? toRecord(root.taskDetails)
    ?? {};
  const salesParticularDetails = toRecord(root.salesParticularDetails)
    ?? toRecord(root.salesParticularInfo)
    ?? {};
  const salesVerificationDetails = toRecord(root.salesVerificationDetails)
    ?? toRecord(root.salesVerificationInfo)
    ?? {};

  return JSON.stringify({
    salesVerificationTaskDetails,
    salesParticularDetails,
    salesVerificationDetails,
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('SvtSubmitSalesVerification model', () => {
  const modelSource = readRepoFile('DetailsListVOA/models/SvtSubmitSalesVerification.ts');
  const pluginSource = readRepoFile('VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitSalesVerification.cs');
  const saleDetailsSource = readRepoFile('DetailsListVOA/services/runtime/sale-details.ts');

  /* ---------------------------------------------------------------- */
  /*  Model structure                                                 */
  /* ---------------------------------------------------------------- */

  describe('model interface completeness', () => {
    test('outer request has saleId, saleSubmitPayload, saleSubmitRemarks', () => {
      expect(modelSource).toContain('saleId?:');
      expect(modelSource).toContain('saleSubmitPayload?:');
      expect(modelSource).toContain('saleSubmitRemarks?:');
    });

    test('inner payload body declares three sections', () => {
      expect(modelSource).toContain('salesVerificationTaskDetails?: SubmitTaskDetails');
      expect(modelSource).toContain('salesParticularDetails?: SalesParticularDetails');
      expect(modelSource).toContain('salesVerificationDetails?: SalesVerificationDetails');
    });

    test('SubmitTaskDetails has canonical and legacy field names', () => {
      // Canonical
      expect(modelSource).toContain('taskId?:');
      expect(modelSource).toContain('taskStatus?:');
      expect(modelSource).toContain('salesSource?:');
      expect(modelSource).toContain('wlttId?:');
      expect(modelSource).toContain('lrppdId?:');
      expect(modelSource).toContain('requestedBy?:');
      // Legacy / deprecated
      expect(modelSource).toContain('wltId?:');
      expect(modelSource).toContain('lrpddId?:');
    });

    test('SubmitTaskStatus type covers all three known values', () => {
      expect(modelSource).toContain("'Complete'");
      expect(modelSource).toContain("'QC Requested'");
      expect(modelSource).toContain("'Reassigned To QC'");
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Plugin source cross-checks                                      */
  /* ---------------------------------------------------------------- */

  describe('plugin alignment', () => {
    test('plugin reads saleSubmitPayload with payload fallback', () => {
      expect(pluginSource).toContain('GetInput(context, "saleSubmitPayload")');
      expect(pluginSource).toContain('GetInput(context, "payload")');
    });

    test('plugin reads saleSubmitRemarks and injects into salesVerificationDetails', () => {
      expect(pluginSource).toContain('GetInput(context, "saleSubmitRemarks")');
      expect(pluginSource).toContain('details["remarks"] = remarksOverride');
    });

    test('plugin fallback builds salesVerificationTaskDetails with wltId and lrpddId', () => {
      expect(pluginSource).toContain('["wltId"]');
      expect(pluginSource).toContain('["lrpddId"]');
    });

    test('plugin fallback builds salesParticularDetails with particularNotes (singular)', () => {
      expect(pluginSource).toContain('["particularNotes"]');
    });

    test('plugin fallback does NOT include requestedBy in task details', () => {
      // The BuildSalesVerificationTaskDetails method has specific keys
      const taskDetailsMethod = pluginSource.substring(
        pluginSource.indexOf('BuildSalesVerificationTaskDetails'),
        pluginSource.indexOf('BuildSalesParticularDetails'),
      );
      expect(taskDetailsMethod).not.toContain('requestedBy');
    });

    test('plugin sends PUT to /sales/{saleId}', () => {
      expect(pluginSource).toContain('HttpMethod.Put');
      expect(pluginSource).toContain('/sales/');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  PCF sale-details.ts source cross-checks                         */
  /* ---------------------------------------------------------------- */

  describe('PCF merge logic alignment', () => {
    test('resolveTaskStatusForSalesVerificationAction returns Complete for complete action', () => {
      expect(saleDetailsSource).toContain("return 'Complete'");
    });

    test('resolveTaskStatusForSalesVerificationAction returns QC Requested for first-time QC', () => {
      expect(saleDetailsSource).toContain("'QC Requested'");
    });

    test('resolveTaskStatusForSalesVerificationAction returns Reassigned To QC when current is Assigned QC Failed', () => {
      expect(saleDetailsSource).toContain("'Reassigned To QC'");
      expect(saleDetailsSource).toContain("'assigned qc failed'");
    });

    test('applySalesVerificationTaskStatus writes taskStatus, taskstatus, status', () => {
      expect(saleDetailsSource).toContain('taskStatus,');
      expect(saleDetailsSource).toContain('taskstatus: taskStatus');
      expect(saleDetailsSource).toContain('status: taskStatus');
    });

    test('promoted master writes both canonical and legacy field names', () => {
      expect(saleDetailsSource).toContain('next.wltId = promotedId');
      expect(saleDetailsSource).toContain('next.wlttId = promotedId');
      expect(saleDetailsSource).toContain('next.lrpddId = promotedId');
      expect(saleDetailsSource).toContain('next.lrppdId = promotedId');
    });

    test('mergeSalesParticularDraftDetails maps particularNotes correctly', () => {
      expect(saleDetailsSource).toContain('particularNotes: draft.particularsNotes');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Real payload deserialization                                    */
  /* ---------------------------------------------------------------- */

  describe('real payload: Complete (S-1004906)', () => {
    const inner = parseInnerPayload(REAL_PAYLOAD_COMPLETE);

    test('outer envelope has saleId and empty remarks', () => {
      expect(REAL_PAYLOAD_COMPLETE.saleId).toBe('S-1004906');
      expect(REAL_PAYLOAD_COMPLETE.saleSubmitRemarks).toBe('');
    });

    test('inner payload has all three sections', () => {
      expect(inner.salesVerificationTaskDetails).toBeDefined();
      expect(inner.salesParticularDetails).toBeDefined();
      expect(inner.salesVerificationDetails).toBeDefined();
    });

    test('taskStatus is Complete', () => {
      expect(inner.salesVerificationTaskDetails!.taskStatus).toBe('Complete');
    });

    test('salesSource is WLTT with wlttId populated', () => {
      expect(inner.salesVerificationTaskDetails!.salesSource).toBe('WLTT');
      expect(inner.salesVerificationTaskDetails!.wlttId).toBe('9AB75974-2A04-46D1-483E-D9C434E594B4');
      expect(inner.salesVerificationTaskDetails!.lrppdId).toBe('');
    });

    test('requestedBy is a GUID', () => {
      expect(inner.salesVerificationTaskDetails!.requestedBy).toMatch(/^[0-9a-f-]+$/i);
    });

    test('salesParticularDetails has all form fields populated', () => {
      const sp = inner.salesParticularDetails!;
      expect(sp.salesParticular).toBe('Details available');
      expect(sp.kitchenAge).toBe('Dated');
      expect(sp.kitchenSpecification).toBe('Basic');
      expect(sp.bathroomAge).toBe('Mid-life');
      expect(sp.bathroomSpecification).toBe('Standard');
      expect(sp.glazing).toBe('Single');
      expect(sp.heating).toBe('None');
      expect(sp.decorativeFinishes).toBe('Modern');
      expect(sp.conditionScore).toBe('0.25');
      expect(sp.conditionCategory).toBe('BELOW AVERAGE');
      expect(sp.linkParticulars).toBe('test');
      expect(sp.particularNotes).toBe('particular');
      expect(sp.padConfirmation).toBe('Data enhancement job created');
    });

    test('salesVerificationDetails has isSaleUseful=No', () => {
      const sv = inner.salesVerificationDetails!;
      expect(sv.isSaleUseful).toBe('No');
      expect(sv.whyNotUseful).toBe('Special purchaser');
      expect(sv.additionalNotes).toBe('test particular');
    });
  });

  describe('real payload: Reassigned To QC (S-1004839)', () => {
    const inner = parseInnerPayload(REAL_PAYLOAD_REASSIGN_QC);

    test('outer has remarks for QC resubmission', () => {
      expect(REAL_PAYLOAD_REASSIGN_QC.saleSubmitRemarks).toBe('reassign');
    });

    test('taskStatus is Reassigned To QC', () => {
      expect(inner.salesVerificationTaskDetails!.taskStatus).toBe('Reassigned To QC');
    });

    test('salesParticularDetails tolerates null fields', () => {
      const sp = inner.salesParticularDetails!;
      expect(sp.bathroomSpecification).toBeNull();
      expect(sp.conditionCategory).toBeNull();
      expect(sp.conditionScore).toBeNull();
      expect(sp.glazing).toBeNull();
      expect(sp.heating).toBeNull();
      expect(sp.decorativeFinishes).toBeNull();
      expect(sp.linkParticulars).toBeNull();
    });

    test('padConfirmation is Data enhancement job not required', () => {
      expect(inner.salesParticularDetails!.padConfirmation).toBe('Data enhancement job not required');
    });

    test('whyNotUseful has full reason text', () => {
      expect(inner.salesVerificationDetails!.whyNotUseful).toBe(
        'Market value but not useful for modelling - Other',
      );
    });
  });

  describe('real payload: QC Requested (S-1004899)', () => {
    const inner = parseInnerPayload(REAL_PAYLOAD_QC_REQUESTED);

    test('outer has qc remarks', () => {
      expect(REAL_PAYLOAD_QC_REQUESTED.saleSubmitRemarks).toBe('qc test it');
    });

    test('taskStatus is QC Requested', () => {
      expect(inner.salesVerificationTaskDetails!.taskStatus).toBe('QC Requested');
    });

    test('all form fields are present (mix of populated and null)', () => {
      const sp = inner.salesParticularDetails!;
      expect(sp.kitchenAge).toBe('Mid-life');
      expect(sp.bathroomSpecification).toBe('High');
      expect(sp.conditionCategory).toBeNull();
      expect(sp.particularNotes).toBe('sample notes');
      expect(sp.salesParticular).toBe('Details not available');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  mergeSalesVerificationDetails + buildSubmitPayload flow         */
  /* ---------------------------------------------------------------- */

  describe('merge + build end-to-end flow', () => {
    /** Build a minimal sale details JSON to simulate the state before submit. */
    function buildInitialState(overrides?: {
      taskStatus?: string;
      wlttId?: string;
      salesSource?: string;
      requestedBy?: string;
    }): string {
      const root = getEmptySaleRecord();
      root.salesVerificationTaskDetails = {
        taskId: '1000555',
        taskStatus: overrides?.taskStatus ?? 'Assigned',
        wlttId: overrides?.wlttId ?? '9AB75974-2A04-46D1-483E-D9C434E594B4',
        lrppdId: '',
        salesSource: overrides?.salesSource ?? 'WLTT',
        requestedBy: overrides?.requestedBy ?? 'cc4cc1fc-aeb8-ef11-b8e8-002248c64505',
      };
      root.salesParticularDetails = {
        kitchenAge: 'Dated',
        bathroomAge: 'Mid-life',
      };
      return JSON.stringify(root);
    }

    test('Complete action sets taskStatus to Complete', () => {
      const initial = buildInitialState();
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'No',
        whyNotUseful: 'Special purchaser',
        additionalNotes: 'test particular',
        salesParticularDraft: {
          reviewStatusKey: 'details-available',
          linkParticulars: 'test',
          kitchenAge: 'Dated',
          kitchenSpecification: 'Basic',
          bathroomAge: 'Mid-life',
          bathroomSpecification: 'Standard',
          glazing: 'Single',
          heating: 'None',
          decorativeFinishes: 'Modern',
          conditionScore: '0.25',
          conditionCategory: 'BELOW AVERAGE',
          particularsNotes: 'particular',
        },
        padConfirmationKey: 'confirmed',
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'completeSalesVerificationTask');
      const submitJson = buildSubmitPayload(merged);
      const submit = JSON.parse(submitJson) as SubmitPayloadBody;

      expect(submit.salesVerificationTaskDetails!.taskStatus).toBe('Complete');
      expect(submit.salesVerificationDetails!.isSaleUseful).toBe('No');
      expect(submit.salesVerificationDetails!.whyNotUseful).toBe('Special purchaser');
      expect(submit.salesVerificationDetails!.additionalNotes).toBe('test particular');
      expect(submit.salesParticularDetails!.salesParticular).toBe('Details available');
      expect(submit.salesParticularDetails!.kitchenAge).toBe('Dated');
      expect(submit.salesParticularDetails!.particularNotes).toBe('particular');
    });

    test('QC Requested action sets taskStatus to QC Requested', () => {
      const initial = buildInitialState();
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'No',
        whyNotUseful: 'Sale linked to incorrect property',
        additionalNotes: 'tstcomments',
        remarks: 'qc test it',
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'submitSalesVerificationTaskForQc');
      const submitJson = buildSubmitPayload(merged);
      const submit = JSON.parse(submitJson) as SubmitPayloadBody;

      expect(submit.salesVerificationTaskDetails!.taskStatus).toBe('QC Requested');
      expect(submit.salesVerificationDetails!.remarks).toBe('qc test it');
    });

    test('Reassigned To QC when current status is Assigned QC Failed', () => {
      const initial = buildInitialState({ taskStatus: 'Assigned QC Failed' });
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'No',
        whyNotUseful: 'Market value but not useful for modelling - Other',
        additionalNotes: 'tst',
        remarks: 'reassign',
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'submitSalesVerificationTaskForQc');
      const submitJson = buildSubmitPayload(merged);
      const submit = JSON.parse(submitJson) as SubmitPayloadBody;

      expect(submit.salesVerificationTaskDetails!.taskStatus).toBe('Reassigned To QC');
      expect(submit.salesVerificationDetails!.remarks).toBe('reassign');
    });

    test('remarks default to empty string when not provided for Complete', () => {
      const initial = buildInitialState();
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'Yes',
        whyNotUseful: '',
        additionalNotes: '',
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'completeSalesVerificationTask');
      const submitJson = buildSubmitPayload(merged);
      const submit = JSON.parse(submitJson) as SubmitPayloadBody;

      expect(submit.salesVerificationDetails!.remarks).toBe('');
    });

    test('promoted WLTT master sets wlttId and clears lrppdId', () => {
      const initial = buildInitialState({ wlttId: '', salesSource: '' });
      const promotedId = '9AB75974-2A04-46D1-483E-D9C434E594B4';
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'No',
        whyNotUseful: 'Special purchaser',
        additionalNotes: '',
        promotedMasterRecord: { id: promotedId, source: 'WLTT', salePrice: '300750', transactionDate: '', hpiAdjustedPrice: '', ratio: '' },
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'completeSalesVerificationTask');
      const submitJson = buildSubmitPayload(merged);
      const submit = JSON.parse(submitJson) as SubmitPayloadBody;

      const task = submit.salesVerificationTaskDetails as SubmitTaskDetails;
      expect(task.salesSource).toBe('WLTT');
      expect(task.wlttId).toBe(promotedId);
      expect(task.wltId).toBe(promotedId); // legacy alias also written
      expect(task.lrppdId).toBeNull();
      expect(task.lrpddId).toBeNull(); // legacy alias also cleared
    });

    test('promoted LRPPD master sets lrppdId and clears wlttId', () => {
      const initial = buildInitialState({ wlttId: 'old-wltt', salesSource: 'WLTT' });
      const promotedId = '01EB45F0-4FDF-40F3-E063-4704A8C05FDE';
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'Yes',
        whyNotUseful: '',
        additionalNotes: '',
        promotedMasterRecord: { id: promotedId, source: 'LRPPD', salePrice: '300750', transactionDate: '', hpiAdjustedPrice: '', ratio: '' },
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'completeSalesVerificationTask');
      const submitJson = buildSubmitPayload(merged);
      const submit = JSON.parse(submitJson) as SubmitPayloadBody;

      const task = submit.salesVerificationTaskDetails as SubmitTaskDetails;
      expect(task.salesSource).toBe('LRPPD');
      expect(task.lrppdId).toBe(promotedId);
      expect(task.lrpddId).toBe(promotedId);
      expect(task.wlttId).toBeNull();
      expect(task.wltId).toBeNull();
    });

    test('padConfirmation text mapping for confirmed key', () => {
      const initial = buildInitialState();
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'Yes',
        whyNotUseful: '',
        additionalNotes: '',
        padConfirmationKey: 'confirmed',
        salesParticularDraft: {
          reviewStatusKey: 'details-available',
          linkParticulars: '',
          kitchenAge: '',
          kitchenSpecification: '',
          bathroomAge: '',
          bathroomSpecification: '',
          glazing: '',
          heating: '',
          decorativeFinishes: '',
          conditionScore: '',
          conditionCategory: '',
          particularsNotes: '',
        },
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'completeSalesVerificationTask');
      const root = getSaleDetailsRoot(merged);
      const sp = toRecord(root.salesParticularDetails)!;
      expect(sp.padConfirmation).toBe('Confirmed');
    });

    test('three sections only — no extra keys in submit payload', () => {
      const initial = buildInitialState();
      const payload: SalesVerificationActionPayload = {
        isSaleUseful: 'Yes',
        whyNotUseful: '',
        additionalNotes: '',
      };

      const merged = mergeSalesVerificationDetails(initial, payload, 'completeSalesVerificationTask');
      const submitJson = buildSubmitPayload(merged);
      const submit = JSON.parse(submitJson) as Record<string, unknown>;
      const keys = Object.keys(submit).sort();

      expect(keys).toEqual([
        'salesParticularDetails',
        'salesVerificationDetails',
        'salesVerificationTaskDetails',
      ]);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Field-name alignment across PCF ↔ Plugin                       */
  /* ---------------------------------------------------------------- */

  describe('PCF ↔ Plugin field alignment', () => {
    test('PCF writes both wlttId and wltId for plugin compatibility', () => {
      expect(saleDetailsSource).toContain('next.wltId = promotedId');
      expect(saleDetailsSource).toContain('next.wlttId = promotedId');
    });

    test('PCF writes both lrppdId and lrpddId for plugin compatibility', () => {
      expect(saleDetailsSource).toContain('next.lrpddId = promotedId');
      expect(saleDetailsSource).toContain('next.lrppdId = promotedId');
    });

    test('PCF writes both salesSource and saleSource for plugin compatibility', () => {
      expect(saleDetailsSource).toContain('salesSource: source');
      expect(saleDetailsSource).toContain('saleSource: source');
    });

    test('PCF writes both particularNotes and particularsNotes', () => {
      expect(saleDetailsSource).toContain('particularNotes: draft.particularsNotes');
      expect(saleDetailsSource).toContain('particularsNotes: draft.particularsNotes');
    });
  });
});
