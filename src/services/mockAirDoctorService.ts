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
    if (baseId === 'all') return aircraftList;
    return aircraftList.filter((a) => a.baseId === baseId);
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
    const alert = list.filter((a) => a.status === 'Attention').length;
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
    if (futureHours === 0) return aircraft;

    const projectedComponents: AircraftComponentData[] = aircraft.components.map((comp) => {
      const projection = comp.futureProjections?.[futureHours];
      if (!projection) return comp;

      return {
        ...comp,
        health: projection.health,
        status: projection.status,
        maintenanceRisk: projection.risk,
        insight: projection.insight,
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

  // Decision Ledger (Page 7)
  getLedger(baseId: BaseId = 'all'): DecisionLedgerEntry[] {
    if (baseId === 'all') return inMemoryLedger;
    return inMemoryLedger.filter((l) => !l.baseId || l.baseId === 'all' || l.baseId === baseId);
  },

  recordDecision(entry: Omit<DecisionLedgerEntry, 'id' | 'timestamp'>): DecisionLedgerEntry {
    const newEntry: DecisionLedgerEntry = {
      ...entry,
      id: `dec-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
    };
    inMemoryLedger = [newEntry, ...inMemoryLedger];
    return newEntry;
  },
};
