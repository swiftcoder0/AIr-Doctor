import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import DecisionLedgerORM

client = TestClient(app)

def test_commander_fleet_metrics():
    res = client.get("/api/commander/fleet-metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["totalAircraft"] == 142
    assert data["serviceable"] == 98
    assert data["underMaintenance"] == 32
    assert data["grounded"] == 12
    assert data["serviceablePct"] == 69
    assert len(data["trend7d"]) == 7
    assert len(data["trend30d"]) == 7
    assert len(data["trend90d"]) == 6
    assert len(data["readinessByType"]) >= 5
    assert len(data["keyInsights"]) == 4

def test_commander_airbases():
    res = client.get("/api/commander/airbases")
    assert res.status_code == 200
    bases = res.json()
    assert len(bases) == 26
    
    # Check Ambala AFS
    ambala = next((b for b in bases if b["id"] == "ambala"), None)
    assert ambala is not None
    assert ambala["name"] == "Ambala AFS"
    assert ambala["command"] == "Western"
    assert ambala["totalAircraft"] == 38
    assert len(ambala["blockers"]) > 0

    # Check Sulur AFS
    sulur = next((b for b in bases if b["id"] == "sulur"), None)
    assert sulur is not None
    assert sulur["name"] == "Sulur AFS"
    assert sulur["command"] == "Southern"

def test_commander_approvals_list():
    res = client.get("/api/commander/approvals")
    assert res.status_code == 200
    approvals = res.json()
    assert len(approvals) >= 5
    assert any(a["id"] == "APR-2026-081" for a in approvals)

def test_commander_approval_action_rbac_and_ledger():
    # 1. Non-commander role (Planner) should receive 403 Forbidden
    res_forbidden = client.post(
        "/api/commander/approvals/APR-2026-081/action",
        json={"action": "APPROVE", "notes": "Unauthorized attempt by planner"},
        headers={"X-AirDoctor-Role": "Planner"},
    )
    assert res_forbidden.status_code == 403
    assert "Only the Air Fleet Commander" in res_forbidden.json()["detail"]

    # 2. Viewer role should receive 403 Forbidden
    res_viewer = client.post(
        "/api/commander/approvals/APR-2026-081/action",
        json={"action": "APPROVE", "notes": "Unauthorized attempt by viewer"},
        headers={"X-AirDoctor-Role": "Viewer"},
    )
    assert res_viewer.status_code == 403

    # 3. Commander role should succeed and commit to SHA-256 Decision Ledger
    res_ok = client.post(
        "/api/commander/approvals/APR-2026-081/action",
        json={
            "action": "APPROVE",
            "notes": "Emergency procurement approved. Expedite vendor delivery to Ambala.",
            "officer_name": "Wing Cmdr. Aditya (Fleet Commander)",
            "officer_role": "Commander",
        },
        headers={"X-AirDoctor-Role": "Commander"},
    )
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["success"] is True
    assert data["approval"]["status"] == "APPROVED"
    assert data["ledger_entry_id"].startswith("DL-CMD-")
    assert len(data["ledger_hash"]) == 64  # Valid SHA-256 hex string

    # Verify ledger entry exists in DB
    db = SessionLocal()
    entry = db.query(DecisionLedgerORM).filter(DecisionLedgerORM.id == data["ledger_entry_id"]).first()
    assert entry is not None
    assert "Expedite vendor delivery" in entry.notes
    db.close()
