import * as React from 'react';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Icon,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Text,
} from '@fluentui/react';
import { statusIconByTone } from '../constants';
import { StatusTone } from '../types';
import { KvpRow } from '../shared/KvpRow';
import { OwnershipRow } from '../shared/OwnershipRow';
import {
  canShowModifyTaskAction,
  getAuditHistoryActionRule,
  getCreateTaskActionRule,
  getModifyTaskActionRule,
  hasDisplayValue,
} from '../rules/ViewSaleActionRules';

interface SalesVerificationTaskSectionProps {
  saleId: string;
  taskId: string;
  statusText: string;
  statusTone: StatusTone;
  assignedTo: string;
  qcAssignedTo: string;
  onOpenAuditHistory?: () => void | Promise<void>;
  onCreateTask?: () => void | Promise<void>;
  onModifyTask?: () => void | Promise<void>;
  canCreateTask?: boolean;
  canModifyTask?: boolean;
}

export const SalesVerificationTaskSection: React.FC<SalesVerificationTaskSectionProps> = ({
  saleId,
  taskId,
  statusText,
  statusTone,
  assignedTo,
  qcAssignedTo,
  onOpenAuditHistory,
  onCreateTask,
  onModifyTask,
  canCreateTask = false,
  canModifyTask = false,
}) => {
  const [createTaskBusy, setCreateTaskBusy] = React.useState(false);
  const [createTaskMessage, setCreateTaskMessage] = React.useState<{ text: string; type: MessageBarType } | undefined>(undefined);
  const [modifyTaskBusy, setModifyTaskBusy] = React.useState(false);
  const [showModifyTaskConfirmation, setShowModifyTaskConfirmation] = React.useState(false);
  const [modifyTaskMessage, setModifyTaskMessage] = React.useState<{ text: string; type: MessageBarType } | undefined>(undefined);

  const hasTaskId = hasDisplayValue(taskId);
  const createTaskActionRule = React.useMemo(
    () => getCreateTaskActionRule({
      createTaskBusy,
      saleId,
      taskId,
      hasCreateTaskHandler: Boolean(onCreateTask),
      canCreateTask,
    }),
    [canCreateTask, createTaskBusy, onCreateTask, saleId, taskId],
  );
  const auditHistoryActionRule = React.useMemo(
    () => getAuditHistoryActionRule({
      hasHandler: Boolean(onOpenAuditHistory),
    }),
    [onOpenAuditHistory],
  );
  const canShowModifyTaskButton = React.useMemo(
    () => canShowModifyTaskAction(statusText),
    [statusText],
  );
  const modifyTaskActionRule = React.useMemo(
    () => getModifyTaskActionRule({
      canModifyTask,
      hasModifyTaskHandler: Boolean(onModifyTask),
      modifyTaskBusy,
    }),
    [canModifyTask, modifyTaskBusy, onModifyTask],
  );

  React.useEffect(() => {
    if (hasTaskId) {
      setCreateTaskBusy(false);
    }
  }, [hasTaskId, taskId]);

  const handleCreateTask = React.useCallback(async () => {
    if (!onCreateTask || createTaskActionRule.disabled) {
      return;
    }

    setCreateTaskBusy(true);
    setCreateTaskMessage(undefined);
    try {
      await Promise.resolve(onCreateTask());
      setCreateTaskMessage({ text: 'Manual SVT task created and assigned to you.', type: MessageBarType.success });
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message.trim()
        : 'Unable to create task. Please try again.';
      setCreateTaskMessage({ text: message, type: MessageBarType.error });
    } finally {
      setCreateTaskBusy(false);
    }
  }, [createTaskActionRule.disabled, onCreateTask]);

  const handleOpenModifyTaskConfirmation = React.useCallback(() => {
    if (!onModifyTask || modifyTaskActionRule.disabled) {
      return;
    }

    setModifyTaskMessage(undefined);
    setShowModifyTaskConfirmation(true);
  }, [modifyTaskActionRule.disabled, onModifyTask]);

  const handleCancelModifyTask = React.useCallback(() => {
    if (modifyTaskBusy) {
      return;
    }

    setShowModifyTaskConfirmation(false);
  }, [modifyTaskBusy]);

  const handleConfirmModifyTask = React.useCallback(async () => {
    if (!onModifyTask || modifyTaskActionRule.disabled) {
      return;
    }

    setModifyTaskBusy(true);
    setModifyTaskMessage(undefined);
    try {
      await Promise.resolve(onModifyTask());
      setShowModifyTaskConfirmation(false);
      setModifyTaskMessage({ text: 'SVT task updated and assigned to you.', type: MessageBarType.success });
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message.trim()
        : 'Unable to modify SVT task. Please try again.';
      setModifyTaskMessage({ text: message, type: MessageBarType.error });
    } finally {
      setModifyTaskBusy(false);
    }
  }, [modifyTaskActionRule.disabled, onModifyTask]);

  const createTaskDisabled = createTaskActionRule.disabled;
  const createTaskUnavailableReason = createTaskActionRule.reason;
  const modifyTaskUnavailableReason = modifyTaskActionRule.reason ?? 'Modify task is currently unavailable.';

  return (
    <section className="voa-sale-details-card" aria-labelledby="svt-task-details-heading">
      <div className="voa-sale-details-card__header">
        <Text as="h2" id="svt-task-details-heading" variant="large" className="voa-sale-details-card__title">
          Sales Verification Task Details
        </Text>
      </div>

      <div className="voa-task-panel-grid">
        <article className="voa-task-panel" aria-labelledby="record-identifiers-heading">
          <h3 id="record-identifiers-heading" className="voa-task-panel__title">Record identifiers</h3>
          <KvpRow label="Sale ID" value={<span className="voa-readonly-pill">{saleId}</span>} />
          <KvpRow label="Task ID" value={<span className="voa-readonly-pill">{taskId}</span>} />
        </article>

        <article className="voa-task-panel" aria-labelledby="status-heading">
          <h3 id="status-heading" className="voa-task-panel__title">Status</h3>
          <KvpRow
            label="Task Status"
            value={
              <span className={`voa-status-badge voa-status-badge--${statusTone}`} aria-label={`Status: ${statusText}`}>
                <Icon iconName={statusIconByTone[statusTone]} className="voa-status-badge__icon" />
                <span>{statusText}</span>
              </span>
            }
          />
        </article>

        <article className="voa-task-panel" aria-labelledby="ownership-heading">
          <h3 id="ownership-heading" className="voa-task-panel__title">Ownership</h3>
          <OwnershipRow label="Caseworker" value={assignedTo} />
          <OwnershipRow label="QC Reviewer" value={qcAssignedTo} />
        </article>

        <article className="voa-task-panel voa-task-panel--actions" aria-labelledby="actions-heading">
          <h3 id="actions-heading" className="voa-task-panel__title">Actions</h3>
          <div className="voa-task-actions">
            <DefaultButton
              text="Audit History"
              ariaLabel={auditHistoryActionRule.disabled
                ? auditHistoryActionRule.reason ?? 'Audit history is currently unavailable.'
                : 'Open audit history'}
              title={auditHistoryActionRule.reason}
              disabled={auditHistoryActionRule.disabled}
              onClick={() => { void onOpenAuditHistory?.(); }}
            />
            {canShowModifyTaskButton && (
              <DefaultButton
                text="Modify SVT Task"
                disabled={modifyTaskActionRule.disabled}
                ariaLabel={modifyTaskActionRule.disabled ? modifyTaskUnavailableReason : 'Modify SVT Task'}
                title={modifyTaskUnavailableReason}
                onClick={handleOpenModifyTaskConfirmation}
              />
            )}
            <DefaultButton
              text={createTaskBusy ? 'Creating Task...' : 'Create Task'}
              disabled={createTaskDisabled}
              ariaLabel={createTaskDisabled
                ? createTaskUnavailableReason ?? 'Create task is currently unavailable.'
                : 'Create sales verification task'}
              title={createTaskUnavailableReason}
              onClick={() => { void handleCreateTask(); }}
            />
          </div>
          {createTaskUnavailableReason && (hasTaskId || !canCreateTask) && (
            <Text variant="small" className="voa-task-actions__note">{createTaskUnavailableReason}</Text>
          )}
          {createTaskMessage && (
            <MessageBar
              messageBarType={createTaskMessage.type}
              isMultiline={false}
              onDismiss={() => setCreateTaskMessage(undefined)}
            >
              {createTaskMessage.text}
            </MessageBar>
          )}
          {modifyTaskMessage && (
            <MessageBar
              messageBarType={modifyTaskMessage.type}
              isMultiline={false}
              onDismiss={() => setModifyTaskMessage(undefined)}
            >
              {modifyTaskMessage.text}
            </MessageBar>
          )}
        </article>
      </div>

      <Dialog
        hidden={!showModifyTaskConfirmation}
        onDismiss={handleCancelModifyTask}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Modify SVT Task',
          subText: 'Are you sure you want to modify this SVT Task?',
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <DialogFooter>
          <PrimaryButton
            text="Yes"
            disabled={modifyTaskBusy}
            onClick={() => { void handleConfirmModifyTask(); }}
          />
          <DefaultButton
            text="No"
            disabled={modifyTaskBusy}
            onClick={handleCancelModifyTask}
          />
        </DialogFooter>
      </Dialog>
    </section>
  );
};

SalesVerificationTaskSection.displayName = 'SalesVerificationTaskSection';
