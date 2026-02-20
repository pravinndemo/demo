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

  test('qc view prefilters map completed statuses', () => {
    const params = mapQcViewPrefiltersToApi({
      searchBy: 'qcUser',
      billingAuthorities: [],
      caseworkers: ['33333333-3333-3333-3333-333333333333'],
      workThat: 'qcCompletedBySelected',
    });

    expect(params.searchBy).toBe('QC');
    expect(params.preFilter).toBe('33333333-3333-3333-3333-333333333333');
    expect(params.taskStatus).toBe('Complete Passed QC,Complete');
  });
});
