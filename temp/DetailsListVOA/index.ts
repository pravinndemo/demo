import './initFluentIcons';
import { IInputs, IOutputs } from './generated/ManifestTypes';
import * as React from 'react';
import { PCFContext } from './components/context/PCFContext';
import { DetailsListHost } from './components/DetailsListHost/DetailsListHost';
import { StatutorySpatialUnitBrowser } from './components/SpatialUnitBrowser/StatutorySpatialUnitBrowser';
import { CONTROL_CONFIG } from './config/ControlConfig';
import { executeUnboundCustomApi, normalizeCustomApiName, resolveCustomApiOperationType } from './services/CustomApi';

export class DetailsListVOA implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private _notifyOutputChanged!: () => void;
  private _context!: ComponentFramework.Context<IInputs>;
  private _saleDetails = '';
  private selectedTaskId?: string;
  private selectedSaleId?: string;
  private selectedTaskIdsJson?: string;
  private selectedSaleIdsJson?: string;
  private selectedCount?: number;
  private backRequestId?: string;
  private actionType?: string;
  private actionRequestId?: string;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
  ): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
  }

  public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    this._context = context;
    try {
      const raw = (context.parameters as unknown as Record<string, { raw?: boolean | string }>).perfLogsEnabled?.raw;
      const enabled = raw === true || String(raw ?? '').toLowerCase() === 'true';
      (globalThis as unknown as { SVT_PERF?: unknown }).SVT_PERF = enabled;
    } catch {
      // ignore
    }

    return React.createElement(
      PCFContext.Provider,
      { value: context },
      React.createElement(
        React.Fragment,
        null,
        React.createElement(DetailsListHost, {
          context,
          onRowInvoke: (args) => {
            this.selectedTaskId = args?.taskId;
            this.selectedSaleId = args?.saleId;
            console.log('[DetailsListVOA] Row invoke:', { taskId: args?.taskId, saleId: args?.saleId });
            this.emitAction('viewSale');
            void this.onTaskClick(args?.taskId, args?.saleId);
          },
          onSelectionChange: (args) => {
            // Selection should only emit IDs and not fetch details
            this.selectedTaskId = args?.taskId;
            this.selectedSaleId = args?.saleId;
            this.selectedTaskIdsJson = JSON.stringify((args?.selectedTaskIds ?? []).filter((v) => !!v));
            this.selectedSaleIdsJson = JSON.stringify((args?.selectedSaleIds ?? []).filter((v) => !!v));
            const taskCount = args?.selectedTaskIds?.length ?? 0;
            const saleCount = args?.selectedSaleIds?.length ?? 0;
            this.selectedCount = taskCount || saleCount;
            this._saleDetails = '';
            this._notifyOutputChanged();
          },
          onSelectionCountChange: (count) => {
            this.selectedCount = count;
            this._notifyOutputChanged();
          },
          onBackRequested: () => {
            this.backRequestId = new Date().toISOString();
            console.log('[DetailsListVOA] Back requested:', { backRequestId: this.backRequestId });
            this.emitAction('back');
          },
        }),
        //React.createElement(StatutorySpatialUnitBrowser, null)
      ),
    );
  }

  public getOutputs(): IOutputs {
    const outputs = {
      selectedTaskId: this.selectedTaskId,
      selectedSaleId: this.selectedSaleId,
      selectedTaskIdsJson: this.selectedTaskIdsJson,
      selectedSaleIdsJson: this.selectedSaleIdsJson,
      selectedCount: this.selectedCount,
      saleDetails: this._saleDetails,
      actionType: this.actionType,
      actionRequestId: this.actionRequestId,
      backRequestId: this.backRequestId,
    } as IOutputs;
    if (this.actionRequestId) {
      this.actionType = undefined;
      this.actionRequestId = undefined;
    }
    return outputs;
  }

  public destroy(): void {
    return;
  }

  private async onTaskClick(taskId?: string, saleId?: string): Promise<void> {
    this._saleDetails = '';
    console.log('[DetailsListVOA] Fetching sale details:', { taskId, saleId });

    if (!saleId) {
      this._saleDetails = JSON.stringify(this.getEmptySaleRecord());
      console.log('[DetailsListVOA] Empty sale details returned (no saleId).');
      this._notifyOutputChanged();
      return;
    }

    try {
      const apiName = this.resolveViewSaleRecordApiName();
      if (!apiName) {
        throw new Error('View sale record API name is not configured.');
      }

      const customApiType = this.resolveCustomApiType();
      const rawPayload = await executeUnboundCustomApi<unknown>(
        this._context,
        apiName,
        { saleId },
        { operationType: customApiType },
      );
      const payload = this.unwrapCustomApiPayload(rawPayload);
      this._saleDetails = typeof payload === 'string'
        ? payload
        : JSON.stringify(payload ?? this.getEmptySaleRecord());
    } catch (error) {
      console.warn('Failed to fetch SVT sale record.', error);
      this._saleDetails = JSON.stringify(this.getEmptySaleRecord());
    }

    console.log('[DetailsListVOA] Sale details updated.', {
      hasDetails: !!this._saleDetails,
      length: this._saleDetails.length,
    });
    this._notifyOutputChanged();
  }

  private emitAction(type: 'back' | 'viewSale'): void {
    this.actionType = type;
    this.actionRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log('[DetailsListVOA] Action emitted:', {
      actionType: this.actionType,
      actionRequestId: this.actionRequestId,
    });
    this._notifyOutputChanged();
  }

  private resolveViewSaleRecordApiName(): string {
    const raw = (this._context.parameters as unknown as Record<string, { raw?: string }>).viewSaleRecordApiName?.raw;
    const fromContext = normalizeCustomApiName(typeof raw === 'string' ? raw : undefined);
    const fallback = normalizeCustomApiName(CONTROL_CONFIG.viewSaleRecordApiName);
    return fromContext || fallback || '';
  }

  private resolveCustomApiType(): number {
    const raw = (this._context.parameters as unknown as Record<string, { raw?: string }>).customApiType?.raw;
    const fromContext = typeof raw === 'string' ? raw : undefined;
    return resolveCustomApiOperationType(fromContext ?? CONTROL_CONFIG.customApiType);
  }

  private unwrapCustomApiPayload(payload: unknown): unknown {
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const raw = record.Result ?? record.result;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as unknown;
        } catch {
          return raw;
        }
      }
    }
    return payload;
  }

  private getEmptySaleRecord(): Record<string, unknown> {
    return {
      taskDetails: {},
      links: {},
      bandingInfo: {},
      propertyAttributes: {},
      masterSale: {},
      repeatSaleInfo: {},
      welshLandTax: {},
      landRegistryData: {},
      salesParticularInfo: {},
      salesVerificationInfo: {},
    };
  }

}
