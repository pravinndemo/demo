import * as React from 'react';
import { IInputs } from '../../generated/ManifestTypes';
import { PCFContext } from '../context/PCFContext';
import { DetailsListHost } from '../DetailsListHost/DetailsListHost';
import { ManagerJourneyShell } from '../HomeShell/ManagerJourneyShell';
import { SaleDetailsShell } from '../SaleDetailsShell/SaleDetailsShell';
import { QcOutcomeActionPayload, SalesVerificationActionPayload, SharePointCatalogChunks } from '../SaleDetailsShell/types';

interface DetailsListControlShellProps {
  context: ComponentFramework.Context<IInputs>;
  useManagerJourney: boolean;
  pcfViewSalesEnabled: boolean;
  showPcfDetails: boolean;
  saleDetailsJson: string;
  saleDetailsReadOnly: boolean;
  saleDetailsReadOnlyReason?: string;
  saleDetailsCanCreateManualTask: boolean;
  saleDetailsCanModifyTask: boolean;
  saleDetailsCanProgressTask: boolean;
  saleDetailsCanSubmitQcOutcome: boolean;
  saleDetailsShowQcSection: boolean;
  currentUserDisplayName: string;
  loading: boolean;
  requestContext: {
    country: string;
    listYear: string;
  };
  sharePointCatalogChunks: SharePointCatalogChunks;
  fxEnvironmentUrl: string;
  vmsBaseUrl: string;
  onRowInvoke: (args: { taskId?: string; saleId?: string; screenKind?: string; tableKey?: string }) => void | Promise<void>;
  onSelectionChange: (args: {
    taskId?: string;
    saleId?: string;
    selectedTaskIds?: string[];
    selectedSaleIds?: string[];
  }) => void;
  onSelectionCountChange: (count: number) => void;
  onBackToCanvas: () => void;
  onContextChange: (args: { country: string; listYear: string }) => void;
  onDetailsBack: () => void;
  onDetailsRefresh: () => Promise<void>;
  onCreateManualTask: (saleId: string) => Promise<void>;
  onModifySvtTask: () => Promise<void>;
  onCompleteSalesVerificationTask: (payload: SalesVerificationActionPayload) => void | Promise<void>;
  onSubmitSalesVerificationTaskForQc: (payload: SalesVerificationActionPayload) => void | Promise<void>;
  onSubmitQcOutcome: (payload: QcOutcomeActionPayload) => void | Promise<void>;
  onOpenQcLog: () => Promise<void>;
  onOpenAuditHistory: () => Promise<void>;
}

export const DetailsListControlShell: React.FC<DetailsListControlShellProps> = ({
  context,
  useManagerJourney,
  pcfViewSalesEnabled,
  showPcfDetails,
  saleDetailsJson,
  saleDetailsReadOnly,
  saleDetailsReadOnlyReason,
  saleDetailsCanCreateManualTask,
  saleDetailsCanModifyTask,
  saleDetailsCanProgressTask,
  saleDetailsCanSubmitQcOutcome,
  saleDetailsShowQcSection,
  currentUserDisplayName,
  loading,
  requestContext,
  sharePointCatalogChunks,
  fxEnvironmentUrl,
  vmsBaseUrl,
  onRowInvoke,
  onSelectionChange,
  onSelectionCountChange,
  onBackToCanvas,
  onContextChange,
  onDetailsBack,
  onDetailsRefresh,
  onCreateManualTask,
  onModifySvtTask,
  onCompleteSalesVerificationTask,
  onSubmitSalesVerificationTaskForQc,
  onSubmitQcOutcome,
  onOpenQcLog,
  onOpenAuditHistory,
}) => {
  const sharedHostProps = React.useMemo(
    () => ({
      context,
      onRowInvoke,
      onSelectionChange,
      onSelectionCountChange,
    }),
    [context, onRowInvoke, onSelectionChange, onSelectionCountChange],
  );

  const gridElement = React.useMemo(
    () => (
      useManagerJourney
        ? (
          <ManagerJourneyShell
            {...sharedHostProps}
            initialCountry={requestContext.country}
            initialListYear={requestContext.listYear}
            onContextChange={onContextChange}
          />
        ) : (
          <DetailsListHost
            {...sharedHostProps}
            onBackRequested={onBackToCanvas}
            countryOverride={requestContext.country}
            listYearOverride={requestContext.listYear}
          />
        )
    ),
    [onBackToCanvas, onContextChange, requestContext.country, requestContext.listYear, sharedHostProps, useManagerJourney],
  );

  const detailElement = React.useMemo(
    () => (
      <SaleDetailsShell
        saleDetailsJson={saleDetailsJson}
        sharePointCatalogChunks={sharePointCatalogChunks}
        fxEnvironmentUrl={fxEnvironmentUrl}
        vmsBaseUrl={vmsBaseUrl}
        readOnly={saleDetailsReadOnly}
        readOnlyReason={saleDetailsReadOnlyReason}
        canCreateManualTask={saleDetailsCanCreateManualTask}
        canModifyTask={saleDetailsCanModifyTask}
        canProgressTask={saleDetailsCanProgressTask}
        canSubmitQcOutcome={saleDetailsCanSubmitQcOutcome}
        showQcSection={saleDetailsShowQcSection}
        currentUserDisplayName={currentUserDisplayName}
        loading={loading}
        onBack={onDetailsBack}
        onRefresh={onDetailsRefresh}
        onCreateManualTask={onCreateManualTask}
        onModifySvtTask={onModifySvtTask}
        onCompleteSalesVerificationTask={onCompleteSalesVerificationTask}
        onSubmitSalesVerificationTaskForQc={onSubmitSalesVerificationTaskForQc}
        onSubmitQcOutcome={onSubmitQcOutcome}
        onOpenQcLog={onOpenQcLog}
        onOpenAuditHistory={onOpenAuditHistory}
      />
    ),
    [
      loading,
      onCompleteSalesVerificationTask,
      onCreateManualTask,
      onModifySvtTask,
      onDetailsBack,
      onDetailsRefresh,
      onOpenAuditHistory,
      onOpenQcLog,
      onSubmitSalesVerificationTaskForQc,
      onSubmitQcOutcome,
      saleDetailsJson,
      sharePointCatalogChunks,
      fxEnvironmentUrl,
      vmsBaseUrl,
      saleDetailsReadOnly,
      saleDetailsReadOnlyReason,
      saleDetailsCanCreateManualTask,
      saleDetailsCanModifyTask,
      saleDetailsCanProgressTask,
      saleDetailsCanSubmitQcOutcome,
      saleDetailsShowQcSection,
      currentUserDisplayName,
    ],
  );

  return (
    <PCFContext.Provider value={context}>
      <>
        <div style={{ display: showPcfDetails ? 'none' : 'block', height: '100%' }}>
          {gridElement}
        </div>
        {pcfViewSalesEnabled ? (
          <div style={{ display: showPcfDetails ? 'block' : 'none', height: '100%' }}>
            {detailElement}
          </div>
        ) : null}
      </>
    </PCFContext.Provider>
  );
};










