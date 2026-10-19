from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# -------------------------------------------------------------
# Base & Fleet Schemas
# -------------------------------------------------------------
class BaseInfo(BaseModel):
    id: str
    name: str
    code: str
    location: str
    squadron: str
    aircraftCount: int
    dataFreshness: str
    syncStatus: str

    model_config = ConfigDict(from_attributes=True)


class ComponentKeyParams(BaseModel):
    pressure: Optional[str] = None
    temperature: Optional[str] = None
    operatingHours: Optional[str] = None
    nextService: Optional[str] = None


class ComponentProjection(BaseModel):
    health: int
    status: str
    risk: str
    insight: str


class SensorAttribution(BaseModel):
    name: str
    contribution_pct: float


class ComponentRulPrediction(BaseModel):
    model_source: str
    model_file_present: bool
    rul_p10: float
    rul_p50: float
    rul_p90: float
    risk_range_pct: float
    trust_penalty_applied: bool
    shap_drivers: List[SensorAttribution]


class AircraftComponent(BaseModel):
    id: str
    name: str
    health: int
    status: str
    currentValue: str
    normalRange: str
    operatingHours: str
    lastInspection: str
    maintenanceRisk: str
    insight: str
    hotspotPosition: List[float]
    category: Optional[str] = "propulsion"
    keyParameters: Optional[ComponentKeyParams] = None
    futureProjections: Optional[Dict[str, ComponentProjection]] = None
    rulPrediction: Optional[ComponentRulPrediction] = None


class AircraftModelConfig(BaseModel):
    initialCameraPosition: List[float]
    initialTarget: List[float]
    scaleMultiplier: float
    rotationOffset: List[float]
    groundOffset: float


class AircraftData(BaseModel):
    id: str
    code: str
    name: str
    fullName: str
    type: str
    status: str
    statusLabel: str
    overallHealth: int
    baseId: str
    baseName: str
    squadron: str
    modelPath: str
    modelFormat: str
    flightHours: str
    lastMaintenance: str
    nextMaintenance: str
    nextMaintenanceHours: int
    nextFlight: Optional[str] = "Ready"
    issueDetected: Optional[str] = None
    components: List[AircraftComponent]
    thumbnail: str
    modelConfig: Optional[AircraftModelConfig] = None


class FleetSummary(BaseModel):
    totalAircraft: int
    readyToFly: int
    inMaintenance: int
    attentionRequired: int
    averageFleetHealth: Optional[int] = 85
    fleetReadinessScore: Optional[int] = 75


class FleetTableItem(BaseModel):
    id: str
    code: str
    name: str
    type: str
    status: str
    health: int
    nextFlight: str
    baseId: str
    issue: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Logistics & Inventory Schemas
# -------------------------------------------------------------
class SparePart(BaseModel):
    id: str
    partNumber: str
    name: str
    applicableSubsystem: str
    baseId: str
    quantityOnHand: int
    stockAlpha: int
    stockBravo: int
    minimumRequired: int
    shortageStatus: str
    supplierLeadTime: str
    supplierLeadTimeDays: int
    crossBaseAvailableQty: Optional[int] = 0
    crossBaseTransferHours: Optional[int] = 14
    crossBaseSource: Optional[str] = None
    compatibleAircraft: Optional[str] = "Tejas / Rafale"
    condition: Optional[str] = "Serviceable"

    model_config = ConfigDict(from_attributes=True)


class Technician(BaseModel):
    id: str
    name: str
    badgeNumber: str
    trade: str
    baseId: str
    status: str
    assignedAircraft: Optional[str] = None
    shift: str

    model_config = ConfigDict(from_attributes=True)


class MaintenanceBay(BaseModel):
    id: str
    name: str
    baseId: str
    type: str
    status: str
    occupiedByAircraft: Optional[str] = None
    activeJob: Optional[str] = None
    estimatedFreeTime: str

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Work Orders Schemas
# -------------------------------------------------------------
class WorkOrder(BaseModel):
    id: str
    aircraft: str
    component: str
    type: str
    status: str
    scheduledDate: str
    estHours: int
    priority: str
    baseId: str
    delayReason: Optional[str] = None
    assignedBay: Optional[str] = None
    assignedTech: Optional[str] = None
    requiredSpare: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WorkOrderCreate(BaseModel):
    aircraft: str
    component: str
    type: str = "Inspection"
    status: str = "Scheduled"
    scheduledDate: str = "14 Oct 2024"
    estHours: int = 12
    priority: str = "Medium"
    baseId: str = "base-alpha"
    delayReason: Optional[str] = None
    assignedBay: Optional[str] = None
    assignedTech: Optional[str] = None
    requiredSpare: Optional[str] = None


class WorkOrderUpdate(BaseModel):
    aircraft: Optional[str] = None
    component: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    scheduledDate: Optional[str] = None
    estHours: Optional[int] = None
    priority: Optional[str] = None
    baseId: Optional[str] = None
    delayReason: Optional[str] = None
    assignedBay: Optional[str] = None
    assignedTech: Optional[str] = None
    requiredSpare: Optional[str] = None


# -------------------------------------------------------------
# Data Trust & Import Schemas
# -------------------------------------------------------------
class DataTrustRecord(BaseModel):
    id: str
    baseId: str
    category: str
    record_id: str
    source_system: str
    timestamp: str
    quality_grade: str
    requires_human_verification: bool
    verification_status: str
    detected_issues: List[str]
    ground_truth_label: Optional[str] = None
    payload: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class ImportHistoryItem(BaseModel):
    id: str
    timestamp: str
    baseId: str
    baseName: str
    category: str
    filename: str
    recordsCount: int
    validCount: int
    flaggedCount: int
    status: str

    model_config = ConfigDict(from_attributes=True)


class CsvRowError(BaseModel):
    row_number: int
    field: str
    error: str
    rejected_value: Any


class CsvPreviewResponse(BaseModel):
    valid: bool
    total_rows: int
    valid_rows_count: int
    flagged_rows_count: int
    category: str
    base_id: str
    preview_rows: List[Dict[str, Any]]
    errors: List[CsvRowError]
    trust_grade: str


class CsvCommitRequest(BaseModel):
    base_id: str
    category: str
    filename: str
    rows: List[Dict[str, Any]]


class CsvCommitResponse(BaseModel):
    success: bool
    batch_id: str
    imported_count: int
    flagged_count: int
    trust_grade: str
    message: str


class RecordVerificationRequest(BaseModel):
    status: str  # 'VERIFIED' | 'REJECTED'
    notes: Optional[str] = None
    reviewer: Optional[str] = "Air Commander"


# -------------------------------------------------------------
# Optimizer Schemas
# -------------------------------------------------------------
class WhatIfRequest(BaseModel):
    delta_spares: Dict[str, int] = Field(default_factory=dict)
    delta_technicians: Dict[str, int] = Field(default_factory=dict)
    delta_bays: int = 0
    cross_base_transfer: bool = False


class WhatIfResult(BaseModel):
    scenarioName: str
    baselineReadyHours: int
    projectedReadyHours: int
    hoursRecovered: int
    aircraft_days_recovered: float
    projectedFleetReadinessPct: int
    costImpactEst: str
    riskAssessment: str
    activeBottleneck: str


class OptimizerRecommendation(BaseModel):
    id: str
    title: str
    actionType: str
    recommendedOption: str
    daysRecovered: float
    rationale: str
    tradeOff: str
    parameters: WhatIfRequest


# -------------------------------------------------------------
# Decision Ledger Schemas
# -------------------------------------------------------------
class DecisionLedgerEntry(BaseModel):
    id: str
    timestamp: str
    actor: str
    action: str
    previous_state: str
    resulting_state: str
    notes: str
    scenario_id: Optional[str] = None
    baseId: Optional[str] = None
    isOverride: Optional[bool] = False
    overrideReason: Optional[str] = None
    prev_hash: Optional[str] = None
    curr_hash: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VerifyChainResponse(BaseModel):
    verified: bool
    total_blocks: int
    head_hash: str
    algorithm: str = "SHA-256"
    message: str


class CreateDecisionRequest(BaseModel):
    actor: str = "Air Commander"
    action: str
    previous_state: str = ""
    resulting_state: str = ""
    notes: str = ""
    scenario_id: Optional[str] = None
    baseId: Optional[str] = "all"
    isOverride: Optional[bool] = False
    overrideReason: Optional[str] = None


# -------------------------------------------------------------
# Security & RBAC Schemas
# -------------------------------------------------------------
class SecurityStatus(BaseModel):
    argon2id_enabled: bool = True
    totp_mfa_enabled: bool = True
    roles: List[str] = ["Commander", "Planner", "Viewer"]
    demo_totp_code: str
    active_policy: str = "Strict Air Force RBAC + Step-Up RFC 6238 TOTP MFA"
    crypto_algorithms: Optional[Dict[str, str]] = None


class DepartmentProfile(BaseModel):
    id: str
    name: str
    officer: str
    service_id: str
    role: str
    default_tab: str
    description: str
    agency_label: str

    model_config = ConfigDict(from_attributes=True)


class DepartmentLoginRequest(BaseModel):
    department_id: str
    service_id: Optional[str] = None
    password: Optional[str] = None


class DepartmentLoginResponse(BaseModel):
    step: str = "totp_required"
    department_id: str
    department_name: str
    officer: str
    service_id: str
    role: str
    default_tab: str
    demo_totp_code: str
    message: str


class VerifyTotpRequest(BaseModel):
    code: Optional[str] = None
    totp_code: Optional[str] = None
    role: Optional[str] = "Commander"
    department_id: Optional[str] = None


class VerifyTotpResponse(BaseModel):
    verified: bool
    role: str = "Commander"
    message: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    officer: Optional[str] = None
    service_id: Optional[str] = None
    default_tab: Optional[str] = None
    access_token: Optional[str] = None
    authenticated_at: Optional[str] = None


# -------------------------------------------------------------
# AI Assistant Chat Schemas
# -------------------------------------------------------------
class ChatCardSpec(BaseModel):
    label: str = Field(..., alias="label")
    value: str = Field(..., alias="value")


class ChatCardData(BaseModel):
    title: str
    badge: Optional[str] = None
    badgeType: Optional[str] = "success"
    partNumber: Optional[str] = None
    specs: List[ChatCardSpec]
    recommendations: Optional[List[str]] = None


class ChatQueryRequest(BaseModel):
    prompt: str
    base_id: Optional[str] = "all"


class ChatQueryResponse(BaseModel):
    id: str
    sender: str = "assistant"
    timestamp: str
    text: str
    cardData: Optional[ChatCardData] = None


# -------------------------------------------------------------
# Commander Command Center Schemas
# -------------------------------------------------------------
class AircraftTypeCount(BaseModel):
    type: str
    total: int
    serviceable: int
    maintenance: int
    grounded: int


class CommanderAirbase(BaseModel):
    id: str
    name: str
    code: str
    command: str
    lat: float
    lng: float
    status: str
    statusLevel: str
    totalAircraft: int
    serviceable: int
    underMaintenance: int
    grounded: int
    readinessPct: int
    squadrons: List[str]
    aircraftBreakdown: List[AircraftTypeCount]
    blockers: List[str]
    commanderName: str
    lastInspection: str
    image: Optional[str] = None


class CommandApprovalItem(BaseModel):
    id: str
    title: str
    type: str
    priority: str
    baseName: str
    aircraft: str
    requester: str
    date: str
    amountOrScope: str
    justification: str
    impact: str
    status: str
    decisionNotes: Optional[str] = None
    decidedBy: Optional[str] = None
    decidedAt: Optional[str] = None
    ledgerEntryId: Optional[str] = None
    ledgerHash: Optional[str] = None


class FleetTrendPoint(BaseModel):
    day: str
    readiness: int
    target: int = 75


class ReadinessByType(BaseModel):
    type: str
    readiness: int
    count: int


class KeyInsightItem(BaseModel):
    title: str
    metric: str
    detail: str
    trend: str
    tone: str


class CommanderFleetMetrics(BaseModel):
    totalAircraft: int
    totalAircraftChange: str
    serviceable: int
    serviceablePct: int
    underMaintenance: int
    underMaintenancePct: int
    grounded: int
    groundedPct: int
    awaitingApproval: int
    overallReadinessPct: int
    trend7d: List[FleetTrendPoint]
    trend30d: List[FleetTrendPoint]
    trend90d: List[FleetTrendPoint]
    readinessByType: List[ReadinessByType]
    keyInsights: List[KeyInsightItem]


class ApprovalActionRequest(BaseModel):
    action: str  # 'APPROVE' | 'REJECT' | 'CLARIFY'
    notes: str
    officer_name: Optional[str] = "Wing Cmdr. Aditya (Fleet Commander)"
    officer_role: Optional[str] = "Commander"


class ApprovalActionResponse(BaseModel):
    success: bool
    message: str
    approval: CommandApprovalItem
    ledger_entry_id: str
    ledger_hash: str


# -------------------------------------------------------------
# Technical Records & Quality Schemas
# -------------------------------------------------------------
class TechnicalRecordItem(BaseModel):
    id: str
    aircraft_id: str
    aircraft_model: str = "Rafale"
    record_type: str
    date: str
    component: Optional[str] = None
    source: str = "PDF Import"
    uploaded_by: str = "Cpl. Arjun Singh"
    status: str = "Verified"
    trust_grade: str = "A"
    finding: Optional[str] = ""
    work_performed: Optional[str] = ""
    parts_replaced: Optional[str] = ""
    flight_hours: Optional[str] = ""
    document_name: Optional[str] = ""
    document_type: Optional[str] = "pdf"
    raw_extracted: Optional[Dict[str, Any]] = None
    validation_issues: Optional[List[str]] = None
    confidence_score: Optional[int] = 95
    created_at: Optional[str] = None
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None
    base_id: Optional[str] = "base-alpha"


class TechnicalRecordStats(BaseModel):
    total_records: int
    verified_records: int
    pending_verification: int
    incomplete_conflicting: int


class PdfExtractResponse(BaseModel):
    success: bool
    filename: str
    aircraft_id: str
    record_type: str
    is_scanned: bool
    page_count: int
    extracted_text_preview: str
    extracted_fields: Dict[str, Any]
    confidence_score: int
    validation_issues: List[str]
    status: str


class CsvColumnMapping(BaseModel):
    source_column: str
    target_field: str
    confidence: float
    is_unknown: bool = False


class CsvMapAndValidateResponse(BaseModel):
    success: bool
    filename: str
    aircraft_id: str
    record_type: str
    total_rows: int
    valid_rows: int
    warning_rows: int
    rejected_rows: int
    column_mappings: List[CsvColumnMapping]
    unknown_columns: List[str]
    preview_rows: List[Dict[str, Any]]
    validation_report: List[str]
    can_commit: bool


class CommitTechnicalRecordRequest(BaseModel):
    aircraft_id: str
    record_type: str
    date: str
    component: Optional[str] = None
    source: str = "PDF Import"
    uploaded_by: Optional[str] = "Sqn Ldr. Vikram"
    finding: Optional[str] = None
    work_performed: Optional[str] = None
    parts_replaced: Optional[str] = None
    flight_hours: Optional[str] = None
    document_name: Optional[str] = None
    document_type: Optional[str] = "pdf"
    status: Optional[str] = "Verified"
    confidence_score: Optional[int] = 95
    raw_extracted: Optional[Dict[str, Any]] = None
    validation_issues: Optional[List[str]] = None
    reviewer: Optional[str] = "Flt Lt. Meera (QA Officer)"
    notes: Optional[str] = None


# -------------------------------------------------------------
# Logistics & Spares Schemas
# -------------------------------------------------------------
class LogisticsInventoryItem(BaseModel):
    id: str
    part_number: str
    description: str
    applicable_aircraft: str
    category: str
    location: str
    usable_qty: int
    reserved_qty: int
    min_stock: int
    status: str
    nsn_oem: str
    condition: str
    last_inspection: str
    unit_cost_inr: int
    compatibility: List[str] = []
    image_url: Optional[str] = None
    base_id: str


class LogisticsKpiSummary(BaseModel):
    total_inventory_items: int
    low_stock_items: int
    pending_requests: int
    transfers_in_progress: int
    approved_orders: int
    is_demo_data: bool = True


class MaterialRequestItem(BaseModel):
    id: str
    aircraft: str
    part_number: str
    part_name: str
    quantity: int
    status: str
    required_by: str
    request_date: str
    priority: str
    destination_base: str
    requester: str
    linked_work_order_id: Optional[str] = None
    notes: Optional[str] = None


class CreateMaterialRequest(BaseModel):
    aircraft: str
    part_number: str
    part_name: str
    quantity: int = 1
    required_by: str
    priority: str = "Medium"
    destination_base: str
    requester: Optional[str] = "Sqn Ldr. Line Officer"
    linked_work_order_id: Optional[str] = None
    notes: Optional[str] = None


class SparesTransferItem(BaseModel):
    id: str
    part_number: str
    part_name: str
    quantity: int
    source_location: str
    destination_location: str
    status: str
    eta: str
    request_date: str
    transport_mode: str
    linked_request_id: Optional[str] = None
    approved_by: Optional[str] = None


class CreateSparesTransferRequest(BaseModel):
    part_number: str
    part_name: str
    quantity: int = 1
    source_location: str
    destination_location: str
    transport_mode: Optional[str] = "IAF Air Transit (C-130J)"
    linked_request_id: Optional[str] = None
    notes: Optional[str] = None


class ProcurementOrderItem(BaseModel):
    id: str
    part_number: str
    part_name: str
    supplier: str
    quantity: int
    status: str
    lead_time: str
    order_date: str
    contract_ref: str
    est_total_cost: str


class CreateProcurementOrderRequest(BaseModel):
    part_number: str
    part_name: str
    supplier: str
    quantity: int = 1
    contract_ref: Optional[str] = None
    est_total_cost: Optional[str] = None


class StockMovementItem(BaseModel):
    id: str
    timestamp: str
    part_number: str
    part_name: str
    movement_type: str
    quantity: int
    origin: str
    destination: str
    responsible_user: str
    linked_reference: Optional[str] = None
    notes: Optional[str] = None


class ReservePartRequest(BaseModel):
    inventory_id: str
    part_number: str
    quantity: int = 1
    linked_request_or_wo: Optional[str] = None
    notes: Optional[str] = None



