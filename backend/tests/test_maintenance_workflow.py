import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, Base, engine
from backend.models import DecisionLedgerORM, MaintenanceWorkOrderORM
from backend.services.maintenance_service import ensure_maintenance_seed_data

Base.metadata.create_all(bind=engine)
with SessionLocal() as _db:
    ensure_maintenance_seed_data(_db)

client = TestClient(app)


def test_maintenance_kpis_endpoint():
    resp = client.get("/api/maintenance/kpis")
    assert resp.status_code == 200
    data = resp.json()
    assert "assigned_work_orders" in data
    assert data["assigned_work_orders"] >= 5
    assert data["in_progress"] >= 1
    assert data["awaiting_parts"] >= 1
    assert data["ready_for_inspection"] >= 1
    assert data["overdue"] >= 1
    assert data["is_demo_data"] is True


def test_maintenance_work_orders_list_and_filters():
    # 1. Fetch all work orders
    resp = client.get("/api/maintenance/work-orders")
    assert resp.status_code == 200
    wos = resp.json()
    assert len(wos) >= 5
    ids = [w["id"] for w in wos]
    assert "WO-1042" in ids
    assert "WO-1038" in ids

    # 2. Filter by status In Progress
    resp_inprog = client.get("/api/maintenance/work-orders?status=In%20Progress")
    assert resp_inprog.status_code == 200
    for w in resp_inprog.json():
        assert w["status"] == "In Progress"

    # 3. Search filter
    resp_search = client.get("/api/maintenance/work-orders?search=Tejas")
    assert resp_search.status_code == 200
    for w in resp_search.json():
        assert "tejas" in (w["aircraft"] + " " + w["aircraft_model"]).lower()


def test_maintenance_work_order_detail_wo1042():
    resp = client.get("/api/maintenance/work-orders/WO-1042")
    assert resp.status_code == 200
    wo = resp.json()
    assert wo["id"] == "WO-1042"
    assert "Tejas" in wo["aircraft"]
    assert wo["priority"] == "High"
    assert wo["current_stage"] == "Awaiting Parts"
    assert wo["stage_index"] == 4
    assert len(wo["stages"]) == 7
    assert len(wo["required_parts"]) >= 3
    assert len(wo["related_documents"]) >= 3
    assert len(wo["activity_log"]) >= 3
    assert len(wo["blocking_items"]) >= 1


def test_maintenance_update_stage_rbac_and_ledger():
    # 1. Viewer role should be denied write access (403 Forbidden)
    resp_denied = client.post(
        "/api/maintenance/work-orders/WO-1038/update-stage",
        headers={"X-AirDoctor-Role": "Viewer"},
        json={
            "work_order_id": "WO-1038",
            "target_stage_index": 6,
            "stage_name": "Inspection & Sign-off",
            "notes": "Testing stage progression guard",
        },
    )
    assert resp_denied.status_code == 403

    # 2. Authorized role (Engineer / Commander) succeeds
    resp_ok = client.post(
        "/api/maintenance/work-orders/WO-1038/update-stage",
        headers={"X-AirDoctor-Role": "Engineer"},
        json={
            "work_order_id": "WO-1038",
            "target_stage_index": 6,
            "stage_name": "Inspection & Sign-off",
            "notes": "Sensor swap completed; submitted for quality inspection.",
            "actual_time": "20 Oct 14:30",
        },
    )
    assert resp_ok.status_code == 200
    data = resp_ok.json()
    assert data["stage_index"] == 6
    assert data["current_stage"] == "Inspection & Sign-off"
    assert data["status"] == "Inspection"

    # 3. Verify Decision Ledger recorded an audit block
    db = SessionLocal()
    try:
        last_dec = (
            db.query(DecisionLedgerORM)
            .filter(DecisionLedgerORM.action == "UPDATE_WORKFLOW_STAGE")
            .order_by(DecisionLedgerORM.timestamp.desc())
            .first()
        )
        assert last_dec is not None
        assert "WO-1038" in last_dec.resulting_state
    finally:
        db.close()


def test_maintenance_confirm_part_receipt_and_resolve_blocker():
    # Confirm receipt of Hydraulic Pump for WO-1042
    resp = client.post(
        "/api/maintenance/work-orders/WO-1042/confirm-part-receipt",
        headers={"X-AirDoctor-Role": "Engineer"},
        json={
            "work_order_id": "WO-1042",
            "part_number": "HYD-5562",
            "quantity_received": 1,
            "received_by": "MWO R. Sharma",
            "storage_location": "Bay 2 Tool Rack A",
            "notes": "Received via C-130J flight IL-402, seals intact.",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    part = next(p for p in data["required_parts"] if p["part_number"] == "HYD-5562")
    assert part["received_qty"] >= 1
    assert part["status"] == "Received"


def test_maintenance_inspection_sign_off():
    resp = client.post(
        "/api/maintenance/work-orders/WO-1031/sign-off",
        headers={"X-AirDoctor-Role": "Engineer"},
        json={
            "work_order_id": "WO-1031",
            "inspector_name": "Flt Lt. Nair",
            "inspector_service_id": "IAF-QA-881",
            "result": "PASSED",
            "checklist_items": [
                {"item": "Bus voltage stable at 28V", "passed": True},
                {"item": "LRU self-test PASS", "passed": True},
            ],
            "sign_off_notes": "All avionics loop tests passed within specification.",
            "authorize_release": True,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Completed"
    assert data["current_stage"] == "Return to Service"
    assert data["stage_index"] == 7


def test_maintenance_technicians_and_bays():
    resp_techs = client.get("/api/maintenance/technicians")
    assert resp_techs.status_code == 200
    techs = resp_techs.json()
    assert len(techs) >= 4
    trades = [t["trade"] for t in techs]
    assert any("Hydraulics" in trade for trade in trades)

    resp_bays = client.get("/api/maintenance/bays")
    assert resp_bays.status_code == 200
    bays = resp_bays.json()
    assert len(bays) >= 5
    assert any(b["status"] == "Occupied" for b in bays)
