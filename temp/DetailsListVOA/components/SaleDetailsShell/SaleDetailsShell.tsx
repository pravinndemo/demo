import * as React from 'react';
import { DefaultButton, MessageBar, MessageBarType, Spinner, SpinnerSize, Stack, Text } from '@fluentui/react';
import { NEW_TAB_HINT_ID } from './constants';
import { useSaleDetailsViewModel } from './useSaleDetailsViewModel';
import { PromotedMasterRecordViewModel, SaleDetailsShellProps, SalesParticularDraftPayload } from './types';
import { SalesVerificationTaskSection } from './sections/SalesVerificationTaskSection';
import { HyperlinksSection } from './sections/HyperlinksSection';
import { BandingSection } from './sections/BandingSection';
import { PadSection } from './sections/PadSection';
import { MasterSaleSection } from './sections/MasterSaleSection';
import { WlttSection } from './sections/WlttSection';
import { LrppdSection } from './sections/LrppdSection';
import { SalesParticularSection } from './sections/SalesParticularSection';
import { SalesParticularReferenceModal } from './sections/SalesParticularReferenceModal';
import { SalesVerificationSection } from './sections/SalesVerificationSection';
import { AuditHistoryModal } from './sections/AuditHistoryModal';
import { getRefreshActionRule } from './rules/ViewSaleActionRules';

export const SaleDetailsShell: React.FC<SaleDetailsShellProps> = ({
  saleDetailsJson,
  sharePointCatalogChunks,
  fxEnvironmentUrl,
  vmsBaseUrl,
  readOnly = false,
  readOnlyReason,
  canCreateManualTask = false,
  canModifyTask = false,
  canProgressTask = false,
  canSubmitQcOutcome = false,
  showQcSection = true,
  currentUserDisplayName = '',
  loading = false,
  onBack,
  onRefresh,
  onCreateManualTask,
  onModifySvtTask,
  onCompleteSalesVerificationTask,
  onSubmitSalesVerificationTaskForQc,
  onSubmitQcOutcome,
  onOpenQcLog,
  onOpenAuditHistory,
}) => {
  const model = useSaleDetailsViewModel(saleDetailsJson, sharePointCatalogChunks, fxEnvironmentUrl, vmsBaseUrl);
  const refreshActionRule = React.useMemo(() => getRefreshActionRule({ loading }), [loading]);
  const [salesParticularDraft, setSalesParticularDraft] = React.useState<SalesParticularDraftPayload>({
    reviewStatusKey: model.salesParticular.reviewStatusKey,
    linkParticulars: model.salesParticular.linkParticulars,
    kitchenAge: model.salesParticular.kitchenAge,
    kitchenSpecification: model.salesParticular.kitchenSpecification,
    bathroomAge: model.salesParticular.bathroomAge,
    bathroomSpecification: model.salesParticular.bathroomSpecification,
    glazing: model.salesParticular.glazing,
    heating: model.salesParticular.heating,
    decorativeFinishes: model.salesParticular.decorativeFinishes,
    conditionScore: model.salesParticular.conditionScore,
    conditionCategory: model.salesParticular.conditionCategory,
    particularsNotes: model.salesParticular.particularsNotes,
  });

  const [padConfirmationKey, setPadConfirmationKey] = React.useState<string | undefined>(undefined);
  const [activeReferenceAttribute, setActiveReferenceAttribute] = React.useState<string | undefined>(undefined);
  const [activeAuditView, setActiveAuditView] = React.useState<'main' | 'qc' | undefined>(undefined);
  const [auditHistoryLoading, setAuditHistoryLoading] = React.useState(false);
  const [promotedMasterRecord, setPromotedMasterRecord] = React.useState<PromotedMasterRecordViewModel | undefined>(
    model.initialPromotedMasterRecord,
  );
  const [promotionMessage, setPromotionMessage] = React.useState<string | undefined>(undefined);
  const promotionMessageTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    setPadConfirmationKey(model.initialPadConfirmationKey);
  }, [model.initialPadConfirmationKey]);

  React.useEffect(() => {
    setPromotedMasterRecord(model.initialPromotedMasterRecord);
    setPromotionMessage(undefined);
  }, [model.saleId, model.taskId, model.initialPromotedMasterRecord]);

  React.useEffect(() => {
    setSalesParticularDraft({
      reviewStatusKey: model.salesParticular.reviewStatusKey,
      linkParticulars: model.salesParticular.linkParticulars,
      kitchenAge: model.salesParticular.kitchenAge,
      kitchenSpecification: model.salesParticular.kitchenSpecification,
      bathroomAge: model.salesParticular.bathroomAge,
      bathroomSpecification: model.salesParticular.bathroomSpecification,
      glazing: model.salesParticular.glazing,
      heating: model.salesParticular.heating,
      decorativeFinishes: model.salesParticular.decorativeFinishes,
      conditionScore: model.salesParticular.conditionScore,
      conditionCategory: model.salesParticular.conditionCategory,
      particularsNotes: model.salesParticular.particularsNotes,
    });
  }, [model.saleId, model.taskId, model.salesParticular]);


  const clearPromotionMessageTimer = React.useCallback(() => {
    if (promotionMessageTimeoutRef.current) {
      clearTimeout(promotionMessageTimeoutRef.current);
      promotionMessageTimeoutRef.current = undefined;
    }
  }, []);

  React.useEffect(() => () => {
    clearPromotionMessageTimer();
  }, [clearPromotionMessageTimer]);

  const showPromotionMessage = React.useCallback((message: string) => {
    clearPromotionMessageTimer();
    setPromotionMessage(message);
    promotionMessageTimeoutRef.current = setTimeout(() => {
      setPromotionMessage(undefined);
      promotionMessageTimeoutRef.current = undefined;
    }, 1500);
  }, [clearPromotionMessageTimer]);

  const openReferenceModal = React.useCallback((attributeKey: string) => {
    setActiveReferenceAttribute(attributeKey);
  }, []);

  const closeReferenceModal = React.useCallback(() => {
    setActiveReferenceAttribute(undefined);
  }, []);

  const closeAuditHistoryModal = React.useCallback(() => {
    setActiveAuditView(undefined);
  }, []);

  const openMainAuditHistory = React.useCallback(async () => {
    setActiveAuditView('main');
    if (!onOpenAuditHistory) {
      return;
    }

    setAuditHistoryLoading(true);
    try {
      await Promise.resolve(onOpenAuditHistory());
    } finally {
      setAuditHistoryLoading(false);
    }
  }, [onOpenAuditHistory]);

  const openQcAuditHistory = React.useCallback(async () => {
    setActiveAuditView('qc');
    if (!onOpenQcLog) {
      return;
    }

    setAuditHistoryLoading(true);
    try {
      await Promise.resolve(onOpenQcLog());
    } finally {
      setAuditHistoryLoading(false);
    }
  }, [onOpenQcLog]);

  const handleWlttPromote = React.useCallback((record: (typeof model.wlttRecords)[number]) => {
    if (readOnly) {
      return;
    }

    setPromotedMasterRecord({
      source: 'WLTT',
      id: record.wlttId,
      salePrice: record.transactionPrice,
      transactionDate: record.transactionDate,
      hpiAdjustedPrice: record.hpiAdjustedPrice,
      ratio: record.ratio,
    });
    showPromotionMessage('WLTT Record is Promoted to Master');
  }, [readOnly, showPromotionMessage]);

  const handleLrppdPromote = React.useCallback((record: (typeof model.lrppdRecords)[number]) => {
    if (readOnly) {
      return;
    }

    setPromotedMasterRecord({
      source: 'LRPPD',
      id: record.lrppdId,
      salePrice: record.transactionPrice,
      transactionDate: record.transactionDate,
      hpiAdjustedPrice: record.hpiAdjustedPrice,
      ratio: record.ratio,
    });
    showPromotionMessage('LR PPD Record is Promoted to Master');
  }, [readOnly, showPromotionMessage]);

  const displayMasterSale = React.useMemo(() => {
    if (!promotedMasterRecord) {
      return model.masterSale;
    }

    return {
      ...model.masterSale,
      salePrice: promotedMasterRecord.salePrice,
      transactionDate: promotedMasterRecord.transactionDate,
      hpiAdjustedPrice: promotedMasterRecord.hpiAdjustedPrice,
      ratio: promotedMasterRecord.ratio,
      saleSource: promotedMasterRecord.source,
    };
  }, [model.masterSale, promotedMasterRecord]);

  const activeAuditModel = activeAuditView === 'qc' ? model.qcAuditHistory : model.mainAuditHistory;
  const activeAuditTitle = activeAuditView === 'qc' ? 'QC Audit Log' : 'Sales Verification Audit History';

  return (
    <div className="voa-sale-details-shell" role="region" aria-label="Sale Record Details">
      <div className="voa-sale-details-shell__content">
        <header className="voa-sale-details-shell__header">
          <DefaultButton
            className="voa-sale-details-shell__header-btn"
            text="Back"
            iconProps={{ iconName: 'Back' }}
            onClick={onBack}
            ariaLabel="Back"
          />
          <Text as="h1" variant="xLarge" className="voa-sale-details-shell__title">
            Sale Record
          </Text>
          <DefaultButton
            className="voa-sale-details-shell__header-btn voa-sale-details-shell__header-btn--right"
            text="Refresh"
            iconProps={{ iconName: 'Refresh' }}
            onClick={() => { void onRefresh(); }}
            disabled={refreshActionRule.disabled}
            ariaLabel="Refresh sale record details"
          />
        </header>

        {loading && (
          <div className="voa-view-sale-pending-note" role="status" aria-live="polite" aria-label="Loading sale record details">
            <Spinner size={SpinnerSize.small} aria-hidden />
            <span>Loading sale record...</span>
          </div>
        )}

        {readOnly && readOnlyReason && (
          <MessageBar messageBarType={MessageBarType.info} isMultiline={false}>
            {readOnlyReason}
          </MessageBar>
        )}

        {promotionMessage && (
          <MessageBar
            messageBarType={MessageBarType.success}
            isMultiline={false}
            onDismiss={() => setPromotionMessage(undefined)}
          >
            {promotionMessage}
          </MessageBar>
        )}

        <span id={NEW_TAB_HINT_ID} className="voa-visually-hidden">Opens in a new browser tab.</span>

        <Stack tokens={{ childrenGap: 12 }} className="voa-sale-details-sections">
          <SalesVerificationTaskSection
            saleId={model.saleId}
            taskId={model.taskId}
            statusText={model.statusText}
            statusTone={model.statusTone}
            assignedTo={model.assignedTo}
            qcAssignedTo={model.qcAssignedTo}
            onOpenAuditHistory={openMainAuditHistory}
            canCreateTask={canCreateManualTask}
            canModifyTask={canModifyTask}
            onCreateTask={onCreateManualTask
              ? () => Promise.resolve(onCreateManualTask(model.saleId))
              : undefined}
            onModifyTask={onModifySvtTask}
          />

          <HyperlinksSection links={model.externalLinks} newTabHintId={NEW_TAB_HINT_ID} />

          <BandingSection
            address={model.address}
            addressLink={model.addressLink}
            billingAuthority={model.billingAuthority}
            band={model.band}
            bandingEffectiveDate={model.bandingEffectiveDate}
            composite={model.composite}
            newTabHintId={NEW_TAB_HINT_ID}
          />

          <PadSection
            padStatusDisplay={model.padStatusDisplay}
            padStatusLabel={model.padStatusLabel}
            isActiveRequestPresent={model.isActiveRequestPresent}
            effectiveDate={model.effectiveDate}
            effectiveTo={model.effectiveTo}
            plotSize={model.plotSize}
            attributeGroups={model.attributeGroups}
            vscCodes={model.vscCodes}
            sourceCodes={model.sourceCodes}
            padConfirmationKey={padConfirmationKey}
            onPadConfirmationChange={setPadConfirmationKey}
            readOnly={readOnly}
          />

          <MasterSaleSection masterSale={displayMasterSale} />
          <WlttSection
            records={model.wlttRecords}
            currentMasterRecordId={promotedMasterRecord?.source === 'WLTT' ? promotedMasterRecord.id : undefined}
            onPromoteRecord={handleWlttPromote}
            readOnly={readOnly}
          />
          <LrppdSection
            records={model.lrppdRecords}
            currentMasterRecordId={promotedMasterRecord?.source === 'LRPPD' ? promotedMasterRecord.id : undefined}
            onPromoteRecord={handleLrppdPromote}
            readOnly={readOnly}
          />
          <SalesParticularSection model={model.salesParticular} onOpenReference={openReferenceModal} readOnly={readOnly} onDraftChange={setSalesParticularDraft} />
          <SalesVerificationSection
            model={model.salesVerification}
            taskStatus={model.statusText}
            salesParticularModel={salesParticularDraft}
            padConfirmationKey={padConfirmationKey}
            onCompleteTask={onCompleteSalesVerificationTask}
            onSubmitForQc={onSubmitSalesVerificationTaskForQc}
            onSubmitQcOutcome={onSubmitQcOutcome}
            onOpenQcLog={openQcAuditHistory}
            promotedMasterRecord={promotedMasterRecord}
            readOnly={readOnly}
            canProgressTask={canProgressTask}
            canSubmitQcOutcome={canSubmitQcOutcome}
            showQcSection={showQcSection}
            qcAssignedTo={model.qcAssignedTo}
            currentUserDisplayName={currentUserDisplayName}
          />
        </Stack>
      </div>

      <SalesParticularReferenceModal
        isOpen={Boolean(activeReferenceAttribute)}
        attributeKey={activeReferenceAttribute}
        references={model.salesParticular.referenceImages}
        onDismiss={closeReferenceModal}
      />

      <AuditHistoryModal
        isOpen={Boolean(activeAuditView)}
        title={activeAuditTitle}
        model={activeAuditModel}
        loading={auditHistoryLoading}
        onDismiss={closeAuditHistoryModal}
      />
    </div>
  );
};

SaleDetailsShell.displayName = 'SaleDetailsShell';











