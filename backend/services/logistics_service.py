import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models import (
    LogisticsInventoryORM,
    MaterialRequestORM,
    SparesTransferORM,
    ProcurementOrderORM,
    StockMovementORM,
    DecisionLedgerORM,
)
from backend.schemas import (
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
)

from backend.database import Base, engine

# Seed Initial Data if Tables are Empty
def seed_logistics_if_empty(db: Session):
    Base.metadata.create_all(bind=engine)
    if db.query(LogisticsInventoryORM).first() is not None:
        return

    # 1. Seed Inventory matching reference image
    inventory = [
        LogisticsInventoryORM(
            id="inv-01",
            part_number="RBE2-0012",
            description="Radar LRU",
            applicable_aircraft="Rafale",
            category="Radar",
            location="AFS Ambala",
            usable_qty=4,
            reserved_qty=1,
            min_stock=2,
            status="In Stock",
            nsn_oem="RBE2-THAL",
            condition="Serviceable",
            last_inspection="08 Sep 2025",
            unit_cost_inr=3500000,
            compatibility_json=json.dumps(["Rafale EH (Standard F3-R)", "Rafale DH"]),
            image_url="/spares/radar_lru.png",
            base_id="afs-ambala",
        ),
        LogisticsInventoryORM(
            id="inv-02",
            part_number="LG-3301",
            description="Landing Gear Actuator",
            applicable_aircraft="Rafale",
            category="Landing Gear",
            location="BRD Sulur",
            usable_qty=2,
            reserved_qty=0,
            min_stock=2,
            status="Low Stock",
            nsn_oem="LG-SAFR-3301",
            condition="Serviceable",
            last_inspection="15 Jul 2025",
            unit_cost_inr=1200000,
            compatibility_json=json.dumps(["Rafale EH (Standard F3-R)"]),
            image_url="/spares/landing_gear_actuator.png",
            base_id="brd-sulur",
        ),
        LogisticsInventoryORM(
            id="inv-03",
            part_number="ENG-774A",
            description="Engine Control Unit",
            applicable_aircraft="Rafale",
            category="Engine",
            location="AFS Hasimara",
            usable_qty=1,
            reserved_qty=1,
            min_stock=2,
            status="Critically Low",
            nsn_oem="774A-IND",
            condition="Serviceable",
            last_inspection="12 Aug 2025",
            unit_cost_inr=4800000,
            compatibility_json=json.dumps(["Rafale EH (Standard F3-R)", "Rafale DH"]),
            image_url="/spares/ecu_774a.png",
            base_id="afs-hasimara",
        ),
        LogisticsInventoryORM(
            id="inv-04",
            part_number="HYD-2209",
            description="Hydraulic Pump",
            applicable_aircraft="Tejas",
            category="Hydraulics",
            location="AFS Pune",
            usable_qty=6,
            reserved_qty=2,
            min_stock=3,
            status="In Stock",
            nsn_oem="HYD-HAL-2209",
            condition="Serviceable",
            last_inspection="02 Oct 2025",
            unit_cost_inr=850000,
            compatibility_json=json.dumps(["Tejas Mk1 (FOC)", "Tejas Mk1A"]),
            image_url="/spares/hydraulic_pump.png",
            base_id="afs-pune",
        ),
        LogisticsInventoryORM(
            id="inv-05",
            part_number="AV-5510",
            description="Avionics Module",
            applicable_aircraft="Su-30MKI",
            category="Avionics",
            location="ASP Chandigarh",
            usable_qty=3,
            reserved_qty=0,
            min_stock=2,
            status="In Stock",
            nsn_oem="AV-HAL-5510",
            condition="Serviceable",
            last_inspection="19 Sep 2025",
            unit_cost_inr=2100000,
            compatibility_json=json.dumps(["Su-30MKI Flanker-H"]),
            image_url="/spares/avionics_module.png",
            base_id="asp-chandigarh",
        ),
        LogisticsInventoryORM(
            id="inv-06",
            part_number="BRK-9087",
            description="Brake Disc",
            applicable_aircraft="Rafale",
            category="Mechanical",
            location="AFS Ambala",
            usable_qty=0,
            reserved_qty=0,
            min_stock=2,
            status="Out of Stock",
            nsn_oem="BRK-MESSIER-9087",
            condition="Unserviceable",
            last_inspection="28 Jun 2025",
            unit_cost_inr=450000,
            compatibility_json=json.dumps(["Rafale EH", "Rafale DH"]),
            image_url="/spares/brake_disc.png",
            base_id="afs-ambala",
        ),
        LogisticsInventoryORM(
            id="inv-07",
            part_number="GEN-1140",
            description="APU Starter Generator",
            applicable_aircraft="Su-30MKI",
            category="Engine",
            location="AFS Pune",
            usable_qty=1,
            reserved_qty=1,
            min_stock=2,
            status="Critically Low",
            nsn_oem="GEN-SATURN-1140",
            condition="Serviceable",
            last_inspection="10 Aug 2025",
            unit_cost_inr=3200000,
            compatibility_json=json.dumps(["Su-30MKI Flanker-H"]),
            image_url="/spares/generator.png",
            base_id="afs-pune",
        ),
        LogisticsInventoryORM(
            id="inv-08",
            part_number="FCS-8812",
            description="Flight Control Actuator",
            applicable_aircraft="Tejas",
            category="Mechanical",
            location="BRD Sulur",
            usable_qty=5,
            reserved_qty=1,
            min_stock=2,
            status="In Stock",
            nsn_oem="FCS-ADE-8812",
            condition="Serviceable",
            last_inspection="22 Sep 2025",
            unit_cost_inr=1900000,
            compatibility_json=json.dumps(["Tejas Mk1", "Tejas Mk1A"]),
            image_url="/spares/fcs_actuator.png",
            base_id="brd-sulur",
        ),
    ]
    db.add_all(inventory)

    # 2. Seed Material Requests matching reference image
    requests = [
        MaterialRequestORM(
            id="REQ-1024",
            aircraft="Rafale",
            part_number="RBE2-0012",
            part_name="Radar LRU",
            quantity=1,
            status="Approved",
            required_by="20 Aug 2025",
            request_date="14 Aug 2025",
            priority="High",
            destination_base="AFS Ambala",
            requester="Wg Cdr. Roy (17 Sqn)",
            linked_work_order_id="WO-1038",
            notes="Scheduled radar transmitter array check",
        ),
        MaterialRequestORM(
            id="REQ-1023",
            aircraft="Tejas",
            part_number="HYD-2209",
            part_name="Hydraulic Pump",
            quantity=2,
            status="Pending",
            required_by="22 Aug 2025",
            request_date="15 Aug 2025",
            priority="Medium",
            destination_base="AFS Pune",
            requester="Sqn Ldr. K. Verma (45 Sqn)",
            linked_work_order_id="WO-1040",
            notes="Replacement seal and auxiliary pump pack",
        ),
        MaterialRequestORM(
            id="REQ-1022",
            aircraft="Su-30MKI",
            part_number="AV-5510",
            part_name="Avionics Module",
            quantity=1,
            status="Approved",
            required_by="19 Aug 2025",
            request_date="13 Aug 2025",
            priority="High",
            destination_base="ASP Chandigarh",
            requester="Flt Lt. S. Rao (220 Sqn)",
            linked_work_order_id="WO-1036",
            notes="Bus transceiver recalibration swap",
        ),
        MaterialRequestORM(
            id="REQ-1021",
            aircraft="Rafale",
            part_number="ENG-774A",
            part_name="Engine Control Unit",
            quantity=1,
            status="Urgent",
            required_by="18 Aug 2025",
            request_date="16 Aug 2025",
            priority="Urgent",
            destination_base="AFS Hasimara",
            requester="Sqn Ldr. A. Sharma (Line Officer)",
            linked_work_order_id="WO-1044",
            notes="Critical ECU replacement for Rafale B-124 readiness",
        ),
        MaterialRequestORM(
            id="REQ-1020",
            aircraft="Rafale",
            part_number="LG-3301",
            part_name="Landing Gear Actuator",
            quantity=1,
            status="In Review",
            required_by="21 Aug 2025",
            request_date="16 Aug 2025",
            priority="Medium",
            destination_base="BRD Sulur",
            requester="Wg Cdr. M. Sen (Maintenance)",
            linked_work_order_id="WO-1041",
            notes="Depot level retraction cylinder maintenance",
        ),
    ]
    db.add_all(requests)

    # 3. Seed Spares Transfers
    transfers = [
        SparesTransferORM(
            id="TRF-2025-081",
            part_number="ENG-774A",
            part_name="Engine Control Unit",
            quantity=1,
            source_location="AFS Ambala",
            destination_location="AFS Hasimara",
            status="In Transit",
            eta="14 hours",
            request_date="18 Aug 2025",
            transport_mode="IAF Air Transit (C-130J)",
            linked_request_id="REQ-1021",
            approved_by="Air Commodore K. R. Sen",
        ),
        SparesTransferORM(
            id="TRF-2025-080",
            part_number="HYD-2209",
            part_name="Hydraulic Pump",
            quantity=2,
            source_location="AFS Pune",
            destination_location="BRD Sulur",
            status="Approved",
            eta="24 hours",
            request_date="17 Aug 2025",
            transport_mode="IAF Air Logistics Courier",
            linked_request_id="REQ-1023",
            approved_by="Group Capt. V. Nair",
        ),
        SparesTransferORM(
            id="TRF-2025-079",
            part_number="RBE2-0012",
            part_name="Radar LRU",
            quantity=1,
            source_location="ASP Chandigarh",
            destination_location="AFS Ambala",
            status="Delivered",
            eta="Completed",
            request_date="14 Aug 2025",
            transport_mode="Secured Ground Transit",
            linked_request_id="REQ-1024",
            approved_by="Air Commodore K. R. Sen",
        ),
    ]
    db.add_all(transfers)

    # 4. Seed Procurement Orders
    procurements = [
        ProcurementOrderORM(
            id="PO-2025-412",
            part_number="ENG-774A",
            part_name="Engine Control Unit",
            supplier="OEM (HAL / Safran)",
            quantity=5,
            status="On Order",
            lead_time="10–15 days",
            order_date="10 Aug 2025",
            contract_ref="MOD/AIR/2025/HAL-914",
            est_total_cost="₹ 2,40,00,000",
        ),
        ProcurementOrderORM(
            id="PO-2025-411",
            part_number="BRK-9087",
            part_name="Brake Disc",
            supplier="HAL Aerospace Division",
            quantity=12,
            status="In Production",
            lead_time="3–4 weeks",
            order_date="05 Aug 2025",
            contract_ref="MOD/AIR/2025/BRK-082",
            est_total_cost="₹ 54,00,000",
        ),
    ]
    db.add_all(procurements)

    # 5. Seed Stock Movements
    movements = [
        StockMovementORM(
            id="MOV-8841",
            timestamp="18 Aug 2025 14:32",
            part_number="ENG-774A",
            part_name="Engine Control Unit",
            movement_type="RESERVATION",
            quantity=1,
            origin="AFS Hasimara",
            destination="AFS Hasimara",
            responsible_user="Flt Lt. Nair (Logistics Depot)",
            linked_reference="REQ-1021",
            notes="Reserved for urgent work order WO-1044 on Rafale B-124",
        ),
        StockMovementORM(
            id="MOV-8840",
            timestamp="18 Aug 2025 11:15",
            part_number="ENG-774A",
            part_name="Engine Control Unit",
            movement_type="TRANSFER_DISPATCH",
            quantity=1,
            origin="AFS Ambala",
            destination="AFS Hasimara",
            responsible_user="Cpl. V. Joshi",
            linked_reference="TRF-2025-081",
            notes="Dispatched via C-130J flight IL-402",
        ),
        StockMovementORM(
            id="MOV-8839",
            timestamp="17 Aug 2025 16:40",
            part_number="HYD-2209",
            part_name="Hydraulic Pump",
            movement_type="RECEIPT",
            quantity=4,
            origin="HAL Nashik Depot",
            destination="AFS Pune",
            responsible_user="Sqn Ldr. K. Verma",
            linked_reference="PO-2025-398",
            notes="Quality inspected and slotted into primary rack",
        ),
    ]
    db.add_all(movements)
    db.commit()


# Service Methods
def get_logistics_kpis(db: Session) -> LogisticsKpiSummary:
    seed_logistics_if_empty(db)
    
    # Matching exact counts from reference screenshot:
    # Total: 4,230, Low Stock: 28, Pending Requests: 12, Transfers in Progress: 7, Approved Orders: 19
    low_stock_count = db.query(LogisticsInventoryORM).filter(
        LogisticsInventoryORM.status.in_(["Low Stock", "Critically Low", "Out of Stock"])
    ).count()
    pending_req_count = db.query(MaterialRequestORM).filter(
        MaterialRequestORM.status.in_(["Pending", "Urgent", "In Review"])
    ).count()
    transfers_active = db.query(SparesTransferORM).filter(
        SparesTransferORM.status.in_(["In Transit", "Requested", "Approved"])
    ).count()

    return LogisticsKpiSummary(
        total_inventory_items=4230,
        low_stock_items=28 if low_stock_count < 28 else low_stock_count,
        pending_requests=12 if pending_req_count < 12 else pending_req_count,
        transfers_in_progress=7 if transfers_active < 7 else transfers_active,
        approved_orders=19,
        is_demo_data=True,
    )


def list_inventory_items(
    db: Session,
    category: Optional[str] = None,
    aircraft: Optional[str] = None,
    location: Optional[str] = None,
    stock_status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[LogisticsInventoryItem]:
    seed_logistics_if_empty(db)
    query = db.query(LogisticsInventoryORM)

    if category and category.lower() != "all" and category.lower() != "all categories":
        query = query.filter(LogisticsInventoryORM.category.ilike(f"%{category}%"))
    if aircraft and aircraft.lower() != "all" and aircraft.lower() != "all aircraft":
        query = query.filter(LogisticsInventoryORM.applicable_aircraft.ilike(f"%{aircraft}%"))
    if location and location.lower() != "all" and location.lower() != "all locations":
        query = query.filter(LogisticsInventoryORM.location.ilike(f"%{location}%"))
    if stock_status and stock_status.lower() != "all" and stock_status.lower() != "stock status":
        query = query.filter(LogisticsInventoryORM.status.ilike(f"%{stock_status}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (LogisticsInventoryORM.part_number.ilike(term))
            | (LogisticsInventoryORM.description.ilike(term))
            | (LogisticsInventoryORM.nsn_oem.ilike(term))
        )

    items = query.all()
    results: List[LogisticsInventoryItem] = []
    for item in items:
        try:
            compat = json.loads(item.compatibility_json) if item.compatibility_json else []
        except:
            compat = []
        results.append(
            LogisticsInventoryItem(
                id=item.id,
                part_number=item.part_number,
                description=item.description,
                applicable_aircraft=item.applicable_aircraft,
                category=item.category,
                location=item.location,
                usable_qty=item.usable_qty,
                reserved_qty=item.reserved_qty,
                min_stock=item.min_stock,
                status=item.status,
                nsn_oem=item.nsn_oem,
                condition=item.condition,
                last_inspection=item.last_inspection,
                unit_cost_inr=item.unit_cost_inr,
                compatibility=compat,
                image_url=item.image_url,
                base_id=item.base_id,
            )
        )
    return results


def get_single_inventory_item(db: Session, item_id: str) -> Optional[LogisticsInventoryItem]:
    seed_logistics_if_empty(db)
    item = db.query(LogisticsInventoryORM).filter(
        (LogisticsInventoryORM.id == item_id) | (LogisticsInventoryORM.part_number == item_id)
    ).first()
    if not item:
        return None
    try:
        compat = json.loads(item.compatibility_json) if item.compatibility_json else []
    except:
        compat = []
    return LogisticsInventoryItem(
        id=item.id,
        part_number=item.part_number,
        description=item.description,
        applicable_aircraft=item.applicable_aircraft,
        category=item.category,
        location=item.location,
        usable_qty=item.usable_qty,
        reserved_qty=item.reserved_qty,
        min_stock=item.min_stock,
        status=item.status,
        nsn_oem=item.nsn_oem,
        condition=item.condition,
        last_inspection=item.last_inspection,
        unit_cost_inr=item.unit_cost_inr,
        compatibility=compat,
        image_url=item.image_url,
        base_id=item.base_id,
    )


def reserve_inventory_part(db: Session, req: ReservePartRequest, actor: str = "Logistics Officer") -> LogisticsInventoryItem:
    seed_logistics_if_empty(db)
    item = db.query(LogisticsInventoryORM).filter(
        (LogisticsInventoryORM.id == req.inventory_id) | (LogisticsInventoryORM.part_number == req.part_number)
    ).first()
    if not item:
        raise ValueError(f"Part {req.part_number} not found in inventory.")
    if item.usable_qty < req.quantity:
        raise ValueError(f"Insufficient usable stock (Available: {item.usable_qty}, Requested: {req.quantity}).")

    prev_state = f"{item.part_number} Usable: {item.usable_qty}, Reserved: {item.reserved_qty}"
    item.usable_qty -= req.quantity
    item.reserved_qty += req.quantity
    if item.usable_qty == 0:
        item.status = "Critically Low" if item.reserved_qty > 0 else "Out of Stock"
    elif item.usable_qty <= item.min_stock:
        item.status = "Low Stock"

    # Log movement
    mov_id = f"MOV-{datetime.now(timezone.utc).strftime('%y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    mov = StockMovementORM(
        id=mov_id,
        timestamp=datetime.now(timezone.utc).strftime("%d %b %Y %H:%M"),
        part_number=item.part_number,
        part_name=item.description,
        movement_type="RESERVATION",
        quantity=req.quantity,
        origin=item.location,
        destination=item.location,
        responsible_user=actor,
        linked_reference=req.linked_request_or_wo or "MANUAL_RESERVATION",
        notes=req.notes or f"Reserved {req.quantity} units of {item.part_number} for tactical readiness.",
    )
    db.add(mov)

    # Log SHA-256 Decision Ledger block
    ledger_entry = DecisionLedgerORM(
        id=f"DEC-SPARE-RES-{mov_id}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=actor,
        action="LOGISTICS_SPARE_RESERVED",
        previous_state=prev_state,
        resulting_state=f"{item.part_number} Usable: {item.usable_qty}, Reserved: {item.reserved_qty} ({item.status})",
        notes=f"Reserved {req.quantity} unit(s) at {item.location} for {req.linked_request_or_wo or 'Maintenance'}.",
        base_id=item.base_id,
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(item)

    try:
        compat = json.loads(item.compatibility_json) if item.compatibility_json else []
    except:
        compat = []
    return LogisticsInventoryItem(
        id=item.id,
        part_number=item.part_number,
        description=item.description,
        applicable_aircraft=item.applicable_aircraft,
        category=item.category,
        location=item.location,
        usable_qty=item.usable_qty,
        reserved_qty=item.reserved_qty,
        min_stock=item.min_stock,
        status=item.status,
        nsn_oem=item.nsn_oem,
        condition=item.condition,
        last_inspection=item.last_inspection,
        unit_cost_inr=item.unit_cost_inr,
        compatibility=compat,
        image_url=item.image_url,
        base_id=item.base_id,
    )


def list_material_requests(db: Session, status: Optional[str] = None) -> List[MaterialRequestItem]:
    seed_logistics_if_empty(db)
    query = db.query(MaterialRequestORM)
    if status and status.lower() != "all":
        query = query.filter(MaterialRequestORM.status.ilike(f"%{status}%"))
    requests = query.order_by(MaterialRequestORM.id.desc()).all()
    return [
        MaterialRequestItem(
            id=r.id,
            aircraft=r.aircraft,
            part_number=r.part_number,
            part_name=r.part_name,
            quantity=r.quantity,
            status=r.status,
            required_by=r.required_by,
            request_date=r.request_date,
            priority=r.priority,
            destination_base=r.destination_base,
            requester=r.requester,
            linked_work_order_id=r.linked_work_order_id,
            notes=r.notes,
        )
        for r in requests
    ]


def create_material_request(db: Session, req: CreateMaterialRequest, actor: str = "Squadron Logistics") -> MaterialRequestItem:
    seed_logistics_if_empty(db)
    count = db.query(MaterialRequestORM).count()
    new_id = f"REQ-{1025 + count}"
    new_req = MaterialRequestORM(
        id=new_id,
        aircraft=req.aircraft,
        part_number=req.part_number,
        part_name=req.part_name,
        quantity=req.quantity,
        status="Pending" if req.priority != "Urgent" else "Urgent",
        required_by=req.required_by,
        request_date=datetime.now(timezone.utc).strftime("%d %b %Y"),
        priority=req.priority,
        destination_base=req.destination_base,
        requester=req.requester or actor,
        linked_work_order_id=req.linked_work_order_id,
        notes=req.notes or "",
    )
    db.add(new_req)

    # Decision ledger
    ledger_entry = DecisionLedgerORM(
        id=f"DEC-MAT-REQ-{new_id}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=actor,
        action="MATERIAL_REQUEST_SUBMITTED",
        previous_state="NEW_REQUISITION",
        resulting_state=f"{new_id} for {req.part_number} ({req.quantity} qty) status: {new_req.status}",
        notes=f"Requisition for {req.aircraft} at {req.destination_base}. Linked WO: {req.linked_work_order_id or 'None'}.",
        base_id=req.destination_base.lower().replace(" ", "-"),
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(new_req)

    return MaterialRequestItem(
        id=new_req.id,
        aircraft=new_req.aircraft,
        part_number=new_req.part_number,
        part_name=new_req.part_name,
        quantity=new_req.quantity,
        status=new_req.status,
        required_by=new_req.required_by,
        request_date=new_req.request_date,
        priority=new_req.priority,
        destination_base=new_req.destination_base,
        requester=new_req.requester,
        linked_work_order_id=new_req.linked_work_order_id,
        notes=new_req.notes,
    )


def list_spares_transfers(db: Session) -> List[SparesTransferItem]:
    seed_logistics_if_empty(db)
    transfers = db.query(SparesTransferORM).order_by(SparesTransferORM.id.desc()).all()
    return [
        SparesTransferItem(
            id=t.id,
            part_number=t.part_number,
            part_name=t.part_name,
            quantity=t.quantity,
            source_location=t.source_location,
            destination_location=t.destination_location,
            status=t.status,
            eta=t.eta,
            request_date=t.request_date,
            transport_mode=t.transport_mode,
            linked_request_id=t.linked_request_id,
            approved_by=t.approved_by,
        )
        for t in transfers
    ]


def create_spares_transfer(db: Session, req: CreateSparesTransferRequest, actor: str = "Logistics Officer") -> SparesTransferItem:
    seed_logistics_if_empty(db)
    count = db.query(SparesTransferORM).count()
    new_id = f"TRF-2025-{82 + count:03d}"
    new_trf = SparesTransferORM(
        id=new_id,
        part_number=req.part_number,
        part_name=req.part_name,
        quantity=req.quantity,
        source_location=req.source_location,
        destination_location=req.destination_location,
        status="Requested",
        eta="18 hours (Est.)",
        request_date=datetime.now(timezone.utc).strftime("%d %b %Y"),
        transport_mode=req.transport_mode or "IAF Air Transit (C-130J)",
        linked_request_id=req.linked_request_id,
        approved_by=actor,
    )
    db.add(new_trf)

    # Log movement
    mov_id = f"MOV-{datetime.now(timezone.utc).strftime('%y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    mov = StockMovementORM(
        id=mov_id,
        timestamp=datetime.now(timezone.utc).strftime("%d %b %Y %H:%M"),
        part_number=req.part_number,
        part_name=req.part_name,
        movement_type="TRANSFER_DISPATCH",
        quantity=req.quantity,
        origin=req.source_location,
        destination=req.destination_location,
        responsible_user=actor,
        linked_reference=new_id,
        notes=f"Transfer request initiated from {req.source_location} to {req.destination_location}.",
    )
    db.add(mov)

    # Ledger entry
    ledger_entry = DecisionLedgerORM(
        id=f"DEC-TRF-{new_id}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=actor,
        action="CROSS_BASE_TRANSFER_REQUESTED",
        previous_state=f"Stock at {req.source_location}",
        resulting_state=f"Transit {new_id} scheduled via {new_trf.transport_mode}",
        notes=f"Cross-base relocation of {req.quantity}x {req.part_number} for {req.destination_location}.",
        base_id=req.source_location.lower().replace(" ", "-"),
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(new_trf)

    return SparesTransferItem(
        id=new_trf.id,
        part_number=new_trf.part_number,
        part_name=new_trf.part_name,
        quantity=new_trf.quantity,
        source_location=new_trf.source_location,
        destination_location=new_trf.destination_location,
        status=new_trf.status,
        eta=new_trf.eta,
        request_date=new_trf.request_date,
        transport_mode=new_trf.transport_mode,
        linked_request_id=new_trf.linked_request_id,
        approved_by=new_trf.approved_by,
    )


def list_procurement_orders(db: Session) -> List[ProcurementOrderItem]:
    seed_logistics_if_empty(db)
    orders = db.query(ProcurementOrderORM).order_by(ProcurementOrderORM.id.desc()).all()
    return [
        ProcurementOrderItem(
            id=p.id,
            part_number=p.part_number,
            part_name=p.part_name,
            supplier=p.supplier,
            quantity=p.quantity,
            status=p.status,
            lead_time=p.lead_time,
            order_date=p.order_date,
            contract_ref=p.contract_ref,
            est_total_cost=p.est_total_cost,
        )
        for p in orders
    ]


def create_procurement_order(db: Session, req: CreateProcurementOrderRequest, actor: str = "Procurement Cell") -> ProcurementOrderItem:
    seed_logistics_if_empty(db)
    count = db.query(ProcurementOrderORM).count()
    new_id = f"PO-2025-{413 + count}"
    new_po = ProcurementOrderORM(
        id=new_id,
        part_number=req.part_number,
        part_name=req.part_name,
        supplier=req.supplier,
        quantity=req.quantity,
        status="On Order",
        lead_time="10–15 days",
        order_date=datetime.utcnow().strftime("%d %b %Y"),
        contract_ref=req.contract_ref or f"MOD/AIR/2025/PO-{new_id}",
        est_total_cost=req.est_total_cost or "₹ 45,00,000",
    )
    db.add(new_po)

    ledger_entry = DecisionLedgerORM(
        id=f"DEC-PO-{new_id}",
        timestamp=datetime.utcnow().isoformat() + "Z",
        actor=actor,
        action="PROCUREMENT_ORDER_CREATED",
        previous_state="SUPPLIER_REQUISITION",
        resulting_state=f"{new_id} placed with {req.supplier} for {req.quantity}x {req.part_number}",
        notes=f"Procurement sanctioned under contract {new_po.contract_ref}.",
        base_id="central-hq",
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(new_po)

    return ProcurementOrderItem(
        id=new_po.id,
        part_number=new_po.part_number,
        part_name=new_po.part_name,
        supplier=new_po.supplier,
        quantity=new_po.quantity,
        status=new_po.status,
        lead_time=new_po.lead_time,
        order_date=new_po.order_date,
        contract_ref=new_po.contract_ref,
        est_total_cost=new_po.est_total_cost,
    )


def list_stock_movements(db: Session) -> List[StockMovementItem]:
    seed_logistics_if_empty(db)
    moves = db.query(StockMovementORM).order_by(StockMovementORM.id.desc()).all()
    return [
        StockMovementItem(
            id=m.id,
            timestamp=m.timestamp,
            part_number=m.part_number,
            part_name=m.part_name,
            movement_type=m.movement_type,
            quantity=m.quantity,
            origin=m.origin,
            destination=m.destination,
            responsible_user=m.responsible_user,
            linked_reference=m.linked_reference,
            notes=m.notes,
        )
        for m in moves
    ]
