from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class BaseInfoORM(Base):
    __tablename__ = "bases"

    id = Column(String(50), primary_key=True, index=True)  # e.g. 'base-alpha', 'base-bravo'
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    squadron = Column(String(100), nullable=False)
    aircraft_count = Column(Integer, default=0)
    data_freshness = Column(String(50), default="Live")
    sync_status = Column(String(50), default="SYNCED")

    aircraft = relationship("AircraftORM", back_populates="base")


class AircraftORM(Base):
    __tablename__ = "aircraft"

    id = Column(String(50), primary_key=True, index=True)  # e.g. 'rafale', 'tejas', 'R-01', 'T-04'
    code = Column(String(50), nullable=False, index=True)   # e.g. 'R-01', 'T-04'
    name = Column(String(100), nullable=False)              # e.g. 'RAFALE', 'TEJAS'
    full_name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False, index=True)   # 'Rafale' | 'Tejas'
    status = Column(String(50), nullable=False, default="Ready") # 'Ready' | 'Maintenance' | 'Attention'
    status_label = Column(String(100), default="Operational")
    overall_health = Column(Integer, default=100)
    base_id = Column(String(50), ForeignKey("bases.id"), nullable=False, index=True)
    base_name = Column(String(100), nullable=False)
    squadron = Column(String(100), nullable=False)
    model_path = Column(String(255), default="")
    model_format = Column(String(20), default="glb")
    flight_hours = Column(String(50), default="0 h")
    last_maintenance = Column(String(50), default="10 Oct 2024")
    next_maintenance = Column(String(50), default="25 Oct 2024")
    next_maintenance_hours = Column(Integer, default=50)
    next_flight = Column(String(50), default="Ready")
    issue_detected = Column(String(255), nullable=True)
    thumbnail = Column(String(255), default="")
    model_config_json = Column(Text, nullable=True)

    base = relationship("BaseInfoORM", back_populates="aircraft")
    components = relationship("AircraftComponentORM", back_populates="aircraft", cascade="all, delete-orphan")


class AircraftComponentORM(Base):
    __tablename__ = "aircraft_components"

    id = Column(String(100), primary_key=True, index=True)
    aircraft_id = Column(String(50), ForeignKey("aircraft.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    health = Column(Integer, default=100)
    status = Column(String(50), default="Normal")  # 'Normal' | 'Monitor' | 'Maintenance Required'
    current_value = Column(String(100), default="Nominal")
    normal_range = Column(String(100), default="Nominal")
    operating_hours = Column(String(50), default="0 h")
    last_inspection = Column(String(50), default="Routine")
    maintenance_risk = Column(String(50), default="LOW")
    insight = Column(Text, default="")
    category = Column(String(50), default="propulsion")
    hotspot_position_json = Column(Text, default="[0,0,0]")
    key_parameters_json = Column(Text, nullable=True)
    future_projections_json = Column(Text, nullable=True)

    aircraft = relationship("AircraftORM", back_populates="components")


class SparePartORM(Base):
    __tablename__ = "spares"

    id = Column(String(50), primary_key=True, index=True)
    part_number = Column(String(50), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    applicable_subsystem = Column(String(100), nullable=False)
    base_id = Column(String(50), nullable=False, index=True)
    quantity_on_hand = Column(Integer, default=0)
    stock_alpha = Column(Integer, default=0)
    stock_bravo = Column(Integer, default=0)
    minimum_required = Column(Integer, default=1)
    shortage_status = Column(String(50), default="IN_STOCK")  # 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL_SHORTAGE'
    supplier_lead_time = Column(String(50), default="1-2 weeks")
    supplier_lead_time_days = Column(Integer, default=14)
    cross_base_available_qty = Column(Integer, default=0)
    cross_base_transfer_hours = Column(Integer, default=14)
    cross_base_source = Column(String(100), nullable=True)
    compatible_aircraft = Column(String(100), default="Tejas / Rafale")
    condition = Column(String(50), default="Serviceable")


class SupplierOrderORM(Base):
    __tablename__ = "supplier_orders"

    id = Column(String(50), primary_key=True, index=True)
    part_number = Column(String(50), nullable=False)
    base_id = Column(String(50), nullable=False)
    quantity = Column(Integer, default=1)
    order_date = Column(String(50), nullable=False)
    expected_delivery = Column(String(50), nullable=False)
    status = Column(String(50), default="ORDERED")  # 'ORDERED' | 'IN_TRANSIT' | 'DELIVERED'


class TechnicianORM(Base):
    __tablename__ = "technicians"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    badge_number = Column(String(50), nullable=False)
    trade = Column(String(100), nullable=False)
    base_id = Column(String(50), nullable=False, index=True)
    status = Column(String(50), default="AVAILABLE")  # 'AVAILABLE' | 'ON_JOB' | 'ON_LEAVE'
    assigned_aircraft = Column(String(50), nullable=True)
    shift = Column(String(100), default="Shift Alpha (06:00 - 14:00)")


class MaintenanceBayORM(Base):
    __tablename__ = "maintenance_bays"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    base_id = Column(String(50), nullable=False, index=True)
    type = Column(String(100), default="Heavy Depot Bay")
    status = Column(String(50), default="AVAILABLE")  # 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
    occupied_by_aircraft = Column(String(50), nullable=True)
    active_job = Column(String(100), nullable=True)
    estimated_free_time = Column(String(50), default="Available Now")


class WorkOrderORM(Base):
    __tablename__ = "work_orders"

    id = Column(String(50), primary_key=True, index=True)
    aircraft = Column(String(100), nullable=False)
    component = Column(String(100), nullable=False)
    type = Column(String(50), default="Inspection")  # 'Overhaul' | 'Inspection' | 'Check' | 'Repair'
    status = Column(String(50), default="Scheduled") # 'Delayed' | 'In Progress' | 'Scheduled' | 'Completed'
    scheduled_date = Column(String(50), default="12 Oct 2024")
    est_hours = Column(Integer, default=12)
    priority = Column(String(50), default="Medium")  # 'High' | 'Medium' | 'Low'
    base_id = Column(String(50), nullable=False, index=True)
    delay_reason = Column(String(255), nullable=True)
    assigned_bay = Column(String(100), nullable=True)
    assigned_tech = Column(String(100), nullable=True)
    required_spare = Column(String(100), nullable=True)


class ImportBatchORM(Base):
    __tablename__ = "import_batches"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(String(50), nullable=False)
    base_id = Column(String(50), nullable=False, index=True)
    base_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    filename = Column(String(255), nullable=False)
    records_count = Column(Integer, default=0)
    valid_count = Column(Integer, default=0)
    flagged_count = Column(Integer, default=0)
    status = Column(String(50), default="ACCEPTED")  # 'ACCEPTED' | 'PENDING_REVIEW' | 'REJECTED'


class DataTrustRecordORM(Base):
    __tablename__ = "data_trust_records"

    id = Column(String(50), primary_key=True, index=True)
    base_id = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    record_id = Column(String(100), nullable=False, index=True)
    source_system = Column(String(255), nullable=False)
    timestamp = Column(String(50), nullable=False)
    quality_grade = Column(String(10), default="B")  # 'A' | 'B' | 'C' | 'D'
    requires_human_verification = Column(Boolean, default=False)
    verification_status = Column(String(50), default="NEEDS_REVIEW") # 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED'
    detected_issues_json = Column(Text, default="[]")
    ground_truth_label = Column(String(100), nullable=True)
    payload_json = Column(Text, default="{}")


class DecisionLedgerORM(Base):
    __tablename__ = "decision_ledger"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(String(50), nullable=False)
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    previous_state = Column(String(255), default="")
    resulting_state = Column(String(255), default="")
    notes = Column(Text, default="")
    scenario_id = Column(String(100), nullable=True)
    base_id = Column(String(50), nullable=True)
    is_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)


class TechnicalRecordORM(Base):
    __tablename__ = "technical_records"

    id = Column(String(50), primary_key=True, index=True) # e.g. "REC-2026-1048"
    aircraft_id = Column(String(50), nullable=False, index=True) # e.g. "Rafale R-01"
    aircraft_model = Column(String(50), default="Rafale") # "Rafale" | "Tejas" | "MiG-21"
    record_type = Column(String(100), nullable=False, index=True)
    date = Column(String(50), nullable=False) # e.g. "18 Oct 2026"
    component = Column(String(100), nullable=True) # e.g. "Engine (M88)"
    source = Column(String(100), default="PDF Import") # "PDF Import" | "CSV Import" | "Digital Import"
    uploaded_by = Column(String(100), default="Cpl. Arjun Singh")
    status = Column(String(50), default="Verified") # "Verified" | "Pending" | "Incomplete" | "Rejected"
    trust_grade = Column(String(10), default="A") # "A" | "B" | "C" | "D"
    finding = Column(Text, default="")
    work_performed = Column(Text, default="")
    parts_replaced = Column(String(255), default="")
    flight_hours = Column(String(50), default="")
    document_name = Column(String(255), default="")
    document_type = Column(String(50), default="pdf")
    raw_extracted_json = Column(Text, default="{}")
    validation_issues_json = Column(Text, default="[]")
    confidence_score = Column(Integer, default=95)
    created_at = Column(String(50), nullable=False)
    verified_at = Column(String(50), nullable=True)
    verified_by = Column(String(100), nullable=True)
    base_id = Column(String(50), default="base-alpha")


class LogisticsInventoryORM(Base):
    __tablename__ = "logistics_inventory"

    id = Column(String(50), primary_key=True, index=True)
    part_number = Column(String(50), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    applicable_aircraft = Column(String(100), nullable=False, index=True)
    category = Column(String(100), default="Engine")
    location = Column(String(100), nullable=False, index=True)
    usable_qty = Column(Integer, default=0)
    reserved_qty = Column(Integer, default=0)
    min_stock = Column(Integer, default=1)
    status = Column(String(50), default="In Stock") # 'In Stock' | 'Low Stock' | 'Critically Low' | 'Out of Stock'
    nsn_oem = Column(String(100), default="")
    condition = Column(String(50), default="Serviceable")
    last_inspection = Column(String(50), default="")
    unit_cost_inr = Column(Integer, default=0)
    compatibility_json = Column(Text, default="[]")
    image_url = Column(String(255), nullable=True)
    base_id = Column(String(50), default="afs-ambala")


class MaterialRequestORM(Base):
    __tablename__ = "material_requests"

    id = Column(String(50), primary_key=True, index=True) # e.g. "REQ-1021"
    aircraft = Column(String(100), nullable=False)
    part_number = Column(String(50), nullable=False, index=True)
    part_name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    status = Column(String(50), default="Pending") # 'Approved' | 'Pending' | 'Urgent' | 'In Review' | 'Completed' | 'Rejected'
    required_by = Column(String(50), nullable=False)
    request_date = Column(String(50), nullable=False)
    priority = Column(String(50), default="Medium") # 'Urgent' | 'High' | 'Medium' | 'Low'
    destination_base = Column(String(100), nullable=False)
    requester = Column(String(100), nullable=False)
    linked_work_order_id = Column(String(50), nullable=True)
    notes = Column(Text, default="")


class SparesTransferORM(Base):
    __tablename__ = "spares_transfers"

    id = Column(String(50), primary_key=True, index=True) # e.g. "TRF-2025-081"
    part_number = Column(String(50), nullable=False, index=True)
    part_name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    source_location = Column(String(100), nullable=False)
    destination_location = Column(String(100), nullable=False)
    status = Column(String(50), default="Requested") # 'In Transit' | 'Requested' | 'Approved' | 'Delivered' | 'Cancelled'
    eta = Column(String(50), default="14 hours")
    request_date = Column(String(50), nullable=False)
    transport_mode = Column(String(100), default="IAF Air Transit (C-130J)")
    linked_request_id = Column(String(50), nullable=True)
    approved_by = Column(String(100), nullable=True)


class ProcurementOrderORM(Base):
    __tablename__ = "procurement_orders"

    id = Column(String(50), primary_key=True, index=True) # e.g. "PO-2025-412"
    part_number = Column(String(50), nullable=False, index=True)
    part_name = Column(String(255), nullable=False)
    supplier = Column(String(100), default="OEM (HAL)")
    quantity = Column(Integer, default=1)
    status = Column(String(50), default="On Order") # 'On Order' | 'Pending MoD Sanction' | 'Delivered' | 'In Production'
    lead_time = Column(String(50), default="10–15 days")
    order_date = Column(String(50), nullable=False)
    contract_ref = Column(String(100), default="")
    est_total_cost = Column(String(100), default="")


class StockMovementORM(Base):
    __tablename__ = "stock_movements"

    id = Column(String(50), primary_key=True, index=True) # e.g. "MOV-8841"
    timestamp = Column(String(50), nullable=False)
    part_number = Column(String(50), nullable=False, index=True)
    part_name = Column(String(255), nullable=False)
    movement_type = Column(String(50), default="RESERVATION") # 'RESERVATION' | 'RECEIPT' | 'ISSUE' | 'TRANSFER_DISPATCH' | 'RETURN'
    quantity = Column(Integer, default=1)
    origin = Column(String(100), default="")
    destination = Column(String(100), default="")
    responsible_user = Column(String(100), nullable=False)
    linked_reference = Column(String(100), nullable=True)
    notes = Column(Text, default="")


class MaintenanceWorkOrderORM(Base):
    __tablename__ = "maintenance_work_orders"

    id = Column(String(50), primary_key=True, index=True) # e.g. "WO-1042"
    aircraft = Column(String(100), nullable=False)
    aircraft_model = Column(String(100), nullable=False)
    issue = Column(String(255), nullable=False)
    priority = Column(String(50), default="Medium") # 'High' | 'Medium' | 'Low'
    current_stage = Column(String(100), default="Work Order Created")
    stage_index = Column(Integer, default=1)
    eta = Column(String(50), default="22 Oct 2026")
    expected_completion = Column(String(100), default="22 Oct 2026, 16:00")
    status = Column(String(50), default="In Progress") # 'In Progress' | 'Inspection' | 'Completed' | 'Delayed'
    assigned_team = Column(String(100), default="Bay 2 – Team Alpha")
    assigned_bay = Column(String(100), default="Bay 2 (Quick-Turn)")
    assigned_tech = Column(String(100), default="MWO R. Sharma")
    opened_date = Column(String(50), default="20 Oct 2026, 09:15")
    estimated_duration = Column(String(50), default="~ 48 hours")
    delay_reason = Column(String(255), nullable=True)
    linked_requests = Column(String(255), nullable=True)
    next_action = Column(String(255), default="Confirm part receipt and start repair.")
    image_url = Column(String(255), default="/tejas_hangar.jpg")
    stages_json = Column(Text, default="[]")
    required_parts_json = Column(Text, default="[]")
    related_documents_json = Column(Text, default="[]")
    activity_log_json = Column(Text, default="[]")
    blocking_items_json = Column(Text, default="[]")
    base_id = Column(String(50), default="afs-ambala")


class MaintenanceSignOffORM(Base):
    __tablename__ = "maintenance_sign_offs"

    id = Column(String(50), primary_key=True, index=True) # e.g. "SIG-9912"
    work_order_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False)
    inspector_name = Column(String(100), nullable=False)
    inspector_service_id = Column(String(50), nullable=False)
    result = Column(String(50), default="PASSED") # 'PASSED' | 'FAILED'
    checklist_json = Column(Text, default="[]")
    notes = Column(Text, default="")
    release_authorized = Column(Boolean, default=False)
    ledger_hash = Column(String(64), nullable=True)



