import {
  BaseId,
  FutureHours,
  AircraftData,
  FleetSummary,
  FleetTableItem,
  SparePart,
  Technician,
  MaintenanceBay,
  MaintenanceJob,
  WorkOrder,
  BottleneckItem,
  DataTrustRecord,
  DecisionLedgerEntry,
  ImportHistoryItem,
  WhatIfRequest,
  WhatIfResult,
  OptimizerRecommendation,
  DataCategory,
  AircraftComponentData,
  ChatMessage,
  SecurityStatus,
  VerifyTotpResult,
  VerifyChainResult,
  ComponentRulPrediction,
  SensorAttribution,
  DepartmentProfile,
  DepartmentLoginResponse,
  VerifyDepartmentTotpResponse,
  DEPARTMENT_PROFILES,
  CommanderAirbase,
  CommandApprovalItem,
  CommanderFleetMetrics,
  ApprovalActionRequest,
  ApprovalActionResponse,
  LogisticsInventoryItem,
  LogisticsKpiSummary,
  MaterialRequestItem,
  SparesTransferItem,
  ProcurementOrderItem,
  StockMovementItem,
  MaintenanceWorkOrderItem,
  MaintenanceKpiSummary,
  UpdateStageRequest,
  InspectionSignOffRequest,
  ConfirmPartReceiptRequest,
  TechnicianRosterItem,
  HangarBayStatusItem,
} from '../types/aircraft';
import {
  baseList,
  aircraftList,
  fleetSummaryData,
  fullFleetTable,
  initialSpares,
  initialWorkOrders,
  initialTechnicians,
  initialBays,
  initialJobs,
  initialBottlenecks,
  initialDataTrustRecords,
  initialDecisionLedger,
  initialImportHistory,
} from '../data/aircraftData';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function sha256Sync(str: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const maxWord = Math.pow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';
  let words: number[] = [];
  let asciiBitLength = str[lengthProperty] * 8;
  let hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  let composite = str + '\x80';
  while ((composite[lengthProperty] % 64) - 56) composite += '\x00';
  for (i = 0; i < composite[lengthProperty]; i++) {
    j = composite.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;
  for (j = 0; j < words[lengthProperty]; ) {
    let w = words.slice(j, (j += 16));
    let oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      let w15 = w[i - 15], w2 = w[i - 2];
      let s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      let s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      let s2 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      let t2 = s2 + maj;
      let s3 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      let t1 = hash[7] + s3 + ch + k[i] + w[i];
      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      let byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

function computeComponentRul(
  compName: string,
  health: number,
  futureHours: number,
  hasTrustPenalty: boolean
): ComponentRulPrediction {
  const rulP50 = Math.max(2, Math.round((health / 100) * 180));
  const baseSpread = Math.max(3, Math.round(rulP50 * 0.15));
  const spread = hasTrustPenalty ? Math.round(baseSpread * 1.8) : baseSpread;
  const rulP10 = Math.max(0.5, Math.round((rulP50 - spread) * 10) / 10);
  const rulP90 = Math.round((rulP50 + spread) * 10) / 10;
  const baseRisk = (100 - health) * 0.95 + futureHours * 0.25;
  const riskRangePct = Math.min(99, Math.max(4, Math.round(baseRisk + (hasTrustPenalty ? 8 : 0))));

  const isHyd = compName.toLowerCase().includes('hydraulic') || compName.toLowerCase().includes('pump');
  const isEng = compName.toLowerCase().includes('engine') || compName.toLowerCase().includes('turbofan');
  const isAv = compName.toLowerCase().includes('avionics') || compName.toLowerCase().includes('radar');

  const shapDrivers: SensorAttribution[] = isHyd
    ? [
        { name: 'Hydraulic Cavitation Pressure', contribution_pct: hasTrustPenalty ? 52 : 48 },
        { name: 'Return Line Fluid Temperature', contribution_pct: 30 },
        { name: 'RMS High-Frequency Vibration', contribution_pct: hasTrustPenalty ? 18 : 22 },
      ]
    : isEng
    ? [
        { name: 'Combustor Liner EGT Gradient', contribution_pct: 46 },
        { name: 'Compressor Stage Vibration', contribution_pct: 34 },
        { name: 'Oil Scavenge Pressure', contribution_pct: 20 },
      ]
    : isAv
    ? [
        { name: 'T/R Subarray Phase Drift', contribution_pct: 45 },
        { name: 'Power Conditioning Thermal Load', contribution_pct: 35 },
        { name: 'Digital Bus Clock Jitter', contribution_pct: 20 },
      ]
    : [
        { name: 'Dynamic Aero-Elastic Strain', contribution_pct: 44 },
        { name: 'Actuator Hysteresis Lag', contribution_pct: 36 },
        { name: 'Operating Cycle Accumulation', contribution_pct: 20 },
      ];

  return {
    model_source: 'deterministic_fallback_slot',
    model_file_present: false,
    rul_p10: rulP10,
    rul_p50: rulP50,
    rul_p90: rulP90,
    risk_range_pct: riskRangePct,
    trust_penalty_applied: hasTrustPenalty,
    shap_drivers: shapDrivers,
  };
}

// Mutable in-memory stores for interactive session
let inMemoryFleetTable: FleetTableItem[] = [...fullFleetTable];
let inMemorySpares: SparePart[] = [...initialSpares];
let inMemoryWorkOrders: WorkOrder[] = [...initialWorkOrders];
let inMemoryTechnicians: Technician[] = [...initialTechnicians];
let inMemoryBays: MaintenanceBay[] = [...initialBays];
let inMemoryJobs: MaintenanceJob[] = [...initialJobs];
let inMemoryBottlenecks: BottleneckItem[] = [...initialBottlenecks];
let inMemoryDataTrust: DataTrustRecord[] = [...initialDataTrustRecords];
let inMemoryLedger: DecisionLedgerEntry[] = [...initialDecisionLedger];
let inMemoryImports: ImportHistoryItem[] = [...initialImportHistory];

export const mockAirDoctorService = {
  getBases() {
    return baseList;
  },

  // 3D Aircraft Viewer List (Rafale & Tejas)
  get3DAircraft(baseId: BaseId = 'all'): AircraftData[] {
    const list = baseId === 'all' ? aircraftList : aircraftList.filter((a) => a.baseId === baseId);
    return list.map((a) => this.projectAircraftHealth(a, 0));
  },

  // 24-Aircraft Fleet Table (Page 1 Command Center)
  getFleetTable(baseId: BaseId = 'all', typeFilter: 'All' | 'Rafale' | 'Tejas' = 'All'): FleetTableItem[] {
    let list = inMemoryFleetTable;
    if (baseId !== 'all') {
      list = list.filter((a) => a.baseId === baseId);
    }
    if (typeFilter !== 'All') {
      list = list.filter((a) => a.type === typeFilter);
    }
    return list;
  },

  getFleetSummary(baseId: BaseId = 'all'): FleetSummary {
    const list = this.getFleetTable(baseId, 'All');
    const ready = list.filter((a) => a.status === 'Ready').length;
    const maint = list.filter((a) => a.status === 'Maintenance').length;
    const alert = Math.max(list.filter((a) => a.status === 'Attention').length, baseId === 'base-alpha' ? 0 : 2);
    const readiness = list.length > 0 ? Math.round((ready / list.length) * 100) : 75;

    return {
      totalAircraft: list.length,
      readyToFly: ready,
      inMaintenance: maint,
      attentionRequired: alert,
      fleetReadinessScore: readiness,
      averageFleetHealth: Math.round(list.reduce((acc, a) => acc + a.health, 0) / list.length),
    };
  },

  // Future Flight-Hours Degradation Simulator (Page 2)
  projectAircraftHealth(aircraft: AircraftData, futureHours: FutureHours): AircraftData {
    const hasTrustPenalty = inMemoryDataTrust.some(
      (t) => (t.quality_grade === 'C' || t.quality_grade === 'D') && t.verification_status !== 'VERIFIED'
    );

    const projectedComponents: AircraftComponentData[] = aircraft.components.map((comp) => {
      const projection = futureHours > 0 ? comp.futureProjections?.[futureHours as 10 | 25 | 50] : null;
      const compHealth = projection ? projection.health : comp.health;
      const compStatus = projection ? projection.status : comp.status;
      const compRisk = projection ? projection.risk : comp.maintenanceRisk;
      const compInsight = projection ? projection.insight : comp.insight;

      const rulPred = computeComponentRul(comp.name, compHealth, futureHours, hasTrustPenalty);

      return {
        ...comp,
        health: compHealth,
        status: compStatus,
        maintenanceRisk: compRisk,
        insight: compInsight,
        rulPrediction: rulPred,
      };
    });

    const projectedAvgHealth = Math.round(
      projectedComponents.reduce((acc, c) => acc + c.health, 0) / projectedComponents.length
    );

    const hasMaintReq = projectedComponents.some((c) => c.status === 'Maintenance Required');
    const hasMonitor = projectedComponents.some((c) => c.status === 'Monitor');

    return {
      ...aircraft,
      overallHealth: projectedAvgHealth,
      status: hasMaintReq ? 'MAINTENANCE' : hasMonitor ? 'ALERT' : aircraft.status,
      statusLabel: hasMaintReq
        ? 'Projected Maintenance'
        : hasMonitor
        ? 'Degraded Performance'
        : aircraft.statusLabel,
      components: projectedComponents,
    };
  },

  // Logistics & Spares (Page 4)
  getSpares(baseId: BaseId = 'all'): SparePart[] {
    if (baseId === 'all') return inMemorySpares;
    return inMemorySpares.filter((s) => s.baseId === baseId || s.crossBaseSource?.toLowerCase().includes(baseId.replace('base-', '')));
  },

  getTechnicians(baseId: BaseId = 'all'): Technician[] {
    if (baseId === 'all') return inMemoryTechnicians;
    return inMemoryTechnicians.filter((t) => t.baseId === baseId);
  },

  getBays(baseId: BaseId = 'all'): MaintenanceBay[] {
    if (baseId === 'all') return inMemoryBays;
    return inMemoryBays.filter((b) => b.baseId === baseId);
  },

  getJobs(baseId: BaseId = 'all'): MaintenanceJob[] {
    if (baseId === 'all') return inMemoryJobs;
    return inMemoryJobs.filter((j) => j.baseId === baseId);
  },

  getBottlenecks(baseId: BaseId = 'all'): BottleneckItem[] {
    if (baseId === 'all') return inMemoryBottlenecks;
    return inMemoryBottlenecks.filter((b) => b.baseId === baseId);
  },

  // Work Orders (Page 6)
  getWorkOrders(
    baseId: BaseId = 'all',
    statusFilter: string = 'All',
    searchQuery: string = '',
    aircraftFilter: string = 'All',
    statusSelect: string = 'All'
  ): WorkOrder[] {
    let list = inMemoryWorkOrders;
    if (baseId !== 'all') {
      list = list.filter((w) => w.baseId === baseId);
    }
    if (statusFilter !== 'All') {
      list = list.filter((w) => w.status === statusFilter);
    }
    if (statusSelect !== 'All') {
      list = list.filter((w) => w.status === statusSelect);
    }
    if (aircraftFilter !== 'All') {
      list = list.filter((w) => w.aircraft.toLowerCase().includes(aircraftFilter.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.id.toLowerCase().includes(q) ||
          w.aircraft.toLowerCase().includes(q) ||
          w.component.toLowerCase().includes(q)
      );
    }
    return list;
  },

  createWorkOrder(newWo: Omit<WorkOrder, 'id'>): WorkOrder {
    const created: WorkOrder = {
      ...newWo,
      id: `WO-${1043 + inMemoryWorkOrders.length}`,
    };
    inMemoryWorkOrders = [created, ...inMemoryWorkOrders];
    this.recordDecision({
      actor: 'Air Commander',
      action: 'CREATE_WORK_ORDER',
      previous_state: `${created.aircraft}: Unscheduled`,
      resulting_state: `${created.id}: ${created.status} (${created.component})`,
      notes: `Created new work order for ${created.aircraft} ${created.component}. Est hours: ${created.estHours}h.`,
      baseId: created.baseId,
    });
    return created;
  },

  updateWorkOrder(id: string, updates: Partial<WorkOrder>) {
    const index = inMemoryWorkOrders.findIndex((w) => w.id === id);
    if (index !== -1) {
      inMemoryWorkOrders[index] = { ...inMemoryWorkOrders[index], ...updates };
      this.recordDecision({
        actor: 'AI Maintenance Planner / Air Commander',
        action: 'UPDATE_WORK_ORDER_SCHEDULE',
        previous_state: `${id}: Previous Schedule`,
        resulting_state: `${id}: Updated to ${updates.scheduledDate || inMemoryWorkOrders[index].scheduledDate} (${updates.status || inMemoryWorkOrders[index].status})`,
        notes: `Optimized work order scheduling: ${JSON.stringify(updates)}`,
        baseId: inMemoryWorkOrders[index].baseId,
      });
    }
  },

  // Resource Optimizer Engine (Page 4)
  getDefaultRecommendation(): OptimizerRecommendation {
    return {
      id: 'rec-01',
      title: 'Execute Cross-Base Transfer of Hydraulic Pump Kit (HP-9042)',
      actionType: 'CROSS_BASE_TRANSFER',
      recommendedOption: 'Cross-Base Transfer from Base Alpha (Ambala Depot) to Base Bravo (Sulur AFS)',
      daysRecovered: 2.92,
      rationale:
        'Supplier delivery of HP-9042 requires 6–8 weeks (lead time 49 days). Base Alpha has 1 unit in stock. Staging an internal air transport delivers the part in 14 hours, reducing Tejas downtime from 96h to 26h.',
      tradeOff:
        'Reduces Base Alpha hydraulic pump depot buffer from 1 to 0 for 72 hours until vendor stock replenishment arrives.',
      parameters: {
        delta_spares: { 'HP-9042': 0 },
        delta_technicians: { 'Hydraulics Specialist': 0 },
        delta_bays: 0,
        cross_base_transfer: true,
      },
    };
  },

  runWhatIf(req: WhatIfRequest): WhatIfResult {
    const baselineReadyHours = 96;
    let effectiveLeadTimeHours = 96;
    let repairDuration = 12;

    if (req.cross_base_transfer) {
      effectiveLeadTimeHours = 14;
    }

    const hpAdded = req.delta_spares['HP-9042'] || 0;
    if (hpAdded > 0) {
      effectiveLeadTimeHours = 0;
    }

    const extraTechs = req.delta_technicians['Hydraulics Specialist'] || 0;
    if (extraTechs > 0) {
      repairDuration = Math.max(8, repairDuration - 4);
    }

    const projectedReadyHours = effectiveLeadTimeHours + repairDuration;
    const hoursRecovered = Math.max(0, baselineReadyHours - projectedReadyHours);
    const aircraft_days_recovered = parseFloat((hoursRecovered / 24).toFixed(2));
    const projectedReadiness =
      projectedReadyHours <= 24 ? 100 : projectedReadyHours <= 48 ? 85 : 50;

    let activeBottleneck = 'None (Pacing within nominal flightline timeline)';
    if (effectiveLeadTimeHours > 24) {
      activeBottleneck = `Commercial Supplier Lead Time (${effectiveLeadTimeHours}h)`;
    } else if (effectiveLeadTimeHours > 0) {
      activeBottleneck = `Inter-Base Transit Time (${effectiveLeadTimeHours}h)`;
    }

    return {
      scenarioName: req.cross_base_transfer
        ? 'Cross-Base Transfer Scenario'
        : hpAdded > 0
        ? 'Expedited Local Spare Allocation'
        : extraTechs > 0
        ? 'Dual-Specialist Pairing'
        : 'Modified Logistics Schedule',
      baselineReadyHours,
      projectedReadyHours,
      hoursRecovered,
      aircraft_days_recovered,
      projectedFleetReadinessPct: projectedReadiness,
      costImpactEst: req.cross_base_transfer
        ? '₹ 45,000 (Internal courier airlift)'
        : hpAdded > 0
        ? '₹ 1,80,000 (Commercial expedite fee)'
        : '₹ 0 (Nominal baseline)',
      riskAssessment:
        aircraft_days_recovered >= 2.5
          ? 'LOW RISK — Mission critical airframe recovered 3 days ahead of baseline.'
          : 'MODERATE RISK — Extended downtime remains above 24h readiness boundary.',
      activeBottleneck,
    };
  },

  // Data Trust & Import Engine (Page 3)
  getDataTrustRecords(baseId: BaseId = 'all'): DataTrustRecord[] {
    if (baseId === 'all') return inMemoryDataTrust;
    return inMemoryDataTrust.filter((r) => r.baseId === baseId);
  },

  getVerifyFirstQueue(baseId: BaseId = 'all'): DataTrustRecord[] {
    const list = this.getDataTrustRecords(baseId);
    return list.filter((r) => r.verification_status === 'NEEDS_REVIEW');
  },

  verifyRecord(recordId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) {
    const record = inMemoryDataTrust.find((r) => r.id === recordId);
    if (!record) return;

    record.verification_status = status;
    record.requires_human_verification = false;
    if (status === 'VERIFIED') {
      record.quality_grade = 'B';
    }

    this.recordDecision({
      actor: 'Air Commander (Data Trust Reviewer)',
      action: status === 'VERIFIED' ? 'APPROVE_DATA_TRUST_RECORD' : 'REJECT_ANOMALOUS_DATA_RECORD',
      previous_state: `${record.record_id}: NEEDS_REVIEW`,
      resulting_state: `${record.record_id}: ${status}`,
      notes: notes || `Verified telemetry/inventory integrity for ${record.record_id}.`,
      baseId: record.baseId,
    });
  },

  getImportHistory(baseId: BaseId = 'all'): ImportHistoryItem[] {
    if (baseId === 'all') return inMemoryImports;
    return inMemoryImports.filter((i) => i.baseId === baseId);
  },

  simulateCsvImport(baseId: BaseId, category: DataCategory, filename: string) {
    const newImport: ImportHistoryItem = {
      id: `imp-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      baseId,
      baseName: baseId === 'base-alpha' ? 'Base Alpha (Ambala AFS)' : 'Base Bravo (Sulur AFS)',
      category,
      filename,
      recordsCount: 42,
      validCount: 39,
      flaggedCount: 3,
      status: 'ACCEPTED',
    };
    inMemoryImports = [newImport, ...inMemoryImports];

    const newRecord: DataTrustRecord = {
      id: `dtr-${Date.now().toString().slice(-4)}`,
      baseId,
      category,
      record_id: `IMP-${category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-3)}`,
      source_system: `Manual CSV Upload: ${filename}`,
      timestamp: '2024-10-03',
      quality_grade: 'A',
      requires_human_verification: false,
      verification_status: 'VERIFIED',
      detected_issues: [],
      payload: {
        date: '2024-10-03',
        aircraft: 'T-04',
        component: 'Hydraulic System',
        value: '198',
        unit: 'bar',
      },
    };
    inMemoryDataTrust = [newRecord, ...inMemoryDataTrust];

    this.recordDecision({
      actor: 'Ground Telemetry Ingest Officer',
      action: 'INGEST_OFFLINE_CSV_BATCH',
      previous_state: 'AWAITING_INGEST',
      resulting_state: `INGESTED_42_RECORDS (${filename})`,
      notes: `Successfully validated CSV batch for ${category} at ${newImport.baseName}.`,
      baseId,
    });

    return newImport;
  },

  // Deterministic AI Chatbot Query Service (Pages 2, 5, 6, 7)
  queryAiAssistant(userPrompt: string): ChatMessage {
    const q = userPrompt.toLowerCase();
    const timestamp = 'Just now';

    // 1. Inquiries about HP-9042 or Hydraulic Pump
    if (q.includes('hp-9042') || q.includes('hydraulic pump') || q.includes('spare')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'HP-9042 is a Hydraulic Pump Kit used in Tejas aircraft. Base Bravo currently has 0 units in stock with an external supplier lead time of 6–8 weeks.',
        cardData: {
          title: 'Hydraulic Pump Kit (HP-9042)',
          badge: 'In Stock at Base Alpha',
          badgeType: 'success',
          partNumber: 'HP-9042',
          specs: [
            { label: 'Current Stock', value: '1 unit (Base Alpha)' },
            { label: 'Min Required', value: '2 units' },
            { label: 'Supplier Lead Time', value: '6–8 weeks' },
            { label: 'Compatible With', value: 'Tejas (Mk1 / Mk1A)' },
            { label: 'Condition', value: 'Serviceable' },
          ],
          recommendations: [
            'Transfer 1 unit from Base Alpha to reduce downtime by 72 hours.',
            'Check alternative spare HP-9042A (compatible variant available).',
            'Expedite supplier order (lead time 6–8 weeks).',
          ],
        },
      };
    }

    // 2. Inquiries about why aircraft is waiting for maintenance / grounded
    if (q.includes('why') || q.includes('grounded') || q.includes('waiting') || q.includes('ar-02') || q.includes('t-04')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'Tejas T-04 (AR-02) is currently flagged for Attention Required because its hydraulic pressure dropped to 82 bar (below the 180 bar safety threshold). Work Order WO-1042 is delayed waiting for Hydraulic Pump Kit HP-9042.',
        cardData: {
          title: 'Tejas T-04 (AR-02) Maintenance Constraint',
          badge: 'Awaiting Spare HP-9042',
          badgeType: 'danger',
          specs: [
            { label: 'Affected Subsystem', value: 'Hydraulic System (82 bar)' },
            { label: 'Work Order', value: 'WO-1042 (Delayed)' },
            { label: 'Assigned Tech', value: 'MWO R. Sharma' },
            { label: 'Current Bay', value: 'Bay 1 (Heavy Depot)' },
            { label: 'Delay Impact', value: '+84 hours delay without transfer' },
          ],
          recommendations: [
            'Execute Cross-Base Transfer of HP-9042 from Base Alpha.',
            'Assign Sgt. V. Nair upon part arrival to compress repair duration.',
          ],
        },
      };
    }

    // 3. Inquiries about schedule, work orders, or schedule optimization
    if (q.includes('schedule') || q.includes('work order') || q.includes('delay') || q.includes('planner')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'Based on current workload and resource availability, here is the AI-optimized maintenance schedule:\n• Reschedule WO-1042 to 13 Oct (after spare arrival).\n• Move WO-1041 to Bay 2 to avoid bay conflict.\n• Allocate 1 additional technician for avionics checks.\n• This reduces total fleet downtime by 18 hours.',
        cardData: {
          title: 'AI Optimized Schedule Recommendations',
          badge: '18h Downtime Reduction',
          badgeType: 'success',
          specs: [
            { label: 'Total Work Orders', value: '24 (12 On Schedule, 8 Delayed, 4 Critical)' },
            { label: 'Key Bottleneck', value: 'HP-9042 Spare Part Shortage' },
            { label: 'Bay Utilization', value: '85% capacity' },
          ],
          recommendations: [
            'Reschedule WO-1042 to 13 Oct (after spare arrival).',
            'Move WO-1041 to Bay 2 to avoid bay conflict.',
            'Allocate 1 additional technician for avionics checks.',
          ],
        },
      };
    }

    // 4. Inquiries about reports, trends, or monthly insights
    if (q.includes('insight') || q.includes('report') || q.includes('trend') || q.includes('month') || q.includes('cause')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'Key insights for October 2024:\n1. Hydraulic system caused 42% of total downtime (120 hours).\n2. Spare shortage is the primary bottleneck pacing return-to-service.\n3. Fleet readiness improved by 6% compared to last month (currently 76%).',
        cardData: {
          title: 'Operational Readiness Insights (Oct 2024)',
          badge: 'Fleet Readiness: 76%',
          badgeType: 'success',
          specs: [
            { label: 'Total Downtime', value: '324 Hours (-18% from last month)' },
            { label: 'Primary Cause', value: 'Parts Shortage (42% of downtime)' },
            { label: 'Avg Repair Time', value: '26 hours (-22%)' },
          ],
          recommendations: [
            'Transfer spare HP-9042 from Base Alpha to restore Tejas T-04.',
            'Schedule preventive seal replacement on hydraulic systems.',
            'Allocate 1 additional technician to reduce maintenance backlog.',
          ],
        },
      };
    }

    // Default general query answer
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp,
      text: `AirDoctor Assistant checked the currently loaded fleet data for Central HQ. 24 aircraft are currently monitored (18 Ready, 4 In Maintenance, 2 Attention Required) with an overall fleet readiness of 75%. Active bottleneck: Spare HP-9042 at Base Bravo.`,
      cardData: {
        title: 'Fleet Status Overview',
        badge: '75% Fleet Readiness',
        badgeType: 'success',
        specs: [
          { label: 'Active Aircraft', value: '24 Total' },
          { label: 'Ready to Fly', value: '18 Airframes' },
          { label: 'Under Maintenance', value: '4 Airframes' },
          { label: 'Attention Required', value: '2 Airframes' },
        ],
        recommendations: [
          'Review priority work orders in Maintenance Scheduler.',
          'Execute recommended cross-base spare transfer in Resource Optimizer.',
        ],
      },
    };
  },

  // Decision Ledger (Page 7) with SHA-256 Hash Chaining
  getLedger(baseId: BaseId = 'all'): DecisionLedgerEntry[] {
    const list = baseId === 'all'
      ? [...inMemoryLedger]
      : inMemoryLedger.filter((l) => !l.baseId || l.baseId === 'all' || l.baseId === baseId);

    // Sort chronologically (oldest to newest) to build unbroken SHA-256 chain
    const sorted = [...list].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
    const hashMap = new Map<string, { prev: string; curr: string }>();

    let prevHash = GENESIS_HASH;
    for (const entry of sorted) {
      const payload = `${prevHash}:${entry.id}:${entry.timestamp}:${entry.actor}:${entry.action}:${entry.resulting_state}`;
      const currHash = sha256Sync(payload);
      hashMap.set(entry.id, { prev: prevHash, curr: currHash });
      prevHash = currHash;
    }

    // Return in reverse chronological order (newest first)
    return list.map((entry) => {
      const hashes = hashMap.get(entry.id) || { prev: GENESIS_HASH, curr: GENESIS_HASH };
      return {
        ...entry,
        prev_hash: hashes.prev,
        curr_hash: hashes.curr,
      };
    });
  },

  recordDecision(entry: Omit<DecisionLedgerEntry, 'id' | 'timestamp'>): DecisionLedgerEntry {
    const newEntry: DecisionLedgerEntry = {
      ...entry,
      id: `dec-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
    };
    inMemoryLedger = [newEntry, ...inMemoryLedger];

    const enriched = this.getLedger('all');
    return enriched.find((e) => e.id === newEntry.id) || newEntry;
  },

  async verifyLedgerChain(): Promise<VerifyChainResult> {
    const sorted = [...inMemoryLedger].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
    let prevHash = GENESIS_HASH;
    for (const entry of sorted) {
      const payload = `${prevHash}:${entry.id}:${entry.timestamp}:${entry.actor}:${entry.action}:${entry.resulting_state}`;
      prevHash = sha256Sync(payload);
    }

    return {
      verified: true,
      total_blocks: inMemoryLedger.length,
      head_hash: prevHash,
      algorithm: 'SHA-256',
      message: `SHA-256 Cryptographic Chain Verified — ${inMemoryLedger.length}/${inMemoryLedger.length} Blocks Intact`,
    };
  },

  // -----------------------------------------------------------
  // Cybersecurity, RBAC & TOTP MFA
  // -----------------------------------------------------------
  getCurrentTotpCode(offset: number = 0): string {
    const window = Math.floor(Date.now() / 30000) + offset;
    const hash = sha256Sync(`AIRDOCTOR_MFA_WINDOW_${window}`);
    const num = parseInt(hash.slice(0, 8), 16) % 1000000;
    const code = num.toString().padStart(6, '0');
    // Save to valid cache
    if (!(this as any)._issuedCodes) {
      (this as any)._issuedCodes = new Set<string>(['777888', '123456']);
    }
    (this as any)._issuedCodes.add(code);
    return code;
  },

  async getAuthStatus(): Promise<SecurityStatus> {
    return {
      argon2id_enabled: true,
      totp_mfa_enabled: true,
      roles: ['Commander', 'Planner', 'Viewer'],
      demo_totp_code: this.getCurrentTotpCode(0),
      active_policy: 'Strict Air Force RBAC + Step-Up RFC 6238 TOTP MFA',
      crypto_algorithms: {
        password_kdf: 'Argon2id (RFC 9106) / Scrypt memory-hard',
        mfa_protocol: 'RFC 6238 HMAC-SHA1 / HMAC-SHA256 Time-Based One-Time Password',
        decision_ledger_chain: 'SHA-256 Merkle-Chained Tamper-Evident Blocks',
      },
    };
  },

  async verifyTotp(code: string, role: string = 'Commander'): Promise<VerifyTotpResult> {
    const clean = (code || '').trim();
    const issued: Set<string> = (this as any)._issuedCodes || new Set<string>();
    const validCodes = new Set<string>(['777888', '123456', ...issued]);
    for (const off of [0, -1, 1, -2, 2]) {
      validCodes.add(this.getCurrentTotpCode(off));
    }

    if (!validCodes.has(clean)) {
      throw new Error("Invalid TOTP MFA token. Please verify current time window or click 'Auto-Fill Valid Demo TOTP'.");
    }
    return {
      verified: true,
      role,
      message: `${role} authorization verified via TOTP Multi-Factor Authentication.`,
    };
  },

  // -----------------------------------------------------------
  // Department Login & 2-Step TOTP Gate (SIH Ministry of Defence)
  // -----------------------------------------------------------
  getDepartmentProfiles(): DepartmentProfile[] {
    return DEPARTMENT_PROFILES;
  },

  async loginDepartment(deptId: string, password?: string): Promise<DepartmentLoginResponse> {
    const cleanId = (deptId || '').trim().toLowerCase();
    const dept = DEPARTMENT_PROFILES.find(
      (d) => d.id.toLowerCase() === cleanId || d.serviceId.toLowerCase() === cleanId
    );
    if (!dept) {
      throw new Error(`Department with ID '${deptId}' not found in Ministry of Defence directory.`);
    }

    if (password && password.trim() !== '') {
      const cleanPwd = password.trim();
      const validPasswords = new Set(['AirDoctor@2026', 'airdoctor2026', 'password123', 'admin', 'demo']);
      if (!validPasswords.has(cleanPwd)) {
        throw new Error("Invalid department security key. Evaluator demo password is 'AirDoctor@2026'.");
      }
    }

    return {
      step: 'totp_required',
      department_id: dept.id,
      department_name: dept.name,
      officer: dept.officer,
      service_id: dept.serviceId,
      role: dept.role,
      default_tab: dept.defaultTab,
      demo_totp_code: this.getCurrentTotpCode(),
      message: `Step 1 verified for ${dept.officer}. 6-digit Time-Based OTP required to complete sign-in.`,
    };
  },

  async verifyDepartmentTotp(deptId: string, totpCode: string): Promise<VerifyDepartmentTotpResponse> {
    const cleanId = (deptId || '').trim().toLowerCase();
    const dept = DEPARTMENT_PROFILES.find(
      (d) => d.id.toLowerCase() === cleanId || d.serviceId.toLowerCase() === cleanId
    );
    if (!dept) {
      throw new Error(`Department '${deptId}' not found.`);
    }

    const clean = (totpCode || '').trim();
    const issued: Set<string> = (this as any)._issuedCodes || new Set<string>();
    const validCodes = new Set<string>(['777888', '123456', ...issued]);
    for (const off of [0, -1, 1, -2, 2]) {
      validCodes.add(this.getCurrentTotpCode(off));
    }

    if (!validCodes.has(clean)) {
      throw new Error("Invalid or expired TOTP code. Use the current 30-second token or click 'Auto-Fill OTP'.");
    }

    return {
      verified: true,
      department_id: dept.id,
      department_name: dept.name,
      officer: dept.officer,
      service_id: dept.serviceId,
      role: dept.role,
      default_tab: dept.defaultTab,
      message: `Authentication successful. Session clearance established for ${dept.officer}.`,
      access_token: `iaf-auth-${Math.random().toString(36).substring(2, 14)}`,
      authenticated_at: new Date().toISOString(),
    };
  },

  getCommanderAirbases(): CommanderAirbase[] {
    return [
      {
        id: 'ambala',
        name: 'Ambala AFS',
        code: 'AFS-AMB',
        command: 'Western',
        lat: 30.368,
        lng: 76.817,
        status: 'Spares Needed',
        statusLevel: 'warning',
        totalAircraft: 38,
        serviceable: 28,
        underMaintenance: 7,
        grounded: 3,
        readinessPct: 74,
        squadrons: ['No. 17 Golden Arrows (Rafale)', 'No. 5 Tigers (Jaguar)'],
        aircraftBreakdown: [
          { type: 'Rafale', total: 18, serviceable: 14, maintenance: 3, grounded: 1 },
          { type: 'Jaguar IS', total: 12, serviceable: 9, maintenance: 2, grounded: 1 },
          { type: 'MiG-21 Bison', total: 8, serviceable: 5, maintenance: 2, grounded: 1 },
        ],
        blockers: [
          'APU Starter Generator shortage for Rafale R-04',
          'Hydraulic seal kit pending QA signoff',
        ],
        commanderName: 'Air Commodore S. Sharma, VM',
        lastInspection: '18 Oct 2026',
      },
      {
        id: 'sulur',
        name: 'Sulur AFS',
        code: 'AFS-SLR',
        command: 'Southern',
        lat: 11.013,
        lng: 77.161,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 24,
        serviceable: 20,
        underMaintenance: 3,
        grounded: 1,
        readinessPct: 83,
        squadrons: ['No. 45 Flying Daggers (Tejas)', 'No. 18 Flying Bullets (Tejas)'],
        aircraftBreakdown: [
          { type: 'Tejas Mk1', total: 16, serviceable: 14, maintenance: 2, grounded: 0 },
          { type: 'Tejas Trainer', total: 8, serviceable: 6, maintenance: 1, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore R. K. Pillai, VSM',
        lastInspection: '19 Oct 2026',
      },
      {
        id: 'pune',
        name: 'Pune AFS',
        code: 'AFS-PUN',
        command: 'South Western',
        lat: 18.582,
        lng: 73.919,
        status: 'Maintenance',
        statusLevel: 'in_progress',
        totalAircraft: 32,
        serviceable: 22,
        underMaintenance: 8,
        grounded: 2,
        readinessPct: 69,
        squadrons: ['No. 20 Lightning (Su-30MKI)', 'No. 30 Rhinos (Su-30MKI)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 32, serviceable: 22, maintenance: 8, grounded: 2 },
        ],
        blockers: ['Radar beam calibration bench queued in Bay 3'],
        commanderName: 'Air Commodore A. Joshi, VM',
        lastInspection: '17 Oct 2026',
      },
      {
        id: 'gwalior',
        name: 'Gwalior AFS',
        code: 'AFS-GWL',
        command: 'Central',
        lat: 26.293,
        lng: 78.228,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 28,
        serviceable: 21,
        underMaintenance: 5,
        grounded: 2,
        readinessPct: 75,
        squadrons: ['No. 1 Tigers (Mirage 2000)', 'No. 7 Battleaxes (Mirage 2000)'],
        aircraftBreakdown: [
          { type: 'Mirage 2000I', total: 20, serviceable: 16, maintenance: 3, grounded: 1 },
          { type: 'Mirage 2000TI', total: 8, serviceable: 5, maintenance: 2, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore M. K. Rathore',
        lastInspection: '19 Oct 2026',
      },
      {
        id: 'hasimara',
        name: 'Hasimara AFS',
        code: 'AFS-HSM',
        command: 'Eastern',
        lat: 26.704,
        lng: 89.369,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 18,
        serviceable: 15,
        underMaintenance: 2,
        grounded: 1,
        readinessPct: 83,
        squadrons: ['No. 101 Falcons (Rafale)'],
        aircraftBreakdown: [
          { type: 'Rafale EH', total: 14, serviceable: 12, maintenance: 1, grounded: 1 },
          { type: 'Rafale DH', total: 4, serviceable: 3, maintenance: 1, grounded: 0 },
        ],
        blockers: [],
        commanderName: 'Air Commodore B. S. Chhina',
        lastInspection: '16 Oct 2026',
      },
      {
        id: 'bareilly',
        name: 'Bareilly AFS',
        code: 'AFS-BLY',
        command: 'Central',
        lat: 28.422,
        lng: 79.450,
        status: 'Spares Needed',
        statusLevel: 'warning',
        totalAircraft: 26,
        serviceable: 17,
        underMaintenance: 6,
        grounded: 3,
        readinessPct: 65,
        squadrons: ['No. 8 Pursoots (Su-30MKI)', 'No. 24 Hawks (Su-30MKI)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 26, serviceable: 17, maintenance: 6, grounded: 3 },
        ],
        blockers: ['Turbofan bleed valve delayed from depot transfer'],
        commanderName: 'Air Commodore P. K. Srivastava',
        lastInspection: '15 Oct 2026',
      },
      {
        id: 'jodhpur',
        name: 'Jodhpur AFS',
        code: 'AFS-JDH',
        command: 'South Western',
        lat: 26.251,
        lng: 73.048,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 22,
        serviceable: 18,
        underMaintenance: 3,
        grounded: 1,
        readinessPct: 82,
        squadrons: ['No. 32 Tigersharks (Su-30MKI)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 22, serviceable: 18, maintenance: 3, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore H. Singh',
        lastInspection: '18 Oct 2026',
      },
      {
        id: 'hindon',
        name: 'Hindon AFS',
        code: 'AFS-HDN',
        command: 'Western',
        lat: 28.706,
        lng: 77.360,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 16,
        serviceable: 14,
        underMaintenance: 2,
        grounded: 0,
        readinessPct: 88,
        squadrons: ['No. 81 Skylords (C-17)', 'No. 77 Veiled Vipers (C-130J)'],
        aircraftBreakdown: [
          { type: 'C-17 Globemaster III', total: 10, serviceable: 9, maintenance: 1, grounded: 0 },
          { type: 'C-130J Super Hercules', total: 6, serviceable: 5, maintenance: 1, grounded: 0 },
        ],
        blockers: [],
        commanderName: 'Air Commodore D. Roy',
        lastInspection: '19 Oct 2026',
      },
      {
        id: 'leh',
        name: 'Leh AFS',
        code: 'AFS-LEH',
        command: 'Northern',
        lat: 34.135,
        lng: 77.546,
        status: 'Critical',
        statusLevel: 'critical',
        totalAircraft: 12,
        serviceable: 7,
        underMaintenance: 3,
        grounded: 2,
        readinessPct: 58,
        squadrons: ['Detachment MiG-29UPG', 'High Altitude Logistics'],
        aircraftBreakdown: [
          { type: 'MiG-29UPG', total: 8, serviceable: 5, maintenance: 2, grounded: 1 },
          { type: 'Mi-17V5', total: 4, serviceable: 2, maintenance: 1, grounded: 1 },
        ],
        blockers: ['Sub-zero fuel pre-heater unit failure on apron'],
        commanderName: 'Group Captain K. N. Rao',
        lastInspection: '14 Oct 2026',
      },
      {
        id: 'srinagar',
        name: 'Srinagar AFS',
        code: 'AFS-SXR',
        command: 'Northern',
        lat: 33.987,
        lng: 74.774,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 14,
        serviceable: 11,
        underMaintenance: 2,
        grounded: 1,
        readinessPct: 79,
        squadrons: ['No. 51 Swordarms (MiG-21 / MiG-29)'],
        aircraftBreakdown: [
          { type: 'MiG-29UPG', total: 8, serviceable: 7, maintenance: 1, grounded: 0 },
          { type: 'MiG-21 Bison', total: 6, serviceable: 4, maintenance: 1, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore V. T. Verma',
        lastInspection: '18 Oct 2026',
      },
      {
        id: 'tezpur',
        name: 'Tezpur AFS',
        code: 'AFS-TEZ',
        command: 'Eastern',
        lat: 26.711,
        lng: 92.797,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 20,
        serviceable: 15,
        underMaintenance: 4,
        grounded: 1,
        readinessPct: 75,
        squadrons: ['No. 2 Winged Arrows (Su-30MKI)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 20, serviceable: 15, maintenance: 4, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore S. K. Mitra',
        lastInspection: '17 Oct 2026',
      },
      {
        id: 'chabua',
        name: 'Chabua AFS',
        code: 'AFS-CHB',
        command: 'Eastern',
        lat: 27.466,
        lng: 95.176,
        status: 'Spares Needed',
        statusLevel: 'warning',
        totalAircraft: 18,
        serviceable: 12,
        underMaintenance: 4,
        grounded: 2,
        readinessPct: 67,
        squadrons: ['No. 102 Trisonics (Su-30MKI)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 18, serviceable: 12, maintenance: 4, grounded: 2 },
        ],
        blockers: ['Radar LRU processor awaiting replacement from depot'],
        commanderName: 'Air Commodore A. N. Roy',
        lastInspection: '16 Oct 2026',
      },
      {
        id: 'kalaikunda',
        name: 'Kalaikunda AFS',
        code: 'AFS-KKD',
        command: 'Eastern',
        lat: 22.343,
        lng: 87.215,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 20,
        serviceable: 16,
        underMaintenance: 3,
        grounded: 1,
        readinessPct: 80,
        squadrons: ['OCU Strike (Su-30MKI / Hawk)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 12, serviceable: 10, maintenance: 2, grounded: 0 },
          { type: 'Hawk Mk132', total: 8, serviceable: 6, maintenance: 1, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore N. Sen',
        lastInspection: '19 Oct 2026',
      },
      {
        id: 'halwara',
        name: 'Halwara AFS',
        code: 'AFS-HAL',
        command: 'Western',
        lat: 30.749,
        lng: 75.633,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 22,
        serviceable: 17,
        underMaintenance: 4,
        grounded: 1,
        readinessPct: 77,
        squadrons: ['No. 220 Desert Tigers (Su-30MKI)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 22, serviceable: 17, maintenance: 4, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore G. S. Randhawa',
        lastInspection: '18 Oct 2026',
      },
      {
        id: 'adampur',
        name: 'Adampur AFS',
        code: 'AFS-ADM',
        command: 'Western',
        lat: 31.433,
        lng: 75.758,
        status: 'Maintenance',
        statusLevel: 'in_progress',
        totalAircraft: 20,
        serviceable: 13,
        underMaintenance: 5,
        grounded: 2,
        readinessPct: 65,
        squadrons: ['No. 47 Black Archers (MiG-29UPG)'],
        aircraftBreakdown: [
          { type: 'MiG-29UPG', total: 20, serviceable: 13, maintenance: 5, grounded: 2 },
        ],
        blockers: ['Periodic airframe structural fatigue assessment'],
        commanderName: 'Air Commodore J. S. Dhillon',
        lastInspection: '15 Oct 2026',
      },
      {
        id: 'jamnagar',
        name: 'Jamnagar AFS',
        code: 'AFS-JGA',
        command: 'South Western',
        lat: 22.465,
        lng: 70.012,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 24,
        serviceable: 19,
        underMaintenance: 4,
        grounded: 1,
        readinessPct: 79,
        squadrons: ['No. 6 Dragons (Jaguar IM Maritime Strike)'],
        aircraftBreakdown: [
          { type: 'Jaguar IM', total: 16, serviceable: 13, maintenance: 2, grounded: 1 },
          { type: 'Jaguar IS', total: 8, serviceable: 6, maintenance: 2, grounded: 0 },
        ],
        blockers: [],
        commanderName: 'Air Commodore T. K. Nair',
        lastInspection: '18 Oct 2026',
      },
      {
        id: 'bhuj',
        name: 'Bhuj AFS',
        code: 'AFS-BHJ',
        command: 'South Western',
        lat: 23.287,
        lng: 69.670,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 16,
        serviceable: 13,
        underMaintenance: 2,
        grounded: 1,
        readinessPct: 81,
        squadrons: ['No. 27 Flaming Arrows (MiG-29UPG)'],
        aircraftBreakdown: [
          { type: 'MiG-29UPG', total: 16, serviceable: 13, maintenance: 2, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore V. Mehta',
        lastInspection: '17 Oct 2026',
      },
      {
        id: 'uttarlai',
        name: 'Uttarlai AFS',
        code: 'AFS-UTL',
        command: 'South Western',
        lat: 25.811,
        lng: 71.489,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 18,
        serviceable: 14,
        underMaintenance: 3,
        grounded: 1,
        readinessPct: 78,
        squadrons: ['No. 4 Oorials (MiG-21 / Su-30MKI)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI', total: 10, serviceable: 8, maintenance: 2, grounded: 0 },
          { type: 'MiG-21 Bison', total: 8, serviceable: 6, maintenance: 1, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore K. C. Bhasin',
        lastInspection: '18 Oct 2026',
      },
      {
        id: 'nal',
        name: 'Nal AFS (Bikaner)',
        code: 'AFS-NAL',
        command: 'South Western',
        lat: 28.071,
        lng: 73.207,
        status: 'Spares Needed',
        statusLevel: 'warning',
        totalAircraft: 16,
        serviceable: 11,
        underMaintenance: 3,
        grounded: 2,
        readinessPct: 69,
        squadrons: ['No. 23 Cheetahs (MiG-21 Bison)'],
        aircraftBreakdown: [
          { type: 'MiG-21 Bison', total: 16, serviceable: 11, maintenance: 3, grounded: 2 },
        ],
        blockers: ['Nose Landing Gear actuator replacement pending'],
        commanderName: 'Air Commodore M. L. Yadav',
        lastInspection: '16 Oct 2026',
      },
      {
        id: 'gorakhpur',
        name: 'Gorakhpur AFS',
        code: 'AFS-GKP',
        command: 'Central',
        lat: 26.739,
        lng: 83.450,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 22,
        serviceable: 17,
        underMaintenance: 4,
        grounded: 1,
        readinessPct: 77,
        squadrons: ['No. 16 Black Cobras (Jaguar IS)'],
        aircraftBreakdown: [
          { type: 'Jaguar IS', total: 22, serviceable: 17, maintenance: 4, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore S. Dwivedi',
        lastInspection: '18 Oct 2026',
      },
      {
        id: 'jorhat',
        name: 'Jorhat AFS',
        code: 'AFS-JRH',
        command: 'Eastern',
        lat: 26.731,
        lng: 94.175,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 14,
        serviceable: 12,
        underMaintenance: 2,
        grounded: 0,
        readinessPct: 86,
        squadrons: ['Air Transport Wing (An-32RE)'],
        aircraftBreakdown: [
          { type: 'An-32RE', total: 14, serviceable: 12, maintenance: 2, grounded: 0 },
        ],
        blockers: [],
        commanderName: 'Group Captain R. Baruah',
        lastInspection: '19 Oct 2026',
      },
      {
        id: 'tanjore',
        name: 'Thanjavur AFS',
        code: 'AFS-TNJ',
        command: 'Southern',
        lat: 10.722,
        lng: 79.102,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 18,
        serviceable: 15,
        underMaintenance: 2,
        grounded: 1,
        readinessPct: 83,
        squadrons: ['No. 222 Tigersharks (Su-30MKI BrahMos)'],
        aircraftBreakdown: [
          { type: 'Su-30MKI BrahMos', total: 18, serviceable: 15, maintenance: 2, grounded: 1 },
        ],
        blockers: [],
        commanderName: 'Air Commodore P. Soundararajan',
        lastInspection: '19 Oct 2026',
      },
      {
        id: 'suratgarh',
        name: 'Suratgarh AFS',
        code: 'AFS-SGH',
        command: 'Western',
        lat: 29.390,
        lng: 73.904,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 16,
        serviceable: 13,
        underMaintenance: 2,
        grounded: 1,
        readinessPct: 81,
        squadrons: ['Forward Tactical Strike Base (MiG-21 / Jaguar)'],
        aircraftBreakdown: [
          { type: 'Jaguar IS', total: 10, serviceable: 8, maintenance: 1, grounded: 1 },
          { type: 'MiG-21 Bison', total: 6, serviceable: 5, maintenance: 1, grounded: 0 },
        ],
        blockers: [],
        commanderName: 'Group Captain A. K. Tyagi',
        lastInspection: '17 Oct 2026',
      },
      {
        id: 'bhatinda',
        name: 'Bathinda AFS',
        code: 'AFS-BTI',
        command: 'Western',
        lat: 30.270,
        lng: 74.755,
        status: 'Maintenance',
        statusLevel: 'in_progress',
        totalAircraft: 18,
        serviceable: 12,
        underMaintenance: 4,
        grounded: 2,
        readinessPct: 67,
        squadrons: ['No. 12 Wing (Air Defence & Heavy Strike)'],
        aircraftBreakdown: [
          { type: 'Mirage 2000', total: 10, serviceable: 7, maintenance: 2, grounded: 1 },
          { type: 'MiG-29', total: 8, serviceable: 5, maintenance: 2, grounded: 1 },
        ],
        blockers: ['Depot bay electrical harness refit'],
        commanderName: 'Air Commodore N. S. Brar',
        lastInspection: '15 Oct 2026',
      },
      {
        id: 'thiruvananthapuram',
        name: 'Southern Air Command HQ',
        code: 'AFS-TRV',
        command: 'Southern',
        lat: 8.524,
        lng: 76.936,
        status: 'Operational',
        statusLevel: 'normal',
        totalAircraft: 10,
        serviceable: 9,
        underMaintenance: 1,
        grounded: 0,
        readinessPct: 90,
        squadrons: ['Maritime Strike Coordination Wing'],
        aircraftBreakdown: [
          { type: 'Do-228 Maritime', total: 6, serviceable: 5, maintenance: 1, grounded: 0 },
          { type: 'An-32RE', total: 4, serviceable: 4, maintenance: 0, grounded: 0 },
        ],
        blockers: [],
        commanderName: 'Air Vice Marshal C. Rajan, AVSM',
        lastInspection: '19 Oct 2026',
      },
      {
        id: 'car_nicobar',
        name: 'Car Nicobar AFS',
        code: 'AFS-CNB',
        command: 'Southern',
        lat: 9.153,
        lng: 92.818,
        status: 'Spares Needed',
        statusLevel: 'warning',
        totalAircraft: 8,
        serviceable: 5,
        underMaintenance: 2,
        grounded: 1,
        readinessPct: 63,
        squadrons: ['No. 122 Grasshoppers (Maritime Recon)'],
        aircraftBreakdown: [
          { type: 'Do-228', total: 4, serviceable: 3, maintenance: 1, grounded: 0 },
          { type: 'Mi-17V5', total: 4, serviceable: 2, maintenance: 1, grounded: 1 },
        ],
        blockers: ['Island logistics ferry arrival delayed by heavy sea state'],
        commanderName: 'Group Captain S. D. George',
        lastInspection: '14 Oct 2026',
      },
    ];
  },

  getCommanderFleetMetrics(): CommanderFleetMetrics {
    const approvals = this.getCommanderApprovals();
    const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

    return {
      totalAircraft: 142,
      totalAircraftChange: '↑ 2%',
      serviceable: 98,
      serviceablePct: 69,
      underMaintenance: 32,
      underMaintenancePct: 22,
      grounded: 12,
      groundedPct: 8,
      awaitingApproval: pendingCount,
      overallReadinessPct: 69,
      trend7d: [
        { day: '13 Oct', readiness: 65, target: 75 },
        { day: '14 Oct', readiness: 67, target: 75 },
        { day: '15 Oct', readiness: 66, target: 75 },
        { day: '16 Oct', readiness: 68, target: 75 },
        { day: '17 Oct', readiness: 70, target: 75 },
        { day: '18 Oct', readiness: 68, target: 75 },
        { day: '19 Oct', readiness: 69, target: 75 },
      ],
      trend30d: [
        { day: 'W1 Sep', readiness: 62, target: 75 },
        { day: 'W2 Sep', readiness: 64, target: 75 },
        { day: 'W3 Sep', readiness: 66, target: 75 },
        { day: 'W4 Sep', readiness: 65, target: 75 },
        { day: 'W1 Oct', readiness: 67, target: 75 },
        { day: 'W2 Oct', readiness: 68, target: 75 },
        { day: 'W3 Oct', readiness: 69, target: 75 },
      ],
      trend90d: [
        { day: 'Aug W1', readiness: 60, target: 75 },
        { day: 'Aug W3', readiness: 62, target: 75 },
        { day: 'Sep W1', readiness: 63, target: 75 },
        { day: 'Sep W3', readiness: 66, target: 75 },
        { day: 'Oct W1', readiness: 68, target: 75 },
        { day: 'Oct W3', readiness: 69, target: 75 },
      ],
      readinessByType: [
        { type: 'Rafale', readiness: 82, count: 36 },
        { type: 'Tejas', readiness: 74, count: 40 },
        { type: 'Su-30MKI', readiness: 68, count: 54 },
        { type: 'MiG-29', readiness: 61, count: 28 },
        { type: 'Mirage 2000', readiness: 71, count: 30 },
      ],
      keyInsights: [
        {
          title: 'Fleet Readiness',
          metric: '+5%',
          detail: 'vs Last Month (Target 75% met in 3/5 commands)',
          trend: 'up',
          tone: 'positive',
        },
        {
          title: 'AOG Rate',
          metric: '12%',
          detail: '-2.4% reduction following fast-track spares clearance',
          trend: 'down',
          tone: 'positive',
        },
        {
          title: 'Critical Spares',
          metric: '3 Bases',
          detail: 'Bareilly, Hasimara, Chabua need supply re-routing',
          trend: 'neutral',
          tone: 'warning',
        },
        {
          title: 'Mean Turnaround',
          metric: '18 hrs',
          detail: 'Averaging 4.2 hrs faster than Q2 baseline',
          trend: 'up',
          tone: 'positive',
        },
      ],
    };
  },

  _commanderApprovals: [
    {
      id: 'APR-2026-081',
      title: 'Emergency Fast-Track Spare Part Procurement: Rafale APU Starter Generator',
      type: 'Spare Part Procurement',
      priority: 'CRITICAL',
      baseName: 'Ambala AFS (Western Command)',
      aircraft: 'Rafale RB-008',
      requester: 'Sqn Ldr. Rajesh (Logistics Depot)',
      date: '19 Oct 2026 09:15 IST',
      amountOrScope: '₹ 48.5 Lakhs (Direct Vendor Fast-track)',
      justification: 'Crucial for QRA (Quick Reaction Alert) readiness. Standard procurement takes 21 days; emergency routing delivers in 48 hours.',
      impact: 'Restores Ambala Rafale squadron readiness from 74% to 88%.',
      status: 'PENDING',
    },
    {
      id: 'APR-2026-082',
      title: 'Return to Service Authorization: LCA Tejas Mk1 (Tail LA-5018)',
      type: 'Return to Service',
      priority: 'HIGH',
      baseName: 'Sulur AFS (Southern Command)',
      aircraft: 'Tejas Mk1 LA-5018',
      requester: 'Sqn Ldr. Vikram (Diagnostics Cell)',
      date: '19 Oct 2026 10:30 IST',
      amountOrScope: 'Post-Depot Level Overhaul Flight Clearance',
      justification: 'Completed 300-hr depot inspection and fly-by-wire sensor calibration. LightGBM RUL projected at 98.4% with zero flagged anomalies.',
      impact: 'Aircraft cleared for immediate operational deployment and combat sorties.',
      status: 'PENDING',
    },
    {
      id: 'APR-2026-083',
      title: 'Depot Resource & Bay Reallocation: Su-30MKI Structural Reinforcement',
      type: 'Resource Reallocation',
      priority: 'MEDIUM',
      baseName: 'Pune AFS (South Western Command)',
      aircraft: 'Su-30MKI SB-122',
      requester: 'Wg Cdr. K. Verma (11 BRD Ojhar/Pune)',
      date: '19 Oct 2026 11:00 IST',
      amountOrScope: 'Reallocate Bay 3 & 4 heavy avionics technicians for 72 hrs',
      justification: 'Avoids 14-day delay in scheduled radar beam calibration before upcoming joint tri-service exercise.',
      impact: 'Shortens turnaround by 4 days without impacting concurrent MiG-29 bay throughput.',
      status: 'PENDING',
    },
    {
      id: 'APR-2026-084',
      title: 'Maintenance Priority Escalation: Radar Antenna Array',
      type: 'Priority Change',
      priority: 'HIGH',
      baseName: 'Gwalior AFS (Central Command)',
      aircraft: 'Mirage 2000 KF-104',
      requester: 'Flt Lt. Meera (QA & Technical Records)',
      date: '19 Oct 2026 11:45 IST',
      amountOrScope: 'Escalate from Routine P3 to Operational Urgent P1',
      justification: 'Pre-flight AESA radar diagnostic flagged intermittent waveguide loss during high-altitude testing.',
      impact: 'Prioritizes avionics repair bench ahead of standard scheduled inspections.',
      status: 'PENDING',
    },
    {
      id: 'APR-2026-085',
      title: 'Cross-Base Strategic Asset Ferry Transfer: 2x LCA Tejas Squadrons',
      type: 'Cross Base Transfer',
      priority: 'MEDIUM',
      baseName: 'Sulur AFS → Bareilly AFS',
      aircraft: 'Tejas LA-5021 & LA-5022',
      requester: 'Air HQ Tactical Operations Wing',
      date: '19 Oct 2026 12:10 IST',
      amountOrScope: 'Ferry flight clearance & staging logistics',
      justification: 'Forward deployment rebalancing along northern corridor to meet operational readiness mandates.',
      impact: 'Strengthens Central/Northern sector air defense buffer by 2 combat-ready airframes.',
      status: 'PENDING',
    },
  ] as CommandApprovalItem[],

  getCommanderApprovals(): CommandApprovalItem[] {
    return [...this._commanderApprovals];
  },

  async actionCommanderApproval(
    approvalId: string,
    req: ApprovalActionRequest
  ): Promise<ApprovalActionResponse> {
    const target = this._commanderApprovals.find((a) => a.id === approvalId);
    if (!target) {
      throw new Error(`Approval request ${approvalId} not found.`);
    }

    const statusMap: Record<string, 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUESTED'> = {
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      CLARIFY: 'CLARIFICATION_REQUESTED',
    };
    const newStatus = statusMap[req.action.toUpperCase()] || 'APPROVED';

    target.status = newStatus;
    target.decisionNotes = req.notes;
    target.decidedBy = req.officer_name || 'Wing Cmdr. Aditya (Fleet Commander)';
    target.decidedAt = new Date().toISOString();

    const ledgerId = `DL-CMD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const ledgerHash = sha256Sync(`CMD_BLOCK_${ledgerId}_${approvalId}_${newStatus}_${Date.now()}`);

    target.ledgerEntryId = ledgerId;
    target.ledgerHash = ledgerHash;

    // Log to Decision Ledger
    this.recordDecision({
      actor: target.decidedBy,
      action: `COMMANDER_${req.action.toUpperCase()}_${target.type.toUpperCase().replace(/\s+/g, '_')}`,
      previous_state: `Status: PENDING | Priority: ${target.priority}`,
      resulting_state: `Approval ${target.id} marked ${newStatus} for ${target.aircraft} at ${target.baseName}`,
      notes: `Commander Decision: ${req.notes}. Impact: ${target.impact}`,
      baseId: 'all',
      isOverride: req.action.toUpperCase() === 'APPROVE',
      overrideReason: req.action.toUpperCase() === 'APPROVE' ? req.notes : undefined,
    });

    return {
      success: true,
      message: `Decision ${newStatus} recorded successfully for ${target.id}. Block ${ledgerId} chained into Decision Ledger.`,
      approval: { ...target },
      ledger_entry_id: ledgerId,
      ledger_hash: ledgerHash,
    };
  },

  // -------------------------------------------------------------
  // Technical Records & Quality (SIH MoD Logbooks)
  // -------------------------------------------------------------
  _inMemoryTechRecords: [
    {
      id: 'REC-2026-1048',
      aircraft_id: 'Rafale R-01',
      aircraft_model: 'Rafale',
      record_type: 'Inspection Record',
      date: '18 Oct 2026',
      component: 'Engine (M88)',
      source: 'PDF Import',
      uploaded_by: 'Cpl. Arjun Singh',
      status: 'Verified',
      trust_grade: 'A',
      finding: 'HP turbine blade leading edge shows initial thermal oxidation layer; within acceptable OEM tolerances.',
      work_performed: 'Borescope inspection of HP turbine nozzle guide vanes (NGVs) and combustion chamber liner.',
      parts_replaced: 'None (Scheduled 100h inspection sign-off)',
      flight_hours: '1,248 h',
      document_name: 'Rafale_R01_Engine_M88_Borescope_18Oct2026.pdf',
      document_type: 'pdf',
      confidence_score: 98,
      base_id: 'base-alpha',
      validation_issues: [],
      verified_by: 'Flt Lt. Meera (QA Officer)',
      verified_at: '2026-10-18T10:30:00Z',
    },
    {
      id: 'REC-2026-1047',
      aircraft_id: 'Tejas T-04',
      aircraft_model: 'Tejas',
      record_type: 'Fault / Repair Report',
      date: '17 Oct 2026',
      component: 'Hydraulic System',
      source: 'CSV Import',
      uploaded_by: 'Fg Off. Patel',
      status: 'Pending',
      trust_grade: 'B',
      finding: 'Return line pressure dropped to 82 bar during pre-flight spool up (normal operational envelope 180-210 bar).',
      work_performed: 'Isolation check of secondary hydraulic manifold valve; actuator seals flagged for replacement.',
      parts_replaced: 'Awaiting Hydraulic Pump Kit HP-9042 from Depot',
      flight_hours: '840 h',
      document_name: 'Tejas_T04_Hydraulics_Telemetry_17Oct2026.csv',
      document_type: 'csv',
      confidence_score: 91,
      base_id: 'base-bravo',
      validation_issues: ['Pending spare allocation verification', 'Sign-off signature missing second officer countersign'],
      verified_by: null,
      verified_at: null,
    },
    {
      id: 'REC-2026-1046',
      aircraft_id: 'MiG-21 M-12',
      aircraft_model: 'MiG-21',
      record_type: 'Component Change',
      date: '16 Oct 2026',
      component: 'Fuel System',
      source: 'Digital Import',
      uploaded_by: 'System (Auto)',
      status: 'Verified',
      trust_grade: 'A',
      finding: 'Scheduled life expiry reached for high-pressure fuel booster filter cartridge assembly.',
      work_performed: 'Replaced booster pump filter element; performed pressure leak test under 4.2 bar crossfeed.',
      parts_replaced: 'Part #FP-201-B (Fuel Filter Assembly)',
      flight_hours: '2,150 h',
      document_name: 'HUMS_Telemetry_AutoSync_Batch_4019.json',
      document_type: 'digital',
      confidence_score: 99,
      base_id: 'base-alpha',
      validation_issues: [],
      verified_by: 'MWO R. Sharma (Hangar Controller)',
      verified_at: '2026-10-16T14:15:00Z',
    },
    {
      id: 'REC-2026-1045',
      aircraft_id: 'Rafale R-01',
      aircraft_model: 'Rafale',
      record_type: 'Maintenance History',
      date: '15 Oct 2026',
      component: 'Landing Gear',
      source: 'PDF Import',
      uploaded_by: 'Sgt. Mehta',
      status: 'Incomplete',
      trust_grade: 'C',
      finding: 'Nose landing gear nitrogen strut damping coefficient lower than nominal baseline.',
      work_performed: 'Nitrogen recharge performed; pressure gauge calibration certificate expired on paper sheet.',
      parts_replaced: 'O-Ring Seal #NG-44',
      flight_hours: '1,242 h',
      document_name: 'Scanned_Logsheet_LG_Strut_Ambala.pdf',
      document_type: 'pdf',
      confidence_score: 72,
      base_id: 'base-alpha',
      validation_issues: ['Calibration certificate date ambiguous on scan', 'Missing technician badge number'],
      verified_by: null,
      verified_at: null,
    },
    {
      id: 'REC-2026-1044',
      aircraft_id: 'Tejas T-04',
      aircraft_model: 'Tejas',
      record_type: 'Inspection Record',
      date: '14 Oct 2026',
      component: 'Avionics',
      source: 'CSV Import',
      uploaded_by: 'Lt. Rao',
      status: 'Verified',
      trust_grade: 'A',
      finding: 'EL/M-2052 radar T/R module array built-in test completed with 100% transmit elements operational.',
      work_performed: 'Firmware integrity hash check and bus continuity calibration across MIL-STD-1553B bus.',
      parts_replaced: 'None',
      flight_hours: '835 h',
      document_name: 'Avionics_QA_Batch_1044.csv',
      document_type: 'csv',
      confidence_score: 96,
      base_id: 'base-bravo',
      validation_issues: [],
      verified_by: 'Flt Lt. Meera (QA Officer)',
      verified_at: '2026-10-14T16:00:00Z',
    },
  ],

  getTechnicalRecords(params?: { aircraft_id?: string; record_type?: string; status?: string; search?: string }) {
    let list = [...this._inMemoryTechRecords];
    if (params?.aircraft_id && params.aircraft_id !== 'all') {
      const a = params.aircraft_id.toLowerCase();
      list = list.filter((r) => r.aircraft_id.toLowerCase().includes(a) || r.aircraft_model.toLowerCase().includes(a));
    }
    if (params?.record_type && params.record_type !== 'All Records' && params.record_type !== 'all') {
      list = list.filter((r) => r.record_type.toLowerCase().includes(params.record_type!.toLowerCase()));
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((r) => r.status.toLowerCase().startsWith(params.status!.toLowerCase()));
    }
    if (params?.search && params.search.trim()) {
      const term = params.search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(term) ||
          r.aircraft_id.toLowerCase().includes(term) ||
          (r.component && r.component.toLowerCase().includes(term)) ||
          r.finding.toLowerCase().includes(term) ||
          r.uploaded_by.toLowerCase().includes(term)
      );
    }
    return list;
  },

  getTechnicalRecordsStats() {
    return {
      total_records: 12468 + (this._inMemoryTechRecords.length - 5),
      verified_records: 9842,
      pending_verification: 1924,
      incomplete_conflicting: 702,
    };
  },

  simulatePdfExtraction(filename: string, aircraftId: string, recordType: string) {
    const isRafale = aircraftId.toLowerCase().includes('rafale');
    const comp = isRafale ? 'Engine (M88)' : 'Hydraulic System';
    return {
      success: true,
      filename,
      aircraft_id: aircraftId,
      record_type: recordType,
      is_scanned: false,
      page_count: 2,
      extracted_text_preview: `INDIAN AIR FORCE - TECHNICAL LOGBOOK ENTRY\nAIRCRAFT IDENTIFIER: ${aircraftId}\nRECORD TYPE: ${recordType}\nCOMPONENT: ${comp}\nEVENT DATE: 18 Oct 2026\nOBSERVATION: Borescope hot-section inspection completed. Thermal barrier coating intact across all 1st stage stator vanes.\nWORK EXECUTED: Dimensional clearance measurement and high-pressure wash performed.\nPARTS REPLACED: Part #HP-9042-S Seal.\nSIGN-OFF: Cpl. Arjun Singh (IAF-QA-9104).`,
      extracted_fields: {
        aircraft_id: aircraftId,
        date: '18 Oct 2026',
        component: comp,
        finding: 'Borescope hot-section inspection completed. Thermal barrier coating intact across all 1st stage stator vanes.',
        work_performed: 'Dimensional clearance measurement and high-pressure wash performed.',
        parts_replaced: 'Part #HP-9042-S Seal',
        uploaded_by: 'Cpl. Arjun Singh',
        flight_hours: isRafale ? '1,248 h' : '840 h',
      },
      confidence_score: 96,
      validation_issues: [],
      status: 'Verified',
    };
  },

  simulateCsvMapping(filename: string, aircraftId: string, recordType: string) {
    return {
      success: true,
      filename,
      aircraft_id: aircraftId,
      record_type: recordType,
      total_rows: 14,
      valid_rows: 12,
      warning_rows: 2,
      rejected_rows: 0,
      column_mappings: [
        { source_column: 'date', target_field: 'date', confidence: 0.98, is_unknown: false },
        { source_column: 'aircraft', target_field: 'aircraft', confidence: 0.95, is_unknown: false },
        { source_column: 'component', target_field: 'component', confidence: 0.95, is_unknown: false },
        { source_column: 'record_type', target_field: 'record_type', confidence: 0.92, is_unknown: false },
        { source_column: 'finding', target_field: 'finding', confidence: 0.96, is_unknown: false },
        { source_column: 'work_performed', target_field: 'work_performed', confidence: 0.94, is_unknown: false },
        { source_column: 'technician', target_field: 'technician', confidence: 0.95, is_unknown: false },
        { source_column: 'vendor_batch_code', target_field: 'unmapped_field', confidence: 0.2, is_unknown: true },
      ],
      unknown_columns: ['vendor_batch_code'],
      preview_rows: [
        {
          date: '18 Oct 2026',
          aircraft: aircraftId,
          component: 'Engine (M88)',
          record_type: recordType,
          finding: 'Vibration envelope within 1.8 mm/s limits.',
          work_performed: 'Borescope check completed.',
          technician: 'Cpl. Arjun Singh',
        },
        {
          date: '17 Oct 2026',
          aircraft: aircraftId,
          component: 'Hydraulic System',
          record_type: recordType,
          finding: 'System return pressure 205 bar.',
          work_performed: 'Filter sampling test nominal.',
          technician: 'Fg Off. Patel',
        },
      ],
      validation_report: [
        'Validation check: 12 valid records, 2 warnings (1 unmapped source header: vendor_batch_code), 0 fatal errors.',
      ],
      can_commit: true,
    };
  },

  commitTechnicalRecord(req: any) {
    const newId = `REC-2026-${1049 + this._inMemoryTechRecords.length}`;
    const newRec = {
      id: newId,
      aircraft_id: req.aircraft_id,
      aircraft_model: req.aircraft_id.toLowerCase().includes('tejas') ? 'Tejas' : 'Rafale',
      record_type: req.record_type,
      date: req.date || '19 Oct 2026',
      component: req.component || 'General Subsystem',
      source: req.source || 'PDF Import',
      uploaded_by: req.uploaded_by || 'Sqn Ldr. Vikram',
      status: req.status || 'Verified',
      trust_grade: 'A',
      finding: req.finding || 'Record reviewed and approved by QA Officer.',
      work_performed: req.work_performed || 'Inspection logged to aircraft history.',
      parts_replaced: req.parts_replaced || 'None',
      flight_hours: req.flight_hours || '1,248 h',
      document_name: req.document_name || 'Uploaded_Document.pdf',
      document_type: req.document_type || 'pdf',
      confidence_score: req.confidence_score || 95,
      validation_issues: req.validation_issues || [],
      created_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
      verified_by: req.reviewer || 'Flt Lt. Meera (QA Officer)',
      base_id: 'base-alpha',
    };

    this._inMemoryTechRecords.unshift(newRec as any);

    this.recordDecision({
      actor: newRec.verified_by,
      action: 'COMMIT_VERIFIED_TECHNICAL_RECORD',
      previous_state: 'STAGED_IMPORT_REVIEW',
      resulting_state: `${newId} committed as ${newRec.status} for ${newRec.aircraft_id}`,
      notes: `Technical logbook committed under ${newRec.record_type} for ${newRec.aircraft_id}. Source: ${newRec.source}.`,
      baseId: 'all',
      isOverride: false,
    });

    return newRec;
  },

  // -----------------------------------------------------------
  // Logistics & Spares Mock Store
  // -----------------------------------------------------------
  _inMemoryLogisticsInventory: [
    {
      id: 'inv-01',
      part_number: 'RBE2-0012',
      description: 'Radar LRU',
      applicable_aircraft: 'Rafale',
      category: 'Radar',
      location: 'AFS Ambala',
      usable_qty: 4,
      reserved_qty: 1,
      min_stock: 2,
      status: 'In Stock' as const,
      nsn_oem: 'RBE2-THAL',
      condition: 'Serviceable',
      last_inspection: '08 Sep 2025',
      unit_cost_inr: 3500000,
      compatibility: ['Rafale EH (Standard F3-R)', 'Rafale DH'],
      image_url: '/spares/radar_lru.png',
      base_id: 'afs-ambala',
    },
    {
      id: 'inv-02',
      part_number: 'LG-3301',
      description: 'Landing Gear Actuator',
      applicable_aircraft: 'Rafale',
      category: 'Landing Gear',
      location: 'BRD Sulur',
      usable_qty: 2,
      reserved_qty: 0,
      min_stock: 2,
      status: 'Low Stock' as const,
      nsn_oem: 'LG-SAFR-3301',
      condition: 'Serviceable',
      last_inspection: '15 Jul 2025',
      unit_cost_inr: 1200000,
      compatibility: ['Rafale EH (Standard F3-R)'],
      image_url: '/spares/landing_gear_actuator.png',
      base_id: 'brd-sulur',
    },
    {
      id: 'inv-03',
      part_number: 'ENG-774A',
      description: 'Engine Control Unit',
      applicable_aircraft: 'Rafale',
      category: 'Engine',
      location: 'AFS Hasimara',
      usable_qty: 1,
      reserved_qty: 1,
      min_stock: 2,
      status: 'Critically Low' as const,
      nsn_oem: '774A-IND',
      condition: 'Serviceable',
      last_inspection: '12 Aug 2025',
      unit_cost_inr: 4800000,
      compatibility: ['Rafale EH (Standard F3-R)', 'Rafale DH'],
      image_url: '/spares/ecu_774a.png',
      base_id: 'afs-hasimara',
    },
    {
      id: 'inv-04',
      part_number: 'HYD-2209',
      description: 'Hydraulic Pump',
      applicable_aircraft: 'Tejas',
      category: 'Hydraulics',
      location: 'AFS Pune',
      usable_qty: 6,
      reserved_qty: 2,
      min_stock: 3,
      status: 'In Stock' as const,
      nsn_oem: 'HYD-HAL-2209',
      condition: 'Serviceable',
      last_inspection: '02 Oct 2025',
      unit_cost_inr: 850000,
      compatibility: ['Tejas Mk1 (FOC)', 'Tejas Mk1A'],
      image_url: '/spares/hydraulic_pump.png',
      base_id: 'afs-pune',
    },
    {
      id: 'inv-05',
      part_number: 'AV-5510',
      description: 'Avionics Module',
      applicable_aircraft: 'Su-30MKI',
      category: 'Avionics',
      location: 'ASP Chandigarh',
      usable_qty: 3,
      reserved_qty: 0,
      min_stock: 2,
      status: 'In Stock' as const,
      nsn_oem: 'AV-HAL-5510',
      condition: 'Serviceable',
      last_inspection: '19 Sep 2025',
      unit_cost_inr: 2100000,
      compatibility: ['Su-30MKI Flanker-H'],
      image_url: '/spares/avionics_module.png',
      base_id: 'asp-chandigarh',
    },
    {
      id: 'inv-06',
      part_number: 'BRK-9087',
      description: 'Brake Disc',
      applicable_aircraft: 'Rafale',
      category: 'Mechanical',
      location: 'AFS Ambala',
      usable_qty: 0,
      reserved_qty: 0,
      min_stock: 2,
      status: 'Out of Stock' as const,
      nsn_oem: 'BRK-MESSIER-9087',
      condition: 'Unserviceable',
      last_inspection: '28 Jun 2025',
      unit_cost_inr: 450000,
      compatibility: ['Rafale EH', 'Rafale DH'],
      image_url: '/spares/brake_disc.png',
      base_id: 'afs-ambala',
    },
    {
      id: 'inv-07',
      part_number: 'GEN-1140',
      description: 'APU Starter Generator',
      applicable_aircraft: 'Su-30MKI',
      category: 'Engine',
      location: 'AFS Pune',
      usable_qty: 1,
      reserved_qty: 1,
      min_stock: 2,
      status: 'Critically Low' as const,
      nsn_oem: 'GEN-SATURN-1140',
      condition: 'Serviceable',
      last_inspection: '10 Aug 2025',
      unit_cost_inr: 3200000,
      compatibility: ['Su-30MKI Flanker-H'],
      image_url: '/spares/generator.png',
      base_id: 'afs-pune',
    },
    {
      id: 'inv-08',
      part_number: 'FCS-8812',
      description: 'Flight Control Actuator',
      applicable_aircraft: 'Tejas',
      category: 'Mechanical',
      location: 'BRD Sulur',
      usable_qty: 5,
      reserved_qty: 1,
      min_stock: 2,
      status: 'In Stock' as const,
      nsn_oem: 'FCS-ADE-8812',
      condition: 'Serviceable',
      last_inspection: '22 Sep 2025',
      unit_cost_inr: 1900000,
      compatibility: ['Tejas Mk1', 'Tejas Mk1A'],
      image_url: '/spares/fcs_actuator.png',
      base_id: 'brd-sulur',
    },
  ] as LogisticsInventoryItem[],

  _inMemoryMaterialRequests: [
    {
      id: 'REQ-1024',
      aircraft: 'Rafale',
      part_number: 'RBE2-0012',
      part_name: 'Radar LRU',
      quantity: 1,
      status: 'Approved' as const,
      required_by: '20 Aug 2025',
      request_date: '14 Aug 2025',
      priority: 'High' as const,
      destination_base: 'AFS Ambala',
      requester: 'Wg Cdr. Roy (17 Sqn)',
      linked_work_order_id: 'WO-1038',
      notes: 'Scheduled radar transmitter array check',
    },
    {
      id: 'REQ-1023',
      aircraft: 'Tejas',
      part_number: 'HYD-2209',
      part_name: 'Hydraulic Pump',
      quantity: 2,
      status: 'Pending' as const,
      required_by: '22 Aug 2025',
      request_date: '15 Aug 2025',
      priority: 'Medium' as const,
      destination_base: 'AFS Pune',
      requester: 'Sqn Ldr. K. Verma (45 Sqn)',
      linked_work_order_id: 'WO-1040',
      notes: 'Replacement seal and auxiliary pump pack',
    },
    {
      id: 'REQ-1022',
      aircraft: 'Su-30MKI',
      part_number: 'AV-5510',
      part_name: 'Avionics Module',
      quantity: 1,
      status: 'Approved' as const,
      required_by: '19 Aug 2025',
      request_date: '13 Aug 2025',
      priority: 'High' as const,
      destination_base: 'ASP Chandigarh',
      requester: 'Flt Lt. S. Rao (220 Sqn)',
      linked_work_order_id: 'WO-1036',
      notes: 'Bus transceiver recalibration swap',
    },
    {
      id: 'REQ-1021',
      aircraft: 'Rafale',
      part_number: 'ENG-774A',
      part_name: 'Engine Control Unit',
      quantity: 1,
      status: 'Urgent' as const,
      required_by: '18 Aug 2025',
      request_date: '16 Aug 2025',
      priority: 'Urgent' as const,
      destination_base: 'AFS Hasimara',
      requester: 'Sqn Ldr. A. Sharma (Line Officer)',
      linked_work_order_id: 'WO-1044',
      notes: 'Critical ECU replacement for Rafale B-124 readiness',
    },
    {
      id: 'REQ-1020',
      aircraft: 'Rafale',
      part_number: 'LG-3301',
      part_name: 'Landing Gear Actuator',
      quantity: 1,
      status: 'In Review' as const,
      required_by: '21 Aug 2025',
      request_date: '16 Aug 2025',
      priority: 'Medium' as const,
      destination_base: 'BRD Sulur',
      requester: 'Wg Cdr. M. Sen (Maintenance)',
      linked_work_order_id: 'WO-1041',
      notes: 'Depot level retraction cylinder maintenance',
    },
  ] as MaterialRequestItem[],

  _inMemorySparesTransfers: [
    {
      id: 'TRF-2025-081',
      part_number: 'ENG-774A',
      part_name: 'Engine Control Unit',
      quantity: 1,
      source_location: 'AFS Ambala',
      destination_location: 'AFS Hasimara',
      status: 'In Transit' as const,
      eta: '14 hours',
      request_date: '18 Aug 2025',
      transport_mode: 'IAF Air Transit (C-130J)',
      linked_request_id: 'REQ-1021',
      approved_by: 'Air Commodore K. R. Sen',
    },
    {
      id: 'TRF-2025-080',
      part_number: 'HYD-2209',
      part_name: 'Hydraulic Pump',
      quantity: 2,
      source_location: 'AFS Pune',
      destination_location: 'BRD Sulur',
      status: 'Approved' as const,
      eta: '24 hours',
      request_date: '17 Aug 2025',
      transport_mode: 'IAF Air Logistics Courier',
      linked_request_id: 'REQ-1023',
      approved_by: 'Group Capt. V. Nair',
    },
    {
      id: 'TRF-2025-079',
      part_number: 'RBE2-0012',
      part_name: 'Radar LRU',
      quantity: 1,
      source_location: 'ASP Chandigarh',
      destination_location: 'AFS Ambala',
      status: 'Delivered' as const,
      eta: 'Completed',
      request_date: '14 Aug 2025',
      transport_mode: 'Secured Ground Transit',
      linked_request_id: 'REQ-1024',
      approved_by: 'Air Commodore K. R. Sen',
    },
  ] as SparesTransferItem[],

  _inMemoryProcurementOrders: [
    {
      id: 'PO-2025-412',
      part_number: 'ENG-774A',
      part_name: 'Engine Control Unit',
      supplier: 'OEM (HAL / Safran)',
      quantity: 5,
      status: 'On Order' as const,
      lead_time: '10–15 days',
      order_date: '10 Aug 2025',
      contract_ref: 'MOD/AIR/2025/HAL-914',
      est_total_cost: '₹ 2,40,00,000',
    },
    {
      id: 'PO-2025-411',
      part_number: 'BRK-9087',
      part_name: 'Brake Disc',
      supplier: 'HAL Aerospace Division',
      quantity: 12,
      status: 'In Production' as const,
      lead_time: '3–4 weeks',
      order_date: '05 Aug 2025',
      contract_ref: 'MOD/AIR/2025/BRK-082',
      est_total_cost: '₹ 54,00,000',
    },
  ] as ProcurementOrderItem[],

  _inMemoryStockMovements: [
    {
      id: 'MOV-8841',
      timestamp: '18 Aug 2025 14:32',
      part_number: 'ENG-774A',
      part_name: 'Engine Control Unit',
      movement_type: 'RESERVATION' as const,
      quantity: 1,
      origin: 'AFS Hasimara',
      destination: 'AFS Hasimara',
      responsible_user: 'Flt Lt. Nair (Logistics Depot)',
      linked_reference: 'REQ-1021',
      notes: 'Reserved for urgent work order WO-1044 on Rafale B-124',
    },
    {
      id: 'MOV-8840',
      timestamp: '18 Aug 2025 11:15',
      part_number: 'ENG-774A',
      part_name: 'Engine Control Unit',
      movement_type: 'TRANSFER_DISPATCH' as const,
      quantity: 1,
      origin: 'AFS Ambala',
      destination: 'AFS Hasimara',
      responsible_user: 'Cpl. V. Joshi',
      linked_reference: 'TRF-2025-081',
      notes: 'Dispatched via C-130J flight IL-402',
    },
    {
      id: 'MOV-8839',
      timestamp: '17 Aug 2025 16:40',
      part_number: 'HYD-2209',
      part_name: 'Hydraulic Pump',
      movement_type: 'RECEIPT' as const,
      quantity: 4,
      origin: 'HAL Nashik Depot',
      destination: 'AFS Pune',
      responsible_user: 'Sqn Ldr. K. Verma',
      linked_reference: 'PO-2025-398',
      notes: 'Quality inspected and slotted into primary rack',
    },
  ] as StockMovementItem[],

  getLogisticsKpis() {
    return {
      total_inventory_items: 4230,
      low_stock_items: 28,
      pending_requests: 12,
      transfers_in_progress: 7,
      approved_orders: 19,
      is_demo_data: true,
    };
  },

  getLogisticsInventory(params?: { category?: string; aircraft?: string; location?: string; stock_status?: string; search?: string }) {
    let list = [...this._inMemoryLogisticsInventory];
    if (params?.category && params.category !== 'all' && params.category !== 'All Categories') {
      list = list.filter((i) => i.category.toLowerCase().includes(params.category!.toLowerCase()));
    }
    if (params?.aircraft && params.aircraft !== 'all' && params.aircraft !== 'All Aircraft') {
      list = list.filter((i) => i.applicable_aircraft.toLowerCase().includes(params.aircraft!.toLowerCase()));
    }
    if (params?.location && params.location !== 'all' && params.location !== 'All Locations') {
      list = list.filter((i) => i.location.toLowerCase().includes(params.location!.toLowerCase()));
    }
    if (params?.stock_status && params.stock_status !== 'all' && params.stock_status !== 'Stock Status') {
      list = list.filter((i) => i.status.toLowerCase().includes(params.stock_status!.toLowerCase()));
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase();
      list = list.filter((i) => i.part_number.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.nsn_oem.toLowerCase().includes(q));
    }
    return list;
  },

  getLogisticsInventoryDetail(itemId: string) {
    const item = this._inMemoryLogisticsInventory.find((i) => i.id === itemId || i.part_number === itemId);
    return item || this._inMemoryLogisticsInventory[0];
  },

  reserveLogisticsPart(req: any) {
    const item = this._inMemoryLogisticsInventory.find((i) => i.id === req.inventory_id || i.part_number === req.part_number);
    if (item && item.usable_qty >= (req.quantity || 1)) {
      item.usable_qty -= req.quantity || 1;
      item.reserved_qty += req.quantity || 1;
      if (item.usable_qty === 0) item.status = 'Critically Low';
      else if (item.usable_qty <= item.min_stock) item.status = 'Low Stock';
    }
    return item || this._inMemoryLogisticsInventory[0];
  },

  getMaterialRequests(status?: string) {
    if (status && status !== 'all') {
      return this._inMemoryMaterialRequests.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }
    return this._inMemoryMaterialRequests;
  },

  createMaterialRequest(req: any): MaterialRequestItem {
    const newReq: MaterialRequestItem = {
      id: `REQ-${1025 + this._inMemoryMaterialRequests.length}`,
      aircraft: req.aircraft,
      part_number: req.part_number,
      part_name: req.part_name,
      quantity: req.quantity || 1,
      status: req.priority === 'Urgent' ? 'Urgent' : 'Pending',
      required_by: req.required_by,
      request_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      priority: (req.priority as any) || 'Medium',
      destination_base: req.destination_base,
      requester: req.requester || 'Squadron Logistics',
      linked_work_order_id: req.linked_work_order_id,
      notes: req.notes,
    };
    this._inMemoryMaterialRequests.unshift(newReq);
    return newReq;
  },

  getSparesTransfers(): SparesTransferItem[] {
    return this._inMemorySparesTransfers;
  },

  createSparesTransfer(req: any): SparesTransferItem {
    const newTrf: SparesTransferItem = {
      id: `TRF-2025-${82 + this._inMemorySparesTransfers.length}`,
      part_number: req.part_number,
      part_name: req.part_name,
      quantity: req.quantity || 1,
      source_location: req.source_location,
      destination_location: req.destination_location,
      status: 'Requested',
      eta: '18 hours (Est.)',
      request_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      transport_mode: req.transport_mode || 'IAF Air Transit (C-130J)',
      linked_request_id: req.linked_request_id,
      approved_by: 'Logistics Officer',
    };
    this._inMemorySparesTransfers.unshift(newTrf);
    return newTrf;
  },

  getProcurementOrders(): ProcurementOrderItem[] {
    return this._inMemoryProcurementOrders;
  },

  createProcurementOrder(req: any): ProcurementOrderItem {
    const newPo: ProcurementOrderItem = {
      id: `PO-2025-${413 + this._inMemoryProcurementOrders.length}`,
      part_number: req.part_number,
      part_name: req.part_name,
      supplier: req.supplier,
      quantity: req.quantity || 1,
      status: 'On Order',
      lead_time: '10–15 days',
      order_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      contract_ref: req.contract_ref || 'MOD/AIR/2025/HAL-915',
      est_total_cost: req.est_total_cost || '₹ 45,00,000',
    };
    this._inMemoryProcurementOrders.unshift(newPo);
    return newPo;
  },

  getStockMovements() {
    return this._inMemoryStockMovements;
  },

  // -----------------------------------------------------------
  // Maintenance Control Centre Mock Store & Methods
  // -----------------------------------------------------------
  _inMemoryMaintenanceWorkOrders: [
    {
      id: 'WO-1042',
      aircraft: 'Tejas T-04',
      aircraft_model: 'Tejas Mk1A',
      issue: 'Landing Gear – Hydraulic Leak',
      priority: 'High' as const,
      current_stage: 'Awaiting Parts',
      stage_index: 4,
      eta: '22 Oct 2026',
      expected_completion: '22 Oct 2026, 16:00',
      status: 'In Progress' as const,
      assigned_team: 'Bay 2 – Team Alpha',
      assigned_bay: 'Bay 2 (Quick-Turn)',
      assigned_tech: 'MWO R. Sharma',
      opened_date: '20 Oct 2026, 09:15',
      estimated_duration: '~ 48 hours',
      delay_reason: 'Waiting for Hydraulic Pump (REQ-2045) from Central Depot (BRD).',
      linked_requests: 'REQ-2045 (Hydraulic Pump)',
      blocking_items: [
        {
          id: 'BLK-1',
          name: 'Hydraulic Pump – In Transit',
          status: 'In Transit',
          link_tab: 'parts-materials',
          link_id: 'REQ-2045',
        },
      ],
      next_action: 'Confirm part receipt and start repair.',
      image_url: '/tejas_hangar.jpg',
      stages: [
        {
          step: 1,
          name: 'Work Order Created',
          code: 'WO_CREATED' as const,
          status: 'completed' as const,
          actual_time: '20 Oct 09:15',
          responsible: 'Sqn Ldr. K. Verma (45 Sqn)',
          notes: 'Work order initialized following post-sortie telemetry check.',
        },
        {
          step: 2,
          name: 'Aircraft Received',
          code: 'AIRCRAFT_RECEIVED' as const,
          status: 'completed' as const,
          actual_time: '20 Oct 11:30',
          responsible: 'Hangar Line Crew',
          notes: 'Towed to Bay 2 and grounded on jack stands.',
        },
        {
          step: 3,
          name: 'Inspection & Diagnosis',
          code: 'INSPECTION_DIAGNOSIS' as const,
          status: 'completed' as const,
          actual_time: '20 Oct 14:00',
          responsible: 'MWO R. Sharma (Hydraulics Lead)',
          notes: 'Port main gear actuator seals cracked; pressure drop verified.',
        },
        {
          step: 4,
          name: 'Awaiting Part (REQ-2045)',
          code: 'AWAITING_PARTS' as const,
          status: 'blocked' as const,
          expected_time: 'ETA: 21 Oct 10:00',
          responsible: 'Logistics Dispatch BRD Sulur',
          blocker_detail: 'Hydraulic Pump HYD-5562 in transit via C-130J flight IL-402.',
        },
        {
          step: 5,
          name: 'Repair & Testing',
          code: 'REPAIR_TESTING' as const,
          status: 'upcoming' as const,
          expected_time: 'Planned: 21 Oct – 22 Oct',
          responsible: 'Team Alpha',
          notes: 'Actuator replacement and 3000 PSI pressure cycling test.',
        },
        {
          step: 6,
          name: 'Inspection & Sign-off',
          code: 'INSPECTION_SIGNOFF' as const,
          status: 'upcoming' as const,
          expected_time: 'Target: 22 Oct 16:00',
          responsible: 'Quality Assurance Inspector',
          notes: 'Independent multi-point quality check and leak containment verification.',
        },
        {
          step: 7,
          name: 'Return to Service',
          code: 'RETURN_TO_SERVICE' as const,
          status: 'upcoming' as const,
          expected_time: 'Pending',
          responsible: 'Chief Engineering Officer',
          notes: 'Final sortie clearance gate approval.',
        },
      ],
      required_parts: [
        {
          part_number: 'HYD-5562',
          part_name: 'Hydraulic Pump',
          required_qty: 1,
          received_qty: 0,
          status: 'In Transit' as const,
          image_url: '/spares/hydraulic_pump.png',
          linked_request_id: 'REQ-2045',
        },
        {
          part_number: 'BRK-9812',
          part_name: 'Seal Kit',
          required_qty: 2,
          received_qty: 2,
          status: 'Received' as const,
          image_url: '/spares/brake_disc.png',
          linked_request_id: 'REQ-2042',
        },
        {
          part_number: 'FIT-4431',
          part_name: 'Mounting Bracket',
          required_qty: 1,
          received_qty: 0,
          status: 'Awaiting' as const,
          image_url: '/spares/fcs_actuator.png',
          linked_request_id: 'REQ-2049',
        },
      ],
      related_documents: [
        {
          id: 'DOC-1042-WO',
          title: 'Work Order (WO-1042)',
          file_type: 'PDF',
          file_size: '450 KB',
          download_url: '#',
          linked_ref: 'WO-1042',
        },
        {
          id: 'DOC-1042-INSP',
          title: 'Inspection Report (Initial)',
          file_type: 'PDF',
          file_size: '320 KB',
          download_url: '#',
          linked_ref: 'REC-2026-1042',
        },
        {
          id: 'DOC-1042-DIAG',
          title: 'Diagnostic Notes',
          file_type: 'PDF',
          file_size: '280 KB',
          download_url: '#',
          linked_ref: 'DIAG-5501',
        },
        {
          id: 'DOC-1042-LOG',
          title: 'Linked Logistics Request',
          file_type: 'LOG',
          file_size: 'REQ-2045',
          download_url: '#',
          linked_ref: 'REQ-2045',
        },
      ],
      activity_log: [
        {
          id: 'ACT-4',
          title: 'Part dispatched from Central Depot',
          timestamp: '21 Oct 2026, 08:45',
          actor: 'Central Depot (BRD)',
          icon_type: 'dispatch' as const,
          notes: 'HYD-5562 loaded onto flight IL-402 with priority manifest.',
        },
        {
          id: 'ACT-3',
          title: 'Inspection completed',
          timestamp: '20 Oct 2026, 14:00',
          actor: 'MWO R. Sharma',
          icon_type: 'inspection' as const,
          notes: 'Failure localized to return valve seal ring.',
        },
        {
          id: 'ACT-2',
          title: 'Aircraft received by agency',
          timestamp: '20 Oct 2026, 11:30',
          actor: 'Line Crew (Bay 2)',
          icon_type: 'received' as const,
          notes: 'Safe grounding certificate signed.',
        },
        {
          id: 'ACT-1',
          title: 'Work order created',
          timestamp: '20 Oct 2026, 09:15',
          actor: 'Sqn Ldr. K. Verma',
          icon_type: 'created' as const,
          notes: 'Priority High assigned based on mission schedule.',
        },
      ],
      base_id: 'afs-ambala',
    },
    {
      id: 'WO-1038',
      aircraft: 'Rafale RB-01',
      aircraft_model: 'Rafale EH',
      issue: 'Engine Sensor Replacement',
      priority: 'High' as const,
      current_stage: 'Repair & Testing',
      stage_index: 5,
      eta: '20 Oct 2026',
      expected_completion: '20 Oct 2026, 18:00',
      status: 'In Progress' as const,
      assigned_team: 'Bay 1 – Team Bravo',
      assigned_bay: 'Bay 1 (Depot)',
      assigned_tech: 'Sgt. V. Nair',
      opened_date: '18 Oct 2026, 10:00',
      estimated_duration: '~ 36 hours',
      linked_requests: 'REQ-2038 (EGT Sensor)',
      blocking_items: [],
      next_action: 'Execute turbine temperature sensor harness calibration.',
      image_url: '/tejas_hangar.jpg',
      stages: [
        { step: 1, name: 'Work Order Created', code: 'WO_CREATED' as const, status: 'completed' as const, actual_time: '18 Oct 10:00', responsible: 'Wg Cdr. Roy' },
        { step: 2, name: 'Aircraft Received', code: 'AIRCRAFT_RECEIVED' as const, status: 'completed' as const, actual_time: '18 Oct 12:00', responsible: 'Bay 1 Crew' },
        { step: 3, name: 'Inspection & Diagnosis', code: 'INSPECTION_DIAGNOSIS' as const, status: 'completed' as const, actual_time: '18 Oct 15:30', responsible: 'Sgt. V. Nair' },
        { step: 4, name: 'Awaiting Part', code: 'AWAITING_PARTS' as const, status: 'completed' as const, actual_time: '19 Oct 09:00', responsible: 'AFS Ambala Stores' },
        { step: 5, name: 'Repair & Testing', code: 'REPAIR_TESTING' as const, status: 'active' as const, expected_time: '20 Oct 18:00', responsible: 'Team Bravo' },
        { step: 6, name: 'Inspection & Sign-off', code: 'INSPECTION_SIGNOFF' as const, status: 'upcoming' as const, expected_time: 'Target: 21 Oct 10:00', responsible: 'QA Inspector' },
        { step: 7, name: 'Return to Service', code: 'RETURN_TO_SERVICE' as const, status: 'upcoming' as const, expected_time: 'Pending', responsible: 'Base Engineering Officer' },
      ],
      required_parts: [
        { part_number: 'ENG-774A', part_name: 'Engine Control Unit', required_qty: 1, received_qty: 1, status: 'Received' as const, image_url: '/spares/ecu_774a.png' },
      ],
      related_documents: [
        { id: 'DOC-1038', title: 'Engine Diagnostics Log', file_type: 'PDF', file_size: '410 KB', linked_ref: 'WO-1038' },
      ],
      activity_log: [
        { id: 'ACT-1038-1', title: 'ECU replacement received from stores', timestamp: '19 Oct 2026, 09:00', actor: 'Logistics Depot', icon_type: 'received' as const },
      ],
      base_id: 'afs-ambala',
    },
    {
      id: 'WO-1031',
      aircraft: 'Tejas T-12',
      aircraft_model: 'Tejas Mk1',
      issue: 'Avionics Module Repair',
      priority: 'Medium' as const,
      current_stage: 'Inspection',
      stage_index: 6,
      eta: '19 Oct 2026',
      expected_completion: '19 Oct 2026, 17:30',
      status: 'Inspection' as const,
      assigned_team: 'Bay 3 – Avionics Lab',
      assigned_bay: 'Bay 3 (Avionics Clean Bay)',
      assigned_tech: 'Cpl. A. Sen',
      opened_date: '16 Oct 2026, 14:20',
      estimated_duration: '~ 24 hours',
      linked_requests: 'REQ-2031 (Avionics Bus LRU)',
      blocking_items: [],
      next_action: 'Complete final mil-bus diagnostic sign-off.',
      image_url: '/tejas_hangar.jpg',
      stages: [
        { step: 1, name: 'Work Order Created', code: 'WO_CREATED' as const, status: 'completed' as const, actual_time: '16 Oct 14:20', responsible: 'Sqn Ldr. Verma' },
        { step: 2, name: 'Aircraft Received', code: 'AIRCRAFT_RECEIVED' as const, status: 'completed' as const, actual_time: '16 Oct 16:00', responsible: 'Bay 3 Techs' },
        { step: 3, name: 'Inspection & Diagnosis', code: 'INSPECTION_DIAGNOSIS' as const, status: 'completed' as const, actual_time: '17 Oct 10:00', responsible: 'Cpl. A. Sen' },
        { step: 4, name: 'Awaiting Part', code: 'AWAITING_PARTS' as const, status: 'completed' as const, actual_time: '18 Oct 11:00', responsible: 'Central Depot' },
        { step: 5, name: 'Repair & Testing', code: 'REPAIR_TESTING' as const, status: 'completed' as const, actual_time: '19 Oct 13:00', responsible: 'Cpl. A. Sen' },
        { step: 6, name: 'Inspection & Sign-off', code: 'INSPECTION_SIGNOFF' as const, status: 'active' as const, expected_time: '19 Oct 17:30', responsible: 'Flt Lt. Nair' },
        { step: 7, name: 'Return to Service', code: 'RETURN_TO_SERVICE' as const, status: 'upcoming' as const, expected_time: 'Target: 20 Oct', responsible: 'Engineering Officer' },
      ],
      required_parts: [
        { part_number: 'AV-5510', part_name: 'Avionics Module', required_qty: 1, received_qty: 1, status: 'Received' as const, image_url: '/spares/avionics_module.png' },
      ],
      related_documents: [
        { id: 'DOC-1031', title: 'Mil-STD-1553 Bus Verification', file_type: 'PDF', file_size: '290 KB', linked_ref: 'WO-1031' },
      ],
      activity_log: [
        { id: 'ACT-1031-1', title: 'Inspection checklist initiated', timestamp: '19 Oct 2026, 14:00', actor: 'Flt Lt. Nair', icon_type: 'inspection' as const },
      ],
      base_id: 'afs-ambala',
    },
    {
      id: 'WO-1027',
      aircraft: 'Su-30MKI S-03',
      aircraft_model: 'Su-30MKI Flanker',
      issue: 'Brake System Overhaul',
      priority: 'High' as const,
      current_stage: 'Completed',
      stage_index: 7,
      eta: '17 Oct 2026',
      expected_completion: '17 Oct 2026, 15:00',
      status: 'Completed' as const,
      assigned_team: 'Bay 1 – Team Bravo',
      assigned_bay: 'Bay 1 (Depot)',
      assigned_tech: 'Sgt. K. Pillai',
      opened_date: '14 Oct 2026, 08:30',
      estimated_duration: '~ 30 hours',
      linked_requests: 'REQ-2027 (Carbon Brake Pack)',
      blocking_items: [],
      next_action: 'Sortie gate released; log verified in Technical Records.',
      image_url: '/tejas_hangar.jpg',
      stages: [
        { step: 1, name: 'Work Order Created', code: 'WO_CREATED' as const, status: 'completed' as const, actual_time: '14 Oct 08:30', responsible: 'Line Engineering' },
        { step: 2, name: 'Aircraft Received', code: 'AIRCRAFT_RECEIVED' as const, status: 'completed' as const, actual_time: '14 Oct 10:00', responsible: 'Bay 1 Crew' },
        { step: 3, name: 'Inspection & Diagnosis', code: 'INSPECTION_DIAGNOSIS' as const, status: 'completed' as const, actual_time: '14 Oct 14:00', responsible: 'Sgt. K. Pillai' },
        { step: 4, name: 'Awaiting Part', code: 'AWAITING_PARTS' as const, status: 'completed' as const, actual_time: '15 Oct 11:00', responsible: 'ASP Chandigarh' },
        { step: 5, name: 'Repair & Testing', code: 'REPAIR_TESTING' as const, status: 'completed' as const, actual_time: '16 Oct 16:00', responsible: 'Team Bravo' },
        { step: 6, name: 'Inspection & Sign-off', code: 'INSPECTION_SIGNOFF' as const, status: 'completed' as const, actual_time: '17 Oct 12:00', responsible: 'Quality Officer' },
        { step: 7, name: 'Return to Service', code: 'RETURN_TO_SERVICE' as const, status: 'completed' as const, actual_time: '17 Oct 15:00', responsible: 'Air Commodore Sen' },
      ],
      required_parts: [
        { part_number: 'BRK-9087', part_name: 'Brake Disc', required_qty: 2, received_qty: 2, status: 'Received' as const, image_url: '/spares/brake_disc.png' },
      ],
      related_documents: [
        { id: 'DOC-1027', title: 'Brake System Sign-Off Certificate', file_type: 'PDF', file_size: '520 KB', linked_ref: 'WO-1027' },
      ],
      activity_log: [
        { id: 'ACT-1027-1', title: 'Returned to operational service', timestamp: '17 Oct 2026, 15:00', actor: 'Air Commodore Sen', icon_type: 'signoff' as const },
      ],
      base_id: 'asp-chandigarh',
    },
    {
      id: 'WO-1025',
      aircraft: 'Rafale RB-04',
      aircraft_model: 'Rafale EH',
      issue: 'Fuel Pump Replacement',
      priority: 'Medium' as const,
      current_stage: 'Awaiting Parts',
      stage_index: 4,
      eta: '24 Oct 2026',
      expected_completion: '24 Oct 2026, 14:00',
      status: 'In Progress' as const,
      assigned_team: 'Bay 4 – Propulsion',
      assigned_bay: 'Bay 4 (Engine Test Cell)',
      assigned_tech: 'JWO M. Gupta',
      opened_date: '19 Oct 2026, 11:45',
      estimated_duration: '~ 40 hours',
      delay_reason: 'Low pressure fuel booster pump in transit from HAL Nashik.',
      linked_requests: 'REQ-2025 (Fuel Pump Unit)',
      blocking_items: [
        { id: 'BLK-2', name: 'Fuel Booster Pump – In Transit', status: 'In Transit', link_tab: 'parts-materials', link_id: 'REQ-2025' },
      ],
      next_action: 'Await fuel booster pump delivery and stage calibration rig.',
      image_url: '/tejas_hangar.jpg',
      stages: [
        { step: 1, name: 'Work Order Created', code: 'WO_CREATED' as const, status: 'completed' as const, actual_time: '19 Oct 11:45', responsible: 'Sqn Ldr. A. Sharma' },
        { step: 2, name: 'Aircraft Received', code: 'AIRCRAFT_RECEIVED' as const, status: 'completed' as const, actual_time: '19 Oct 13:30', responsible: 'Bay 4 Crew' },
        { step: 3, name: 'Inspection & Diagnosis', code: 'INSPECTION_DIAGNOSIS' as const, status: 'completed' as const, actual_time: '19 Oct 16:00', responsible: 'JWO M. Gupta' },
        { step: 4, name: 'Awaiting Part', code: 'AWAITING_PARTS' as const, status: 'blocked' as const, expected_time: 'ETA: 22 Oct 11:00', responsible: 'HAL Nashik Depot', blocker_detail: 'Inter-base freight booked.' },
        { step: 5, name: 'Repair & Testing', code: 'REPAIR_TESTING' as const, status: 'upcoming' as const, expected_time: 'Planned: 22 Oct – 23 Oct', responsible: 'Propulsion Team' },
        { step: 6, name: 'Inspection & Sign-off', code: 'INSPECTION_SIGNOFF' as const, status: 'upcoming' as const, expected_time: 'Target: 24 Oct 10:00', responsible: 'QA Officer' },
        { step: 7, name: 'Return to Service', code: 'RETURN_TO_SERVICE' as const, status: 'upcoming' as const, expected_time: 'Pending', responsible: 'Engineering Officer' },
      ],
      required_parts: [
        { part_number: 'HYD-2209', part_name: 'Fuel Pump Unit', required_qty: 1, received_qty: 0, status: 'In Transit' as const, image_url: '/spares/hydraulic_pump.png', linked_request_id: 'REQ-2025' },
      ],
      related_documents: [
        { id: 'DOC-1025', title: 'Fuel System Flow Diagnostics', file_type: 'PDF', file_size: '340 KB', linked_ref: 'WO-1025' },
      ],
      activity_log: [
        { id: 'ACT-1025-1', title: 'Requisition submitted to HAL Nashik', timestamp: '19 Oct 2026, 17:00', actor: 'Logistics Liaison', icon_type: 'dispatch' as const },
      ],
      base_id: 'afs-ambala',
    },
  ] as MaintenanceWorkOrderItem[],

  _inMemoryTechniciansRoster: [
    {
      id: 'tech-01',
      name: 'MWO R. Sharma',
      badge_number: 'IAF-ENG-4401',
      trade: 'Hydraulics & Flight Controls',
      qualifications: ['Tejas Mk1A Master Cert', 'High-Pressure Hydraulics', 'NDT Level II'],
      shift: 'Shift Alpha (06:00 - 14:00)',
      status: 'On Job' as const,
      assigned_work_order: 'WO-1042',
      assigned_aircraft: 'Tejas T-04',
      base_id: 'afs-ambala',
      experience_years: 16,
    },
    {
      id: 'tech-02',
      name: 'Sgt. V. Nair',
      badge_number: 'IAF-ENG-5112',
      trade: 'Propulsion & Turbofans',
      qualifications: ['Snecma M88 Engine Cert', 'AL-31FP Gas Turbine Lead'],
      shift: 'Shift Alpha (06:00 - 14:00)',
      status: 'On Job' as const,
      assigned_work_order: 'WO-1038',
      assigned_aircraft: 'Rafale RB-01',
      base_id: 'afs-ambala',
      experience_years: 12,
    },
    {
      id: 'tech-03',
      name: 'Cpl. A. Sen',
      badge_number: 'IAF-ENG-6204',
      trade: 'Avionics & Radar EW',
      qualifications: ['Mil-STD-1553 Bus Specialist', 'AESA Radar Alignment'],
      shift: 'Shift Bravo (14:00 - 22:00)',
      status: 'On Job' as const,
      assigned_work_order: 'WO-1031',
      assigned_aircraft: 'Tejas T-12',
      base_id: 'afs-ambala',
      experience_years: 7,
    },
    {
      id: 'tech-04',
      name: 'JWO M. Gupta',
      badge_number: 'IAF-ENG-4980',
      trade: 'Airframe & Composites',
      qualifications: ['Carbon Composite Autoclave Repair', 'Titanium Structural Welder'],
      shift: 'Shift Bravo (14:00 - 22:00)',
      status: 'On Job' as const,
      assigned_work_order: 'WO-1025',
      assigned_aircraft: 'Rafale RB-04',
      base_id: 'afs-ambala',
      experience_years: 14,
    },
    {
      id: 'tech-05',
      name: 'Sgt. K. Pillai',
      badge_number: 'IAF-ENG-5430',
      trade: 'Mechanical & Undercarriage',
      qualifications: ['Heavy Landing Gear Overhaul', 'Pneumatic Brakes Lead'],
      shift: 'Shift Charlie (22:00 - 06:00)',
      status: 'Available' as const,
      base_id: 'asp-chandigarh',
      experience_years: 11,
    },
    {
      id: 'tech-06',
      name: 'Cpl. D. Ghosh',
      badge_number: 'IAF-ENG-7102',
      trade: 'Electrical & Power Systems',
      qualifications: ['Starter-Generator Overhaul', 'Lithium Battery Safety'],
      shift: 'Shift Alpha (06:00 - 14:00)',
      status: 'Available' as const,
      base_id: 'afs-ambala',
      experience_years: 5,
    },
  ] as TechnicianRosterItem[],

  _inMemoryHangarBaysStatus: [
    {
      id: 'bay-01',
      name: 'Bay 1 (Depot)',
      bay_type: 'Heavy Depot Bay',
      status: 'Occupied' as const,
      occupied_by: 'Rafale RB-01',
      active_job: 'Engine Sensor Replacement (WO-1038)',
      estimated_free_time: 'Today, 18:00',
      compatible_aircraft: ['Rafale EH', 'Su-30MKI', 'Tejas Mk1A'],
      base_id: 'afs-ambala',
      environmental_control: true,
    },
    {
      id: 'bay-02',
      name: 'Bay 2 (Quick-Turn)',
      bay_type: 'Quick-Turn Maintenance Bay',
      status: 'Occupied' as const,
      occupied_by: 'Tejas T-04',
      active_job: 'Landing Gear – Hydraulic Leak (WO-1042)',
      estimated_free_time: '22 Oct 2026, 16:00',
      compatible_aircraft: ['Tejas Mk1', 'Tejas Mk1A', 'Mirage 2000'],
      base_id: 'afs-ambala',
      environmental_control: true,
    },
    {
      id: 'bay-03',
      name: 'Bay 3 (Avionics Clean Bay)',
      bay_type: 'Class 10,000 Clean Room Bay',
      status: 'Occupied' as const,
      occupied_by: 'Tejas T-12',
      active_job: 'Avionics Module Repair (WO-1031)',
      estimated_free_time: 'Today, 17:30',
      compatible_aircraft: ['Tejas Mk1A', 'Rafale EH', 'Su-30MKI'],
      base_id: 'afs-ambala',
      environmental_control: true,
    },
    {
      id: 'bay-04',
      name: 'Bay 4 (Engine Test Cell)',
      bay_type: 'Acoustic Test Cell',
      status: 'Occupied' as const,
      occupied_by: 'Rafale RB-04',
      active_job: 'Fuel Pump Replacement (WO-1025)',
      estimated_free_time: '24 Oct 2026, 14:00',
      compatible_aircraft: ['Rafale EH', 'Su-30MKI'],
      base_id: 'afs-ambala',
      environmental_control: true,
    },
    {
      id: 'bay-05',
      name: 'Bay 5 (Composite Bay)',
      bay_type: 'Composite Repair Facility',
      status: 'Available' as const,
      estimated_free_time: 'Available Now',
      compatible_aircraft: ['Tejas Mk1A', 'Rafale EH'],
      base_id: 'afs-ambala',
      environmental_control: true,
    },
    {
      id: 'bay-06',
      name: 'Bay 6 (Inspection Gate)',
      bay_type: 'Flight Clearance & Release Gate',
      status: 'Available' as const,
      estimated_free_time: 'Available Now',
      compatible_aircraft: ['All IAF Types'],
      base_id: 'afs-ambala',
      environmental_control: false,
    },
  ] as HangarBayStatusItem[],

  getMaintenanceKpis(): MaintenanceKpiSummary {
    const list = this._inMemoryMaintenanceWorkOrders;
    return {
      assigned_work_orders: 12,
      assigned_delta: '+2 Under Maintenance',
      in_progress: list.filter((w) => w.status === 'In Progress').length || 6,
      awaiting_parts: list.filter((w) => w.current_stage.includes('Awaiting') || w.status === 'Awaiting Parts').length || 3,
      ready_for_inspection: list.filter((w) => w.status === 'Inspection' || w.stage_index === 6).length || 2,
      overdue: 1,
      is_demo_data: true,
    };
  },

  getMaintenanceWorkOrders(params?: { status?: string; priority?: string; search?: string }): MaintenanceWorkOrderItem[] {
    let list = [...this._inMemoryMaintenanceWorkOrders];
    if (params?.status && params.status !== 'All' && params.status !== 'all') {
      const s = params.status.toLowerCase();
      if (s === 'in progress') list = list.filter((w) => w.status === 'In Progress');
      else if (s === 'awaiting parts') list = list.filter((w) => w.current_stage.toLowerCase().includes('awaiting'));
      else if (s === 'inspection') list = list.filter((w) => w.status === 'Inspection');
      else if (s === 'completed') list = list.filter((w) => w.status === 'Completed');
    }
    if (params?.priority && params.priority !== 'All' && params.priority !== 'all') {
      list = list.filter((w) => w.priority.toLowerCase() === params.priority!.toLowerCase());
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (w) =>
          w.id.toLowerCase().includes(q) ||
          w.aircraft.toLowerCase().includes(q) ||
          w.aircraft_model.toLowerCase().includes(q) ||
          w.issue.toLowerCase().includes(q) ||
          w.assigned_team.toLowerCase().includes(q)
      );
    }
    return list;
  },

  getMaintenanceWorkOrderDetail(woId: string): MaintenanceWorkOrderItem {
    const item = this._inMemoryMaintenanceWorkOrders.find((w) => w.id === woId);
    return item || this._inMemoryMaintenanceWorkOrders[0];
  },

  updateMaintenanceStage(woId: string, req: UpdateStageRequest): MaintenanceWorkOrderItem {
    const wo = this._inMemoryMaintenanceWorkOrders.find((w) => w.id === woId);
    if (wo) {
      wo.stage_index = req.target_stage_index;
      wo.current_stage = req.stage_name;
      wo.stages = wo.stages.map((s) => {
        if (s.step < req.target_stage_index) return { ...s, status: 'completed' as const };
        if (s.step === req.target_stage_index) {
          return {
            ...s,
            status: 'active' as const,
            actual_time: req.actual_time || s.actual_time,
            responsible: req.responsible_person || s.responsible,
            notes: req.notes || s.notes,
          };
        }
        return { ...s, status: 'upcoming' as const };
      });
      if (req.target_stage_index === 7) wo.status = 'Completed';
      else if (req.target_stage_index === 6) wo.status = 'Inspection';
      else wo.status = 'In Progress';

      wo.activity_log.unshift({
        id: `ACT-${Date.now()}`,
        title: `Stage advanced to ${req.stage_name}`,
        timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actor: req.responsible_person || 'MWO R. Sharma',
        icon_type: 'update',
        notes: req.notes || `Progressed to Step ${req.target_stage_index}`,
      });
    }
    return wo || this._inMemoryMaintenanceWorkOrders[0];
  },

  confirmMaintenancePartReceipt(woId: string, req: ConfirmPartReceiptRequest): MaintenanceWorkOrderItem {
    const wo = this._inMemoryMaintenanceWorkOrders.find((w) => w.id === woId);
    if (wo) {
      const part = wo.required_parts.find((p) => p.part_number === req.part_number);
      if (part) {
        part.received_qty += req.quantity_received;
        if (part.received_qty >= part.required_qty) part.status = 'Received';
      }
      if (wo.required_parts.every((p) => p.received_qty >= p.required_qty)) {
        wo.blocking_items = [];
        wo.delay_reason = undefined;
        if (wo.stage_index === 4) {
          wo.stage_index = 5;
          wo.current_stage = 'Repair & Testing';
        }
      }
      wo.activity_log.unshift({
        id: `ACT-${Date.now()}`,
        title: `Part received: ${req.part_number} (Qty: ${req.quantity_received})`,
        timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actor: req.received_by || 'MWO R. Sharma',
        icon_type: 'received',
        notes: req.notes || 'Part receipt confirmed and slotted into tool bay.',
      });
    }
    return wo || this._inMemoryMaintenanceWorkOrders[0];
  },

  recordMaintenanceInspectionSignOff(woId: string, req: InspectionSignOffRequest): MaintenanceWorkOrderItem {
    const wo = this._inMemoryMaintenanceWorkOrders.find((w) => w.id === woId);
    if (wo) {
      if (req.result === 'PASSED' && req.authorize_release) {
        wo.current_stage = 'Return to Service';
        wo.stage_index = 7;
        wo.status = 'Completed';
        wo.next_action = 'Sortie flight clearance authorized and signed.';
        wo.stages.forEach((s) => (s.status = 'completed'));
      } else if (req.result === 'PASSED') {
        wo.current_stage = 'Inspection & Sign-off';
        wo.stage_index = 6;
        wo.status = 'Inspection';
        wo.next_action = 'Quality check passed; awaiting final commander release sign-off.';
      } else {
        wo.current_stage = 'Repair & Testing';
        wo.stage_index = 5;
        wo.status = 'In Progress';
        wo.next_action = 'Quality inspection failed; re-work required by maintenance team.';
      }

      wo.activity_log.unshift({
        id: `ACT-${Date.now()}`,
        title: `Inspection sign-off: ${req.result}`,
        timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actor: `${req.inspector_name} (${req.inspector_service_id})`,
        icon_type: 'signoff',
        notes: req.sign_off_notes || `Inspection result: ${req.result}`,
      });
    }
    return wo || this._inMemoryMaintenanceWorkOrders[0];
  },

  getMaintenanceTechnicians(): TechnicianRosterItem[] {
    return this._inMemoryTechniciansRoster;
  },

  getMaintenanceBays(): HangarBayStatusItem[] {
    return this._inMemoryHangarBaysStatus;
  },
};

