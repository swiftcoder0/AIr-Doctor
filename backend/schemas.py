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

    model_config = ConfigDict(from_attributes=True)


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
