export type ComponentStatusType = 'Normal' | 'Monitor' | 'Maintenance Required';

export type AircraftStatusType = 'READY' | 'MAINTENANCE' | 'ALERT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type BaseId = 'base-alpha' | 'base-bravo' | 'all';

export type FutureHours = 0 | 10 | 25 | 50;

export interface BaseInfo {
  id: BaseId;
  name: string;
  code: string;
  location: string;
  squadron: string;
  aircraftCount: number;
  dataFreshness: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'LOCAL_ONLY';
}

export interface AircraftComponentData {
  id: string;
  name: string;
  health: number; // 0 - 100
  status: ComponentStatusType;
  currentValue: string;
  normalRange: string;
  operatingHours: string;
  lastInspection: string;
  maintenanceRisk: RiskLevel;
  insight: string;
  // Normalized 3D position relative to centered model
  hotspotPosition: [number, number, number];
  category?: 'propulsion' | 'avionics' | 'aerodynamics' | 'hydraulics' | 'structure' | 'landing';
  // Key parameters for bottom drawer
  keyParameters?: {
    pressure?: string;
    temperature?: string;
    operatingHours?: string;
    nextService?: string;
  };
  // Degradation projection per future hours
  futureProjections?: {
    10: { health: number; status: ComponentStatusType; risk: RiskLevel; insight: string };
    25: { health: number; status: ComponentStatusType; risk: RiskLevel; insight: string };
    50: { health: number; status: ComponentStatusType; risk: RiskLevel; insight: string };
  };
}

export interface AircraftData {
  id: string;
  code: string; // e.g. "AR-01" or "R-01", "T-04"
  name: string; // e.g. "RAFALE" or "TEJAS"
  fullName: string; // e.g. "Dassault Rafale – Multirole Fighter"
  type: string;
  status: AircraftStatusType;
  statusLabel: string;
  overallHealth: number; // 0 - 100
  baseId: BaseId;
  baseName: string;
  squadron: string;
  modelPath: string;
  modelFormat: 'glb' | 'obj';
  flightHours: string;
  lastMaintenance: string;
  nextMaintenance: string;
  nextMaintenanceHours: number;
  nextFlight?: string;
  issueDetected?: string;
  components: AircraftComponentData[];
  thumbnail: string;
  modelConfig: {
    initialCameraPosition: [number, number, number];
    initialTarget: [number, number, number];
    scaleMultiplier: number;
    rotationOffset: [number, number, number];
    groundOffset: number;
  };
}

export interface FleetSummary {
  totalAircraft: number;
  readyToFly: number;
  inMaintenance: number;
  attentionRequired: number;
  averageFleetHealth?: number;
  fleetReadinessScore?: number;
}

export interface FleetTableItem {
  id: string;
  code: string;
  name: string;
  type: 'Rafale' | 'Tejas';
  status: 'Ready' | 'Maintenance' | 'Attention';
  health: number;
  nextFlight: string;
  baseId: BaseId;
  issue?: string;
}

// -------------------------------------------------------------
// Data Trust & Import Types
// -------------------------------------------------------------
export type TrustGrade = 'A' | 'B' | 'C' | 'D';
export type DataCategory = 'aircraft_health' | 'maintenance_records' | 'spares_inventory' | 'technicians_bays';
export type VerifyStatus = 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface DataTrustRecord {
  id: string;
  baseId: BaseId;
  category: DataCategory;
  record_id: string;
  source_system: string;
  timestamp: string;
  quality_grade: TrustGrade;
  requires_human_verification: boolean;
  verification_status: VerifyStatus;
  detected_issues: string[];
  ground_truth_label?: string;
  payload: Record<string, any>;
}

export interface ImportHistoryItem {
  id: string;
  timestamp: string;
  baseId: BaseId;
  baseName: string;
  category: DataCategory;
  filename: string;
  recordsCount: number;
  validCount: number;
  flaggedCount: number;
  status: 'ACCEPTED' | 'PENDING_REVIEW' | 'REJECTED';
}

// -------------------------------------------------------------
// Logistics & Maintenance Types
// -------------------------------------------------------------
export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  applicableSubsystem: string;
  baseId: BaseId;
  quantityOnHand: number;
  stockAlpha: number;
  stockBravo: number;
  minimumRequired: number;
  shortageStatus: 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL_SHORTAGE';
  supplierLeadTime: string; // e.g. "6–8 weeks"
  supplierLeadTimeDays: number;
  crossBaseAvailableQty?: number;
  crossBaseTransferHours?: number;
  crossBaseSource?: string;
  compatibleAircraft?: string;
  condition?: string;
}

export interface Technician {
  id: string;
  name: string;
  badgeNumber: string;
  trade: 'Hydraulics Specialist' | 'Avionics & Radar' | 'Turbofan Propulsion' | 'Composite Airframe' | 'Armament & FCS';
  baseId: BaseId;
  status: 'AVAILABLE' | 'ON_JOB' | 'ON_LEAVE';
  assignedAircraft?: string;
  shift: 'Shift Alpha (06:00 - 14:00)' | 'Shift Bravo (14:00 - 22:00)' | 'Shift Charlie (22:00 - 06:00)';
}

export interface MaintenanceBay {
  id: string;
  name: string;
  baseId: BaseId;
  type: 'Heavy Depot Bay' | 'Flightline Quick-Turn Bay' | 'Avionics Cleanroom';
  status: 'OCCUPIED' | 'AVAILABLE' | 'MAINTENANCE';
  occupiedByAircraft?: string;
  activeJob?: string;
  estimatedFreeTime: string;
}

export interface MaintenanceJob {
  id: string;
  aircraftCode: string;
  aircraftName: string;
  baseId: BaseId;
  subsystem: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'IN_PROGRESS' | 'WAITING_PARTS' | 'WAITING_TECH' | 'QUEUED';
  assignedBay: string;
  assignedTechnician: string;
  requiredPartNumber: string;
  requiredPartName: string;
  repairDurationHours: number;
  projectedReadyHours: number;
  bottleneckType: 'SPARE_PART' | 'TECHNICIAN' | 'BAY' | 'NONE';
  bottleneckDetail: string;
}

export interface WorkOrder {
  id: string;
  aircraft: string; // e.g. "Tejas AR-02" or "Tejas T-04"
  component: string; // e.g. "Hydraulic System"
  type: 'Overhaul' | 'Inspection' | 'Check' | 'Repair';
  status: 'Delayed' | 'In Progress' | 'Scheduled' | 'Completed';
  scheduledDate: string; // e.g. "12 Oct 2024"
  estHours: number; // e.g. 24
  priority: 'High' | 'Medium' | 'Low';
  baseId: BaseId;
  delayReason?: string;
  assignedBay?: string;
  assignedTech?: string;
  requiredSpare?: string;
}

export interface BottleneckItem {
  id: string;
  type: 'SPARE_PART' | 'TECHNICIAN' | 'BAY';
  name: string;
  baseId: BaseId;
  impactedAircraft: string;
  delayHours: number;
  suggestedAction: string;
}

// -------------------------------------------------------------
// Resource Recovery Optimizer Types
// -------------------------------------------------------------
export interface WhatIfRequest {
  delta_spares: Record<string, number>;
  delta_technicians: Record<string, number>;
  delta_bays: number;
  cross_base_transfer: boolean;
}

export interface WhatIfResult {
  scenarioName: string;
  baselineReadyHours: number;
  projectedReadyHours: number;
  hoursRecovered: number;
  aircraft_days_recovered: number;
  projectedFleetReadinessPct: number;
  costImpactEst: string;
  riskAssessment: string;
  activeBottleneck: string;
}

export interface OptimizerRecommendation {
  id: string;
  title: string;
  actionType: 'CROSS_BASE_TRANSFER' | 'EXPEDITE_SPARE' | 'REASSIGN_TECH' | 'ALLOCATE_BAY';
  recommendedOption: string;
  daysRecovered: number;
  rationale: string;
  tradeOff: string;
  parameters: WhatIfRequest;
}

// -------------------------------------------------------------
// AI Assistant & Chat Types
// -------------------------------------------------------------
export interface ChatCardSpec {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  cardData?: {
    title: string;
    badge?: string;
    badgeType?: 'success' | 'warning' | 'danger';
    specs: ChatCardSpec[];
    recommendations?: string[];
    partNumber?: string;
  };
}

// -------------------------------------------------------------
// Decision Ledger Types
// -------------------------------------------------------------
export interface DecisionLedgerEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  previous_state: string;
  resulting_state: string;
  notes: string;
  scenario_id?: string;
  baseId?: BaseId;
  isOverride?: boolean;
  overrideReason?: string;
}
