import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_auth_status_endpoint():
    resp = client.get("/api/auth/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["argon2id_enabled"] is True
    assert data["totp_mfa_enabled"] is True
    assert "Commander" in data["roles"]
    assert "Viewer" in data["roles"]
    assert len(data["demo_totp_code"]) == 6
    assert data["demo_totp_code"].isdigit()

def test_auth_verify_totp_valid_and_invalid():
    # 1. Fetch current active TOTP code
    status_resp = client.get("/api/auth/status")
    current_code = status_resp.json()["demo_totp_code"]

    # 2. Verify with valid current code
    verify_resp = client.post("/api/auth/verify-totp", json={"code": current_code, "role": "Commander"})
    assert verify_resp.status_code == 200
    assert verify_resp.json()["verified"] is True
    assert verify_resp.json()["role"] == "Commander"

    # 3. Verify with master demo code
    demo_override_resp = client.post("/api/auth/verify-totp", json={"code": "777888", "role": "Commander"})
    assert demo_override_resp.status_code == 200
    assert demo_override_resp.json()["verified"] is True

    # 4. Reject invalid code
    bad_resp = client.post("/api/auth/verify-totp", json={"code": "000000", "role": "Commander"})
    assert bad_resp.status_code == 400
    assert "Invalid TOTP" in bad_resp.json()["detail"]

def test_rbac_viewer_role_403_guard():
    headers = {"X-AirDoctor-Role": "Viewer"}

    # Attempt write on trust verify
    resp_trust = client.post("/api/trust/dtr-01/verify", headers=headers)
    assert resp_trust.status_code == 403
    assert "RBAC Policy: Viewer role is strictly read-only" in resp_trust.json()["detail"]

    # Attempt write on ledger decision
    resp_ledger = client.post(
        "/api/ledger/decision",
        json={"actor": "Viewer", "action": "UNAUTHORIZED_WRITE"},
        headers=headers,
    )
    assert resp_ledger.status_code == 403

    # Attempt write on work order creation
    resp_wo = client.post(
        "/api/work-orders",
        json={
            "aircraft": "Tejas AR-02",
            "component": "Hydraulic System",
            "type": "Inspection",
            "status": "Scheduled",
            "scheduledDate": "18 Oct 2024",
            "estHours": 4,
            "priority": "Low",
            "baseId": "base-bravo",
        },
        headers=headers,
    )
    assert resp_wo.status_code == 403

def test_ledger_sha256_hash_chain_and_verify_endpoint():
    # 1. Fetch ledger entries and check hash chaining
    resp = client.get("/api/ledger")
    assert resp.status_code == 200
    entries = resp.json()
    assert len(entries) > 0
    for e in entries:
        assert "prev_hash" in e
        assert "curr_hash" in e
        assert len(e["curr_hash"]) == 64  # SHA-256 hex digest length

    # 2. Call verify-chain endpoint
    verify_resp = client.get("/api/ledger/verify-chain")
    assert verify_resp.status_code == 200
    chain_data = verify_resp.json()
    assert chain_data["verified"] is True
    assert chain_data["algorithm"] == "SHA-256"
    assert chain_data["total_blocks"] >= len(entries)
    assert len(chain_data["head_hash"]) == 64

def test_model_loader_slot_and_rul_prediction():
    # Test Rafale components RUL
    resp_rafale = client.get("/api/aircraft/rafale/health?future_hours=0")
    assert resp_rafale.status_code == 200
    data = resp_rafale.json()
    assert len(data["components"]) > 0

    engine_comp = next((c for c in data["components"] if "engine" in c["name"].lower()), data["components"][0])
    assert "rulPrediction" in engine_comp
    rul = engine_comp["rulPrediction"]
    assert rul is not None
    assert rul["rul_p10"] > 0
    assert rul["rul_p50"] >= rul["rul_p10"]
    assert rul["rul_p90"] >= rul["rul_p50"]
    assert 0 <= rul["risk_range_pct"] <= 100
    assert len(rul["shap_drivers"]) == 3
    assert all("name" in d and "contribution_pct" in d for d in rul["shap_drivers"])
