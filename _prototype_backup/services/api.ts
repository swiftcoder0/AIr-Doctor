import {
  AircraftData,
  FleetSummary,
  SparePart,
  Technician,
  MaintenanceBay,
  MaintenanceJob,
  BottleneckItem,
  WhatIfRequest,
  WhatIfResult,
  DataTrustRecord,
  DecisionLedgerEntry,
  ScenarioInfo,
  MockPredictionResponse,
  ScenarioId,
} from '../types/aircraft';
import { aircraftList, fleetSummaryData } from '../data/aircraftData';

const API_BASE = 'http://127.0.0.1:8000/api';

// Fallback in-memory ledger and scenario for offline mode
let localActiveScenario: ScenarioId = 'baseline';
let localLedger: DecisionLedgerEntry[] = [
  {
    id: 'dec-init-01',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    actor: 'system-init',
    action: 'INITIALIZE_FLEET_BASELINES',
    previous_state: 'OFFLINE',
    resulting_state: 'FLEET_MONITORED_24',
    notes: 'Seeded synthetic fleet baseline (14 generic jets, 10 generic helicopters).',
    scenario_id: 'baseline',
  },
  {
    id: 'dec-init-02',
    timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    actor: 'maintenance-officer-01',
    action: 'GROUND_AIRCRAFT_FOR_INSPECTION',
    previous_state: 'GEN-H203: READY',
    resulting_state: 'GEN-H203: MAINTENANCE',
    notes: 'Initiated mandatory rotor hub teardown following high vibration alert on swashplate bearing.',
    scenario_id: 'baseline',
  },
];

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    // Graceful offline fallback
    return null;
  }
}

export const api = {
  async getFleetSummary(): Promise<FleetSummary> {
    const res = await apiRequest<any>('/fleet/summary');
    if (res) {
      return {
        totalAircraft: res.total_aircraft,
        readyToFly: res.ready_to_fly,
        inMaintenance: res.in_maintenance,
        attentionRequired: res.attention_required,
        averageFleetHealth: res.average_fleet_health,
        fleetReadinessScore: res.fleet_readiness_score,
        activeScenario: res.active_scenario,
        dataTrustDistribution: res.data_trust_distribution,
        squadronBreakdown: res.squadron_breakdown,
      };
    }
    return fleetSummaryData;
  },

  async getAircraftList(filters?: {
    squadron?: string;
    base?: string;
    aircraft_class?: string;
    status?: string;
    search?: string;
  }): Promise<AircraftData[]> {
    const params = new URLSearchParams();
    if (filters?.squadron) params.append('squadron', filters.squadron);
    if (filters?.base) params.append('base', filters.base);
    if (filters?.aircraft_class) params.append('aircraft_class', filters.aircraft_class);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<any[]>(`/aircraft${query}`);
    if (res && res.length > 0) {
      // Map API summary to full aircraft entries using client cache
      return res.map((item) => {
        const full = aircraftList.find((a) => a.id === item.id);
        return {
          ...(full || aircraftList[0]),
          id: item.id,
          code: item.tail_number,
          tailNumber: item.tail_number,
          name: item.name,
          aircraftClass: item.aircraft_class,
          squadron: item.squadron,
          base: item.base,
          status: item.status,
          statusLabel:
            item.status === 'READY'
              ? 'Ready to Fly'
              : item.status === 'MAINTENANCE'
              ? 'In Maintenance'
              : 'Attention Required',
          overallHealth: item.overall_health,
          utilizationRate: item.utilization_rate,
          projectedAvailabilityDays: item.projected_availability_days,
          flightHours: item.flight_hours,
          lastMaintenance: item.last_maintenance,
          nextMaintenanceHours: item.next_maintenance_hours,
          issueDetected: item.active_issue,
        };
      });
    }

    // Local client filtering fallback
    let list = [...aircraftList];
    if (filters?.squadron) list = list.filter((a) => a.squadron.toLowerCase() === filters.squadron!.toLowerCase());
    if (filters?.base) list = list.filter((a) => a.base.toLowerCase() === filters.base!.toLowerCase());
    if (filters?.aircraft_class) list = list.filter((a) => a.aircraftClass === filters.aircraft_class);
    if (filters?.status) list = list.filter((a) => a.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.squadron.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getAircraftDetail(aircraftId: string): Promise<AircraftData> {
    const res = await apiRequest<any>(`/aircraft/${aircraftId}`);
    if (res) {
      const base = aircraftList.find((a) => a.id === aircraftId) || aircraftList[0];
      return {
        ...base,
        id: res.id,
        code: res.tail_number,
        tailNumber: res.tail_number,
        name: res.name,
        aircraftClass: res.aircraft_class,
        squadron: res.squadron,
        base: res.base,
        status: res.status,
        overallHealth: res.overall_health,
        utilizationRate: res.utilization_rate,
        projectedAvailabilityDays: res.projected_availability_days,
        flightHours: res.flight_hours,
        lastMaintenance: res.last_maintenance,
        nextMaintenanceHours: res.next_maintenance_hours,
        issueDetected: res.active_issue,
        components: res.components.map((c: any) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          health: c.health,
          status: c.status,
          currentValue: c.current_value,
          normalRange: c.normal_range,
          operatingHours: c.operating_hours,
          lastInspection: c.last_inspection,
          maintenanceRisk: c.maintenance_risk,
          insight: c.insight,
          hotspotPosition: c.hotspot_position,
          dataTrustGrade: c.data_trust_grade,
          sensorReadings: c.sensor_readings,
          trendHistory: c.trend_history,
        })),
        maintenanceHistory: res.maintenance_history,
      };
    }
    return aircraftList.find((a) => a.id === aircraftId) || aircraftList[0];
  },

  async getAircraftHealthPrediction(aircraftId: string, componentId: string): Promise<MockPredictionResponse> {
    const res = await apiRequest<any>(`/aircraft/${aircraftId}/health?component_id=${componentId}`);
    if (res && res.prediction) {
      return res.prediction;
    }

    // Client fallback prediction
    return {
      aircraft_id: aircraftId,
      component_id: componentId,
      model_mode: 'mock',
      remaining_useful_life_range: [180.0, 320.0],
      risk_band: 'LOW',
      horizon_criteria: 'Next 50 to 150 flight hours based on simulated sortie profiles',
      trust_grade: 'A',
      explanation: 'Telemetry trend reflects nominal component health. Predicted degradation slope is flat across current operational cycle.',
      feature_provenance: {
        component_health_score: 94,
        operating_hours: 1200,
        trust_grade_numerical: 1.0,
      },
      model_version: 'AirDoctor-Synthetic-RUL-v0.9.2-MOCK',
      prediction_timestamp: new Date().toISOString(),
      warnings: [
        'SIMULATED ESTIMATE: Generated in MOCK inference mode using synthetic boundary parameters.',
        'Operational usage is strictly for non-critical demonstration and planning.',
      ],
    };
  },

  async getInventory(): Promise<SparePart[]> {
    const res = await apiRequest<SparePart[]>('/inventory');
    if (res) return res;
    return [
      { id: 'sp-hyd-01', part_number: 'HYD-SEAL-KIT-01', name: 'High-Pressure Hydraulic Seal Kit', applicable_class: ['jet', 'helicopter'], quantity_on_hand: 3, min_reorder_level: 5, status: 'Low Stock', lead_time_days: 4, cost_synthetic_usd: 850, affected_components: ['jet-hydraulics', 'heli-hydraulics'] },
      { id: 'sp-pump-02', part_number: 'PUMP-CORE-350', name: 'Main Hydraulic Variable Pump Core', applicable_class: ['jet'], quantity_on_hand: 1, min_reorder_level: 2, status: 'Low Stock', lead_time_days: 7, cost_synthetic_usd: 14200, affected_components: ['jet-hydraulics'] },
      { id: 'sp-rotor-03', part_number: 'ROTOR-BEARING-H12', name: 'Swashplate Duplex Bearing Assembly', applicable_class: ['helicopter'], quantity_on_hand: 0, min_reorder_level: 2, status: 'Critical Shortage', lead_time_days: 11, cost_synthetic_usd: 9800, affected_components: ['heli-main-rotor'] },
      { id: 'sp-act-04', part_number: 'ELEVON-ACTUATOR-M4', name: 'Electro-Hydraulic Servo Actuator', applicable_class: ['jet'], quantity_on_hand: 2, min_reorder_level: 3, status: 'Low Stock', lead_time_days: 5, cost_synthetic_usd: 18500, affected_components: ['jet-control-surfaces'] },
      { id: 'sp-flt-05', part_number: 'OIL-FILTER-CARTRIDGE', name: 'Micro-Synthetic Lube Oil Filter', applicable_class: ['jet', 'helicopter'], quantity_on_hand: 14, min_reorder_level: 8, status: 'Adequate', lead_time_days: 2, cost_synthetic_usd: 140, affected_components: ['jet-engine', 'heli-gearbox'] },
    ];
  },

  async getTechnicians(): Promise<Technician[]> {
    const res = await apiRequest<Technician[]>('/technicians');
    if (res) return res;
    return [
      { id: 'tech-01', name: 'Master Sgt. R. Nair', trade: 'Hydraulics Specialist', certification_level: 3, shift: 'Morning', status: 'Available', base: 'Forward Base Alpha' },
      { id: 'tech-02', name: 'Sgt. Ankit Verma', trade: 'Hydraulics Specialist', certification_level: 2, shift: 'Evening', status: 'Assigned', base: 'Forward Base Alpha', current_job_id: 'job-j102-hyd' },
      { id: 'tech-05', name: 'Chief WO Vikram Singh', trade: 'Rotorcraft Systems', certification_level: 3, shift: 'Morning', status: 'Assigned', base: 'Forward Base Alpha', current_job_id: 'job-h203-swash' },
      { id: 'tech-08', name: 'Master Sgt. K. Pillai', trade: 'Propulsion Specialist', certification_level: 3, shift: 'Morning', status: 'Available', base: 'Forward Base Alpha' },
      { id: 'tech-11', name: 'Sgt. Neha Rawat', trade: 'Avionics Tech', certification_level: 2, shift: 'Morning', status: 'Available', base: 'Forward Base Alpha' },
    ];
  },

  async getBays(): Promise<MaintenanceBay[]> {
    const res = await apiRequest<MaintenanceBay[]>('/bays');
    if (res) return res;
    return [
      { id: 'bay-fba-01', bay_name: 'Hangar Bay 1 (Heavy Jet)', base: 'Forward Base Alpha', status: 'Occupied', current_aircraft_id: 'gen-j102', estimated_clearance_hours: 14.5 },
      { id: 'bay-fba-02', bay_name: 'Hangar Bay 2 (Rotorcraft)', base: 'Forward Base Alpha', status: 'Occupied', current_aircraft_id: 'gen-h203', estimated_clearance_hours: 26.0 },
      { id: 'bay-fba-03', bay_name: 'Hangar Bay 3 (Fast Turnaround)', base: 'Forward Base Alpha', status: 'Available', current_aircraft_id: null, estimated_clearance_hours: 0.0 },
      { id: 'bay-fba-04', bay_name: 'Hangar Bay 4 (Avionics Cleanroom)', base: 'Forward Base Alpha', status: 'Available', current_aircraft_id: null, estimated_clearance_hours: 0.0 },
      { id: 'bay-sdg-01', bay_name: 'Depot Bay Alpha (Overhaul)', base: 'Support Depot Gamma', status: 'Available', current_aircraft_id: null, estimated_clearance_hours: 0.0 },
      { id: 'bay-sdg-02', bay_name: 'Depot Bay Beta (Composite/NDT)', base: 'Support Depot Gamma', status: 'Under Maintenance', current_aircraft_id: null, estimated_clearance_hours: 48.0 },
    ];
  },

  async getJobs(): Promise<MaintenanceJob[]> {
    const res = await apiRequest<MaintenanceJob[]>('/jobs');
    if (res) return res;
    return [
      {
        id: 'job-j102-hyd',
        aircraft_id: 'gen-j102',
        aircraft_tail: 'GEN-J102',
        component_id: 'jet-hydraulics',
        component_name: 'Main Hydraulic Circuit',
        title: 'P1: Hydraulic Circuit Return Manifold Replacement & Leakage Rectification',
        priority: 'P1 - Critical',
        status: 'In Progress',
        trade_required: 'Hydraulics Specialist',
        bay_required: 'Hangar Bay 1 (Heavy Jet)',
        parts_required: ['HYD-SEAL-KIT-01', 'PUMP-CORE-350'],
        estimated_duration_hours: 18.0,
        bottleneck_type: 'spares',
        bottleneck_reason: 'Pump Core lead time delayed by 3 days. Awaiting warehouse issue voucher.',
        aircraft_days_impact: 3.5,
      },
      {
        id: 'job-h203-swash',
        aircraft_id: 'gen-h203',
        aircraft_tail: 'GEN-H203',
        component_id: 'heli-main-rotor',
        component_name: 'Main Rotor Head & Swashplate',
        title: 'P1: Rotor Hub Swashplate Bearing Teardown & Dynamic Re-track',
        priority: 'P1 - Critical',
        status: 'Awaiting Parts',
        trade_required: 'Rotorcraft Systems',
        bay_required: 'Hangar Bay 2 (Rotorcraft)',
        parts_required: ['ROTOR-BEARING-H12'],
        estimated_duration_hours: 28.0,
        bottleneck_type: 'spares',
        bottleneck_reason: 'Zero stock for ROTOR-BEARING-H12 (11-day supplier lead time). Aircraft grounded.',
        aircraft_days_impact: 8.0,
      },
    ];
  },

  async getBottlenecks(): Promise<BottleneckItem[]> {
    const res = await apiRequest<BottleneckItem[]>('/bottlenecks');
    if (res) return res;
    return [
      {
        rank: 1,
        resource_type: 'spare_part',
        resource_name: 'Swashplate Duplex Bearing Assembly (ROTOR-BEARING-H12)',
        shortage_description: 'Zero units on hand with 11-day delivery lead time.',
        affected_aircraft_ids: ['gen-h203'],
        estimated_aircraft_days_recovered: 8.0,
        mitigation_action: 'Expedite supplier priority consignment (+1 unit) or cannibalize decommissioned airframe.',
      },
      {
        rank: 2,
        resource_type: 'spare_part',
        resource_name: 'Main Hydraulic Variable Pump Core (PUMP-CORE-350)',
        shortage_description: 'Stock at 1 vs minimum reorder level 2.',
        affected_aircraft_ids: ['gen-j102'],
        estimated_aircraft_days_recovered: 3.5,
        mitigation_action: 'Release emergency depot buffer at Support Depot Gamma.',
      },
      {
        rank: 3,
        resource_type: 'technician',
        resource_name: 'Level-2+ Hydraulics Specialist (Forward Base Alpha)',
        shortage_description: 'Only 1 available specialist on station; multi-aircraft concurrent hydraulic maintenance queued.',
        affected_aircraft_ids: ['gen-j102', 'gen-j105'],
        estimated_aircraft_days_recovered: 2.8,
        mitigation_action: 'Reassign 1 Hydraulics Specialist from Evening shift or transfer from Support Depot Gamma.',
      },
    ];
  },

  async runWhatIf(request: WhatIfRequest): Promise<WhatIfResult> {
    const res = await apiRequest<WhatIfResult>('/plan/whatif', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (res) return res;

    // Fallback simulation
    let days = 0;
    if (request.delta_spares['sp-rotor-03']) days += 8.0 * request.delta_spares['sp-rotor-03'];
    if (request.delta_spares['sp-pump-02']) days += 3.5 * request.delta_spares['sp-pump-02'];
    if (request.delta_technicians['Hydraulics Specialist']) days += 2.8 * request.delta_technicians['Hydraulics Specialist'];
    if (request.delta_bays) days += 1.5 * request.delta_bays;

    return {
      baseline_ready_count: 18,
      projected_ready_count: Math.min(24, 18 + (days > 4 ? 2 : days > 0 ? 1 : 0)),
      baseline_avg_readiness_pct: 75.0,
      projected_avg_readiness_pct: Math.min(100, 75.0 + Math.round(days * 2.2)),
      aircraft_days_recovered: days,
      remaining_bottlenecks: [],
      explanation: `Simulated intervention recovers approximately ${days.toFixed(1)} aircraft-days across the fleet.`,
    };
  },

  async getDataTrustRecords(grade?: string): Promise<DataTrustRecord[]> {
    const query = grade ? `?grade=${grade}` : '';
    const res = await apiRequest<DataTrustRecord[]>(`/trust/records${query}`);
    if (res) return res;
    return [
      {
        record_id: 'DTR-901',
        aircraft_id: 'gen-j101',
        aircraft_tail: 'GEN-J101',
        component_id: 'jet-hydraulics',
        component_name: 'Main Hydraulic Circuit',
        metric_name: 'Circuit Line Pressure',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        reported_value: 210.4,
        unit: 'bar',
        quality_grade: 'A',
        issues_detected: [],
        requires_human_verification: false,
        hidden_ground_truth: 210.2,
      },
      {
        record_id: 'DTR-903',
        aircraft_id: 'gen-j107',
        aircraft_tail: 'GEN-J107',
        component_id: 'jet-engine',
        component_name: 'Turbofan Propulsion Unit',
        metric_name: 'Exhaust Gas Temperature (EGT)',
        timestamp: new Date(Date.now() - 76 * 3600 * 1000).toISOString(),
        reported_value: 682.0,
        unit: 'deg_C',
        quality_grade: 'C',
        issues_detected: ['Stale timestamp (> 72h elapsed)', 'Packet CRC error'],
        requires_human_verification: true,
        hidden_ground_truth: 745.0,
      },
      {
        record_id: 'DTR-904',
        aircraft_id: 'gen-h204',
        aircraft_tail: 'GEN-H204',
        component_id: 'heli-gearbox',
        component_name: 'Main Transmission & Gearbox',
        metric_name: 'Reduction Gearbox Lube Pressure',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        reported_value: 'N/A',
        unit: 'bar',
        quality_grade: 'D',
        issues_detected: ['Missing required float field', 'Transducer disconnected'],
        requires_human_verification: true,
        hidden_ground_truth: 5.2,
      },
      {
        record_id: 'DTR-906',
        aircraft_id: 'gen-h203',
        aircraft_tail: 'GEN-H203',
        component_id: 'heli-main-rotor',
        component_name: 'Main Rotor Head & Swashplate',
        metric_name: 'Swashplate Bearing Radial Vibration',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        reported_value: -4.5,
        unit: 'g_peak',
        quality_grade: 'D',
        issues_detected: ['Negative vibration reading is physically impossible', 'Inverted polarity wiring'],
        requires_human_verification: true,
        hidden_ground_truth: 0.28,
      },
    ];
  },

  async getVerifyFirst(): Promise<DataTrustRecord[]> {
    const res = await apiRequest<DataTrustRecord[]>('/trust/verify-first');
    if (res) return res;
    const all = await this.getDataTrustRecords();
    return all.filter((r) => r.requires_human_verification);
  },

  async getLedger(): Promise<DecisionLedgerEntry[]> {
    const res = await apiRequest<DecisionLedgerEntry[]>('/ledger');
    if (res) return res;
    return localLedger;
  },

  async recordDecision(payload: {
    action: string;
    previous_state: string;
    resulting_state: string;
    notes: string;
    actor?: string;
  }): Promise<DecisionLedgerEntry> {
    const res = await apiRequest<DecisionLedgerEntry>('/ledger/decision', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res) return res;

    const entry: DecisionLedgerEntry = {
      id: `dec-${localLedger.length + 1}`,
      timestamp: new Date().toISOString(),
      actor: payload.actor || 'demo-ops-officer',
      action: payload.action,
      previous_state: payload.previous_state,
      resulting_state: payload.resulting_state,
      notes: payload.notes,
      scenario_id: localActiveScenario,
    };
    localLedger.unshift(entry);
    return entry;
  },

  getLedgerCsvUrl(): string {
    return `${API_BASE}/ledger/export/csv`;
  },

  async getScenarios(): Promise<ScenarioInfo[]> {
    const res = await apiRequest<ScenarioInfo[]>('/scenarios');
    if (res) return res;
    return [
      { id: 'baseline', name: 'Baseline Fleet Deployment', description: 'Standard operational tempo with balanced spares and nominal weather.', active: localActiveScenario === 'baseline', impacted_areas: ['Nominal Fleet Health'], simulated_impact_summary: 'Baseline 24-aircraft fleet readiness at 75–83%.' },
      { id: 'spares_constrained', name: 'Spares Constrained', description: 'Supply chain bottleneck: hydraulic pump cores and swashplate bearings zeroed.', active: localActiveScenario === 'spares_constrained', impacted_areas: ['Inventory Lead Times', 'Hydraulic & Rotorcraft Maintenance'], simulated_impact_summary: 'Grounded queue expands; 12.7 aircraft-days lost.' },
      { id: 'technician_constrained', name: 'Technician Constrained', description: 'Surge exercise drains Level-2+ Hydraulics and Rotorcraft specialists.', active: localActiveScenario === 'technician_constrained', impacted_areas: ['Turnaround Duration'], simulated_impact_summary: 'Repairs delayed due to single-shift trade coverage.' },
      { id: 'bay_constrained', name: 'Maintenance Bay Constrained', description: 'Hangar floor epoxy and environmental seal retrofits close 4 bays.', active: localActiveScenario === 'bay_constrained', impacted_areas: ['Hangar Bay Slots'], simulated_impact_summary: 'Aircraft held on tarmac; turnaround increases by 4.5 days.' },
      { id: 'poor_data_quality', name: 'Poor Data Quality', description: 'Telemetry transponder bus noise injects sensor scale errors and missing values.', active: localActiveScenario === 'poor_data_quality', impacted_areas: ['Data Trust Grades'], simulated_impact_summary: '10+ records routed to Human-in-the-Loop review queue.' },
      { id: 'campaign_recovery', name: 'Campaign Recovery Surge', description: 'High operational surge increases utilization to 92%.', active: localActiveScenario === 'campaign_recovery', impacted_areas: ['Fleet Utilization Rate'], simulated_impact_summary: 'Faster turnarounds with heightened component thermal stress.' },
      { id: 'disconnected_base', name: 'Disconnected Base', description: 'Forward Base Alpha communication and supply links disrupted.', active: localActiveScenario === 'disconnected_base', impacted_areas: ['Remote Depot Replenishment'], simulated_impact_summary: 'External parts lead times delayed by +14 days.' },
    ];
  },

  async activateScenario(scenarioId: ScenarioId): Promise<{ status: string; active_scenario: ScenarioId }> {
    const res = await apiRequest<{ status: string; active_scenario: ScenarioId }>('/scenarios/activate', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    if (res) {
      localActiveScenario = scenarioId;
      return res;
    }
    localActiveScenario = scenarioId;
    return { status: 'success', active_scenario: scenarioId };
  },
};
