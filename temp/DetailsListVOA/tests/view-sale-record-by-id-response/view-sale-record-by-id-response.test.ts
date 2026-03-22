/**
 * Tests for the ViewSaleRecordById response model and its mapping
 * through the SaleDetailsShell utility layer.
 *
 * Uses the real API response shape from:
 *   GET /v1/sales/S-1005525
 */
import fs from 'fs';
import path from 'path';

import type { ViewSaleRecordByIdResponse } from '../../models/ViewSaleRecordById';

/* ------------------------------------------------------------------ */
/*  Fixture: real API response                                        */
/* ------------------------------------------------------------------ */

const REAL_API_RESPONSE: ViewSaleRecordByIdResponse = {
  salesVerificationTaskDetails: {
    saleId: 'S-1005525',
    taskId: 'A-1000631',
    taskStatus: 'Assigned',
    assignedTo: '025942bd-acb8-ef11-a72f-002248c8be77',
    wlttId: null,
    lrppdId: null,
    salesSource: null,
    requestedBy: null,
    qcAssignedTo: null,
  },
  links: {
    epc: 'CF35 6PD',
    zoopla: 'CF35-6PD',
    rightMove: 'CF35 6PD',
    vmsX: '297591',
    vmsY: '182457',
  },
  propertyAndBandingDetails: {
    address: 'WOODFORD BRYNNA ROAD, PENCOED, BRIDGEND, CF35 6PD',
    band: 'C',
    bandingEffectiveDate: '2005-04-01T00:00:00',
    billingAuthority: '6940',
    billingAuthorityName: 'Rhondda Cynon Taff',
    composite: false,
    suId: '0775e82f-36db-d85c-8e4a-b0f63e4261cb',
    padStatus: 'Committed',
    effectiveDate: '1993-04-01T00:00:00',
    effectiveTo: null,
    status: null,
    dwellingGroup: '30',
    dwellingType: 'HS',
    dwellingArea: '84',
    ageCode: 'E',
    heating: 'Y',
    mainroomCount: 5,
    bedroomCount: 3,
    bathroomCount: 1,
    floorCount: 2,
    floorLevel: null,
    parkingCode: 'G1',
    conservatoryArea: null,
    conservatoryType: null,
    reasonCode: 'R',
    valueSignificantCodes: null,
    sourceCodes: null,
    plotSize: null,
    padConfirmation: null,
    valueSignificantCodeName: null,
    valueSignificantDescription: null,
    sourceCode: '22',
    sourceCodeDescription: '22 - Data enhanced from office records - recorded details',
    dwellingGroupDescription: 'Private and Local Authority dwellings built under licence between 1945 and 1953',
    dwellingTypeDescription: 'Semi-detached house',
    ageCodeDescription: '1945 - 1954',
    parkingCodeDescription: 'Garaging (within unit of assessment) for 1 car',
    conservatoryTypeDescription: null,
    reasonCodeDescription: 'Bulk Data Captured',
  },
  masterSale: {
    salePrice: 199950,
    transactionDate: '2021-06-21T00:00:00',
    ratio: null,
    salesSource: 'LRPPD',
    hpiAdjustedPrice: 240646,
    reviewFlags: 'outlier;',
    overallFlag: 'Investigate can use',
    summaryFlags: 'same solicitor;',
    modelValue: '198607',
  },
  repeatSaleInfo: {
    previousRatioRange: null,
    laterRatioRange: null,
  },
  welshLandTax: [
    {
      wlttId: '593EB3E7-3053-AA98-81DB-05E07DACF2CD',
      transactionPrice: 300750,
      transactionPremium: null,
      transactionDate: '2022-05-27T00:00:00',
      groundRent: null,
      vendors: 'WATERS ADAM JAMES , WATERS BEN , WATERS SAM',
      vendees: 'FARROW MARK ADRIAN , HALL SHARON LOUISE',
      vendorAgents: 'SPICKETTS BATTRICK',
      vendeeAgents: 'NEWBOLD SOLICITORS',
      typeOfProperty: 'R',
      tenureType: 'FP',
      leaseFrom: null,
      leaseTerm: null,
      hpiAdjustedPrice: 312736,
      ratio: null,
    },
  ],
  landRegistryData: [
    {
      lrppdId: '01EB45F0-4FDF-40F3-E063-4704A8C05FDE',
      address: 'NO 2 CHRISTCHURCH HOUSE CHEPSTOW ROAD',
      transactionPrice: 300750,
      typeOfProperty: 'T',
      tenureType: 'F',
      oldNew: 'N',
      transactionDate: '2022-05-27T00:00:00',
      pricePaidCategory: 'A',
      hpiAdjustedPrice: 312736,
      ratio: null,
    },
  ],
  salesParticularDetails: {
    salesParticular: null,
    linkParticulars: null,
    kitchenAge: null,
    kitchenSpecification: null,
    bathroomAge: null,
    bathroomSpecification: null,
    glazing: null,
    heating: null,
    decorativeFinishes: null,
    conditionScore: null,
    conditionCategory: null,
    particularNotes: null,
    padConfirmation: null,
  },
  salesVerificationDetails: {
    isSaleUseful: null,
    whyNotUseful: null,
    additionalNotes: null,
    remarks: null,
  },
  qualityControlOutcome: {
    qcOutcome: null,
    qcRemark: null,
    qcReviewedBy: null,
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers (import from SaleDetailsShell utils)                      */
/* ------------------------------------------------------------------ */

import {
  parseSaleDetails,
  getValue,
  getRecord,
  getRecordFromKeys,
  getRecordArray,
  firstNonEmpty,
  formatValue,
  toUkDate,
  toUkCurrency,
  toStatusTone,
  parseCsvCodes,
  mapPadConfirmationToKey,
} from '../../components/SaleDetailsShell/utils';

import type { SaleDetailsRecord } from '../../components/SaleDetailsShell/types';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('ViewSaleRecordById response model', () => {
  const modelSource = readRepoFile('DetailsListVOA/models/ViewSaleRecordById.ts');
  const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');

  /* ---------- Model type structural tests ---------- */

  describe('model interface completeness', () => {
    test('envelope interface declares all top-level sections', () => {
      const sections = [
        'salesVerificationTaskDetails',
        'links',
        'propertyAndBandingDetails',
        'masterSale',
        'repeatSaleInfo',
        'welshLandTax',
        'landRegistryData',
        'salesParticularDetails',
        'salesVerificationDetails',
        'qualityControlOutcome',
      ];
      sections.forEach((section) => {
        expect(modelSource).toContain(`${section}?:`);
      });
    });

    test('salesVerificationTaskDetails interface has all fields', () => {
      const fields = ['saleId', 'taskId', 'taskStatus', 'assignedTo', 'wlttId', 'lrppdId', 'salesSource', 'requestedBy', 'qcAssignedTo'];
      fields.forEach((field) => {
        expect(modelSource).toContain(`${field}?:`);
      });
    });

    test('propertyAndBandingDetails interface has description tooltip fields', () => {
      const descFields = [
        'sourceCodeDescription',
        'dwellingGroupDescription',
        'dwellingTypeDescription',
        'ageCodeDescription',
        'parkingCodeDescription',
        'conservatoryTypeDescription',
        'reasonCodeDescription',
      ];
      descFields.forEach((field) => {
        expect(modelSource).toContain(`${field}?:`);
      });
    });

    test('propertyAndBandingDetails includes both sourceCode and sourceCodes', () => {
      expect(modelSource).toContain('sourceCodes?:');
      expect(modelSource).toContain('sourceCode?:');
    });

    test('all model fields are optional (every property uses ?:)', () => {
      // Extract lines that look like property declarations (indented, ending with ;)
      const propLines = modelSource
        .split('\n')
        .filter((line) => /^\s+\w+\??\s*:/.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*'));
      const nonOptionalProps = propLines.filter((line) => !line.includes('?:'));
      expect(nonOptionalProps).toEqual([]);
    });
  });

  /* ---------- JSON deserialization ---------- */

  describe('parseSaleDetails round-trip', () => {
    const json = JSON.stringify(REAL_API_RESPONSE);
    const parsed = parseSaleDetails(json);

    test('deserializes all top-level sections', () => {
      expect(parsed.salesVerificationTaskDetails).toBeDefined();
      expect(parsed.links).toBeDefined();
      expect(parsed.propertyAndBandingDetails).toBeDefined();
      expect(parsed.masterSale).toBeDefined();
      expect(parsed.repeatSaleInfo).toBeDefined();
      expect(parsed.welshLandTax).toBeDefined();
      expect(parsed.landRegistryData).toBeDefined();
      expect(parsed.salesParticularDetails).toBeDefined();
      expect(parsed.salesVerificationDetails).toBeDefined();
      expect(parsed.qualityControlOutcome).toBeDefined();
    });

    test('empty / null input returns empty record', () => {
      expect(parseSaleDetails('')).toEqual({});
      expect(parseSaleDetails('not json')).toEqual({});
    });
  });

  /* ---------- Section: salesVerificationTaskDetails ---------- */

  describe('salesVerificationTaskDetails mapping', () => {
    const json = JSON.stringify(REAL_API_RESPONSE);
    const details = parseSaleDetails(json);
    const task = getRecordFromKeys(details, ['salesVerificationTaskDetails', 'taskDetails']) as SaleDetailsRecord;

    test('saleId is extracted', () => {
      expect(getValue(task, 'saleId')).toBe('S-1005525');
    });

    test('taskId is extracted', () => {
      expect(getValue(task, 'taskId')).toBe('A-1000631');
    });

    test('taskStatus maps to a status tone', () => {
      expect(getValue(task, 'taskStatus')).toBe('Assigned');
      expect(toStatusTone('Assigned')).toBeDefined();
    });

    test('assignedTo is a GUID', () => {
      expect(getValue(task, 'assignedTo')).toMatch(/^[0-9a-f-]+$/i);
    });

    test('null fields resolve to empty string via getValue', () => {
      expect(getValue(task, 'wlttId')).toBe('');
      expect(getValue(task, 'lrppdId')).toBe('');
      expect(getValue(task, 'salesSource')).toBe('');
      expect(getValue(task, 'requestedBy')).toBe('');
      expect(getValue(task, 'qcAssignedTo')).toBe('');
    });
  });

  /* ---------- Section: links ---------- */

  describe('links mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const links = getRecord(details, 'links');

    test('vmsX and vmsY are populated for VMS URL construction', () => {
      expect(getValue(links, 'vmsX')).toBe('297591');
      expect(getValue(links, 'vmsY')).toBe('182457');
    });

    test('epc, zoopla, rightMove are populated', () => {
      expect(getValue(links, 'epc')).toBe('CF35 6PD');
      expect(getValue(links, 'zoopla')).toBe('CF35-6PD');
      expect(getValue(links, 'rightMove')).toBe('CF35 6PD');
    });
  });

  /* ---------- Section: propertyAndBandingDetails ---------- */

  describe('propertyAndBandingDetails mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const banding = getRecordFromKeys(details, ['propertyAndBandingDetails', 'bandingInfo']);

    test('address, band, billing authority are present', () => {
      expect(getValue(banding, 'address')).toContain('WOODFORD');
      expect(getValue(banding, 'band')).toBe('C');
      expect(getValue(banding, 'billingAuthorityName')).toBe('Rhondda Cynon Taff');
      expect(getValue(banding, 'billingAuthority')).toBe('6940');
    });

    test('bandingEffectiveDate formats to UK date', () => {
      expect(toUkDate(getValue(banding, 'bandingEffectiveDate'))).toBe('01/04/2005');
    });

    test('suId is a valid GUID for hereditament link', () => {
      expect(getValue(banding, 'suId')).toMatch(/^[0-9a-f-]+$/i);
    });

    test('PAD attribute codes are extracted', () => {
      expect(getValue(banding, 'dwellingGroup')).toBe('30');
      expect(getValue(banding, 'dwellingType')).toBe('HS');
      expect(getValue(banding, 'ageCode')).toBe('E');
      expect(getValue(banding, 'dwellingArea')).toBe('84');
      expect(getValue(banding, 'heating')).toBe('Y');
      expect(getValue(banding, 'mainroomCount')).toBe('5');
      expect(getValue(banding, 'bedroomCount')).toBe('3');
      expect(getValue(banding, 'bathroomCount')).toBe('1');
      expect(getValue(banding, 'floorCount')).toBe('2');
      expect(getValue(banding, 'parkingCode')).toBe('G1');
      expect(getValue(banding, 'reasonCode')).toBe('R');
    });

    test('null PAD attributes resolve to empty string', () => {
      expect(getValue(banding, 'floorLevel')).toBe('');
      expect(getValue(banding, 'conservatoryArea')).toBe('');
      expect(getValue(banding, 'conservatoryType')).toBe('');
    });

    test('description tooltip fields are accessible', () => {
      expect(getValue(banding, 'dwellingGroupDescription')).toBe(
        'Private and Local Authority dwellings built under licence between 1945 and 1953',
      );
      expect(getValue(banding, 'dwellingTypeDescription')).toBe('Semi-detached house');
      expect(getValue(banding, 'ageCodeDescription')).toBe('1945 - 1954');
      expect(getValue(banding, 'parkingCodeDescription')).toBe('Garaging (within unit of assessment) for 1 car');
      expect(getValue(banding, 'reasonCodeDescription')).toBe('Bulk Data Captured');
    });

    test('sourceCode (singular) is accessible when sourceCodes is null', () => {
      expect(getValue(banding, 'sourceCodes')).toBe('');
      expect(getValue(banding, 'sourceCode')).toBe('22');
      // The view model should fall back to singular
      const codes = parseCsvCodes(firstNonEmpty(
        getValue(banding, 'sourceCodes'),
        getValue(banding, 'sourceCode'),
      ));
      expect(codes).toEqual(['22']);
    });
  });

  /* ---------- Section: masterSale ---------- */

  describe('masterSale mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const master = getRecord(details, 'masterSale');

    test('salePrice formats to UK currency', () => {
      expect(toUkCurrency(getValue(master, 'salePrice'))).toBe('£199,950.00');
    });

    test('transactionDate formats to UK date', () => {
      expect(toUkDate(getValue(master, 'transactionDate'))).toBe('21/06/2021');
    });

    test('hpiAdjustedPrice formats to UK currency', () => {
      expect(toUkCurrency(getValue(master, 'hpiAdjustedPrice'))).toBe('£240,646.00');
    });

    test('modelValue formats to UK currency', () => {
      expect(toUkCurrency(getValue(master, 'modelValue'))).toBe('£198,607.00');
    });

    test('flag fields are populated', () => {
      expect(getValue(master, 'overallFlag')).toBe('Investigate can use');
      expect(getValue(master, 'reviewFlags')).toContain('outlier');
      expect(getValue(master, 'summaryFlags')).toContain('same solicitor');
    });

    test('null ratio resolves to empty string', () => {
      expect(getValue(master, 'ratio')).toBe('');
    });

    test('salesSource indicates LRPPD', () => {
      expect(getValue(master, 'salesSource')).toBe('LRPPD');
    });
  });

  /* ---------- Section: repeatSaleInfo ---------- */

  describe('repeatSaleInfo mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const repeat = getRecordFromKeys(details, ['repeatsSaleInfo', 'repeatSaleInfo']);

    test('null ratio ranges resolve to empty string', () => {
      expect(getValue(repeat, 'previousRatioRange')).toBe('');
      expect(getValue(repeat, 'laterRatioRange')).toBe('');
    });
  });

  /* ---------- Section: welshLandTax ---------- */

  describe('welshLandTax mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const wlttRecords = getRecordArray(details, 'welshLandTax');

    test('array has one WLTT record', () => {
      expect(wlttRecords).toHaveLength(1);
    });

    const record = wlttRecords[0];

    test('wlttId is a GUID', () => {
      expect(getValue(record, 'wlttId')).toMatch(/^[0-9a-f-]+$/i);
    });

    test('transactionPrice formats to UK currency', () => {
      expect(toUkCurrency(getValue(record, 'transactionPrice'))).toBe('£300,750.00');
    });

    test('transactionDate formats to UK date', () => {
      expect(toUkDate(getValue(record, 'transactionDate'))).toBe('27/05/2022');
    });

    test('party fields are populated', () => {
      expect(getValue(record, 'vendors')).toContain('WATERS');
      expect(getValue(record, 'vendees')).toContain('FARROW');
      expect(getValue(record, 'vendorAgents')).toBe('SPICKETTS BATTRICK');
      expect(getValue(record, 'vendeeAgents')).toBe('NEWBOLD SOLICITORS');
    });

    test('null optional fields resolve gracefully', () => {
      expect(getValue(record, 'transactionPremium')).toBe('');
      expect(getValue(record, 'groundRent')).toBe('');
      expect(getValue(record, 'leaseFrom')).toBe('');
      expect(getValue(record, 'leaseTerm')).toBe('');
      expect(getValue(record, 'ratio')).toBe('');
    });

    test('property type and tenure are present', () => {
      expect(getValue(record, 'typeOfProperty')).toBe('R');
      expect(getValue(record, 'tenureType')).toBe('FP');
    });
  });

  /* ---------- Section: landRegistryData ---------- */

  describe('landRegistryData mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const lrppdRecords = getRecordArray(details, 'landRegistryData');

    test('array has one LRPPD record', () => {
      expect(lrppdRecords).toHaveLength(1);
    });

    const record = lrppdRecords[0];

    test('lrppdId is a GUID-like value', () => {
      expect(getValue(record, 'lrppdId')).toMatch(/^[0-9A-F-]+$/i);
    });

    test('address is populated', () => {
      expect(getValue(record, 'address')).toContain('CHRISTCHURCH');
    });

    test('transactionPrice formats to UK currency', () => {
      expect(toUkCurrency(getValue(record, 'transactionPrice'))).toBe('£300,750.00');
    });

    test('date formats correctly', () => {
      expect(toUkDate(getValue(record, 'transactionDate'))).toBe('27/05/2022');
    });

    test('all classification fields present', () => {
      expect(getValue(record, 'typeOfProperty')).toBe('T');
      expect(getValue(record, 'tenureType')).toBe('F');
      expect(getValue(record, 'oldNew')).toBe('N');
      expect(getValue(record, 'pricePaidCategory')).toBe('A');
    });
  });

  /* ---------- Section: salesParticularDetails ---------- */

  describe('salesParticularDetails mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const sp = getRecordFromKeys(details, ['salesParticularDetails', 'salesParticularInfo']);

    test('all null form fields resolve to empty string', () => {
      const fields = [
        'salesParticular', 'linkParticulars', 'kitchenAge', 'kitchenSpecification',
        'bathroomAge', 'bathroomSpecification', 'glazing', 'heating',
        'decorativeFinishes', 'conditionScore', 'conditionCategory', 'particularNotes',
        'padConfirmation',
      ];
      fields.forEach((field) => {
        expect(getValue(sp, field)).toBe('');
      });
    });
  });

  /* ---------- Section: salesVerificationDetails ---------- */

  describe('salesVerificationDetails mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const sv = getRecordFromKeys(details, ['salesVerificationDetails', 'salesVerificationInfo']);

    test('all null verification fields resolve to empty string', () => {
      expect(getValue(sv, 'isSaleUseful')).toBe('');
      expect(getValue(sv, 'whyNotUseful')).toBe('');
      expect(getValue(sv, 'additionalNotes')).toBe('');
      expect(getValue(sv, 'remarks')).toBe('');
    });
  });

  /* ---------- Section: qualityControlOutcome ---------- */

  describe('qualityControlOutcome mapping', () => {
    const details = parseSaleDetails(JSON.stringify(REAL_API_RESPONSE));
    const qc = getRecordFromKeys(details, ['qualityControlOutcome', 'qcOutcomeDetails']);

    test('all null QC fields resolve to empty string', () => {
      expect(getValue(qc, 'qcOutcome')).toBe('');
      expect(getValue(qc, 'qcRemark')).toBe('');
      expect(getValue(qc, 'qcReviewedBy')).toBe('');
    });
  });

  /* ---------- View-model builder source-level checks ---------- */

  describe('useSaleDetailsViewModel handles new fields', () => {
    test('buildPadChip checks *Description suffix for tooltips', () => {
      expect(viewModelSource).toContain('`${attributeKey}Description`');
    });

    test('sourceCodes falls back to singular sourceCode', () => {
      expect(viewModelSource).toContain("getValue(propertyAndBandingDetails, 'sourceCode')");
    });

    test('view model extracts padConfirmation from banding section', () => {
      expect(viewModelSource).toContain("getValue(propertyAndBandingDetails, 'padConfirmation')");
    });
  });

  /* ---------- Populated response scenario ---------- */

  describe('mapping with populated fields (non-null scenario)', () => {
    const populated: ViewSaleRecordByIdResponse = {
      ...REAL_API_RESPONSE,
      salesVerificationTaskDetails: {
        ...REAL_API_RESPONSE.salesVerificationTaskDetails,
        taskStatus: 'Assigned QC Failed',
        wlttId: '593EB3E7-3053-AA98-81DB-05E07DACF2CD',
        salesSource: 'WLTT',
        qcAssignedTo: 'aabbccdd-1122-3344-5566-778899aabbcc',
      },
      salesParticularDetails: {
        salesParticular: 'Details available',
        kitchenAge: '1945-1964',
        kitchenSpecification: 'Basic',
        bathroomAge: '1965-1979',
        bathroomSpecification: 'Dated',
        glazing: 'Double',
        heating: 'Central Heating',
        decorativeFinishes: 'Standard',
        conditionScore: '45',
        conditionCategory: 'Fair',
        particularNotes: 'Some notes about the property',
        padConfirmation: 'Confirmed',
      },
      salesVerificationDetails: {
        isSaleUseful: 'Yes',
        whyNotUseful: null,
        additionalNotes: 'Verified in person',
        remarks: 'Good condition',
      },
      qualityControlOutcome: {
        qcOutcome: 'Fail',
        qcRemark: 'Missing EPC data',
        qcReviewedBy: 'aabbccdd-1122-3344-5566-778899aabbcc',
      },
      repeatSaleInfo: {
        previousRatioRange: '0.95 - 1.05',
        laterRatioRange: '0.90 - 1.10',
      },
    };

    const details = parseSaleDetails(JSON.stringify(populated));
    const task = getRecordFromKeys(details, ['salesVerificationTaskDetails', 'taskDetails']);
    const sp = getRecordFromKeys(details, ['salesParticularDetails', 'salesParticularInfo']);
    const sv = getRecordFromKeys(details, ['salesVerificationDetails', 'salesVerificationInfo']);
    const qc = getRecordFromKeys(details, ['qualityControlOutcome', 'qcOutcomeDetails']);
    const repeat = getRecordFromKeys(details, ['repeatsSaleInfo', 'repeatSaleInfo']);

    test('taskStatus maps to critical status tone for QC Failed', () => {
      expect(toStatusTone(getValue(task, 'taskStatus'))).toBe('critical');
    });

    test('wlttId is accessible when populated', () => {
      expect(getValue(task, 'wlttId')).toBe('593EB3E7-3053-AA98-81DB-05E07DACF2CD');
    });

    test('salesSource is WLTT', () => {
      expect(getValue(task, 'salesSource')).toBe('WLTT');
    });

    test('sales particular form fields are populated', () => {
      expect(getValue(sp, 'kitchenAge')).toBe('1945-1964');
      expect(getValue(sp, 'conditionScore')).toBe('45');
      expect(getValue(sp, 'conditionCategory')).toBe('Fair');
      expect(getValue(sp, 'particularNotes')).toBe('Some notes about the property');
    });

    test('sales verification fields are populated', () => {
      expect(getValue(sv, 'isSaleUseful')).toBe('Yes');
      expect(getValue(sv, 'additionalNotes')).toBe('Verified in person');
      expect(getValue(sv, 'remarks')).toBe('Good condition');
    });

    test('QC outcome fields are populated', () => {
      expect(getValue(qc, 'qcOutcome')).toBe('Fail');
      expect(getValue(qc, 'qcRemark')).toBe('Missing EPC data');
    });

    test('repeat sale info ratio ranges are populated', () => {
      expect(getValue(repeat, 'previousRatioRange')).toBe('0.95 - 1.05');
      expect(getValue(repeat, 'laterRatioRange')).toBe('0.90 - 1.10');
    });

    test('padConfirmation maps to key', () => {
      expect(mapPadConfirmationToKey(getValue(sp, 'padConfirmation'))).toBeDefined();
    });
  });
});
