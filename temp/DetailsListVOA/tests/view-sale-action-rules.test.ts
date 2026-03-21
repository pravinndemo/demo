import {
  canShowModifyTaskAction,
  getAuditHistoryActionRule,
  getCompleteSalesVerificationTaskActionRule,
  getCreateTaskActionRule,
  getModifyTaskActionRule,
  getPromoteToMasterActionRule,
  getQcLogActionRule,
  getRefreshActionRule,
  getSalesParticularCalculateActionRule,
  getSalesVerificationEditRule,
  getSubmitForQcActionRule,
  getSubmitQcOutcomeActionRule,
  hasDisplayValue,
} from '../components/SaleDetailsShell/rules/ViewSaleActionRules';

describe('view sale action rules', () => {
  test('hasDisplayValue rejects blank and dash placeholder', () => {
    expect(hasDisplayValue('')).toBe(false);
    expect(hasDisplayValue(' - ')).toBe(false);
    expect(hasDisplayValue('M-1000001')).toBe(true);
  });

  test('refresh action is disabled while loading', () => {
    expect(getRefreshActionRule({ loading: true })).toEqual({ disabled: true });
    expect(getRefreshActionRule({ loading: false })).toEqual({ disabled: false });
  });

  test('create task action enforces existing-task precedence', () => {
    const rule = getCreateTaskActionRule({
      createTaskBusy: false,
      saleId: 'S-1001',
      taskId: 'A-1001',
      hasCreateTaskHandler: true,
      canCreateTask: true,
    });

    expect(rule.disabled).toBe(true);
    expect(rule.reason).toBe('A task ID already exists for this sale record.');
  });

  test('create task action is disabled for missing manager access', () => {
    const rule = getCreateTaskActionRule({
      createTaskBusy: false,
      saleId: 'S-1001',
      taskId: '-',
      hasCreateTaskHandler: true,
      canCreateTask: false,
    });

    expect(rule.disabled).toBe(true);
    expect(rule.reason).toBe('Create task is available only to manager role/team.');
  });

  test('create task action is enabled only when all conditions pass', () => {
    const rule = getCreateTaskActionRule({
      createTaskBusy: false,
      saleId: 'S-1001',
      taskId: '-',
      hasCreateTaskHandler: true,
      canCreateTask: true,
    });

    expect(rule).toEqual({ disabled: false });
  });

  test('modify task action requires caseworker access and configured handler', () => {
    const personaRule = getModifyTaskActionRule({
      canModifyTask: false,
      hasModifyTaskHandler: true,
    });
    expect(personaRule.disabled).toBe(true);
    expect(personaRule.reason).toBe('Modify task is available only to caseworker role/team.');

    const handlerRule = getModifyTaskActionRule({
      canModifyTask: true,
      hasModifyTaskHandler: false,
    });
    expect(handlerRule.disabled).toBe(true);
    expect(handlerRule.reason).toBe('Modify task is currently unavailable.');
  });

  test('modify task action is visible only for complete states', () => {
    expect(canShowModifyTaskAction('Complete')).toBe(true);
    expect(canShowModifyTaskAction('Complete Passed QC')).toBe(true);
    expect(canShowModifyTaskAction('Assigned')).toBe(false);
  });
  test('audit history action is disabled when handler is missing', () => {
    expect(getAuditHistoryActionRule({ hasHandler: false })).toEqual({
      disabled: true,
      reason: 'Audit history action is not configured.',
    });
    expect(getAuditHistoryActionRule({ hasHandler: true })).toEqual({ disabled: false });
  });

  test('sales verification edit action requires caseworker progress access', () => {
    const rule = getSalesVerificationEditRule({
      busy: false,
      readOnly: false,
      canProgressTask: false,
    });

    expect(rule.disabled).toBe(true);
    expect(rule.reason).toBe('Sales verification actions are available only to caseworker role/team.');
  });

  test('complete and submit actions inherit edit gate and handler gate', () => {
    expect(getCompleteSalesVerificationTaskActionRule({
      busy: false,
      readOnly: false,
      canProgressTask: true,
      hasHandler: false,
    })).toEqual({
      disabled: true,
      reason: 'Complete task action is not configured.',
    });

    expect(getSubmitForQcActionRule({
      busy: false,
      readOnly: false,
      canProgressTask: true,
      hasHandler: false,
    })).toEqual({
      disabled: true,
      reason: 'Submit for QC action is not configured.',
    });
  });


  test('complete action is disabled for Assigned QC Failed status', () => {
    expect(getCompleteSalesVerificationTaskActionRule({
      busy: false,
      readOnly: false,
      canProgressTask: true,
      hasHandler: true,
      taskStatus: 'Assigned QC Failed',
    })).toEqual({
      disabled: true,
      reason: 'Complete task is disabled after QC failure. Submit for QC instead.',
    });
  });

  test('submit qc outcome action enforces assignment, role, selection, and fail-remarks rule', () => {
    expect(getSubmitQcOutcomeActionRule({
      busy: false,
      hasHandler: true,
      canSubmitQcOutcome: false,
      showQcSection: true,
      selectedOutcome: 'Pass',
    })).toEqual({
      disabled: true,
      reason: 'QC outcome actions are available only to QC role/team.',
    });

    expect(getSubmitQcOutcomeActionRule({
      busy: false,
      hasHandler: true,
      canSubmitQcOutcome: true,
      showQcSection: false,
      selectedOutcome: 'Pass',
    })).toEqual({
      disabled: true,
      reason: 'QC fields are available only when the task is assigned to you.',
    });

    expect(getSubmitQcOutcomeActionRule({
      busy: false,
      hasHandler: true,
      canSubmitQcOutcome: true,
      showQcSection: true,
      selectedOutcome: '',
    })).toEqual({
      disabled: true,
      reason: 'Select QC outcome before submitting.',
    });

    expect(getSubmitQcOutcomeActionRule({
      busy: false,
      hasHandler: true,
      canSubmitQcOutcome: true,
      showQcSection: true,
      selectedOutcome: 'Fail',
      remarks: '   ',
    })).toEqual({
      disabled: true,
      reason: 'Please provide QC remarks before submitting',
    });

    expect(getSubmitQcOutcomeActionRule({
      busy: false,
      hasHandler: true,
      canSubmitQcOutcome: true,
      showQcSection: true,
      selectedOutcome: 'Pass',
      remarks: '',
    })).toEqual({ disabled: false });
  });

  test('qc log action is disabled during busy state or missing handler', () => {
    expect(getQcLogActionRule({ busy: true, hasHandler: true })).toEqual({ disabled: true });
    expect(getQcLogActionRule({ busy: false, hasHandler: false })).toEqual({
      disabled: true,
      reason: 'QC log action is not configured.',
    });
  });

  test('qc log is blocked for read-only caseworker context', () => {
    expect(getQcLogActionRule({
      busy: false,
      hasHandler: true,
      readOnly: true,
      canProgressTask: true,
    })).toEqual({
      disabled: true,
      reason: 'QC log is available to the assigned caseworker, QC users, and managers.',
    });
  });

  test('promote to master action requires records, non-master, editable mode, and handler', () => {
    expect(getPromoteToMasterActionRule({
      recordCount: 0,
      isCurrentMaster: false,
      readOnly: false,
      hasPromoteHandler: true,
    })).toEqual({ disabled: true });

    expect(getPromoteToMasterActionRule({
      recordCount: 1,
      isCurrentMaster: true,
      readOnly: false,
      hasPromoteHandler: true,
    })).toEqual({ disabled: true });

    expect(getPromoteToMasterActionRule({
      recordCount: 1,
      isCurrentMaster: false,
      readOnly: false,
      hasPromoteHandler: true,
    })).toEqual({ disabled: false });
  });

  test('sales particular calculate action is disabled for read-only and non-updatable review states', () => {
    expect(getSalesParticularCalculateActionRule({ readOnly: true, reviewStatusKey: 'details-available' })).toEqual({ disabled: true });
    expect(getSalesParticularCalculateActionRule({ readOnly: false, reviewStatusKey: 'details-not-available' })).toEqual({ disabled: true });
    expect(getSalesParticularCalculateActionRule({ readOnly: false, reviewStatusKey: 'not-reviewed' })).toEqual({ disabled: true });
    expect(getSalesParticularCalculateActionRule({ readOnly: false, reviewStatusKey: 'details-available' })).toEqual({ disabled: false });
  });
});

