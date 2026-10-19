import {
  BaseId,
  BaseInfo,
  FleetSummary,
  FleetTableItem,
  AircraftData,
  SparePart,
  Technician,
  MaintenanceBay,
  WorkOrder,
  DataTrustRecord,
  ImportHistoryItem,
  DecisionLedgerEntry,
  WhatIfRequest,
  WhatIfResult,
  OptimizerRecommendation,
  ChatMessage,
  DataCategory,
  FutureHours,
  UserRole,
  SecurityStatus,
  VerifyTotpResult,
  VerifyChainResult,
  DepartmentProfile,
  DepartmentLoginRequest,
  DepartmentLoginResponse,
  VerifyDepartmentTotpRequest,
  VerifyDepartmentTotpResponse,
  CommanderAirbase,
  CommandApprovalItem,
  CommanderFleetMetrics,
  ApprovalActionRequest,
  ApprovalActionResponse,
  TechnicalRecordItem,
  TechnicalRecordStats,
  PdfExtractResponse,
  CsvMapAndValidateResponse,
  CommitTechnicalRecordRequest,
  LogisticsInventoryItem,
  LogisticsKpiSummary,
  MaterialRequestItem,
  CreateMaterialRequest,
  SparesTransferItem,
  CreateSparesTransferRequest,
  ProcurementOrderItem,
  CreateProcurementOrderRequest,
  StockMovementItem,
  ReservePartRequest,
} from '../types/aircraft';
import { mockAirDoctorService } from './mockAirDoctorService';

const defaultBase = import.meta.env.PROD
  ? 'https://air-doctor.onrender.com'
  : 'http://127.0.0.1:8000';
const rawBase = import.meta.env.VITE_API_URL || defaultBase;
export const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

export type ConnectionStatus = 'connected' | 'fallback' | 'checking';

let currentConnectionStatus: ConnectionStatus = 'checking';
const connectionListeners: Array<(status: ConnectionStatus) => void> = [];

export function getConnectionStatus(): ConnectionStatus {
  return currentConnectionStatus;
}

export function subscribeConnectionStatus(listener: (status: ConnectionStatus) => void): () => void {
  connectionListeners.push(listener);
  listener(currentConnectionStatus);
  return () => {
    const idx = connectionListeners.indexOf(listener);
    if (idx !== -1) connectionListeners.splice(idx, 1);
  };
}

function setConnectionStatus(status: ConnectionStatus) {
  if (currentConnectionStatus !== status) {
    currentConnectionStatus = status;
    connectionListeners.forEach((l) => l(status));
  }
}

let activeUserRole: UserRole = 'Commander';

export function setActiveUserRole(role: UserRole) {
  activeUserRole = role;
}

export function getActiveUserRole(): UserRole {
  return activeUserRole;
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-AirDoctor-Role': activeUserRole,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error [${response.status}] ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    setConnectionStatus('connected');
    return data;
  } catch (err) {
    setConnectionStatus('fallback');
    throw err;
  }
}

export const api = {
  // Liveness & Probe
  async getHealthz(): Promise<{ status: string; database: string }> {
    return fetchJson('/healthz');
  },

  async checkBackendLiveness(): Promise<boolean> {
    try {
      await fetchJson('/healthz');
      return true;
    } catch {
      return false;
    }
  },

  // Bases
  async getBases(): Promise<BaseInfo[]> {
    try {
      return await fetchJson<BaseInfo[]>('/bases');
    } catch {
      return mockAirDoctorService.getBases();
    }
  },

  // Fleet Summary
  async getFleetSummary(baseId: BaseId = 'all'): Promise<FleetSummary> {
    try {
      return await fetchJson<FleetSummary>(`/fleet/summary?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.getFleetSummary(baseId);
    }
  },

  // Fleet Table
  async getFleetTable(baseId: BaseId = 'all', typeFilter: 'All' | 'Rafale' | 'Tejas' = 'All'): Promise<FleetTableItem[]> {
    try {
      return await fetchJson<FleetTableItem[]>(`/aircraft?base_id=${baseId}&type_filter=${typeFilter}`);
    } catch {
      return mockAirDoctorService.getFleetTable(baseId, typeFilter);
    }
  },

  // 3D Aircraft Models
  async get3DAircraft(baseId: BaseId = 'all'): Promise<AircraftData[]> {
    try {
      return await fetchJson<AircraftData[]>(`/aircraft/3d?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.get3DAircraft(baseId);
    }
  },

  // Aircraft Health & Degradation Projections
  async getAircraftHealth(aircraftId: string, futureHours: FutureHours = 0): Promise<AircraftData> {
    try {
      return await fetchJson<AircraftData>(`/aircraft/${aircraftId}/health?future_hours=${futureHours}`);
    } catch {
      const baseAircraft = mockAirDoctorService.get3DAircraft('all').find((a) => a.id === aircraftId) || mockAirDoctorService.get3DAircraft('all')[0];
      return mockAirDoctorService.projectAircraftHealth(baseAircraft, futureHours);
    }
  },

  // Spares Inventory
  async getSpares(baseId: BaseId = 'all'): Promise<SparePart[]> {
    try {
      return await fetchJson<SparePart[]>(`/inventory?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.getSpares(baseId);
    }
  },

  // Technicians
  async getTechnicians(baseId: BaseId = 'all'): Promise<Technician[]> {
    try {
      return await fetchJson<Technician[]>(`/technicians?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.getTechnicians(baseId);
    }
  },

  // Maintenance Bays
  async getBays(baseId: BaseId = 'all'): Promise<MaintenanceBay[]> {
    try {
      return await fetchJson<MaintenanceBay[]>(`/bays?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.getBays(baseId);
    }
  },

  // Work Orders
  async getWorkOrders(
    baseId: BaseId = 'all',
    status: string = 'All',
    search: string = ''
  ): Promise<WorkOrder[]> {
    try {
      return await fetchJson<WorkOrder[]>(`/work-orders?base_id=${baseId}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
    } catch {
      return mockAirDoctorService.getWorkOrders(baseId, status, search);
    }
  },

  async createWorkOrder(newWo: Omit<WorkOrder, 'id'>): Promise<WorkOrder> {
    try {
      return await fetchJson<WorkOrder>('/work-orders', {
        method: 'POST',
        body: JSON.stringify(newWo),
      });
    } catch {
      return mockAirDoctorService.createWorkOrder(newWo);
    }
  },

  async updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    try {
      return await fetchJson<WorkOrder>(`/work-orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch {
      mockAirDoctorService.updateWorkOrder(id, updates);
      return mockAirDoctorService.getWorkOrders('all').find((w) => w.id === id)!;
    }
  },

  // CSV Preview & Commit
  async previewCsv(
    csvText: string,
    category: DataCategory,
    baseId: BaseId
  ): Promise<{
    valid: boolean;
    total_rows: number;
    valid_rows_count: number;
    flagged_rows_count: number;
    trust_grade: string;
    preview_rows: any[];
    errors: any[];
  }> {
    const formData = new FormData();
    formData.append('csv_text', csvText);
    formData.append('category', category);
    formData.append('base_id', baseId);

    const response = await fetch(`${API_BASE_URL}/imports/preview`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async commitCsv(
    baseId: BaseId,
    category: DataCategory,
    filename: string,
    rows: any[]
  ): Promise<{ success: boolean; batch_id: string; imported_count: number; trust_grade: string; message: string }> {
    return fetchJson('/imports/commit', {
      method: 'POST',
      body: JSON.stringify({
        base_id: baseId,
        category,
        filename,
        rows,
      }),
    });
  },

  // Import History
  async getImportHistory(baseId: BaseId = 'all'): Promise<ImportHistoryItem[]> {
    try {
      return await fetchJson<ImportHistoryItem[]>(`/imports?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.getImportHistory(baseId);
    }
  },

  // Data Trust Records
  async getDataTrustRecords(baseId: BaseId = 'all'): Promise<DataTrustRecord[]> {
    try {
      return await fetchJson<DataTrustRecord[]>(`/trust/records?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.getDataTrustRecords(baseId);
    }
  },

  async verifyTrustRecord(recordId: string, reviewer: string = 'Air Commander'): Promise<void> {
    try {
      await fetchJson(`/trust/${recordId}/verify?reviewer=${encodeURIComponent(reviewer)}`, {
        method: 'POST',
      });
    } catch {
      mockAirDoctorService.verifyRecord(recordId, 'VERIFIED');
    }
  },

  async rejectTrustRecord(recordId: string, reviewer: string = 'Air Commander'): Promise<void> {
    try {
      await fetchJson(`/trust/${recordId}/reject?reviewer=${encodeURIComponent(reviewer)}`, {
        method: 'POST',
      });
    } catch {
      mockAirDoctorService.verifyRecord(recordId, 'REJECTED');
    }
  },

  // Optimizer & What-If
  async getOptimizerRecommendation(): Promise<OptimizerRecommendation> {
    try {
      return await fetchJson<OptimizerRecommendation>('/optimizer/compare');
    } catch {
      return mockAirDoctorService.getDefaultRecommendation();
    }
  },

  async simulateWhatIf(req: WhatIfRequest): Promise<WhatIfResult> {
    try {
      return await fetchJson<WhatIfResult>('/optimizer/simulate', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch {
      return mockAirDoctorService.runWhatIf(req);
    }
  },

  // Decision Ledger
  async getLedger(baseId: BaseId = 'all'): Promise<DecisionLedgerEntry[]> {
    try {
      return await fetchJson<DecisionLedgerEntry[]>(`/ledger?base_id=${baseId}`);
    } catch {
      return mockAirDoctorService.getLedger(baseId);
    }
  },

  async recordDecision(entry: Omit<DecisionLedgerEntry, 'id' | 'timestamp'>): Promise<DecisionLedgerEntry> {
    try {
      return await fetchJson<DecisionLedgerEntry>('/ledger/decision', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
    } catch {
      return mockAirDoctorService.recordDecision(entry);
    }
  },

  // AI Assistant Dynamic Chat
  async queryAiAssistant(prompt: string, baseId: BaseId = 'all'): Promise<ChatMessage> {
    try {
      const res = await fetchJson<ChatMessage>('/chat/query', {
        method: 'POST',
        body: JSON.stringify({ prompt, base_id: baseId }),
      });
      return res;
    } catch {
      return mockAirDoctorService.queryAiAssistant(prompt);
    }
  },

  // -----------------------------------------------------------
  // Cryptographic Audit & Verification
  // -----------------------------------------------------------
  async verifyLedgerChain(): Promise<VerifyChainResult> {
    try {
      return await fetchJson<VerifyChainResult>('/ledger/verify-chain');
    } catch {
      return mockAirDoctorService.verifyLedgerChain();
    }
  },

  // -----------------------------------------------------------
  // Cybersecurity, RBAC & TOTP MFA
  // -----------------------------------------------------------
  async getAuthStatus(): Promise<SecurityStatus> {
    try {
      return await fetchJson<SecurityStatus>('/auth/status');
    } catch {
      return mockAirDoctorService.getAuthStatus();
    }
  },

  async verifyTotp(code: string, role: string = 'Commander'): Promise<VerifyTotpResult> {
    try {
      return await fetchJson<VerifyTotpResult>('/auth/verify-totp', {
        method: 'POST',
        body: JSON.stringify({ code, role }),
      });
    } catch {
      return mockAirDoctorService.verifyTotp(code, role);
    }
  },

  // -----------------------------------------------------------
  // Department Login & 2-Step TOTP Gate (SIH Ministry of Defence)
  // -----------------------------------------------------------
  async getDepartments(): Promise<DepartmentProfile[]> {
    try {
      const list = await fetchJson<any[]>('/auth/departments');
      return list.map((d) => ({
        ...d,
        serviceId: d.serviceId || d.service_id,
        defaultTab: d.defaultTab || d.default_tab,
        agencyLabel: d.agencyLabel || d.agency_label,
      }));
    } catch {
      return mockAirDoctorService.getDepartmentProfiles();
    }
  },

  async loginDepartment(req: DepartmentLoginRequest): Promise<DepartmentLoginResponse> {
    try {
      return await fetchJson<DepartmentLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch {
      return mockAirDoctorService.loginDepartment(req.department_id, req.password);
    }
  },

  async verifyDepartmentTotp(req: VerifyDepartmentTotpRequest): Promise<VerifyDepartmentTotpResponse> {
    try {
      const res = await fetchJson<VerifyDepartmentTotpResponse>('/auth/verify-totp', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      if (res.role) {
        setActiveUserRole(res.role);
      }
      return res;
    } catch {
      const res = await mockAirDoctorService.verifyDepartmentTotp(req.department_id, req.totp_code);
      if (res.role) {
        setActiveUserRole(res.role);
      }
      return res;
    }
  },

  async getCommanderFleetMetrics(): Promise<CommanderFleetMetrics> {
    try {
      const data = await fetchJson<CommanderFleetMetrics>('/commander/fleet-metrics');
      return data;
    } catch {
      return mockAirDoctorService.getCommanderFleetMetrics();
    }
  },

  async getCommanderAirbases(): Promise<CommanderAirbase[]> {
    try {
      const data = await fetchJson<CommanderAirbase[]>('/commander/airbases');
      return data;
    } catch {
      return mockAirDoctorService.getCommanderAirbases();
    }
  },

  async getCommanderApprovals(): Promise<CommandApprovalItem[]> {
    try {
      const data = await fetchJson<CommandApprovalItem[]>('/commander/approvals');
      return data;
    } catch {
      return mockAirDoctorService.getCommanderApprovals();
    }
  },

  async actionCommanderApproval(
    approvalId: string,
    req: ApprovalActionRequest
  ): Promise<ApprovalActionResponse> {
    try {
      const data = await fetchJson<ApprovalActionResponse>(`/commander/approvals/${approvalId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      return data;
    } catch {
      return mockAirDoctorService.actionCommanderApproval(approvalId, req);
    }
  },

  // -----------------------------------------------------------
  // Technical Records & Quality Endpoints
  // -----------------------------------------------------------
  async getTechnicalRecords(params?: {
    aircraft_id?: string;
    record_type?: string;
    status?: string;
    search?: string;
  }): Promise<TechnicalRecordItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.aircraft_id && params.aircraft_id !== 'all') query.append('aircraft_id', params.aircraft_id);
      if (params?.record_type && params.record_type !== 'All Records' && params.record_type !== 'all')
        query.append('record_type', params.record_type);
      if (params?.status && params.status !== 'all') query.append('status', params.status);
      if (params?.search && params.search.trim()) query.append('search', params.search.trim());

      const qs = query.toString() ? `?${query.toString()}` : '';
      return await fetchJson<TechnicalRecordItem[]>(`/tech-records${qs}`);
    } catch {
      return mockAirDoctorService.getTechnicalRecords(params) as TechnicalRecordItem[];
    }
  },

  async getTechnicalRecordsStats(): Promise<TechnicalRecordStats> {
    try {
      return await fetchJson<TechnicalRecordStats>('/tech-records/stats');
    } catch {
      return mockAirDoctorService.getTechnicalRecordsStats();
    }
  },

  async uploadPdfRecord(
    file: File | Blob,
    filename: string,
    aircraftId: string,
    recordType: string
  ): Promise<PdfExtractResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('aircraft_id', aircraftId);
      formData.append('record_type', recordType);

      const url = `${API_BASE_URL}/tech-records/upload-pdf`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-AirDoctor-Role': getActiveUserRole(),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    } catch {
      return mockAirDoctorService.simulatePdfExtraction(filename, aircraftId, recordType);
    }
  },

  async uploadCsvRecord(
    file: File | Blob,
    filename: string,
    aircraftId: string,
    recordType: string
  ): Promise<CsvMapAndValidateResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('aircraft_id', aircraftId);
      formData.append('record_type', recordType);

      const url = `${API_BASE_URL}/tech-records/upload-csv`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-AirDoctor-Role': getActiveUserRole(),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    } catch {
      return mockAirDoctorService.simulateCsvMapping(filename, aircraftId, recordType);
    }
  },

  async commitTechnicalRecord(req: CommitTechnicalRecordRequest): Promise<TechnicalRecordItem> {
    try {
      return await fetchJson<TechnicalRecordItem>('/tech-records/commit', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch {
      return mockAirDoctorService.commitTechnicalRecord(req) as TechnicalRecordItem;
    }
  },

  // -------------------------------------------------------------
  // Logistics & Spares API
  // -------------------------------------------------------------
  async getLogisticsKpis(): Promise<LogisticsKpiSummary> {
    try {
      return await fetchJson<LogisticsKpiSummary>('/logistics/kpis');
    } catch {
      return mockAirDoctorService.getLogisticsKpis();
    }
  },

  async getLogisticsInventory(params?: {
    category?: string;
    aircraft?: string;
    location?: string;
    stock_status?: string;
    search?: string;
  }): Promise<LogisticsInventoryItem[]> {
    try {
      const sp = new URLSearchParams();
      if (params?.category && params.category !== 'all' && params.category !== 'All Categories') sp.append('category', params.category);
      if (params?.aircraft && params.aircraft !== 'all' && params.aircraft !== 'All Aircraft') sp.append('aircraft', params.aircraft);
      if (params?.location && params.location !== 'all' && params.location !== 'All Locations') sp.append('location', params.location);
      if (params?.stock_status && params.stock_status !== 'all' && params.stock_status !== 'Stock Status') sp.append('stock_status', params.stock_status);
      if (params?.search) sp.append('search', params.search);

      const qs = sp.toString() ? `?${sp.toString()}` : '';
      return await fetchJson<LogisticsInventoryItem[]>(`/logistics/inventory${qs}`);
    } catch {
      return mockAirDoctorService.getLogisticsInventory(params);
    }
  },

  async getLogisticsInventoryDetail(itemId: string): Promise<LogisticsInventoryItem> {
    try {
      return await fetchJson<LogisticsInventoryItem>(`/logistics/inventory/${encodeURIComponent(itemId)}`);
    } catch {
      return mockAirDoctorService.getLogisticsInventoryDetail(itemId);
    }
  },

  async reserveLogisticsPart(req: ReservePartRequest): Promise<LogisticsInventoryItem> {
    try {
      return await fetchJson<LogisticsInventoryItem>('/logistics/reserve', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch {
      return mockAirDoctorService.reserveLogisticsPart(req);
    }
  },

  async getMaterialRequests(status?: string): Promise<MaterialRequestItem[]> {
    try {
      const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
      return await fetchJson<MaterialRequestItem[]>(`/logistics/requests${qs}`);
    } catch {
      return mockAirDoctorService.getMaterialRequests(status);
    }
  },

  async createMaterialRequest(req: CreateMaterialRequest): Promise<MaterialRequestItem> {
    try {
      return await fetchJson<MaterialRequestItem>('/logistics/requests', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch {
      return mockAirDoctorService.createMaterialRequest(req);
    }
  },

  async getSparesTransfers(): Promise<SparesTransferItem[]> {
    try {
      return await fetchJson<SparesTransferItem[]>('/logistics/transfers');
    } catch {
      return mockAirDoctorService.getSparesTransfers();
    }
  },

  async createSparesTransfer(req: CreateSparesTransferRequest): Promise<SparesTransferItem> {
    try {
      return await fetchJson<SparesTransferItem>('/logistics/transfers', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch {
      return mockAirDoctorService.createSparesTransfer(req);
    }
  },

  async getProcurementOrders(): Promise<ProcurementOrderItem[]> {
    try {
      return await fetchJson<ProcurementOrderItem[]>('/logistics/procurement');
    } catch {
      return mockAirDoctorService.getProcurementOrders();
    }
  },

  async createProcurementOrder(req: CreateProcurementOrderRequest): Promise<ProcurementOrderItem> {
    try {
      return await fetchJson<ProcurementOrderItem>('/logistics/procurement', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    } catch {
      return mockAirDoctorService.createProcurementOrder(req);
    }
  },

  async getStockMovements(): Promise<StockMovementItem[]> {
    try {
      return await fetchJson<StockMovementItem[]>('/logistics/movements');
    } catch {
      return mockAirDoctorService.getStockMovements();
    }
  },
};



