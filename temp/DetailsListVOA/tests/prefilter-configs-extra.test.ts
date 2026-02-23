import {
  getManagerWorkThatOptions,
  getQcWorkThatOptions,
  isManagerCompletedWorkThat,
  isQcCompletedWorkThat,
  mapManagerPrefiltersToApi,
  mapQcPrefiltersToApi,
  mapQcViewPrefiltersToApi,
  QC_VIEW_PREFILTER_DEFAULT,
  QC_WORKTHAT_SELF_OPTIONS,
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
    expect(params.preFilter).toBeUndefined();
    expect(params.taskStatus).toBe('Complete');
  });

  test('mapQcViewPrefiltersToApi omits searchBy and preFilter', () => {
    const params = mapQcViewPrefiltersToApi({
      searchBy: 'task',
      billingAuthorities: [],
      caseworkers: ['123'],
      workThat: 'qcAssignedInProgress',
    });
    expect(params.searchBy).toBeUndefined();
    expect(params.preFilter).toBeUndefined();
    expect(params.taskStatus).toBe('Assigned QC Failed,Assigned');
  });

  test('qc view defaults and options', () => {
    expect(QC_VIEW_PREFILTER_DEFAULT.searchBy).toBe('qcUser');
    expect(QC_VIEW_PREFILTER_DEFAULT.workThat).toBe('qcAssignedToSelected');
    const optionKeys = new Set(QC_WORKTHAT_SELF_OPTIONS.map((opt) => String(opt.key)));
    expect(optionKeys.has('qcAssignedToSelected')).toBe(true);
    expect(optionKeys.has('qcCompletedBySelected')).toBe(true);
    expect(optionKeys.has('qcAssignedInProgress')).toBe(true);
  });
});
