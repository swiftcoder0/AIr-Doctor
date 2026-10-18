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
} from '../types/aircraft';
import { mockAirDoctorService } from './mockAirDoctorService';

const rawBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

let activeUserRole: UserRole = 'Commander';

export function setActiveUserRole(role: UserRole) {
  activeUserRole = role;
}

export function getActiveUserRole(): UserRole {
  return activeUserRole;
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
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

  return response.json();
}

export const api = {
  // Liveness
  async getHealthz(): Promise<{ status: string; database: string }> {
    return fetchJson('/healthz');
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
};
