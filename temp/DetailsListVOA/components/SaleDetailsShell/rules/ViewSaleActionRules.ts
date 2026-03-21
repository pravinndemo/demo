import { SalesParticularReviewStatus } from '../types';

export interface ViewSaleActionRule {
  disabled: boolean;
  reason?: string;
}

export interface RefreshActionRuleInput {
  loading: boolean;
}

export interface CreateTaskActionRuleInput {
  createTaskBusy: boolean;
  saleId: string;
  taskId: string;
  hasCreateTaskHandler: boolean;
  canCreateTask: boolean;
}

export interface ModifyTaskActionRuleInput {
  canModifyTask: boolean;
  hasModifyTaskHandler?: boolean;
  modifyTaskBusy?: boolean;
}

export interface AuditHistoryActionRuleInput {
  hasHandler: boolean;
}

export interface SalesVerificationEditRuleInput {
  busy: boolean;
  readOnly: boolean;
  canProgressTask: boolean;
}

export interface SalesVerificationActionRuleInput extends SalesVerificationEditRuleInput {
  hasHandler: boolean;
  taskStatus?: string;
}


export interface SubmitQcOutcomeActionRuleInput {
  busy: boolean;
  hasHandler: boolean;
  canSubmitQcOutcome: boolean;
  showQcSection: boolean;
  selectedOutcome?: string;
  remarks?: string;
}

export interface QcLogActionRuleInput {
  busy: boolean;
  hasHandler: boolean;
  readOnly?: boolean;
  canProgressTask?: boolean;
}

export interface PromoteToMasterActionRuleInput {
  recordCount: number;
  isCurrentMaster: boolean;
  readOnly: boolean;
  hasPromoteHandler: boolean;
}

export interface SalesParticularCalculateRuleInput {
  readOnly: boolean;
  reviewStatusKey?: SalesParticularReviewStatus;
}

export const hasDisplayValue = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed !== '' && trimmed !== '-';
};

export const getRefreshActionRule = ({ loading }: RefreshActionRuleInput): ViewSaleActionRule => ({
  disabled: loading,
});

export const getCreateTaskActionRule = ({
  createTaskBusy,
  saleId,
  taskId,
  hasCreateTaskHandler,
  canCreateTask,
}: CreateTaskActionRuleInput): ViewSaleActionRule => {
  const hasSaleId = hasDisplayValue(saleId);
  const hasTaskId = hasDisplayValue(taskId);

  if (hasTaskId) {
    return {
      disabled: true,
      reason: 'A task ID already exists for this sale record.',
    };
  }

  if (!hasSaleId) {
    return {
      disabled: true,
      reason: 'Sale ID is required before creating a task.',
    };
  }

  if (!hasCreateTaskHandler) {
    return {
      disabled: true,
      reason: 'Create task action is not configured.',
    };
  }

  if (!canCreateTask) {
    return {
      disabled: true,
      reason: 'Create task is available only to manager role/team.',
    };
  }

  if (createTaskBusy) {
    return { disabled: true };
  }

  return { disabled: false };
};

export const getModifyTaskActionRule = ({
  canModifyTask,
  hasModifyTaskHandler = false,
  modifyTaskBusy = false,
}: ModifyTaskActionRuleInput): ViewSaleActionRule => {
  if (!canModifyTask) {
    return {
      disabled: true,
      reason: 'Modify task is available only to caseworker role/team.',
    };
  }

  if (!hasModifyTaskHandler) {
    return {
      disabled: true,
      reason: 'Modify task is currently unavailable.',
    };
  }

  if (modifyTaskBusy) {
    return {
      disabled: true,
    };
  }

  return { disabled: false };
};

const MODIFY_TASK_ALLOWED_STATUSES = new Set(['complete', 'complete passed qc']);

export const canShowModifyTaskAction = (taskStatus: string): boolean =>
  MODIFY_TASK_ALLOWED_STATUSES.has(taskStatus.trim().toLowerCase());

export const getAuditHistoryActionRule = ({
  hasHandler,
}: AuditHistoryActionRuleInput): ViewSaleActionRule => {
  if (!hasHandler) {
    return {
      disabled: true,
      reason: 'Audit history action is not configured.',
    };
  }

  return { disabled: false };
};

export const getSalesVerificationEditRule = ({
  busy,
  readOnly,
  canProgressTask,
}: SalesVerificationEditRuleInput): ViewSaleActionRule => {
  if (busy) {
    return { disabled: true };
  }

  if (readOnly) {
    return { disabled: true };
  }

  if (!canProgressTask) {
    return {
      disabled: true,
      reason: 'Sales verification actions are available only to caseworker role/team.',
    };
  }

  return { disabled: false };
};

export const getCompleteSalesVerificationTaskActionRule = ({
  busy,
  readOnly,
  canProgressTask,
  hasHandler,
  taskStatus,
}: SalesVerificationActionRuleInput): ViewSaleActionRule => {
  const editRule = getSalesVerificationEditRule({ busy, readOnly, canProgressTask });
  if (editRule.disabled) {
    return editRule;
  }

  if (!hasHandler) {
    return {
      disabled: true,
      reason: 'Complete task action is not configured.',
    };
  }

  if (taskStatus?.trim().toLowerCase() === 'assigned qc failed') {
    return {
      disabled: true,
      reason: 'Complete task is disabled after QC failure. Submit for QC instead.',
    };
  }

  return { disabled: false };
};

export const getSubmitForQcActionRule = ({
  busy,
  readOnly,
  canProgressTask,
  hasHandler,
}: SalesVerificationActionRuleInput): ViewSaleActionRule => {
  const editRule = getSalesVerificationEditRule({ busy, readOnly, canProgressTask });
  if (editRule.disabled) {
    return editRule;
  }

  if (!hasHandler) {
    return {
      disabled: true,
      reason: 'Submit for QC action is not configured.',
    };
  }

  return { disabled: false };
};


export const getSubmitQcOutcomeActionRule = ({
  busy,
  hasHandler,
  canSubmitQcOutcome,
  showQcSection,
  selectedOutcome,
  remarks,
}: SubmitQcOutcomeActionRuleInput): ViewSaleActionRule => {
  if (!showQcSection) {
    return {
      disabled: true,
      reason: 'QC fields are available only when the task is assigned to you.',
    };
  }

  if (!canSubmitQcOutcome) {
    return {
      disabled: true,
      reason: 'QC outcome actions are available only to QC role/team.',
    };
  }

  if (busy) {
    return { disabled: true };
  }

  if (!hasHandler) {
    return {
      disabled: true,
      reason: 'Submit QC outcome action is not configured.',
    };
  }

  const outcome = (selectedOutcome ?? '').trim().toLowerCase();
  if (!outcome) {
    return {
      disabled: true,
      reason: 'Select QC outcome before submitting.',
    };
  }

  if (outcome === 'fail' && !(remarks ?? '').trim()) {
    return {
      disabled: true,
      reason: 'Please provide QC remarks before submitting',
    };
  }

  return { disabled: false };
};

export const getQcLogActionRule = ({
  busy,
  hasHandler,
  readOnly = false,
  canProgressTask = false,
}: QcLogActionRuleInput): ViewSaleActionRule => {
  if (busy) {
    return { disabled: true };
  }

  if (!hasHandler) {
    return {
      disabled: true,
      reason: 'QC log action is not configured.',
    };
  }

  // Restrict only unassigned/non-owning caseworkers in read-only mode.
  if (canProgressTask && readOnly) {
    return {
      disabled: true,
      reason: 'QC log is available to the assigned caseworker, QC users, and managers.',
    };
  }

  return { disabled: false };
};

export const getPromoteToMasterActionRule = ({
  recordCount,
  isCurrentMaster,
  readOnly,
  hasPromoteHandler,
}: PromoteToMasterActionRuleInput): ViewSaleActionRule => {
  if (recordCount <= 0 || isCurrentMaster || readOnly || !hasPromoteHandler) {
    return { disabled: true };
  }

  return { disabled: false };
};

export const getSalesParticularCalculateActionRule = ({
  readOnly,
  reviewStatusKey,
}: SalesParticularCalculateRuleInput): ViewSaleActionRule => {
  if (readOnly) {
    return { disabled: true };
  }

  if (reviewStatusKey === 'details-not-available' || reviewStatusKey === 'not-reviewed') {
    return { disabled: true };
  }

  return { disabled: false };
};
