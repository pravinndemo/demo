import {
  mapManagerPrefiltersToApi,
  mapQcPrefiltersToApi,
  mapQcViewPrefiltersToApi,
} from '../config/PrefilterConfigs';

describe('Prefilter mapping', () => {
  describe('mapManagerPrefiltersToApi', () => {
    test('maps billing authority search and completion dates', () => {
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

    test('maps caseworker search to CW and assigned statuses', () => {
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

    test('maps "__all__" caseworker to ALL', () => {
      const params = mapManagerPrefiltersToApi({
        searchBy: 'caseworker',
        billingAuthorities: [],
        caseworkers: ['__all__'],
      });

      expect(params.preFilter).toBe('ALL');
    });

    describe('assignment criteria matrix', () => {
      type ManagerCase = {
        name: string;
        prefilters: {
          searchBy: 'billingAuthority' | 'caseworker';
          billingAuthorities: string[];
          caseworkers: string[];
          workThat:
            | 'readyToAllocate'
            | 'currentlyAssigned'
            | 'hasBeenComplete'
            | 'awaitingQc'
            | 'assignedToSelected'
            | 'completedBySelected'
            | 'assignedAwaitingQc';
          completedFrom?: string;
          completedTo?: string;
        };
        expected: {
          searchBy: 'BA' | 'CW';
          preFilter: string;
          taskStatus: string;
          fromDate?: string;
          toDate?: string;
        };
      };

      const cases: ManagerCase[] = [
        {
          name: 'billing authority | ready to allocate',
          prefilters: {
            searchBy: 'billingAuthority',
            billingAuthorities: ['Cardiff'],
            caseworkers: [],
            workThat: 'readyToAllocate',
          },
          expected: { searchBy: 'BA', preFilter: 'Cardiff', taskStatus: 'New' },
        },
        {
          name: 'billing authority | currently assigned',
          prefilters: {
            searchBy: 'billingAuthority',
            billingAuthorities: ['Newport'],
            caseworkers: [],
            workThat: 'currentlyAssigned',
          },
          expected: { searchBy: 'BA', preFilter: 'Newport', taskStatus: 'Assigned QC Failed,Assigned' },
        },
        {
          name: 'billing authority | awaiting QC',
          prefilters: {
            searchBy: 'billingAuthority',
            billingAuthorities: ['Bridgend'],
            caseworkers: [],
            workThat: 'awaitingQc',
          },
          expected: { searchBy: 'BA', preFilter: 'Bridgend', taskStatus: 'QC Requested,Reassigned To QC,Assigned To QC' },
        },
        {
          name: 'billing authority | completed with dates',
          prefilters: {
            searchBy: 'billingAuthority',
            billingAuthorities: ['Cardiff'],
            caseworkers: [],
            workThat: 'hasBeenComplete',
            completedFrom: '2026-02-01',
            completedTo: '2026-02-15',
          },
          expected: {
            searchBy: 'BA',
            preFilter: 'Cardiff',
            taskStatus: 'Complete Passed QC,Complete',
            fromDate: '01/02/2026',
            toDate: '15/02/2026',
          },
        },
        {
          name: 'caseworker | assigned to selected',
          prefilters: {
            searchBy: 'caseworker',
            billingAuthorities: [],
            caseworkers: ['cw-1'],
            workThat: 'assignedToSelected',
          },
          expected: { searchBy: 'CW', preFilter: 'cw-1', taskStatus: 'Assigned QC Failed,Assigned' },
        },
        {
          name: 'caseworker | assigned and awaiting QC',
          prefilters: {
            searchBy: 'caseworker',
            billingAuthorities: [],
            caseworkers: ['cw-2'],
            workThat: 'assignedAwaitingQc',
          },
          expected: { searchBy: 'CW', preFilter: 'cw-2', taskStatus: 'QC Requested,Reassigned To QC,Assigned To QC' },
        },
        {
          name: 'caseworker | completed with dates',
          prefilters: {
            searchBy: 'caseworker',
            billingAuthorities: [],
            caseworkers: ['cw-3'],
            workThat: 'completedBySelected',
            completedFrom: '2026-02-01',
            completedTo: '2026-02-15',
          },
          expected: {
            searchBy: 'CW',
            preFilter: 'cw-3',
            taskStatus: 'Complete Passed QC,Complete',
            fromDate: '01/02/2026',
            toDate: '15/02/2026',
          },
        },
      ];

      test.each(cases)('maps assignment criteria: $name', ({ prefilters, expected }) => {
        const params = mapManagerPrefiltersToApi(prefilters);

        expect(params.searchBy).toBe(expected.searchBy);
        expect(params.preFilter).toBe(expected.preFilter);
        expect(params.taskStatus).toBe(expected.taskStatus);
        if (expected.fromDate !== undefined) expect(params.fromDate).toBe(expected.fromDate);
        if (expected.toDate !== undefined) expect(params.toDate).toBe(expected.toDate);
      });
    });
  });

  describe('mapQcPrefiltersToApi', () => {
    test('maps QC user search with statuses and date range', () => {
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

    describe('assignment criteria matrix', () => {
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
          name: 'qc user | assigned to selected',
          prefilters: { searchBy: 'qcUser', caseworkers: ['qc-1'], workThat: 'qcAssignedToSelected' },
          expected: { searchBy: 'QC', preFilter: 'qc-1', taskStatus: 'Reassigned To QC,Assigned To QC' },
        },
        {
          name: 'qc user | completed by selected',
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
          name: 'qc user | assigned but in progress',
          prefilters: { searchBy: 'qcUser', caseworkers: ['qc-3'], workThat: 'qcAssignedInProgress' },
          expected: { searchBy: 'QC', preFilter: 'qc-3', taskStatus: 'Assigned QC Failed' },
        },
        {
          name: 'caseworker | completed with QC requested',
          prefilters: { searchBy: 'caseworker', caseworkers: ['cw-1'], workThat: 'caseworkerCompletedQcRequested' },
          expected: { searchBy: 'CW', preFilter: 'cw-1', taskStatus: 'QC Requested' },
        },
        {
          name: 'caseworker | completed',
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
          name: 'task | completed with QC requested',
          prefilters: { searchBy: 'task', caseworkers: ['cw-3'], workThat: 'taskCompletedQcRequested' },
          expected: { searchBy: 'Tk', preFilter: undefined, taskStatus: 'QC Requested' },
        },
        {
          name: 'task | completed with dates',
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

      test.each(cases)('maps QC assignment criteria: $name', ({ prefilters, expected }) => {
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

      test('maps "__all__" to ALL for non-task searches', () => {
        const params = mapQcPrefiltersToApi({
          searchBy: 'qcUser',
          billingAuthorities: [],
          caseworkers: ['__all__'],
          workThat: 'qcAssignedToSelected',
        });

        expect(params.preFilter).toBe('ALL');
      });

      test('omits taskStatus when workThat is missing', () => {
        const params = mapQcPrefiltersToApi({
          searchBy: 'qcUser',
          billingAuthorities: [],
          caseworkers: ['qc-9'],
        });

        expect(params.taskStatus).toBeUndefined();
      });
    });
  });

  describe('mapQcViewPrefiltersToApi', () => {
    describe('criteria matrix', () => {
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
          name: 'completed by me with dates',
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

      test.each(cases)('maps QC view criteria: $name', ({ prefilters, expected }) => {
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

      test('omits taskStatus when workThat is missing', () => {
        const params = mapQcViewPrefiltersToApi({
          searchBy: 'qcUser',
          billingAuthorities: [],
          caseworkers: ['qc-me'],
        });

        expect(params.taskStatus).toBeUndefined();
      });
    });
  });

  describe('performance', () => {
    const caseworkers = Array.from({ length: 10000 }, (_, i) => ` cw-${i} `);
    const iterations = 50;
    const timeCalls = (fn: () => void): number => {
      const start = Date.now();
      for (let i = 0; i < iterations; i += 1) {
        fn();
      }
      return Date.now() - start;
    };

    test('mapManagerPrefiltersToApi handles large caseworker lists quickly', () => {
      let params: Record<string, string> = {};
      const elapsedMs = timeCalls(() => {
        params = mapManagerPrefiltersToApi({
          searchBy: 'caseworker',
          billingAuthorities: [],
          caseworkers,
          workThat: 'assignedToSelected',
        });
      });

      expect(params.preFilter?.startsWith('cw-0')).toBe(true);
      expect(elapsedMs).toBeLessThan(500);
    });

    test('mapQcPrefiltersToApi handles large caseworker lists quickly', () => {
      let params: Record<string, string> = {};
      const elapsedMs = timeCalls(() => {
        params = mapQcPrefiltersToApi({
          searchBy: 'qcUser',
          billingAuthorities: [],
          caseworkers,
          workThat: 'qcAssignedToSelected',
        });
      });

      expect(params.searchBy).toBe('QC');
      expect(params.preFilter?.startsWith('cw-0')).toBe(true);
      expect(elapsedMs).toBeLessThan(500);
    });

    test('mapQcViewPrefiltersToApi handles repeated runs quickly', () => {
      let params: Record<string, string> = {};
      const elapsedMs = timeCalls(() => {
        params = mapQcViewPrefiltersToApi({
          searchBy: 'qcUser',
          billingAuthorities: [],
          caseworkers,
          workThat: 'qcAssignedToSelected',
        });
      });

      expect(params.taskStatus).toBe('Reassigned To QC,Assigned To QC');
      expect(elapsedMs).toBeLessThan(500);
    });
  });
});
