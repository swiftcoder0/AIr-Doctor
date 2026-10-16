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
