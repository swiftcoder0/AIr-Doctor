import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Response, Header
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.config import DATA_CLASSIFICATION, MAX_UPLOAD_SIZE_BYTES, ALLOWED_CSV_EXTENSIONS
from backend.models import (
    BaseInfoORM,
    AircraftORM,
    SparePartORM,
    TechnicianORM,
    MaintenanceBayORM,
    WorkOrderORM,
    ImportBatchORM,
    DataTrustRecordORM,
    DecisionLedgerORM,
)
from backend.schemas import (
    BaseInfo,
    FleetSummary,
    FleetTableItem,
    AircraftData,
    SparePart,
    Technician,
    MaintenanceBay,
    WorkOrder,
    WorkOrderCreate,
    WorkOrderUpdate,
    ImportHistoryItem,
    DataTrustRecord,
    DecisionLedgerEntry,
    CreateDecisionRequest,
    WhatIfRequest,
    WhatIfResult,
    OptimizerRecommendation,
    CsvPreviewResponse,
    CsvCommitRequest,
    CsvCommitResponse,
    ChatQueryRequest,
    ChatQueryResponse,
    SecurityStatus,
    VerifyTotpRequest,
    VerifyTotpResponse,
    VerifyChainResponse,
    DepartmentProfile,
    DepartmentLoginRequest,
    DepartmentLoginResponse,
    CommanderAirbase,
    CommandApprovalItem,
    CommanderFleetMetrics,
    ApprovalActionRequest,
    ApprovalActionResponse,
    TechnicalRecordItem,
    TechnicalRecordStats,
    PdfExtractResponse,
    CsvMapAndValidateResponse,
    CommitTechnicalRecordRequest,
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
from backend.services.tech_records_service import (
    list_technical_records,
    get_technical_records_stats,
    extract_pdf_maintenance_record,
    map_and_validate_csv_excel,
    commit_technical_record,
)
from backend.services.logistics_service import (
    get_logistics_kpis,
    list_inventory_items,
    get_single_inventory_item,
    reserve_inventory_part,
    list_material_requests,
    create_material_request,
    list_spares_transfers,
    create_spares_transfer,
    list_procurement_orders,
    create_procurement_order,
    list_stock_movements,
)
from backend.services.fleet_service import (
    get_all_bases,
    get_fleet_summary,
    get_fleet_table,
    get_aircraft_health_detail,
    get_3d_aircraft_list,
)
from backend.services.csv_service import parse_and_validate_csv, commit_csv_import
from backend.services.optimizer_service import calculate_what_if_simulation, get_default_optimizer_recommendation
from backend.services.chat_service import answer_ai_assistant_query
from backend.services.commander_service import (
    get_commander_fleet_metrics,
    get_commander_airbases,
    get_commander_approvals,
    execute_approval_action,
)
from backend.services.security_service import (
    get_security_status,
    verify_totp_code,
    verify_rbac_write_permission,
    verify_commander_permission,
    DEPARTMENT_PROFILES,
    authenticate_department_login,
    verify_department_totp,
)
from backend.services.ledger_service import enrich_ledger_with_hashes, verify_ledger_chain

router = APIRouter(prefix="/api")

# -------------------------------------------------------------
# 0. Authentication, Security & MFA
# -------------------------------------------------------------
@router.get("/auth/status", response_model=SecurityStatus, tags=["Security"])
def get_auth_status():
    """Returns active security configuration (Argon2id, RFC 6238 TOTP, RBAC roles)."""
    return get_security_status()

@router.get("/auth/departments", response_model=List[DepartmentProfile], tags=["Security"])
def get_departments():
    """Returns the 5 official Ministry of Defence SIH airbase department profiles."""
    return DEPARTMENT_PROFILES

@router.post("/auth/login", response_model=DepartmentLoginResponse, tags=["Security"])
def login_department(req: DepartmentLoginRequest):
    """
    Step 1: Authenticates the selected department profile and password.
    Returns totp_required status, department metadata, and live RFC 6238 demo OTP.
    """
    return authenticate_department_login(department_id=req.department_id, password=req.password)

@router.post("/auth/verify-totp", response_model=VerifyTotpResponse, tags=["Security"])
def verify_totp(req: VerifyTotpRequest):
    """Validates a 6-digit TOTP code to complete department sign-in or step-up authorization."""
    totp = req.totp_code or req.code or ""
    if not totp:
        raise HTTPException(status_code=400, detail="TOTP code is required.")

    if req.department_id:
        res = verify_department_totp(department_id=req.department_id, totp_code=totp, role=req.role)
        return VerifyTotpResponse(**res)

    is_valid = verify_totp_code(totp)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid TOTP MFA token. Please verify current time window or click 'Auto-Fill Valid Demo TOTP'.",
        )
    return VerifyTotpResponse(
        verified=True,
        role=req.role or "Commander",
        message="Commander authorization verified via TOTP Multi-Factor Authentication.",
    )


# -------------------------------------------------------------
# 1. Health & Liveness
# -------------------------------------------------------------
@router.get("/healthz", tags=["System"])
def get_healthz(db: Session = Depends(get_db)):
    """Liveness check reporting status and synthetic classification."""
    bases_count = db.query(BaseInfoORM).count()
    aircraft_count = db.query(AircraftORM).count()
    return {
        "status": "ok",
        "service": "AirDoctor Persistent FastAPI Backend",
        "version": "2.0.0",
        "data_classification": DATA_CLASSIFICATION,
        "database": "SQLite (Persistent)",
        "total_bases": bases_count,
        "total_aircraft": aircraft_count,
    }

# -------------------------------------------------------------
# 2. Bases & Fleet Command Center
# -------------------------------------------------------------
@router.get("/bases", response_model=List[BaseInfo], tags=["Fleet"])
def list_bases(db: Session = Depends(get_db)):
    """Returns all operational bases (Central HQ, Base Alpha, Base Bravo)."""
    return get_all_bases(db)

@router.get("/fleet/summary", response_model=FleetSummary, tags=["Fleet"])
def fleet_summary(base_id: Optional[str] = Query("all", alias="base_id"), db: Session = Depends(get_db)):
    """Calculates fleet readiness summary, total, ready, maintenance and attention counts."""
    return get_fleet_summary(db, base_id=base_id)

@router.get("/aircraft", response_model=List[FleetTableItem], tags=["Fleet"])
def list_aircraft(
    base_id: Optional[str] = Query("all"),
    type_filter: Optional[str] = Query("All"),
    db: Session = Depends(get_db),
):
    """Lists fleet table items with base and aircraft type filters."""
    return get_fleet_table(db, base_id=base_id, type_filter=type_filter)

@router.get("/aircraft/3d", response_model=List[AircraftData], tags=["Fleet"])
def list_3d_aircraft(base_id: Optional[str] = Query("all"), db: Session = Depends(get_db)):
    """Returns 3D digital twin aircraft models (Rafale and Tejas) with 10 interactive hotspots."""
    return get_3d_aircraft_list(db, base_id=base_id)

@router.get("/aircraft/{aircraft_id}/health", response_model=AircraftData, tags=["Fleet"])
def get_aircraft_health(
    aircraft_id: str,
    future_hours: Optional[int] = Query(0),
    db: Session = Depends(get_db),
):
    """Returns component health and deterministic degradation projections (Now, +10h, +25h, +50h)."""
    detail = get_aircraft_health_detail(db, aircraft_id=aircraft_id, future_hours=future_hours)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Aircraft '{aircraft_id}' not found.")
    return detail

# -------------------------------------------------------------
# 3. CSV Import & Data Trust
# -------------------------------------------------------------
@router.post("/imports/preview", response_model=CsvPreviewResponse, tags=["Imports"])
async def preview_csv_import(
    file: Optional[UploadFile] = File(None),
    category: str = Form(...),
    base_id: str = Form(...),
    csv_text: Optional[str] = Form(None),
):
    """
    Parses and validates CSV content for required headers, types, units, and duplicates.
    Provides row-level errors and preview before committing.
    """
    content = ""
    if file:
        filename = file.filename or ""
        ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_CSV_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsafe file extension '{ext}'. Only CSV/TXT accepted.")
        
        raw_bytes = await file.read()
        if len(raw_bytes) > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (5 MB).")
        
        try:
            content = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = raw_bytes.decode("latin-1")
    elif csv_text:
        content = csv_text
    else:
        raise HTTPException(status_code=400, detail="No file or CSV text content provided.")

    return parse_and_validate_csv(file_content=content, category=category, base_id=base_id)

@router.post("/imports/commit", response_model=CsvCommitResponse, tags=["Imports"])
def commit_import(request: CsvCommitRequest, db: Session = Depends(get_db)):
    """Commits validated CSV rows into persistent SQLite storage and logs the audit event."""
    return commit_csv_import(
        db=db,
        base_id=request.base_id,
        category=request.category,
        filename=request.filename,
        rows=request.rows,
    )

@router.get("/imports", response_model=List[ImportHistoryItem], tags=["Imports"])
def list_import_history(base_id: Optional[str] = Query("all"), db: Session = Depends(get_db)):
    """Lists persistent import history batches."""
    query = db.query(ImportBatchORM)
    if base_id != "all":
        query = query.filter(ImportBatchORM.base_id == base_id)
    batches = query.order_by(ImportBatchORM.timestamp.desc()).all()
    return [
        ImportHistoryItem(
            id=b.id,
            timestamp=b.timestamp,
            baseId=b.base_id,
            baseName=b.base_name,
            category=b.category,
            filename=b.filename,
            recordsCount=b.records_count,
            validCount=b.valid_count,
            flaggedCount=b.flagged_count,
            status=b.status,
        )
        for b in batches
    ]

# -------------------------------------------------------------
# 2.5 Technical Records & Quality Endpoints
# -------------------------------------------------------------
@router.get("/tech-records", response_model=List[TechnicalRecordItem], tags=["Technical Records"])
def get_tech_records(
    aircraft_id: Optional[str] = Query(None),
    record_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieves technical records, inspections, and maintenance documentation."""
    return list_technical_records(
        db=db,
        aircraft_id=aircraft_id,
        record_type=record_type,
        status=status,
        search=search,
    )

@router.get("/tech-records/stats", response_model=TechnicalRecordStats, tags=["Technical Records"])
def get_tech_records_kpis(db: Session = Depends(get_db)):
    """Returns technical records KPI metrics (Total, Verified, Pending, Incomplete/Conflicting)."""
    return get_technical_records_stats(db)

@router.post("/tech-records/upload-pdf", response_model=PdfExtractResponse, tags=["Technical Records"])
async def upload_pdf_record(
    file: UploadFile = File(...),
    aircraft_id: str = Form("Rafale R-01"),
    record_type: str = Form("Inspection Record"),
):
    """Parses and extracts structured data from an uploaded PDF maintenance report."""
    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowable limit (50 MB).")

    return extract_pdf_maintenance_record(
        pdf_bytes=raw_bytes,
        filename=file.filename or "uploaded_report.pdf",
        aircraft_id=aircraft_id,
        record_type=record_type,
    )

@router.post("/tech-records/upload-csv", response_model=CsvMapAndValidateResponse, tags=["Technical Records"])
async def upload_csv_record(
    file: UploadFile = File(...),
    aircraft_id: str = Form("Rafale R-01"),
    record_type: str = Form("Maintenance History"),
):
    """Maps and validates an uploaded CSV/Excel technical records spreadsheet."""
    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowable limit (50 MB).")

    return map_and_validate_csv_excel(
        file_bytes=raw_bytes,
        filename=file.filename or "uploaded_records.csv",
        aircraft_id=aircraft_id,
        record_type=record_type,
    )

@router.post("/tech-records/commit", response_model=TechnicalRecordItem, tags=["Technical Records"])
def commit_record(
    request: CommitTechnicalRecordRequest,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Commits a reviewed technical record to persistent DB and logs SHA-256 ledger block."""
    verify_rbac_write_permission(x_airdoctor_role)
    return commit_technical_record(db=db, req=request)


@router.get("/trust/records", response_model=List[DataTrustRecord], tags=["Data Trust"])
def list_trust_records(
    base_id: Optional[str] = Query("all"),
    grade: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns persistent Data Trust quality records and audit findings."""
    query = db.query(DataTrustRecordORM)
    if base_id != "all":
        query = query.filter(DataTrustRecordORM.base_id == base_id)
    if grade:
        query = query.filter(DataTrustRecordORM.quality_grade == grade)
    if status:
        query = query.filter(DataTrustRecordORM.verification_status == status)
    
    records = query.all()
    out = []
    for r in records:
        issues = []
        try:
            issues = eval(r.detected_issues_json) if r.detected_issues_json else []
        except Exception:
            pass
        payload = {}
        try:
            payload = eval(r.payload_json) if r.payload_json else {}
        except Exception:
            pass

        out.append(DataTrustRecord(
            id=r.id,
            baseId=r.base_id,
            category=r.category,
            record_id=r.record_id,
            source_system=r.source_system,
            timestamp=r.timestamp,
            quality_grade=r.quality_grade,
            requires_human_verification=r.requires_human_verification,
            verification_status=r.verification_status,
            detected_issues=issues if isinstance(issues, list) else [],
            ground_truth_label=r.ground_truth_label,
            payload=payload if isinstance(payload, dict) else {},
        ))
    return out

@router.post("/trust/{record_id}/verify", tags=["Data Trust"])
def verify_trust_record(
    record_id: str,
    reviewer: str = "Air Commander",
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Marks a Data Trust record as VERIFIED and records an entry in the Decision Ledger."""
    verify_rbac_write_permission(x_airdoctor_role)
    rec = db.query(DataTrustRecordORM).filter(DataTrustRecordORM.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Data Trust Record '{record_id}' not found.")
    
    old_status = rec.verification_status
    rec.verification_status = "VERIFIED"
    rec.requires_human_verification = False
    rec.quality_grade = "B" if rec.quality_grade in ["C", "D"] else rec.quality_grade

    # Log to Decision Ledger
    ledger = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=reviewer,
        action="VERIFY_DATA_TRUST_RECORD",
        previous_state=f"{rec.record_id}: {old_status}",
        resulting_state=f"{rec.record_id}: VERIFIED",
        notes=f"Human reviewer verified telemetry/inventory integrity for {rec.record_id}.",
        base_id=rec.base_id,
        is_override=False,
    )
    db.add(ledger)
    db.commit()
    return {"status": "ok", "record_id": record_id, "verification_status": "VERIFIED"}

@router.post("/trust/{record_id}/reject", tags=["Data Trust"])
def reject_trust_record(
    record_id: str,
    reviewer: str = "Air Commander",
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Marks a Data Trust record as REJECTED and records an entry in the Decision Ledger."""
    verify_rbac_write_permission(x_airdoctor_role)
    rec = db.query(DataTrustRecordORM).filter(DataTrustRecordORM.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Data Trust Record '{record_id}' not found.")
    
    old_status = rec.verification_status
    rec.verification_status = "REJECTED"
    rec.requires_human_verification = False

    ledger = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=reviewer,
        action="REJECT_ANOMALOUS_DATA_RECORD",
        previous_state=f"{rec.record_id}: {old_status}",
        resulting_state=f"{rec.record_id}: REJECTED",
        notes=f"Rejected anomalous telemetry record {rec.record_id} from training and analytics ingestion.",
        base_id=rec.base_id,
        is_override=False,
    )
    db.add(ledger)
    db.commit()
    return {"status": "ok", "record_id": record_id, "verification_status": "REJECTED"}

# -------------------------------------------------------------
# 4. Logistics & Spares Department Endpoints
# -------------------------------------------------------------
@router.get("/logistics/kpis", response_model=LogisticsKpiSummary, tags=["Logistics & Spares"])
def get_logistics_kpi_summary(db: Session = Depends(get_db)):
    """Returns top inventory KPI summary metrics (Total, Low Stock, Pending Requests, Active Transfers)."""
    return get_logistics_kpis(db)


@router.get("/logistics/inventory", response_model=List[LogisticsInventoryItem], tags=["Logistics & Spares"])
def get_logistics_inventory_items(
    category: Optional[str] = Query(None),
    aircraft: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    stock_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieves filtered spare parts inventory across operating airbases, depots, and forward stores."""
    return list_inventory_items(
        db=db,
        category=category,
        aircraft=aircraft,
        location=location,
        stock_status=stock_status,
        search=search,
    )


@router.get("/logistics/inventory/{item_id}", response_model=LogisticsInventoryItem, tags=["Logistics & Spares"])
def get_logistics_inventory_detail(item_id: str, db: Session = Depends(get_db)):
    """Retrieves full specification, compatibility, and stock details for a single part."""
    item = get_single_inventory_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Part {item_id} not found in inventory registry.")
    return item


@router.post("/logistics/reserve", response_model=LogisticsInventoryItem, tags=["Logistics & Spares"])
def reserve_part_stock(
    req: ReservePartRequest,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Reserves usable inventory for an aircraft maintenance task or work order."""
    verify_rbac_write_permission(x_airdoctor_role)
    try:
        return reserve_inventory_part(db=db, req=req, actor=f"Authorized Officer ({x_airdoctor_role or 'Planner'})")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/logistics/requests", response_model=List[MaterialRequestItem], tags=["Logistics & Spares"])
def get_material_requests_list(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieves all squadron and depot material requisitions."""
    return list_material_requests(db=db, status=status)


@router.post("/logistics/requests", response_model=MaterialRequestItem, tags=["Logistics & Spares"])
def submit_material_request(
    req: CreateMaterialRequest,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Submits a new material request for an aircraft part or assembly."""
    verify_rbac_write_permission(x_airdoctor_role)
    return create_material_request(db=db, req=req, actor=f"Requisitioning Officer ({x_airdoctor_role or 'Planner'})")


@router.get("/logistics/transfers", response_model=List[SparesTransferItem], tags=["Logistics & Spares"])
def get_spares_transfers_list(db: Session = Depends(get_db)):
    """Returns active and completed cross-airbase inventory transfers."""
    return list_spares_transfers(db=db)


@router.post("/logistics/transfers", response_model=SparesTransferItem, tags=["Logistics & Spares"])
def submit_spares_transfer(
    req: CreateSparesTransferRequest,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Initiates a cross-base spare parts transfer between operating airbases."""
    verify_rbac_write_permission(x_airdoctor_role)
    return create_spares_transfer(db=db, req=req, actor=f"Dispatch Officer ({x_airdoctor_role or 'Planner'})")


@router.get("/logistics/procurement", response_model=List[ProcurementOrderItem], tags=["Logistics & Spares"])
def get_procurement_orders_list(db: Session = Depends(get_db)):
    """Returns OEM and vendor supply orders."""
    return list_procurement_orders(db=db)


@router.post("/logistics/procurement", response_model=ProcurementOrderItem, tags=["Logistics & Spares"])
def submit_procurement_order(
    req: CreateProcurementOrderRequest,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Submits a procurement requisition to approved aerospace vendors (e.g. HAL / OEM)."""
    verify_rbac_write_permission(x_airdoctor_role)
    return create_procurement_order(db=db, req=req, actor=f"Procurement Officer ({x_airdoctor_role or 'Planner'})")


@router.get("/logistics/movements", response_model=List[StockMovementItem], tags=["Logistics & Spares"])
def get_stock_movements_history(db: Session = Depends(get_db)):
    """Returns full chronological audit log of inventory receipts, reservations, dispatches, and returns."""
    return list_stock_movements(db=db)


# -------------------------------------------------------------
# 4.1 Legacy Inventory, Technicians & Bays
# -------------------------------------------------------------
@router.get("/inventory", response_model=List[SparePart], tags=["Logistics"])
def get_inventory(base_id: Optional[str] = Query("all"), db: Session = Depends(get_db)):
    """Returns spare parts catalog and current warehouse stock across bases."""
    query = db.query(SparePartORM)
    if base_id != "all":
        query = query.filter(SparePartORM.base_id == base_id)
    spares = query.all()
    return [
        SparePart(
            id=s.id,
            partNumber=s.part_number,
            name=s.name,
            applicableSubsystem=s.applicable_subsystem,
            baseId=s.base_id,
            quantityOnHand=s.quantity_on_hand,
            stockAlpha=s.stock_alpha,
            stockBravo=s.stock_bravo,
            minimumRequired=s.minimum_required,
            shortageStatus=s.shortage_status,
            supplierLeadTime=s.supplier_lead_time,
            supplierLeadTimeDays=s.supplier_lead_time_days,
            crossBaseAvailableQty=s.cross_base_available_qty,
            crossBaseTransferHours=s.cross_base_transfer_hours,
            crossBaseSource=s.cross_base_source,
            compatibleAircraft=s.compatible_aircraft,
            condition=s.condition,
        )
        for s in spares
    ]

@router.get("/technicians", response_model=List[Technician], tags=["Logistics"])
def get_technicians(base_id: Optional[str] = Query("all"), db: Session = Depends(get_db)):
    """Returns technician workforce roster, trades, shifts, and current availability."""
    query = db.query(TechnicianORM)
    if base_id != "all":
        query = query.filter(TechnicianORM.base_id == base_id)
    techs = query.all()
    return [
        Technician(
            id=t.id,
            name=t.name,
            badgeNumber=t.badge_number,
            trade=t.trade,
            baseId=t.base_id,
            status=t.status,
            assignedAircraft=t.assigned_aircraft,
            shift=t.shift,
        )
        for t in techs
    ]

@router.get("/maintenance-bays", response_model=List[MaintenanceBay], tags=["Logistics"])
@router.get("/bays", response_model=List[MaintenanceBay], tags=["Logistics"])
def get_maintenance_bays(base_id: Optional[str] = Query("all"), db: Session = Depends(get_db)):
    """Returns maintenance bay occupancy and turn times across bases."""
    query = db.query(MaintenanceBayORM)
    if base_id != "all":
        query = query.filter(MaintenanceBayORM.base_id == base_id)
    bays = query.all()
    return [
        MaintenanceBay(
            id=b.id,
            name=b.name,
            baseId=b.base_id,
            type=b.type,
            status=b.status,
            occupiedByAircraft=b.occupied_by_aircraft,
            activeJob=b.active_job,
            estimatedFreeTime=b.estimated_free_time,
        )
        for b in bays
    ]

# -------------------------------------------------------------
# 5. Work Orders
# -------------------------------------------------------------
def _to_work_order_schema(w: WorkOrderORM) -> WorkOrder:
    return WorkOrder(
        id=w.id,
        aircraft=w.aircraft,
        component=w.component,
        type=w.type,
        status=w.status,
        scheduledDate=w.scheduled_date,
        estHours=w.est_hours,
        priority=w.priority,
        baseId=w.base_id,
        delayReason=w.delay_reason,
        assignedBay=w.assigned_bay,
        assignedTech=w.assigned_tech,
        requiredSpare=w.required_spare,
    )

@router.get("/work-orders", response_model=List[WorkOrder], tags=["Work Orders"])
def list_work_orders(
    base_id: Optional[str] = Query("all"),
    status: Optional[str] = Query("All"),
    search: Optional[str] = Query(""),
    db: Session = Depends(get_db),
):
    """Lists maintenance work orders with base, status and text search filtering."""
    query = db.query(WorkOrderORM)
    if base_id != "all":
        query = query.filter(WorkOrderORM.base_id == base_id)
    if status != "All":
        query = query.filter(WorkOrderORM.status == status)
    if search:
        q = f"%{search.lower()}%"
        query = query.filter(
            WorkOrderORM.id.ilike(q) | WorkOrderORM.aircraft.ilike(q) | WorkOrderORM.component.ilike(q)
        )
    return [_to_work_order_schema(w) for w in query.all()]

@router.post("/work-orders", response_model=WorkOrder, tags=["Work Orders"])
def create_work_order(
    wo_in: WorkOrderCreate,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Creates a new maintenance work order and records the decision in the audit ledger."""
    verify_rbac_write_permission(x_airdoctor_role)
    total_existing = db.query(WorkOrderORM).count()
    new_id = f"WO-{1043 + total_existing}"
    
    wo = WorkOrderORM(
        id=new_id,
        aircraft=wo_in.aircraft,
        component=wo_in.component,
        type=wo_in.type,
        status=wo_in.status,
        scheduled_date=wo_in.scheduledDate,
        est_hours=wo_in.estHours,
        priority=wo_in.priority,
        base_id=wo_in.baseId,
        delay_reason=wo_in.delayReason,
        assigned_bay=wo_in.assignedBay,
        assigned_tech=wo_in.assignedTech,
        required_spare=wo_in.requiredSpare,
    )
    db.add(wo)

    # Log to Decision Ledger
    ledger = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor="Air Commander",
        action="CREATE_WORK_ORDER",
        previous_state=f"{wo_in.aircraft}: Unscheduled",
        resulting_state=f"{new_id}: {wo_in.status} ({wo_in.component})",
        notes=f"Created work order for {wo_in.aircraft} {wo_in.component}. Est hours: {wo_in.estHours}h.",
        base_id=wo_in.baseId,
        is_override=False,
    )
    db.add(ledger)
    db.commit()
    db.refresh(wo)
    return _to_work_order_schema(wo)

@router.patch("/work-orders/{work_order_id}", response_model=WorkOrder, tags=["Work Orders"])
def update_work_order(
    work_order_id: str,
    updates: WorkOrderUpdate,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Updates an existing work order's schedule or status, recording the action in the audit ledger."""
    verify_rbac_write_permission(x_airdoctor_role)
    wo = db.query(WorkOrderORM).filter(WorkOrderORM.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work Order '{work_order_id}' not found.")
    
    old_state = f"{wo.id}: {wo.scheduled_date} ({wo.status})"
    update_data = updates.model_dump(exclude_unset=True)
    
    for key, val in update_data.items():
        if key == "scheduledDate":
            wo.scheduled_date = val
        elif key == "estHours":
            wo.est_hours = val
        elif key == "baseId":
            wo.base_id = val
        elif key == "delayReason":
            wo.delay_reason = val
        elif key == "assignedBay":
            wo.assigned_bay = val
        elif key == "assignedTech":
            wo.assigned_tech = val
        elif key == "requiredSpare":
            wo.required_spare = val
        elif hasattr(wo, key):
            setattr(wo, key, val)

    new_state = f"{wo.id}: {wo.scheduled_date} ({wo.status})"
    ledger = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor="AI Maintenance Planner / Air Commander",
        action="UPDATE_WORK_ORDER_SCHEDULE",
        previous_state=old_state,
        resulting_state=new_state,
        notes=f"Updated work order {work_order_id} parameters: {list(update_data.keys())}.",
        base_id=wo.base_id,
        is_override=False,
    )
    db.add(ledger)
    db.commit()
    db.refresh(wo)
    return _to_work_order_schema(wo)

# -------------------------------------------------------------
# 6. Resource Recovery Optimizer
# -------------------------------------------------------------
@router.get("/optimizer/compare", response_model=OptimizerRecommendation, tags=["Optimizer"])
@router.post("/optimizer/compare", response_model=OptimizerRecommendation, tags=["Optimizer"])
def get_optimizer_compare():
    """Returns baseline vs recommended resource scenario with recovered aircraft-days."""
    return get_default_optimizer_recommendation()

@router.post("/optimizer/simulate", response_model=WhatIfResult, tags=["Optimizer"])
@router.post("/plan/whatif", response_model=WhatIfResult, tags=["Optimizer"])
def simulate_optimizer_scenario(req: WhatIfRequest):
    """Executes deterministic What-If simulation comparing spares, technicians, and bays."""
    return calculate_what_if_simulation(req)

# -------------------------------------------------------------
# 7. Decision Ledger & Audit
# -------------------------------------------------------------
@router.get("/ledger/verify-chain", response_model=VerifyChainResponse, tags=["Ledger"])
def verify_chain(db: Session = Depends(get_db)):
    """Cryptographically validates the unbroken SHA-256 hash chain of the Decision Ledger."""
    return verify_ledger_chain(db)

@router.get("/ledger", response_model=List[DecisionLedgerEntry], tags=["Ledger"])
def get_ledger(base_id: Optional[str] = Query("all"), db: Session = Depends(get_db)):
    """Returns immutable audit trail of maintenance decisions, enriched with cryptographic SHA-256 hash chains."""
    query = db.query(DecisionLedgerORM)
    if base_id != "all":
        query = query.filter((DecisionLedgerORM.base_id == base_id) | (DecisionLedgerORM.base_id == "all"))
    entries = query.all()
    return enrich_ledger_with_hashes(entries)

@router.post("/ledger/decision", response_model=DecisionLedgerEntry, tags=["Ledger"])
def record_decision(
    req: CreateDecisionRequest,
    x_airdoctor_role: Optional[str] = Header(None, alias="X-AirDoctor-Role"),
    db: Session = Depends(get_db),
):
    """Appends an immutable audit event to the Decision Ledger with cryptographic verification."""
    verify_rbac_write_permission(x_airdoctor_role)
    entry = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=req.actor,
        action=req.action,
        previous_state=req.previous_state,
        resulting_state=req.resulting_state,
        notes=req.notes,
        scenario_id=req.scenario_id,
        base_id=req.baseId,
        is_override=req.isOverride or False,
        override_reason=req.overrideReason,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    # Return enriched with current hash
    all_entries = db.query(DecisionLedgerORM).all()
    enriched = enrich_ledger_with_hashes(all_entries)
    for e in enriched:
        if e.id == entry.id:
            return e

    return DecisionLedgerEntry(
        id=entry.id,
        timestamp=entry.timestamp,
        actor=entry.actor,
        action=entry.action,
        previous_state=entry.previous_state,
        resulting_state=entry.resulting_state,
        notes=entry.notes,
        scenario_id=entry.scenario_id,
        baseId=entry.base_id,
        isOverride=entry.is_override,
        overrideReason=entry.override_reason,
    )

@router.get("/ledger/export/csv", tags=["Ledger"])
def export_ledger_csv(base_id: Optional[str] = Query("all"), db: Session = Depends(get_db)):
    """Exports the decision ledger to a downloadable CSV file."""
    query = db.query(DecisionLedgerORM)
    if base_id != "all":
        query = query.filter((DecisionLedgerORM.base_id == base_id) | (DecisionLedgerORM.base_id == "all"))
    entries = query.order_by(DecisionLedgerORM.timestamp.desc()).all()

    import csv
    import io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp (UTC)", "Actor", "Action", "Base", "Previous State", "Resulting State", "Notes", "Is Override", "Override Reason"])
    for e in entries:
        writer.writerow([
            e.id,
            e.timestamp,
            e.actor,
            e.action,
            e.base_id or "all",
            e.previous_state,
            e.resulting_state,
            e.notes,
            "TRUE" if e.is_override else "FALSE",
            e.override_reason or "",
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=airdoctor_decision_ledger.csv"}
    )

# -------------------------------------------------------------
# 8. AI Assistant Chat
# -------------------------------------------------------------
@router.post("/chat/query", response_model=ChatQueryResponse, tags=["AI Assistant"])
def chat_query(req: ChatQueryRequest, db: Session = Depends(get_db)):
    """Queries AI Assistant against real current database records and calculations."""
    return answer_ai_assistant_query(db=db, user_prompt=req.prompt, base_id=req.base_id)


# -------------------------------------------------------------
# 9. Air Fleet Commander Command Center
# -------------------------------------------------------------
@router.get("/commander/fleet-metrics", response_model=CommanderFleetMetrics, tags=["Commander"])
def get_fleet_metrics_commander():
    """Returns top-level fleet readiness, KPI metrics, trends (7D/30D/90D), and key insights."""
    return get_commander_fleet_metrics()


@router.get("/commander/airbases", response_model=List[CommanderAirbase], tags=["Commander"])
def get_airbases_commander():
    """Returns 26 official Indian Air Force airbases across commands with coordinates, aircraft counts, and blockers."""
    return get_commander_airbases()


@router.get("/commander/approvals", response_model=List[CommandApprovalItem], tags=["Commander"])
def get_approvals_commander():
    """Returns pending operational decisions awaiting Commander review and sign-off."""
    return get_commander_approvals()


@router.post("/commander/approvals/{approval_id}/action", response_model=ApprovalActionResponse, tags=["Commander"])
def action_approval_commander(
    approval_id: str,
    req: ApprovalActionRequest,
    db: Session = Depends(get_db),
    _rbac: None = Depends(verify_commander_permission),
):
    """
    Executes Commander approval/rejection decision on an operational item.
    Enforces strict Commander role authorization and records an immutable block into the Decision Ledger.
    """
    try:
        return execute_approval_action(approval_id, req, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

