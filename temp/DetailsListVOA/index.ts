import './initFluentIcons';
import { IInputs, IOutputs } from './generated/ManifestTypes';
import * as React from 'react';
import { DetailsListControlShell } from './components/ControlShell/DetailsListControlShell';
import { DetailsListRuntimeController } from './services/DetailsListRuntimeController';

export class DetailsListVOA implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private readonly runtime = new DetailsListRuntimeController();

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
  ): void {
    this.runtime.init(context, notifyOutputChanged);
    try {
      context.mode.trackContainerResize(true);
    } catch {
      // Ignore hosts that do not support container resize tracking.
    }
  }

  public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    this.runtime.setContext(context);

    try {
      const raw = (context.parameters as unknown as Record<string, { raw?: boolean | string }>).perfLogsEnabled?.raw;
      const enabled = raw === true || String(raw ?? '').toLowerCase() === 'true';
      (globalThis as unknown as { SVT_PERF?: unknown }).SVT_PERF = enabled;
    } catch {
      // ignore
    }

    try {
      const raw = (context.parameters as unknown as Record<string, { raw?: boolean | string }>).debugConsole?.raw;
      const enabled = raw === true || String(raw ?? '').toLowerCase() === 'true';
      (globalThis as unknown as { SVT_DEBUG?: boolean }).SVT_DEBUG = enabled;
    } catch {
      // ignore
    }

    const pcfViewSalesEnabled = this.runtime.isPcfViewSalesDetailsEnabledFlag();
    this.runtime.syncPcfViewSalesEnabled(pcfViewSalesEnabled);

    const useManagerJourney = this.runtime.isManagerHomeScreen();
    this.runtime.setManagerJourneyActive(useManagerJourney);
    const requestContext = this.runtime.getActiveRequestContext();
    const sharePointCatalogChunks = this.runtime.getSharePointCatalogChunks();

    return React.createElement(DetailsListControlShell, {
      context,
      useManagerJourney,
      pcfViewSalesEnabled,
      showPcfDetails: pcfViewSalesEnabled && this.runtime.shouldShowPcfSaleDetails,
      saleDetailsJson: this.runtime.saleDetailsJson,
      saleDetailsReadOnly: this.runtime.isSaleDetailsReadOnly,
      saleDetailsReadOnlyReason: this.runtime.saleDetailsReadOnlyReason,
      saleDetailsCanCreateManualTask: this.runtime.canCreateManualTask,
      saleDetailsCanModifyTask: this.runtime.canModifySvtTask,
      saleDetailsCanProgressTask: this.runtime.canProgressSalesVerificationTask,
      saleDetailsCanSubmitQcOutcome: this.runtime.canSubmitQcOutcome,
      saleDetailsShowQcSection: this.runtime.shouldShowQcSection,
      currentUserDisplayName: this.runtime.currentUserDisplayName,
      loading: this.runtime.isViewSalePending,
      requestContext,
      sharePointCatalogChunks,
      fxEnvironmentUrl: this.runtime.getFxEnvironmentUrl(),
      vmsBaseUrl: this.runtime.getVmsBaseUrl(),
      onRowInvoke: (args) => this.runtime.handleRowInvoke(args),
      onSelectionChange: (args) => this.runtime.handleSelectionChange(args),
      onSelectionCountChange: (count) => this.runtime.handleSelectionCountChange(count),
      onBackToCanvas: () => this.runtime.handleBackToCanvas(),
      onContextChange: (args) => this.runtime.updateManagerJourneyContext(args),
      onDetailsBack: () => this.runtime.handleDetailsBack(),
      onDetailsRefresh: () => this.runtime.refreshDetails(),
      onCreateManualTask: (saleId) => this.runtime.createManualTask(saleId),
      onModifySvtTask: () => this.runtime.modifySvtTask(),
      onCompleteSalesVerificationTask: (payload) => this.runtime.handleSalesVerificationTaskAction('completeSalesVerificationTask', payload),
      onSubmitSalesVerificationTaskForQc: (payload) => this.runtime.handleSalesVerificationTaskAction('submitSalesVerificationTaskForQc', payload),
      onSubmitQcOutcome: (payload) => this.runtime.submitQcOutcome(payload),
      onOpenQcLog: () => this.runtime.openQcLog(),
      onOpenAuditHistory: () => this.runtime.openAuditHistory(),
    });
  }

  public getOutputs(): IOutputs {
    return this.runtime.getOutputs();
  }

  public destroy(): void {
    return;
  }
}





