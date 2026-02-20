import {
  getManagerWorkThatOptions,
  getQcWorkThatOptions,
  isManagerCompletedWorkThat,
  isQcCompletedWorkThat,
  mapManagerPrefiltersToApi,
  mapQcPrefiltersToApi,
  mapQcViewPrefiltersToApi,
} from '../config/PrefilterConfigs';

describe('prefilter configs extra', () => {
  test('getManagerWorkThatOptions switches by searchBy', () => {
    const caseworkerOpts = getManagerWorkThatOptions('caseworker');
    const billingOpts = getManagerWorkThatOptions('billingAuthority');
    expect(caseworkerOpts.some((opt) => opt.key === 'assignedToSelected')).toBe(true);
    expect(billingOpts.some((opt) => opt.key === 'readyToAllocate')).toBe(true);
  });

  test('getQcWorkThatOptions switches by searchBy', () => {
    expect(getQcWorkThatOptions('qcUser').some((opt) => opt.key === 'qcAssignedToSelected')).toBe(true);
    expect(getQcWorkThatOptions('caseworker').some((opt) => opt.key === 'caseworkerCompleted')).toBe(true);
    expect(getQcWorkThatOptions('task').some((opt) => opt.key === 'taskCompleted')).toBe(true);
  });

  test('completed workThat helpers', () => {
    expect(isManagerCompletedWorkThat('hasBeenComplete')).toBe(true);
    expect(isManagerCompletedWorkThat('completedBySelected')).toBe(true);
    expect(isManagerCompletedWorkThat('readyToAllocate')).toBe(false);

    expect(isQcCompletedWorkThat('qcCompletedBySelected')).toBe(true);
    expect(isQcCompletedWorkThat('caseworkerCompleted')).toBe(true);
    expect(isQcCompletedWorkThat('taskCompleted')).toBe(true);
    expect(isQcCompletedWorkThat('qcAssignedToSelected')).toBe(false);
  });

  test('mapManagerPrefiltersToApi handles empty values', () => {
    const params = mapManagerPrefiltersToApi({
      searchBy: 'billingAuthority',
      billingAuthorities: ['  '],
      caseworkers: [],
    });
    expect(params.preFilter).toBeUndefined();
    expect(params.searchBy).toBe('BA');
  });

  test('mapQcPrefiltersToApi searchBy switch', () => {
    const params = mapQcPrefiltersToApi({
      searchBy: 'task',
      billingAuthorities: [],
      caseworkers: ['__all__'],
      workThat: 'caseworkerCompleted',
    });
    expect(params.searchBy).toBe('Tk');
    expect(params.preFilter).toBe('ALL');
    expect(params.taskStatus).toBe('Complete');
  });

  test('mapQcViewPrefiltersToApi searchBy switch', () => {
    const params = mapQcViewPrefiltersToApi({
      searchBy: 'task',
      billingAuthorities: [],
      caseworkers: ['123'],
      workThat: 'qcAssignedInProgress',
    });
    expect(params.searchBy).toBe('Tk');
    expect(params.preFilter).toBe('123');
    expect(params.taskStatus).toBe('Assigned QC Failed,Assigned');
  });
});
