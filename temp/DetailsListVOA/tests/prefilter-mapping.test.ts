import {
  mapManagerPrefiltersToApi,
  mapQcPrefiltersToApi,
  mapQcViewPrefiltersToApi,
} from '../config/PrefilterConfigs';

describe('prefilter mapping', () => {
  test('manager prefilters map billing authority and dates', () => {
    const params = mapManagerPrefiltersToApi({
      searchBy: 'billingAuthority',
      billingAuthorities: ['Cardiff', 'Newport'],
      caseworkers: [],
      workThat: 'readyToAllocate',
      completedFrom: '2026-02-01',
      completedTo: '2026-02-15',
    });

    expect(params.searchBy).toBe('BA');
    expect(params.preFilter).toBe('Cardiff,Newport');
    expect(params.taskStatus).toBe('New');
    expect(params.fromDate).toBe('01/02/2026');
    expect(params.toDate).toBe('15/02/2026');
  });

  test('manager prefilters map caseworker and status', () => {
    const params = mapManagerPrefiltersToApi({
      searchBy: 'caseworker',
      billingAuthorities: [],
      caseworkers: ['11111111-1111-1111-1111-111111111111'],
      workThat: 'assignedToSelected',
    });

    expect(params.searchBy).toBe('CW');
    expect(params.preFilter).toBe('11111111-1111-1111-1111-111111111111');
    expect(params.taskStatus).toBe('Assigned QC Failed,Assigned');
  });

  test('manager prefilters treat __all__ as ALL', () => {
    const params = mapManagerPrefiltersToApi({
      searchBy: 'caseworker',
      billingAuthorities: [],
      caseworkers: ['__all__'],
    });

    expect(params.preFilter).toBe('ALL');
  });

  test('qc assignment prefilters map QC user and statuses', () => {
    const params = mapQcPrefiltersToApi({
      searchBy: 'qcUser',
      billingAuthorities: [],
      caseworkers: ['22222222-2222-2222-2222-222222222222'],
      workThat: 'qcAssignedToSelected',
      completedFrom: '2026-02-01',
      completedTo: '2026-02-03',
    });

    expect(params.searchBy).toBe('QC');
    expect(params.preFilter).toBe('22222222-2222-2222-2222-222222222222');
    expect(params.taskStatus).toBe('Reassigned To QC,Assigned To QC');
    expect(params.fromDate).toBe('01/02/2026');
    expect(params.toDate).toBe('03/02/2026');
  });

  describe('qc assignment criteria', () => {
    type QcAssignmentCase = {
      name: string;
      prefilters: {
        searchBy: 'qcUser' | 'caseworker' | 'task';
        caseworkers: string[];
        workThat:
          | 'qcAssignedToSelected'
          | 'qcCompletedBySelected'
          | 'qcAssignedInProgress'
          | 'caseworkerCompletedQcRequested'
          | 'caseworkerCompleted'
          | 'taskCompletedQcRequested'
          | 'taskCompleted';
        completedFrom?: string;
        completedTo?: string;
      };
      expected: {
        searchBy: 'QC' | 'CW' | 'Tk';
        preFilter?: string;
        taskStatus: string;
        fromDate?: string;
        toDate?: string;
      };
    };

    const cases: QcAssignmentCase[] = [
      {
        name: 'QC user assigned to selected',
        prefilters: { searchBy: 'qcUser', caseworkers: ['qc-1'], workThat: 'qcAssignedToSelected' },
        expected: { searchBy: 'QC', preFilter: 'qc-1', taskStatus: 'Reassigned To QC,Assigned To QC' },
      },
      {
        name: 'QC user completed by selected',
        prefilters: {
          searchBy: 'qcUser',
          caseworkers: ['qc-2'],
          workThat: 'qcCompletedBySelected',
          completedFrom: '2026-02-01',
          completedTo: '2026-02-15',
        },
        expected: { searchBy: 'QC', preFilter: 'qc-2', taskStatus: 'Complete Passed QC', fromDate: '01/02/2026', toDate: '15/02/2026' },
      },
      {
        name: 'QC user assigned but in progress',
        prefilters: { searchBy: 'qcUser', caseworkers: ['qc-3'], workThat: 'qcAssignedInProgress' },
        expected: { searchBy: 'QC', preFilter: 'qc-3', taskStatus: 'Assigned QC Failed' },
      },
      {
        name: 'Caseworker completed with QC requested',
        prefilters: { searchBy: 'caseworker', caseworkers: ['cw-1'], workThat: 'caseworkerCompletedQcRequested' },
        expected: { searchBy: 'CW', preFilter: 'cw-1', taskStatus: 'QC Requested' },
      },
      {
        name: 'Caseworker completed',
        prefilters: {
          searchBy: 'caseworker',
          caseworkers: ['cw-2'],
          workThat: 'caseworkerCompleted',
          completedFrom: '2026-02-03',
          completedTo: '2026-02-17',
        },
        expected: { searchBy: 'CW', preFilter: 'cw-2', taskStatus: 'Complete', fromDate: '03/02/2026', toDate: '17/02/2026' },
      },
      {
        name: 'Task completed with QC requested',
        prefilters: { searchBy: 'task', caseworkers: ['cw-3'], workThat: 'taskCompletedQcRequested' },
        expected: { searchBy: 'Tk', preFilter: undefined, taskStatus: 'QC Requested' },
      },
      {
        name: 'Task completed with dates',
        prefilters: {
          searchBy: 'task',
          caseworkers: ['cw-4'],
          workThat: 'taskCompleted',
          completedFrom: '2026-02-01',
          completedTo: '2026-02-15',
        },
        expected: { searchBy: 'Tk', preFilter: undefined, taskStatus: 'Complete', fromDate: '01/02/2026', toDate: '15/02/2026' },
      },
    ];

    test.each(cases)('qc assignment maps $name', ({ prefilters, expected }) => {
      const params = mapQcPrefiltersToApi({
        billingAuthorities: [],
        ...prefilters,
      });

      expect(params.searchBy).toBe(expected.searchBy);
      if (expected.preFilter === undefined) {
        expect(params.preFilter).toBeUndefined();
      } else {
        expect(params.preFilter).toBe(expected.preFilter);
      }
      expect(params.taskStatus).toBe(expected.taskStatus);
      if (expected.fromDate !== undefined) expect(params.fromDate).toBe(expected.fromDate);
      if (expected.toDate !== undefined) expect(params.toDate).toBe(expected.toDate);
    });

    test('qc assignment treats __all__ as ALL for non-task searches', () => {
      const params = mapQcPrefiltersToApi({
        searchBy: 'qcUser',
        billingAuthorities: [],
        caseworkers: ['__all__'],
        workThat: 'qcAssignedToSelected',
      });

      expect(params.preFilter).toBe('ALL');
    });

    test('qc assignment omits taskStatus when workThat is missing', () => {
      const params = mapQcPrefiltersToApi({
        searchBy: 'qcUser',
        billingAuthorities: [],
        caseworkers: ['qc-9'],
      });

      expect(params.taskStatus).toBeUndefined();
    });
  });

  describe('qc view criteria', () => {
    type QcViewCase = {
      name: string;
      prefilters: {
        searchBy: 'qcUser';
        caseworkers: string[];
        workThat: 'qcAssignedToSelected' | 'qcCompletedBySelected' | 'qcAssignedInProgress';
        completedFrom?: string;
        completedTo?: string;
      };
      expected: {
        taskStatus: string;
        fromDate?: string;
        toDate?: string;
      };
    };

    const cases: QcViewCase[] = [
      {
        name: 'assigned to me',
        prefilters: { searchBy: 'qcUser', caseworkers: ['qc-me'], workThat: 'qcAssignedToSelected' },
        expected: { taskStatus: 'Reassigned To QC,Assigned To QC' },
      },
      {
        name: 'i have completed with dates',
        prefilters: {
          searchBy: 'qcUser',
          caseworkers: ['qc-me'],
          workThat: 'qcCompletedBySelected',
          completedFrom: '2026-02-05',
          completedTo: '2026-02-19',
        },
        expected: { taskStatus: 'Complete Passed QC,Complete', fromDate: '05/02/2026', toDate: '19/02/2026' },
      },
      {
        name: 'assigned to me but in progress',
        prefilters: { searchBy: 'qcUser', caseworkers: ['qc-me'], workThat: 'qcAssignedInProgress' },
        expected: { taskStatus: 'Assigned QC Failed,Assigned' },
      },
    ];

    test.each(cases)('qc view maps $name', ({ prefilters, expected }) => {
      const params = mapQcViewPrefiltersToApi({
        billingAuthorities: [],
        ...prefilters,
      });

      expect(params.searchBy).toBeUndefined();
      expect(params.preFilter).toBeUndefined();
      expect(params.taskStatus).toBe(expected.taskStatus);
      if (expected.fromDate !== undefined) expect(params.fromDate).toBe(expected.fromDate);
      if (expected.toDate !== undefined) expect(params.toDate).toBe(expected.toDate);
    });

    test('qc view omits taskStatus when workThat is missing', () => {
      const params = mapQcViewPrefiltersToApi({
        searchBy: 'qcUser',
        billingAuthorities: [],
        caseworkers: ['qc-me'],
      });

      expect(params.taskStatus).toBeUndefined();
    });
  });
});
