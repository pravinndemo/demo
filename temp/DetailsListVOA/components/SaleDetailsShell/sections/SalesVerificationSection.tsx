import * as React from 'react';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Dropdown,
  Icon,
  IDropdownOption,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Text,
  TextField,
} from '@fluentui/react';
import {
  PromotedMasterRecordViewModel,
  QcOutcomeActionPayload,
  SalesParticularDraftPayload,
  SalesVerificationActionPayload,
  SalesVerificationViewModel,
} from '../types';
import {
  getCompleteSalesVerificationTaskActionRule,
  getQcLogActionRule,
  getSalesVerificationEditRule,
  getSubmitForQcActionRule,
  getSubmitQcOutcomeActionRule,
} from '../rules/ViewSaleActionRules';

interface SalesVerificationSectionProps {
  model: SalesVerificationViewModel;
  taskStatus: string;
  salesParticularModel: SalesParticularDraftPayload;
  padConfirmationKey?: string;
  onCompleteTask?: (payload: SalesVerificationActionPayload) => void | Promise<void>;
  onSubmitForQc?: (payload: SalesVerificationActionPayload) => void | Promise<void>;
  onSubmitQcOutcome?: (payload: QcOutcomeActionPayload) => void | Promise<void>;
  onOpenQcLog?: () => void | Promise<void>;
  promotedMasterRecord?: PromotedMasterRecordViewModel;
  readOnly?: boolean;
  canProgressTask?: boolean;
  canSubmitQcOutcome?: boolean;
  showQcSection?: boolean;
  qcAssignedTo?: string;
  currentUserDisplayName?: string;
}

const USEFUL_OPTIONS: IDropdownOption[] = [
  { key: 'yes', text: 'Yes' },
  { key: 'no', text: 'No' },
];

const WHY_NOT_OPTIONS: IDropdownOption[] = [
  { key: 'connected-parties', text: 'Connected parties' },
  { key: 'dilapidated-property', text: 'Dilapidated property' },
  { key: 'exchange-of-property', text: 'Exchange of property' },
  { key: 'includes-other-property', text: 'Includes other property' },
  { key: 'market-value-not-useful-specialist-property', text: 'Market value but not useful for modelling - Specialist property' },
  { key: 'market-value-not-useful-other', text: 'Market value but not useful for modelling - Other' },
  { key: 'not-market-value', text: 'Not market value' },
  { key: 'reflects-development-potential', text: 'Reflects development potential' },
  { key: 'sale-linked-to-incorrect-property', text: 'Sale linked to incorrect property' },
  { key: 'special-purchaser', text: 'Special purchaser' },
  { key: 'tenant-purchase', text: 'Tenant purchase' },
  { key: 'undivided-share', text: 'Undivided share' },
];


const QC_OUTCOME_OPTIONS: IDropdownOption[] = [
  { key: 'pass', text: 'Pass' },
  { key: 'fail', text: 'Fail' },
];

const toQcOutcomeKey = (value: string): string | undefined => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'pass' || normalized === 'passed') {
    return 'pass';
  }

  if (normalized === 'fail' || normalized === 'failed') {
    return 'fail';
  }

  return undefined;
};

const toQcOutcomeValue = (value?: string): 'Pass' | 'Fail' | '' => {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'pass') {
    return 'Pass';
  }

  if (normalized === 'fail') {
    return 'Fail';
  }

  return '';
};

const resolveQcSubmitButtonText = (taskStatus: string): string => {
  const normalized = taskStatus.trim().toLowerCase();
  if (normalized === 'reassigned to qc') {
    return 'Submit Reassigned QC Outcome';
  }

  return 'Submit QC Outcome';
};

const SALES_PARTICULAR_REQUIRED_FIELDS: { key: keyof SalesParticularDraftPayload; message: string }[] = [
  { key: 'kitchenAge', message: 'Select the kitchen age' },
  { key: 'kitchenSpecification', message: 'Select the kitchen spec' },
  { key: 'bathroomAge', message: 'Select the bathroom age' },
  { key: 'bathroomSpecification', message: 'Select the bathroom spec' },
  { key: 'glazing', message: 'Select the glazing' },
  { key: 'heating', message: 'Select the heating' },
  { key: 'decorativeFinishes', message: 'Select the decorative finishes' },
];

const trimValue = (value: string | undefined): string => (value ?? '').trim();

const toUsefulKey = (raw: string): string | undefined => {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'no' || normalized === 'notuseful' || normalized === 'not useful sale' || normalized === 'not useful') {
    return 'no';
  }

  if (normalized === 'yes' || normalized === 'useful' || normalized === 'useful sale' || normalized === 'investigate can use') {
    return 'yes';
  }

  return undefined;
};

const toUsefulValue = (key?: string): string => {
  if (!key) {
    return '';
  }
  const match = USEFUL_OPTIONS.find((option) => String(option.key) === key);
  return match?.text ?? key;
};

const toWhyKey = (raw: string): string | undefined => {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  const match = WHY_NOT_OPTIONS.find((option) => option.text.toLowerCase() === normalized || option.key.toString().toLowerCase() === normalized);
  return (match?.key as string | undefined) ?? undefined;
};

const toWhyValue = (key?: string): string => {
  if (!key) {
    return '';
  }
  const match = WHY_NOT_OPTIONS.find((option) => String(option.key) === key);
  return match?.text ?? key;
};

const getWhyOptions = (rawWhyNotUseful: string): IDropdownOption[] => {
  const trimmed = rawWhyNotUseful.trim();
  if (!trimmed) {
    return WHY_NOT_OPTIONS;
  }

  const exists = WHY_NOT_OPTIONS.some((option) => option.text.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return WHY_NOT_OPTIONS;
  }

  return [{ key: trimmed, text: trimmed }, ...WHY_NOT_OPTIONS];
};

export const SalesVerificationSection: React.FC<SalesVerificationSectionProps> = ({
  model,
  taskStatus,
  salesParticularModel,
  padConfirmationKey,
  onCompleteTask,
  onSubmitForQc,
  onSubmitQcOutcome,
  onOpenQcLog,
  promotedMasterRecord,
  readOnly = false,
  canProgressTask = false,
  canSubmitQcOutcome = false,
  showQcSection = true,
  qcAssignedTo = '',
  currentUserDisplayName = '',
}) => {
  const [isSaleUsefulKey, setIsSaleUsefulKey] = React.useState<string | undefined>(toUsefulKey(model.isSaleUseful));
  const [whyNotUsefulKey, setWhyNotUsefulKey] = React.useState<string | undefined>(toWhyKey(model.whyNotUseful) ?? (model.whyNotUseful || undefined));
  const [additionalNotes, setAdditionalNotes] = React.useState(model.additionalNotes);
  const [isSaleUsefulError, setIsSaleUsefulError] = React.useState<string | undefined>(undefined);
  const [whyNotUsefulError, setWhyNotUsefulError] = React.useState<string | undefined>(undefined);
  const [mandatoryErrorMessages, setMandatoryErrorMessages] = React.useState<string[]>([]);
  const [busyAction, setBusyAction] = React.useState<'complete' | 'submit' | 'qclog' | 'qcsubmit' | undefined>(undefined);
  const [showSubmitForQcDialog, setShowSubmitForQcDialog] = React.useState(false);
  const [qcRemarks, setQcRemarks] = React.useState(model.remarks);
  const [submitForQcRemarksError, setSubmitForQcRemarksError] = React.useState<string | undefined>(undefined);
  const [qcOutcomeKey, setQcOutcomeKey] = React.useState<string | undefined>(toQcOutcomeKey(model.qcOutcome));
  const [qcOutcomeRemarks, setQcOutcomeRemarks] = React.useState(model.qcRemark);
  const [qcOutcomeSelectionError, setQcOutcomeSelectionError] = React.useState<string | undefined>(undefined);
  const [qcOutcomeRemarksError, setQcOutcomeRemarksError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setIsSaleUsefulKey(toUsefulKey(model.isSaleUseful));
    setWhyNotUsefulKey(toWhyKey(model.whyNotUseful) ?? (model.whyNotUseful || undefined));
    setAdditionalNotes(model.additionalNotes);
    setQcRemarks(model.remarks);
    setQcOutcomeKey(toQcOutcomeKey(model.qcOutcome));
    setQcOutcomeRemarks(model.qcRemark);
    setIsSaleUsefulError(undefined);
    setWhyNotUsefulError(undefined);
    setMandatoryErrorMessages([]);
    setSubmitForQcRemarksError(undefined);
    setQcOutcomeSelectionError(undefined);
    setQcOutcomeRemarksError(undefined);
    setShowSubmitForQcDialog(false);
  }, [model]);

  const isNotUseful = isSaleUsefulKey === 'no';
  const maxNotesLength = 2000;
  const notesRemaining = Math.max(0, maxNotesLength - additionalNotes.length);

  const whyNotOptions = React.useMemo(() => getWhyOptions(model.whyNotUseful), [model.whyNotUseful]);

  const qcSummary = [model.qcOutcome, model.qcRemark, model.qcReviewedBy]
    .filter((value) => value?.trim() && value.trim() !== '-')
    .join(' - ');
  const qcRemarksMaxLength = 2000;
  const qcRemarksRemaining = Math.max(0, qcRemarksMaxLength - qcOutcomeRemarks.length);
  const qcOutcomeIsFail = qcOutcomeKey === 'fail';
  const qcRemarksRequiredMessage = 'Please provide QC remarks before submitting';
  const shouldShowQcRemarksRequiredMessage = canSubmitQcOutcome && qcOutcomeIsFail && !trimValue(qcOutcomeRemarks);
  const effectiveQcOutcomeRemarksError = qcOutcomeRemarksError ?? (shouldShowQcRemarksRequiredMessage ? qcRemarksRequiredMessage : undefined);
  const qcUndertakenByDisplay = trimValue(
    canSubmitQcOutcome
      ? (qcAssignedTo || currentUserDisplayName || model.qcReviewedBy)
      : (model.qcReviewedBy || qcAssignedTo),
  ) || '-';
  const showCaseworkerActions = !canSubmitQcOutcome && showQcSection;
  const qcSubmitButtonText = resolveQcSubmitButtonText(taskStatus);

  const payload: SalesVerificationActionPayload = React.useMemo(() => ({
    isSaleUseful: toUsefulValue(isSaleUsefulKey),
    whyNotUseful: isNotUseful ? toWhyValue(whyNotUsefulKey) : '',
    additionalNotes,
    remarks: model.remarks,
    promotedMasterRecord,
    salesParticularDraft: salesParticularModel,
    padConfirmationKey,
  }), [additionalNotes, isNotUseful, isSaleUsefulKey, model.remarks, padConfirmationKey, promotedMasterRecord, salesParticularModel, whyNotUsefulKey]);

  const busy = Boolean(busyAction);
  const salesVerificationEditRule = React.useMemo(
    () => getSalesVerificationEditRule({ busy, readOnly, canProgressTask }),
    [busy, canProgressTask, readOnly],
  );
  const completeTaskActionRule = React.useMemo(
    () => getCompleteSalesVerificationTaskActionRule({
      busy,
      readOnly,
      canProgressTask,
      hasHandler: Boolean(onCompleteTask),
      taskStatus,
    }),
    [busy, canProgressTask, onCompleteTask, readOnly, taskStatus],
  );
  const submitForQcActionRule = React.useMemo(
    () => getSubmitForQcActionRule({
      busy,
      readOnly,
      canProgressTask,
      hasHandler: Boolean(onSubmitForQc),
      taskStatus,
    }),
    [busy, canProgressTask, onSubmitForQc, readOnly, taskStatus],
  );
  const submitQcOutcomeActionRule = React.useMemo(
    () => getSubmitQcOutcomeActionRule({
      busy,
      hasHandler: Boolean(onSubmitQcOutcome),
      canSubmitQcOutcome,
      showQcSection,
      selectedOutcome: toQcOutcomeValue(qcOutcomeKey),
      remarks: qcOutcomeRemarks,
    }),
    [busy, canSubmitQcOutcome, onSubmitQcOutcome, qcOutcomeKey, qcOutcomeRemarks, showQcSection],
  );
  const qcLogActionRule = React.useMemo(
    () => getQcLogActionRule({
      busy,
      hasHandler: Boolean(onOpenQcLog),
      readOnly,
      canProgressTask,
    }),
    [busy, canProgressTask, onOpenQcLog, readOnly],
  );
  const editingDisabled = salesVerificationEditRule.disabled;

  const collectCrossSectionMandatoryErrors = React.useCallback((): string[] => {
    const nextErrors: string[] = [];

    if (!salesParticularModel.reviewStatusKey) {
      nextErrors.push('Sales Particulars: Enter the sales particulars');
    }

    if (salesParticularModel.reviewStatusKey === 'details-available') {
      SALES_PARTICULAR_REQUIRED_FIELDS.forEach(({ key, message }) => {
        if (!trimValue(salesParticularModel[key])) {
          nextErrors.push(`Sales Particulars: ${message}`);
        }
      });
    }

    if (isSaleUsefulKey === 'yes' && !trimValue(padConfirmationKey)) {
      nextErrors.push('Property Attribute Details: Select PAD confirmation');
    }

    return nextErrors;
  }, [isSaleUsefulKey, padConfirmationKey, salesParticularModel]);

  const validate = React.useCallback((): boolean => {
    const nextSaleUsefulError = !isSaleUsefulKey
      ? 'Select whether the sale is useful or not'
      : undefined;
    const nextWhyNotUsefulError = isSaleUsefulKey === 'no' && !whyNotUsefulKey
      ? 'Enter why the sale is not useful'
      : undefined;

    const crossSectionErrors = collectCrossSectionMandatoryErrors();
    const allErrors = [
      nextSaleUsefulError,
      nextWhyNotUsefulError,
      ...crossSectionErrors,
    ].filter((value): value is string => Boolean(value));

    setIsSaleUsefulError(nextSaleUsefulError);
    setWhyNotUsefulError(nextWhyNotUsefulError);
    setMandatoryErrorMessages(allErrors);

    return allErrors.length === 0;
  }, [collectCrossSectionMandatoryErrors, isSaleUsefulKey, whyNotUsefulKey]);

  const handleComplete = React.useCallback(async () => {
    if (!onCompleteTask || completeTaskActionRule.disabled) {
      return;
    }
    if (!validate()) {
      return;
    }

    setBusyAction('complete');
    try {
      await Promise.resolve(onCompleteTask(payload));
    } finally {
      setBusyAction(undefined);
    }
  }, [completeTaskActionRule.disabled, onCompleteTask, payload, validate]);

  const handleSubmitForQc = React.useCallback(() => {
    if (!onSubmitForQc || submitForQcActionRule.disabled) {
      return;
    }
    if (!validate()) {
      return;
    }

    setSubmitForQcRemarksError(undefined);
    setShowSubmitForQcDialog(true);
  }, [onSubmitForQc, submitForQcActionRule.disabled, validate]);

  const handleCancelSubmitForQc = React.useCallback(() => {
    if (busyAction === 'submit') {
      return;
    }

    setShowSubmitForQcDialog(false);
    setSubmitForQcRemarksError(undefined);
  }, [busyAction]);

  const handleConfirmSubmitForQc = React.useCallback(async () => {
    if (!onSubmitForQc || submitForQcActionRule.disabled) {
      return;
    }

    const normalizedRemarks = qcRemarks.trim();
    if (!normalizedRemarks) {
      setSubmitForQcRemarksError('Enter remarks before submitting for QC');
      return;
    }

    setBusyAction('submit');
    try {
      await Promise.resolve(onSubmitForQc({
        ...payload,
        remarks: normalizedRemarks,
      }));
      setShowSubmitForQcDialog(false);
      setSubmitForQcRemarksError(undefined);
    } finally {
      setBusyAction(undefined);
    }
  }, [onSubmitForQc, payload, qcRemarks, submitForQcActionRule.disabled]);


  const handleSubmitQcOutcome = React.useCallback(async () => {
    if (!onSubmitQcOutcome || submitQcOutcomeActionRule.disabled) {
      return;
    }

    const normalizedOutcome = toQcOutcomeValue(qcOutcomeKey);
    const normalizedRemarks = qcOutcomeRemarks.trim();

    if (!normalizedOutcome) {
      setQcOutcomeSelectionError('Select QC outcome before submitting.');
      return;
    }

    if (normalizedOutcome === 'Fail' && !normalizedRemarks) {
      setQcOutcomeRemarksError(qcRemarksRequiredMessage);
      return;
    }

    const reviewedBy = trimValue(qcAssignedTo)
      || trimValue(currentUserDisplayName)
      || trimValue(model.qcReviewedBy)
      || 'QC User';

    setQcOutcomeSelectionError(undefined);
    setQcOutcomeRemarksError(undefined);
    setBusyAction('qcsubmit');
    try {
      await Promise.resolve(onSubmitQcOutcome({
        qcOutcome: normalizedOutcome,
        qcRemark: normalizedRemarks,
        qcReviewedBy: reviewedBy,
      }));
    } finally {
      setBusyAction(undefined);
    }
  }, [
    currentUserDisplayName,
    model.qcReviewedBy,
    onSubmitQcOutcome,
    qcAssignedTo,
    qcOutcomeKey,
    qcOutcomeRemarks,
    qcRemarksRequiredMessage,
    submitQcOutcomeActionRule.disabled,
  ]);

  const handleQcLog = React.useCallback(async () => {
    if (!onOpenQcLog || qcLogActionRule.disabled) {
      return;
    }

    setBusyAction('qclog');
    try {
      await Promise.resolve(onOpenQcLog());
    } finally {
      setBusyAction(undefined);
    }
  }, [onOpenQcLog, qcLogActionRule.disabled]);

  return (
    <section className="voa-sale-details-card voa-sales-verification-card" aria-labelledby="sales-verification-heading">
      <div className="voa-sale-details-card__header">
        <Text as="h2" id="sales-verification-heading" variant="large" className="voa-sale-details-card__title">
          Sales Verification
        </Text>
      </div>

      <div className="voa-sales-verification-layout">
        <div className="voa-sales-verification-fields">
          <div className="voa-sales-verification-row">
            <label htmlFor="voa-sale-useful" className="voa-sales-verification-row__label">Is this sale useful?</label>
            <div className="voa-sales-verification-row__control">
              <Dropdown
                id="voa-sale-useful"
                placeholder="Select whether the sale is useful"
                selectedKey={isSaleUsefulKey}
                options={USEFUL_OPTIONS}
                disabled={editingDisabled}
                onChange={(_, option) => {
                  const nextKey = option?.key as string | undefined;
                  setIsSaleUsefulKey(nextKey);
                  setIsSaleUsefulError(undefined);
                  setMandatoryErrorMessages([]);
                  if (nextKey !== 'no') {
                    setWhyNotUsefulKey(undefined);
                    setWhyNotUsefulError(undefined);
                  }
                }}
                ariaLabel="Is this sale useful"
                className="voa-sales-verification-row__dropdown"
              />
              {isSaleUsefulError && <span className="voa-sales-verification-row__error">{isSaleUsefulError}</span>}
            </div>
          </div>

          {isNotUseful && (
            <div className="voa-sales-verification-row">
              <label htmlFor="voa-why-not-useful" className="voa-sales-verification-row__label">Why is the sale not useful?</label>
              <div className="voa-sales-verification-row__control">
                <Dropdown
                  id="voa-why-not-useful"
                  placeholder="Select why the sale is not useful"
                  selectedKey={whyNotUsefulKey}
                  options={whyNotOptions}
                  disabled={editingDisabled}
                  onChange={(_, option) => {
                    setWhyNotUsefulKey(option?.key as string | undefined);
                    setWhyNotUsefulError(undefined);
                    setMandatoryErrorMessages([]);
                  }}
                  ariaLabel="Why is the sale not useful"
                  className="voa-sales-verification-row__dropdown"
                />
                {whyNotUsefulError && <span className="voa-sales-verification-row__error">{whyNotUsefulError}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="voa-sales-verification-notes">
          <label htmlFor="voa-additional-notes" className="voa-sales-verification-notes__label">Additional Notes</label>
          <TextField
            id="voa-additional-notes"
            value={additionalNotes}
            placeholder="Enter additional notes"
            multiline
            rows={5}
            maxLength={maxNotesLength}
            disabled={editingDisabled}
            onChange={(_, nextValue) => setAdditionalNotes((nextValue ?? '').slice(0, maxNotesLength))}
            ariaLabel="Additional Notes"
            className="voa-sales-verification-notes__field"
          />
          <div className="voa-sales-verification-notes__count" aria-live="polite">
            Character(s) remaining: {notesRemaining.toLocaleString('en-GB')}
          </div>
        </div>
      </div>

      {mandatoryErrorMessages.length > 0 && (
        <MessageBar messageBarType={MessageBarType.error} className="voa-sales-verification-mandatory" role="alert">
          <div>Please ensure all mandatory fields are completed</div>
          <ul className="voa-sales-verification-mandatory__list">
            {mandatoryErrorMessages.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </MessageBar>
      )}

      {showCaseworkerActions && (
        <div className="voa-sales-verification-actions" role="group" aria-label="Sales verification actions">
          <DefaultButton
            text="Complete Sales Verification Task"
            ariaLabel="Complete Sales Verification Task"
            className="voa-sales-verification-action-btn"
            disabled={completeTaskActionRule.disabled}
            onClick={() => { void handleComplete(); }}
          />
          <DefaultButton
            text="Submit Sales Verification Task for QC"
            ariaLabel="Submit Sales Verification Task for QC"
            className="voa-sales-verification-action-btn"
            disabled={submitForQcActionRule.disabled}
            onClick={() => { void handleSubmitForQc(); }}
          />
        </div>
      )}

      {showQcSection && (
        <section className="voa-sales-verification-qc-section" aria-label="Quality Control">
          <Text as="h3" variant="mediumPlus" className="voa-sales-verification-qc-section__title">
            Quality Control
          </Text>

          <div className="voa-sales-verification-row">
            <label htmlFor="voa-qc-undertaken-by" className="voa-sales-verification-row__label">QC undertaken by</label>
            <div className="voa-sales-verification-row__control">
              <TextField
                id="voa-qc-undertaken-by"
                value={qcUndertakenByDisplay}
                readOnly
                disabled
                ariaLabel="QC undertaken by"
              />
            </div>
          </div>

          <div className="voa-sales-verification-row">
            <label htmlFor="voa-qc-outcome" className="voa-sales-verification-row__label">QC outcome</label>
            <div className="voa-sales-verification-row__control">
              <Dropdown
                id="voa-qc-outcome"
                placeholder="Select Outcome"
                selectedKey={qcOutcomeKey}
                options={QC_OUTCOME_OPTIONS}
                disabled={!canSubmitQcOutcome || busy}
                onChange={(_, option) => {
                  setQcOutcomeKey(option?.key as string | undefined);
                  setQcOutcomeSelectionError(undefined);
                  setQcOutcomeRemarksError(undefined);
                }}
                ariaLabel="QC outcome"
                className="voa-sales-verification-row__dropdown"
              />
              {qcOutcomeSelectionError && (
                <span className="voa-sales-verification-row__error">{qcOutcomeSelectionError}</span>
              )}
            </div>
          </div>

          <div className="voa-sales-verification-row voa-sales-verification-row--top">
            <label htmlFor="voa-qc-remarks" className="voa-sales-verification-row__label">QC remarks</label>
            <div className="voa-sales-verification-row__control">
              <TextField
                id="voa-qc-remarks"
                value={qcOutcomeRemarks}
                placeholder="Enter QC remarks"
                multiline
                rows={4}
                maxLength={qcRemarksMaxLength}
                disabled={!canSubmitQcOutcome || busy}
                required={qcOutcomeIsFail}
                errorMessage={effectiveQcOutcomeRemarksError}
                onChange={(_, nextValue) => {
                  setQcOutcomeRemarks((nextValue ?? '').slice(0, qcRemarksMaxLength));
                  setQcOutcomeRemarksError(undefined);
                }}
                ariaLabel="QC remarks"
                className="voa-sales-verification-notes__field"
              />
              <div className="voa-sales-verification-notes__count" aria-live="polite">
                Character(s) remaining: {qcRemarksRemaining.toLocaleString('en-GB')}
              </div>
            </div>
          </div>

          <div className="voa-sales-verification-qc-section__actions">
            <PrimaryButton
              text={qcSubmitButtonText}
              disabled={submitQcOutcomeActionRule.disabled}
              title={submitQcOutcomeActionRule.reason}
              onClick={() => { void handleSubmitQcOutcome(); }}
            />
            {shouldShowQcRemarksRequiredMessage && (
              <span className="voa-sales-verification-row__error">{qcRemarksRequiredMessage}</span>
            )}
          </div>
        </section>
      )}

      <div className="voa-sales-verification-qc-log">
        <span className="voa-sales-verification-qc-log__label">View QC Log:</span>
        <DefaultButton
          text="View QC Log"
          iconProps={{ iconName: 'History' }}
          ariaLabel="Open QC Log"
          className="voa-sales-verification-qc-log__btn"
          disabled={qcLogActionRule.disabled}
          onClick={() => { void handleQcLog(); }}
        />
        {qcSummary && (
          <span className="voa-sales-verification-qc-log__summary">
            <Icon iconName="Info" aria-hidden /> {qcSummary}
          </span>
        )}
      </div>

      <Dialog
        hidden={!showSubmitForQcDialog}
        onDismiss={handleCancelSubmitForQc}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Submit Sales Verification Task for QC',
          subText: 'Remarks are mandatory before submitting this task for Quality Control.',
        }}
        modalProps={{ isBlocking: true }}
      >
        <TextField
          id="voa-submit-qc-remarks"
          label="Remarks"
          value={qcRemarks}
          multiline
          rows={4}
          required
          errorMessage={submitForQcRemarksError}
          onChange={(_, nextValue) => {
            setQcRemarks(nextValue ?? '');
            setSubmitForQcRemarksError(undefined);
          }}
        />
        <DialogFooter>
          <PrimaryButton
            text="Submit"
            disabled={busyAction === 'submit'}
            onClick={() => { void handleConfirmSubmitForQc(); }}
          />
          <DefaultButton
            text="Cancel"
            disabled={busyAction === 'submit'}
            onClick={handleCancelSubmitForQc}
          />
        </DialogFooter>
      </Dialog>
    </section>
  );
};

SalesVerificationSection.displayName = 'SalesVerificationSection';
