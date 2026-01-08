import './initFluentIcons';
import { IInputs, IOutputs } from './generated/ManifestTypes';
import * as React from 'react';
import { PCFContext } from './components/context/PCFContext';
import { DetailsListHost } from './components/DetailsListHost/DetailsListHost';
import { StatutorySpatialUnitBrowser } from './components/SpatialUnitBrowser/StatutorySpatialUnitBrowser';
import { SVTSaleRecord, SDLTRecord } from './models/SVTModels';
import { CONTROL_CONFIG } from './config/ControlConfig';

export class DetailsListVOA implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private _notifyOutputChanged!: () => void;
  private _context!: ComponentFramework.Context<IInputs>;
  private _saleDetails = '';
  private selectedTaskId?: string;
  private selectedSaleId?: string;
  private selectedTaskIdsJson?: string;
  private selectedSaleIdsJson?: string;

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
            void this.onTaskClick(args?.taskId, args?.saleId);
          },
          onSelectionChange: (args) => {
            // Selection should only emit IDs and not fetch details
            this.selectedTaskId = args?.taskId;
            this.selectedSaleId = args?.saleId;
            this.selectedTaskIdsJson = JSON.stringify((args?.selectedTaskIds ?? []).filter((v) => !!v));
            this.selectedSaleIdsJson = JSON.stringify((args?.selectedSaleIds ?? []).filter((v) => !!v));
            this._saleDetails = '';
            this._notifyOutputChanged();
          },
        }),
        //React.createElement(StatutorySpatialUnitBrowser, null)
      ),
    );
  }

  public getOutputs(): IOutputs {
    return {
      selectedTaskId: this.selectedTaskId,
      selectedSaleId: this.selectedSaleId,
      selectedTaskIdsJson: this.selectedTaskIdsJson,
      selectedSaleIdsJson: this.selectedSaleIdsJson,
      saleDetails: this._saleDetails,
    } as IOutputs;
  }

  public destroy(): void {
    return;
  }

  private async onTaskClick(taskId?: string, saleId?: string): Promise<void> {
    this._saleDetails = '';

    if (!taskId || !saleId) {
      this._notifyOutputChanged();
      return;
    }

    const baseUrl = CONTROL_CONFIG.apiBaseUrl?.trim();

    try {
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
      const apiUrl = `${normalizedBaseUrl}/sales/${saleId}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as SVTSaleRecord;
      this._saleDetails = JSON.stringify(data);
    } catch (error) {
      console.warn('Falling back to mock SVT sale record.', error);
      const mock = this.getMockSaleRecord(taskId, saleId);
      this._saleDetails = JSON.stringify(mock);
    }

    this._notifyOutputChanged();
  }

  private getMockSaleRecord(taskId?: string, saleId?: string): SVTSaleRecord {
    const sdltTransactions: SDLTRecord[] = [
      {
        SDLTID: '47758',
        TransactionPrice: '7000£',
        TransactionPremium: '750',
        TransactionDate: '17/08/2022',
        GroundRent: '300',
        Vendors: ['John', 'Smith'],
        Vendees: ['Jane', 'Roger'],
        VendorAgents: ['Agent1', 'Agent2'],
        VendeeAgents: ['Agent3', 'Agent4'],
        TypeofProperty: 'Terraced',
        TenureType: 'FreeHold',
        LeaseFrom: '17/12/2025',
        LeaseTerm: '12',
        IsMasterSaleRecord: true,
      },
      {
        SDLTID: '32457',
        TransactionPrice: '2000£',
        TransactionPremium: '750',
        TransactionDate: '17/09/1990',
        GroundRent: '300',
        Vendors: ['Mathew', 'Michael'],
        Vendees: ['James', 'Anderson'],
        VendorAgents: ['VendorAgent1', 'VendorAgent2'],
        VendeeAgents: ['VendeeAgents1', 'VendeeAgents2'],
        TypeofProperty: 'Terraced',
        TenureType: 'FreeHold',
        LeaseFrom: '17/09/1990',
        LeaseTerm: '12',
        IsMasterSaleRecord: false,
      },
    ];

    return {
      uprn: '18741001',
      task_ID: taskId ?? '8789878991',
      postcode: 'E14 4PH',
      address: '1 Bruno Avenue, MT84 2VY',
      billingAuthority: 'Cardiff',
      band: 'C',
      salePrice: '£395,000',
      transactionDate: '17/08/2022',
      latestModelPrice: '£380,000',
      latestAdjustedPrice: '£375,000',
      overallFlag: 'Investigate',
      ratio: '1.05',
      outlier: true,
      flags: ['A1', 'A5', 'B2'],
      usefulSale: 'Yes',
      notes: 'Needs kitchen age update',
      kitchenAge: '2015',
      kitchenSpec: 'Modern',
      bathroomAge: '2014',
      bathroomSpec: 'Basic',
      decorativeFinishes: 'Standard',
      conditionScore: 82,
      conditionCategory: 'B',
      propertyType: 'Terraced',
      LRPPDID: saleId ?? '452354',
      SDLT: sdltTransactions,
    };
  }

}
