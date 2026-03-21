import { IInputs, IOutputs } from '../generated/ManifestTypes';
import { QcOutcomeActionPayload, SalesVerificationActionPayload } from '../components/SaleDetailsShell/types';
import { CONTROL_CONFIG } from '../config/ControlConfig';
import { executeUnboundCustomApi } from './CustomApi';
import {
  extractTaskIdFromUnknown,
  parseManualTaskCreationResult,
  parseModifyTaskResult,
  resolveConfiguredApiName,
  resolveConfiguredApiType,
  resolveCurrentUserDisplayName,
  resolveCurrentUserId,
  RuntimeActionType,
  unwrapCustomApiPayload,
} from './runtime/actions';
import {
  AuditType,
  getEmptySaleRecord,
  mergeAuditHistoryDetails,
  mergeManualTaskCreationDetails,
  mergeModifyTaskDetails,
  mergeQcOutcomeDetails,
  mergeSalesVerificationDetails,
  resolveCurrentTaskIdFromDetails,
  resolveTaskIdForAuditLogs,
  toRecord,
} from './runtime/sale-details';
import {
  JourneyContext,
  SharePointCatalogChunks,
  isManagerHomeJourneyScreen,
  isPcfViewSalesDetailsEnabled,
  normalizeJourneyContext,
  resolveActiveRequestContext,
  resolveSharePointCatalogChunks,
} from './runtime/context-routing';
import { hasDisplayText, normalizeTextValue } from './runtime/text';

const CASEWORKER_TEAM_NAME = 'svt user team';
const CASEWORKER_ROLE_NAME = 'voa - svt user';
const MANAGER_TEAM_NAME = 'svt manager team';
const MANAGER_ROLE_NAME = 'voa - svt manager';
const QA_TEAM_NAME = 'svt qa team';
const QA_ROLE_NAME = 'voa - svt qa';
const EDITABLE_CASEWORKER_STATUSES = new Set(['assigned', 'assigned qc failed']);
const EDITABLE_QC_STATUSES = new Set(['assigned to qc', 'reassigned to qc']);
const MODIFY_TASK_ALLOWED_STATUSES = new Set(['complete', 'complete passed qc']);
const ENABLE_COUNTRY_LIST_YEAR_API_PARAMS = CONTROL_CONFIG.enableCountryListYearApiParams === true;

export class DetailsListRuntimeController {
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
  private actionSequence = 0;
  private viewSalePending?: boolean;
  private viewSaleRequestSeq = 0;
  private activeViewSaleRequestId?: number;
  private showPcfSaleDetails = false;
  private managerJourneyActive = false;
  private managerJourneyContext?: JourneyContext;
  private selectedScreenKind?: string;
  private selectedTableKey?: string;
  private saleDetailsReadOnly = false;
  private saleDetailsReadOnlyMessage?: string;
  private hasCaseworkerAccess = false;
  private hasManagerAccess = false;
  private hasQaAccess = false;
  private saleDetailsCanSubmitQcOutcome = false;
  private saleDetailsShowQcSection = true;
  private hasResolvedCaseworkerAccess = false;
  private caseworkerAccessRequest?: Promise<boolean>;

  public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
  }

  public setContext(context: ComponentFramework.Context<IInputs>): void {
    this._context = context;
  }

  public getOutputs(): IOutputs {
    return {
      selectedTaskId: this.selectedTaskId,
      selectedSaleId: this.selectedSaleId,
      selectedTaskIdsJson: this.selectedTaskIdsJson,
      selectedSaleIdsJson: this.selectedSaleIdsJson,
      selectedCount: this.selectedCount,
      saleDetails: this._saleDetails,
      viewSalePending: this.viewSalePending,
      actionType: this.actionType,
      actionRequestId: this.actionRequestId,
      backRequestId: this.backRequestId,
    } as IOutputs;
  }

  public get saleDetailsJson(): string {
    return this._saleDetails;
  }

  public get isViewSalePending(): boolean {
    return this.viewSalePending === true;
  }

  public get shouldShowPcfSaleDetails(): boolean {
    return this.showPcfSaleDetails;
  }

  public get isSaleDetailsReadOnly(): boolean {
    return this.saleDetailsReadOnly;
  }

  public get saleDetailsReadOnlyReason(): string | undefined {
    return this.saleDetailsReadOnlyMessage;
  }

  public get canCreateManualTask(): boolean {
    return this.hasManagerAccess;
  }

  public get canModifySvtTask(): boolean {
    return this.hasCaseworkerAccess;
  }

  public get canProgressSalesVerificationTask(): boolean {
    return this.hasCaseworkerAccess;
  }

  public get canSubmitQcOutcome(): boolean {
    return this.saleDetailsCanSubmitQcOutcome;
  }

  public get shouldShowQcSection(): boolean {
    return this.saleDetailsShowQcSection;
  }

  public get currentUserDisplayName(): string {
    return resolveCurrentUserDisplayName(this._context);
  }

  public syncPcfViewSalesEnabled(enabled: boolean): void {
    if (!enabled && this.showPcfSaleDetails) {
      this.showPcfSaleDetails = false;
    }
  }

  public isManagerHomeScreen(): boolean {
    return isManagerHomeJourneyScreen(this._context);
  }

  public setManagerJourneyActive(isActive: boolean): void {
    this.managerJourneyActive = isActive;
    if (!isActive) {
      this.managerJourneyContext = undefined;
    }
  }

  public updateManagerJourneyContext(args: { country: string; listYear: string }): void {
    this.managerJourneyContext = normalizeJourneyContext(args);
  }

  public getSharePointCatalogChunks(): SharePointCatalogChunks {
    return resolveSharePointCatalogChunks(this._context);
  }
  public getFxEnvironmentUrl(): string {
    const contextParams = this._context.parameters as unknown as Record<string, { raw?: string }>;
    return normalizeTextValue(contextParams.fxEnvironmentUrl?.raw);
  }

  public getVmsBaseUrl(): string {
    const contextParams = this._context.parameters as unknown as Record<string, { raw?: string }>;
    return normalizeTextValue(contextParams.vmsBaseUrl?.raw);
  }


  public getActiveRequestContext(): { country: string; listYear: string } {
    return resolveActiveRequestContext(this._context, this.managerJourneyActive, this.managerJourneyContext);
  }

  public isPcfViewSalesDetailsEnabledFlag(): boolean {
    return isPcfViewSalesDetailsEnabled(this._context);
  }

  public async handleRowInvoke(args: { taskId?: string; saleId?: string; screenKind?: string; tableKey?: string }): Promise<void> {
    this.selectedTaskId = args?.taskId;
    this.selectedSaleId = args?.saleId;
    this.selectedScreenKind = normalizeTextValue(args?.screenKind);
    this.selectedTableKey = normalizeTextValue(args?.tableKey);
    await this.onTaskClick(args?.taskId, args?.saleId);
  }

  public handleSelectionChange(args: {
    taskId?: string;
    saleId?: string;
    selectedTaskIds?: string[];
    selectedSaleIds?: string[];
  }): void {
    this.selectedTaskId = args?.taskId;
    this.selectedSaleId = args?.saleId;
    this.selectedTaskIdsJson = JSON.stringify((args?.selectedTaskIds ?? []).filter((v) => !!v));
    this.selectedSaleIdsJson = JSON.stringify((args?.selectedSaleIds ?? []).filter((v) => !!v));
    const taskCount = args?.selectedTaskIds?.length ?? 0;
    const saleCount = args?.selectedSaleIds?.length ?? 0;
    this.selectedCount = taskCount || saleCount;
  }

  public handleSelectionCountChange(count: number): void {
    if (this.selectedCount !== count) {
      this.selectedCount = count;
    }
  }

  public handleBackToCanvas(): void {
    this._saleDetails = '';
    this.viewSalePending = false;
    this.showPcfSaleDetails = false;
    this.saleDetailsReadOnly = false;
    this.saleDetailsReadOnlyMessage = undefined;
    this.saleDetailsCanSubmitQcOutcome = false;
    this.saleDetailsShowQcSection = true;
    this.selectedScreenKind = undefined;
    this.selectedTableKey = undefined;
    this.emitAction('back');
  }

  public handleDetailsBack(): void {
    this.showPcfSaleDetails = false;
    this.viewSalePending = false;
    this.saleDetailsReadOnly = false;
    this.saleDetailsReadOnlyMessage = undefined;
    this.saleDetailsCanSubmitQcOutcome = false;
    this.saleDetailsShowQcSection = true;
    this._notifyOutputChanged();
  }

  public async refreshDetails(): Promise<void> {
    await this.onTaskClick(this.selectedTaskId, this.selectedSaleId);
  }

  public async createManualTask(saleId: string): Promise<void> {
    const normalizedSaleId = normalizeTextValue(saleId) || normalizeTextValue(this.selectedSaleId);
    if (!hasDisplayText(normalizedSaleId)) {
      throw new Error('Sale ID is not available for manual task creation.');
    }

    const existingTaskId = resolveCurrentTaskIdFromDetails(this._saleDetails, this.selectedTaskId);
    if (existingTaskId) {
      throw new Error('Task ID already exists for this sale record.');
    }

    await this.ensureCaseworkerAccess();
    if (!this.hasManagerAccess) {
      throw new Error('Manual task creation is restricted to manager role/team.');
    }

    const apiName = resolveConfiguredApiName(
      this._context,
      'manualTaskCreationApiName',
      CONTROL_CONFIG.manualTaskCreationApiName,
    );
    if (!apiName) {
      throw new Error('Manual task creation API name is not configured.');
    }

    const response = await executeUnboundCustomApi<unknown>(
      this._context,
      apiName,
      {
        saleId: normalizedSaleId,
        sourceType: 'M',
        createdBy: resolveCurrentUserId(this._context),
      },
      {
        operationType: resolveConfiguredApiType(
          this._context,
          'manualTaskCreationApiType',
          CONTROL_CONFIG.manualTaskCreationApiType,
        ),
      },
    );

    const parsed = parseManualTaskCreationResult(response);
    if (!parsed.success) {
      throw new Error(parsed.message || 'Manual task creation failed.');
    }

    const createdTaskId = extractTaskIdFromUnknown(parsed.payload) || extractTaskIdFromUnknown(response);
    this._saleDetails = mergeManualTaskCreationDetails(this._saleDetails, {
      saleId: normalizedSaleId,
      taskId: createdTaskId,
      assignedTo: resolveCurrentUserDisplayName(this._context),
    });

    this.selectedSaleId = normalizedSaleId;
    if (createdTaskId) {
      this.selectedTaskId = createdTaskId;
    }

    this._notifyOutputChanged();
    await this.onTaskClick(this.selectedTaskId, normalizedSaleId);
  }

  public async modifySvtTask(): Promise<void> {
    const existingTaskId = resolveCurrentTaskIdFromDetails(this._saleDetails, this.selectedTaskId);
    if (!hasDisplayText(existingTaskId)) {
      throw new Error('Task ID is not available for modify SVT task.');
    }

    const taskStatus = this.resolveTaskStatusFromSaleRecord(this._saleDetails);
    if (!MODIFY_TASK_ALLOWED_STATUSES.has(taskStatus)) {
      throw new Error('Modify SVT task is available only when task status is Complete or Complete Passed QC.');
    }

    await this.ensureCaseworkerAccess();
    if (!this.hasCaseworkerAccess) {
      throw new Error('Modify SVT task is restricted to caseworker role/team.');
    }

    const apiName = resolveConfiguredApiName(
      this._context,
      'modifyTaskApiName',
      CONTROL_CONFIG.modifyTaskApiName,
    );
    if (!apiName) {
      throw new Error('Modify SVT task API name is not configured.');
    }

    const normalizedTaskId = this.normalizeTaskIdForModifyTask(existingTaskId);
    if (!normalizedTaskId) {
      throw new Error('Task ID is invalid for modify SVT task.');
    }

    const requestedBy = resolveCurrentUserId(this._context);
    const response = await executeUnboundCustomApi<unknown>(
      this._context,
      apiName,
      {
        source: 'VSRT',
        taskStatus: 'Assigned',
        taskList: JSON.stringify([normalizedTaskId]),
        requestedBy,
      },
      {
        operationType: resolveConfiguredApiType(
          this._context,
          'modifyTaskApiType',
          CONTROL_CONFIG.modifyTaskApiType,
        ),
      },
    );

    const parsed = parseModifyTaskResult(response);
    if (!parsed.success) {
      throw new Error(parsed.message || 'Modify SVT task failed.');
    }

    const assignedDateIso = new Date().toISOString();
    this._saleDetails = mergeModifyTaskDetails(this._saleDetails, {
      taskStatus: 'Assigned',
      assignedTo: resolveCurrentUserDisplayName(this._context),
      assignedToUserId: requestedBy,
      assignedDateIso,
    });

    this.selectedTaskId = normalizeTextValue(existingTaskId) || this.selectedTaskId;
    const access = this.resolveSaleDetailsAccess(this._saleDetails);
    this.saleDetailsReadOnly = access.readOnly;
    this.saleDetailsReadOnlyMessage = access.reason;
    const qcAccess = this.resolveQcSectionAccess(this._saleDetails);
    this.saleDetailsCanSubmitQcOutcome = qcAccess.canSubmit;
    this.saleDetailsShowQcSection = qcAccess.showSection;
    this._notifyOutputChanged();
  }

  public handleSalesVerificationTaskAction(
    type: 'completeSalesVerificationTask' | 'submitSalesVerificationTaskForQc',
    payload: SalesVerificationActionPayload,
  ): void {
    this._saleDetails = mergeSalesVerificationDetails(this._saleDetails, payload, type);
    const access = this.resolveSaleDetailsAccess(this._saleDetails);
    this.saleDetailsReadOnly = access.readOnly;
    this.saleDetailsReadOnlyMessage = access.reason;
    const qcAccess = this.resolveQcSectionAccess(this._saleDetails);
    this.saleDetailsCanSubmitQcOutcome = qcAccess.canSubmit;
    this.saleDetailsShowQcSection = qcAccess.showSection;
    this.emitAction(type);
  }

  public submitQcOutcome(payload: QcOutcomeActionPayload): void {
    this._saleDetails = mergeQcOutcomeDetails(this._saleDetails, payload);
    const access = this.resolveSaleDetailsAccess(this._saleDetails);
    this.saleDetailsReadOnly = access.readOnly;
    this.saleDetailsReadOnlyMessage = access.reason;
    const qcAccess = this.resolveQcSectionAccess(this._saleDetails);
    this.saleDetailsCanSubmitQcOutcome = qcAccess.canSubmit;
    this.saleDetailsShowQcSection = qcAccess.showSection;
    this.emitAction('submitQcOutcome');
  }

  public async openQcLog(): Promise<void> {
    await this.handleAuditHistoryOpen('QC');
  }

  public async openAuditHistory(): Promise<void> {
    await this.handleAuditHistoryOpen('SL');
  }

  private async onTaskClick(taskId?: string, saleId?: string): Promise<void> {
    const pcfViewSalesEnabled = isPcfViewSalesDetailsEnabled(this._context);
    const requestId = this.beginViewSaleRequest({ retainSaleDetails: pcfViewSalesEnabled && this.showPcfSaleDetails });

    if (!saleId) {
      this.finishViewSaleRequest(requestId, JSON.stringify(getEmptySaleRecord()), pcfViewSalesEnabled);
      return;
    }

    let detailsPayload = '';
    try {
      const apiName = resolveConfiguredApiName(
        this._context,
        'viewSaleRecordApiName',
        CONTROL_CONFIG.viewSaleRecordApiName,
      );
      if (!apiName) {
        throw new Error('View sale record API name is not configured.');
      }

      const customApiType = resolveConfiguredApiType(this._context, 'customApiType', CONTROL_CONFIG.customApiType);
      const { country, listYear } = resolveActiveRequestContext(
        this._context,
        this.managerJourneyActive,
        this.managerJourneyContext,
      );
      const viewSaleParams: Record<string, string> = { saleId };
      if (ENABLE_COUNTRY_LIST_YEAR_API_PARAMS) {
        if (country) viewSaleParams.country = country;
        if (listYear) viewSaleParams.listYear = listYear;
      }

      const rawPayload = await executeUnboundCustomApi<unknown>(
        this._context,
        apiName,
        viewSaleParams,
        { operationType: customApiType },
      );
      const payload = unwrapCustomApiPayload(rawPayload);
      detailsPayload = typeof payload === 'string'
        ? payload
        : JSON.stringify(payload ?? getEmptySaleRecord());
    } catch (error) {
      console.warn('Failed to fetch SVT sale record.', error);
      detailsPayload = JSON.stringify(getEmptySaleRecord());
    }

    await this.ensureCaseworkerAccess();
    this.finishViewSaleRequest(requestId, detailsPayload, pcfViewSalesEnabled);
  }

  private beginViewSaleRequest(options?: { retainSaleDetails?: boolean }): number {
    this.viewSaleRequestSeq += 1;
    const requestId = this.viewSaleRequestSeq;
    this.activeViewSaleRequestId = requestId;
    this.viewSalePending = true;
    if (!options?.retainSaleDetails) {
      this._saleDetails = '';
      this.saleDetailsReadOnly = false;
      this.saleDetailsReadOnlyMessage = undefined;
      this.saleDetailsCanSubmitQcOutcome = false;
      this.saleDetailsShowQcSection = true;
    }
    this._notifyOutputChanged();
    return requestId;
  }

  private finishViewSaleRequest(requestId: number, detailsPayload: string, showPcfDetails: boolean): void {
    if (this.activeViewSaleRequestId !== requestId) {
      return;
    }
    this._saleDetails = detailsPayload;
    this.viewSalePending = false;
    this.showPcfSaleDetails = showPcfDetails;
    const access = this.resolveSaleDetailsAccess(detailsPayload);
    this.saleDetailsReadOnly = access.readOnly;
    this.saleDetailsReadOnlyMessage = access.reason;
    const qcAccess = this.resolveQcSectionAccess(detailsPayload);
    this.saleDetailsCanSubmitQcOutcome = qcAccess.canSubmit;
    this.saleDetailsShowQcSection = qcAccess.showSection;
    this.emitAction(showPcfDetails ? 'viewSalePcf' : 'viewSale');
  }

  private async handleAuditHistoryOpen(auditType: AuditType): Promise<void> {
    await this.fetchAuditHistory(auditType);
    this.emitAction(auditType === 'QC' ? 'viewQcLog' : 'viewAuditHistory');
  }

  private async fetchAuditHistory(auditType: AuditType): Promise<void> {
    const taskId = resolveTaskIdForAuditLogs(this._saleDetails, this.selectedTaskId);
    if (!taskId) {
      this._saleDetails = mergeAuditHistoryDetails(this._saleDetails, auditType, {
        taskId: '',
        auditHistory: [],
        errorMessage: 'Task ID is not available for audit lookup.',
      });
      this._notifyOutputChanged();
      return;
    }

    const apiName = resolveConfiguredApiName(this._context, 'auditLogsApiName', CONTROL_CONFIG.auditLogsApiName);
    if (!apiName) {
      this._saleDetails = mergeAuditHistoryDetails(this._saleDetails, auditType, {
        taskId,
        auditHistory: [],
        errorMessage: 'Audit logs API is not configured.',
      });
      this._notifyOutputChanged();
      return;
    }

    const customApiType = resolveConfiguredApiType(this._context, 'auditLogsApiType', CONTROL_CONFIG.auditLogsApiType);

    try {
      const rawPayload = await executeUnboundCustomApi<unknown>(
        this._context,
        apiName,
        { taskId, auditType },
        { operationType: customApiType },
      );

      const payload = unwrapCustomApiPayload(rawPayload);
      const payloadRecord = toRecord(payload) ?? {
        taskId,
        auditHistory: [],
      };
      this._saleDetails = mergeAuditHistoryDetails(this._saleDetails, auditType, payloadRecord);
    } catch (error) {
      console.warn(`Failed to fetch ${auditType} audit history.`, error);
      this._saleDetails = mergeAuditHistoryDetails(this._saleDetails, auditType, {
        taskId,
        auditHistory: [],
        errorMessage: `Failed to fetch ${auditType} audit history.`,
      });
    }

    this._notifyOutputChanged();
  }

  private async ensureCaseworkerAccess(): Promise<boolean> {
    if (this.hasResolvedCaseworkerAccess) {
      return this.hasCaseworkerAccess;
    }

    this.caseworkerAccessRequest ??= this.resolveCaseworkerAccess();

    let resolvedSuccessfully = false;
    try {
      this.hasCaseworkerAccess = await this.caseworkerAccessRequest;
      resolvedSuccessfully = true;
    } catch (error) {
      console.warn('Failed to resolve caseworker access.', error);
      this.hasCaseworkerAccess = false;
      this.hasManagerAccess = false;
      this.hasQaAccess = false;
    } finally {
      this.hasResolvedCaseworkerAccess = resolvedSuccessfully;
      this.caseworkerAccessRequest = undefined;
    }

    return this.hasCaseworkerAccess;
  }

  private async resolveCaseworkerAccess(): Promise<boolean> {
    const apiName = resolveConfiguredApiName(
      this._context,
      'userContextApiName',
      CONTROL_CONFIG.userContextApiName,
    );
    if (!apiName) {
      this.hasManagerAccess = false;
      this.hasQaAccess = false;
      return false;
    }

    const customApiType = resolveConfiguredApiType(
      this._context,
      'userContextApiType',
      CONTROL_CONFIG.userContextApiType ?? CONTROL_CONFIG.customApiType,
    );

    const rawPayload = await executeUnboundCustomApi<unknown>(
      this._context,
      apiName,
      {},
      { operationType: customApiType },
    );
    const payload = unwrapCustomApiPayload(rawPayload);
    this.hasManagerAccess = this.hasManagerEvidence(payload);
    this.hasQaAccess = this.hasQaEvidence(payload);
    return this.hasCaseworkerEvidence(payload);
  }

  private hasCaseworkerEvidence(payload: unknown): boolean {
    const root = this.toUserContextRecord(payload);
    const persona = normalizeTextValue(root.svtPersona ?? root.persona).toLowerCase();
    if (persona === 'user') {
      return true;
    }

    const matchedTeamName = normalizeTextValue(root.matchedTeamName).toLowerCase();
    if (matchedTeamName === CASEWORKER_TEAM_NAME) {
      return true;
    }

    const matchedRoleName = normalizeTextValue(root.matchedRoleName).toLowerCase();
    if (matchedRoleName === CASEWORKER_ROLE_NAME) {
      return true;
    }

    const matchedTeams = this.normalizeUserContextValues(root.matchedTeamNames);
    if (matchedTeams.includes(CASEWORKER_TEAM_NAME)) {
      return true;
    }

    const matchedRoles = this.normalizeUserContextValues(root.matchedRoleNames);
    if (matchedRoles.includes(CASEWORKER_ROLE_NAME)) {
      return true;
    }

    const explicitFlag = normalizeTextValue(root.hasCaseworkerAccess).toLowerCase();
    return explicitFlag === 'true' || explicitFlag === '1' || explicitFlag === 'yes';
  }

  private hasManagerEvidence(payload: unknown): boolean {
    const root = this.toUserContextRecord(payload);
    const persona = normalizeTextValue(root.svtPersona ?? root.persona).toLowerCase();
    if (persona === 'manager') {
      return true;
    }

    const matchedTeamName = normalizeTextValue(root.matchedTeamName).toLowerCase();
    if (matchedTeamName === MANAGER_TEAM_NAME) {
      return true;
    }

    const matchedRoleName = normalizeTextValue(root.matchedRoleName).toLowerCase();
    if (matchedRoleName === MANAGER_ROLE_NAME) {
      return true;
    }

    const matchedTeams = this.normalizeUserContextValues(root.matchedTeamNames);
    if (matchedTeams.includes(MANAGER_TEAM_NAME)) {
      return true;
    }

    const matchedRoles = this.normalizeUserContextValues(root.matchedRoleNames);
    if (matchedRoles.includes(MANAGER_ROLE_NAME)) {
      return true;
    }

    const explicitFlag = normalizeTextValue(root.hasManagerAccess).toLowerCase();
    return explicitFlag === 'true' || explicitFlag === '1' || explicitFlag === 'yes';
  }


  private hasQaEvidence(payload: unknown): boolean {
    const root = this.toUserContextRecord(payload);
    const persona = normalizeTextValue(root.svtPersona ?? root.persona).toLowerCase();
    if (persona === 'qa' || persona === 'quality control') {
      return true;
    }

    const matchedTeamName = normalizeTextValue(root.matchedTeamName).toLowerCase();
    if (matchedTeamName === QA_TEAM_NAME) {
      return true;
    }

    const matchedRoleName = normalizeTextValue(root.matchedRoleName).toLowerCase();
    if (matchedRoleName === QA_ROLE_NAME) {
      return true;
    }

    const matchedTeams = this.normalizeUserContextValues(root.matchedTeamNames);
    if (matchedTeams.includes(QA_TEAM_NAME)) {
      return true;
    }

    const matchedRoles = this.normalizeUserContextValues(root.matchedRoleNames);
    if (matchedRoles.includes(QA_ROLE_NAME)) {
      return true;
    }

    const explicitFlag = normalizeTextValue(root.hasQaAccess ?? root.hasQualityControlAccess).toLowerCase();
    return explicitFlag === 'true' || explicitFlag === '1' || explicitFlag === 'yes';
  }

  private toUserContextRecord(payload: unknown, depth = 0): Record<string, unknown> {
    if (depth > 4) {
      return {};
    }

    const record = toRecord(payload);
    if (record) {
      const nested = record.Result ?? record.result;
      const hasPersona = Object.prototype.hasOwnProperty.call(record, 'svtPersona')
        || Object.prototype.hasOwnProperty.call(record, 'persona');
      if (hasPersona || nested === undefined) {
        return record;
      }
      return this.toUserContextRecord(nested, depth + 1);
    }

    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      if (!trimmed) {
        return {};
      }
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return this.toUserContextRecord(parsed, depth + 1);
      } catch {
        return {};
      }
    }

    return {};
  }

  private normalizeUserContextValues(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw
        .map((value) => normalizeTextValue(value).toLowerCase())
        .filter((value) => value !== '');
    }

    const text = normalizeTextValue(raw);
    if (!text) {
      return [];
    }

    return text
      .split(/[;,|]/)
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value !== '');
  }

  private normalizeTaskIdForModifyTask(taskId: string): string {
    const normalized = normalizeTextValue(taskId);
    if (!normalized) {
      return '';
    }

    const digitsOnly = normalized.replace(/\D/g, '');
    return digitsOnly || normalized;
  }
  private canEditAsAssignedCaseworker(detailsPayload: string): boolean {
    if (!this.hasCaseworkerAccess) {
      return false;
    }

    if (!this.isTaskStatusEditableByCaseworker(detailsPayload)) {
      return false;
    }

    return this.isSaleRecordAssignedToCurrentUser(detailsPayload);
  }

  private isTaskStatusEditableByCaseworker(detailsPayload: string): boolean {
    const status = this.resolveTaskStatusFromSaleRecord(detailsPayload);
    return EDITABLE_CASEWORKER_STATUSES.has(status);
  }


  private isTaskStatusEditableByQc(detailsPayload: string): boolean {
    const status = this.resolveTaskStatusFromSaleRecord(detailsPayload);
    return EDITABLE_QC_STATUSES.has(status);
  }

  private resolveTaskStatusFromSaleRecord(detailsPayload: string): string {
    const root = this.parseSaleRecordRoot(detailsPayload);
    const taskDetailsCandidates = [
      toRecord(root.salesVerificationTaskDetails),
      toRecord(root.taskDetails),
      root,
    ].filter((record): record is Record<string, unknown> => Boolean(record));

    const statusKeys = ['taskStatus', 'taskstatus', 'status'];

    for (const record of taskDetailsCandidates) {
      for (const key of statusKeys) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) {
          continue;
        }

        const status = normalizeTextValue(record[key]).toLowerCase();
        if (status) {
          return status;
        }
      }
    }

    return '';
  }

  private isSaleRecordAssignedToCurrentUser(detailsPayload: string): boolean {
    const assignedToCandidates = this.extractAssignedToCandidates(detailsPayload)
      .map((value) => this.normalizeIdentityToken(value))
      .filter((value) => value !== '');
    if (assignedToCandidates.length === 0) {
      return false;
    }

    const currentUserTokens = this.resolveCurrentUserTokens();
    if (currentUserTokens.length === 0) {
      return false;
    }

    const assignedSet = new Set(assignedToCandidates);
    return currentUserTokens.some((token) => assignedSet.has(token));
  }


  private isSaleRecordQcAssignedToCurrentUser(detailsPayload: string): boolean {
    const qcAssignedCandidates = this.extractQcAssignedToCandidates(detailsPayload)
      .map((value) => this.normalizeIdentityToken(value))
      .filter((value) => value !== '');

    if (qcAssignedCandidates.length === 0) {
      const fallbackAssigned = this.extractAssignedToCandidates(detailsPayload)
        .map((value) => this.normalizeIdentityToken(value))
        .filter((value) => value !== '');
      qcAssignedCandidates.push(...fallbackAssigned);
    }

    if (qcAssignedCandidates.length === 0) {
      return false;
    }

    const currentUserTokens = this.resolveCurrentUserTokens();
    if (currentUserTokens.length === 0) {
      return false;
    }

    const assignedSet = new Set(qcAssignedCandidates);
    return currentUserTokens.some((token) => assignedSet.has(token));
  }

  private resolveCurrentUserTokens(): string[] {
    const tokens = new Set<string>();
    this.addIdentityToken(tokens, resolveCurrentUserId(this._context));
    this.addIdentityToken(tokens, resolveCurrentUserDisplayName(this._context));

    const contextSettings = this._context.userSettings as { userName?: string; userDisplayName?: string } | undefined;
    this.addIdentityToken(tokens, contextSettings?.userName);
    this.addIdentityToken(tokens, contextSettings?.userDisplayName);

    return Array.from(tokens);
  }

  private addIdentityToken(sink: Set<string>, value: unknown): void {
    const token = this.normalizeIdentityToken(value);
    if (token) {
      sink.add(token);
    }
  }

  private normalizeIdentityToken(value: unknown): string {
    const normalized = normalizeTextValue(value).toLowerCase();
    if (!normalized) {
      return '';
    }

    return normalized.replace(/^\{+|\}+$/g, '');
  }

  private parseSaleRecordRoot(detailsPayload: string): Record<string, unknown> {
    if (!detailsPayload) {
      return {};
    }

    try {
      const parsed = JSON.parse(detailsPayload) as unknown;
      return toRecord(parsed) ?? {};
    } catch {
      return {};
    }
  }

  private resolveSaleDetailsAccess(detailsPayload: string): { readOnly: boolean; reason?: string } {
    const taskExists = this.hasTaskIdInSaleRecord(detailsPayload);
    const isUnassigned = this.isSaleRecordUnassigned(detailsPayload);
    const canEditAsCaseworker = taskExists && this.canEditAsAssignedCaseworker(detailsPayload);

    if (canEditAsCaseworker) {
      return { readOnly: false };
    }

    if (!this.isManagerAssignmentContext()) {
      if (!taskExists) {
        return { readOnly: false };
      }

      if (this.hasCaseworkerAccess) {
        return {
          readOnly: true,
          reason: 'This task is read-only unless it is assigned to you and in status Assigned or Assigned QC Failed.',
        };
      }

      return { readOnly: true };
    }

    return {
      readOnly: true,
      reason: taskExists && isUnassigned
        ? 'This task is unassigned. Manager Assignment is view-only. Assign it to yourself to take ownership.'
        : undefined,
    };
  }


  private resolveQcSectionAccess(detailsPayload: string): { canSubmit: boolean; showSection: boolean } {
    if (!this.hasQaAccess) {
      return { canSubmit: false, showSection: true };
    }

    const assignedToCurrentQcUser = this.isSaleRecordQcAssignedToCurrentUser(detailsPayload);
    if (!assignedToCurrentQcUser) {
      return { canSubmit: false, showSection: false };
    }

    if (!this.isTaskStatusEditableByQc(detailsPayload)) {
      return { canSubmit: false, showSection: true };
    }

    return { canSubmit: true, showSection: true };
  }

  private isManagerAssignmentContext(): boolean {
    const selectedKind = normalizeTextValue(this.selectedScreenKind).toLowerCase();
    if (selectedKind === 'managerassign') {
      return true;
    }

    const selectedTable = normalizeTextValue(this.selectedTableKey).toLowerCase();
    if (selectedTable === 'manager') {
      return true;
    }

    const contextParams = this._context.parameters as unknown as Record<string, { raw?: string }>;
    const contextTable = normalizeTextValue(contextParams.tableKey?.raw).toLowerCase();
    if (contextTable === 'manager') {
      return true;
    }

    const contextScreen = normalizeTextValue(contextParams.canvasScreenName?.raw).toLowerCase();
    return contextScreen.includes('manager') && contextScreen.includes('assignment');
  }

  private hasTaskIdInSaleRecord(detailsPayload: string): boolean {
    const taskId = resolveCurrentTaskIdFromDetails(detailsPayload, this.selectedTaskId);
    return hasDisplayText(taskId);
  }

  private isSaleRecordUnassigned(detailsPayload: string): boolean {
    const candidates = this.extractAssignedToCandidates(detailsPayload)
      .map((value) => normalizeTextValue(value))
      .filter((value) => hasDisplayText(value));
    return candidates.length === 0;
  }


  private extractQcAssignedToCandidates(detailsPayload: string): string[] {
    const values = new Set<string>();
    const root = this.parseSaleRecordRoot(detailsPayload);

    const taskDetailsCandidates = [
      toRecord(root.salesVerificationTaskDetails),
      toRecord(root.taskDetails),
      root,
    ].filter((record): record is Record<string, unknown> => Boolean(record));

    const qcAssignedKeys = [
      'qcAssignedTo',
      'qcassignedto',
      'assignedToQc',
      'assignedtoqc',
      'qcAssignedToUserId',
      'qcassignedtouserid',
      'qcAssignedToId',
      'qcassignedtoid',
      'qcAssignedToName',
      'qcassignedtoname',
      'qcAssignedToDisplayName',
      'qcassignedtodisplayname',
    ];

    for (const record of taskDetailsCandidates) {
      for (const key of qcAssignedKeys) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) {
          continue;
        }
        this.collectIdentityValues(record[key], values);
      }
    }

    return Array.from(values);
  }

  private extractAssignedToCandidates(detailsPayload: string): string[] {
    const values = new Set<string>();
    const root = this.parseSaleRecordRoot(detailsPayload);

    const taskDetailsCandidates = [
      toRecord(root.salesVerificationTaskDetails),
      toRecord(root.taskDetails),
    ].filter((record): record is Record<string, unknown> => Boolean(record));

    const assignedToKeys = [
      'assignedTo',
      'assignedto',
      'assignedToUserId',
      'assignedtouserid',
      'assignedToId',
      'assignedtoid',
      'assignedToUser',
      'assignedtouser',
      'assignedToName',
      'assignedtoname',
      'assignedToUserName',
      'assignedtousername',
      'assignedToDisplayName',
      'assignedtodisplayname',
    ];

    for (const record of taskDetailsCandidates) {
      for (const key of assignedToKeys) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) {
          continue;
        }
        this.collectIdentityValues(record[key], values);
      }
    }

    if (Object.prototype.hasOwnProperty.call(root, 'assignedTo')) {
      this.collectIdentityValues(root.assignedTo, values);
    }

    return Array.from(values);
  }

  private collectIdentityValues(value: unknown, sink: Set<string>, depth = 0): void {
    if (depth > 3 || value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const normalized = normalizeTextValue(value);
      if (normalized) {
        sink.add(normalized);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => this.collectIdentityValues(entry, sink, depth + 1));
      return;
    }

    const record = toRecord(value);
    if (!record) {
      return;
    }

    const nestedKeys = [
      'id',
      'Id',
      'userId',
      'userid',
      'systemuserid',
      'name',
      'fullName',
      'fullname',
      'displayName',
      'displayname',
      'value',
    ];

    for (const key of nestedKeys) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) {
        continue;
      }
      this.collectIdentityValues(record[key], sink, depth + 1);
    }
  }


  private emitAction(type: RuntimeActionType): void {
    if (type === 'back') {
      this.selectedTaskId = '';
      this.selectedSaleId = '';
      this.selectedTaskIdsJson = '[]';
      this.selectedSaleIdsJson = '[]';
      this.selectedCount = 0;
    }
    this.actionType = type;
    this.actionSequence += 1;
    this.actionRequestId = `${this.actionSequence}-${Date.now()}`;
    this.backRequestId = this.actionRequestId;
    this._notifyOutputChanged();
  }
}

