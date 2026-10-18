def test_healthz(client):
    response = client.get("/api/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "SYNTHETIC" in data["data_classification"]
    assert data["total_bases"] >= 2
    assert data["total_aircraft"] >= 24

def test_bases(client):
    response = client.get("/api/bases")
    assert response.status_code == 200
    bases = response.json()
    assert len(bases) >= 3
    base_ids = [b["id"] for b in bases]
    assert "all" in base_ids
    assert "base-alpha" in base_ids
    assert "base-bravo" in base_ids

def test_fleet_summary(client):
    # Fleet summary for Central HQ (all)
    response = client.get("/api/fleet/summary?base_id=all")
    assert response.status_code == 200
    summary = response.json()
    assert summary["totalAircraft"] == 24
    assert summary["readyToFly"] + summary["inMaintenance"] + summary["attentionRequired"] == 24
    assert summary["fleetReadinessScore"] >= 50

    # Fleet summary for Base Alpha
    resp_alpha = client.get("/api/fleet/summary?base_id=base-alpha")
    assert resp_alpha.status_code == 200
    assert resp_alpha.json()["totalAircraft"] == 12

    # Fleet summary for Base Bravo
    resp_bravo = client.get("/api/fleet/summary?base_id=base-bravo")
    assert resp_bravo.status_code == 200
    assert resp_bravo.json()["totalAircraft"] == 12

def test_aircraft_list_and_filters(client):
    # All aircraft
    response = client.get("/api/aircraft?base_id=all&type_filter=All")
    assert response.status_code == 200
    aircraft = response.json()
    assert len(aircraft) == 24

    # Filter by Rafale
    resp_rafale = client.get("/api/aircraft?base_id=all&type_filter=Rafale")
    assert resp_rafale.status_code == 200
    assert all(a["type"] == "Rafale" for a in resp_rafale.json())
    assert len(resp_rafale.json()) == 12

    # Filter by Tejas
    resp_tejas = client.get("/api/aircraft?base_id=all&type_filter=Tejas")
    assert resp_tejas.status_code == 200
    assert all(a["type"] == "Tejas" for a in resp_tejas.json())
    assert len(resp_tejas.json()) == 12

def test_aircraft_health_and_degradation(client):
    # Test Rafale now (future_hours=0)
    resp_0 = client.get("/api/aircraft/rafale/health?future_hours=0")
    assert resp_0.status_code == 200
    data_0 = resp_0.json()
    assert data_0["name"] == "RAFALE"
    assert len(data_0["components"]) == 10
    engine_comp_0 = next(c for c in data_0["components"] if c["name"] == "Engine")
    assert engine_comp_0["health"] == 88

    # Test Rafale +50h degradation
    resp_50 = client.get("/api/aircraft/rafale/health?future_hours=50")
    assert resp_50.status_code == 200
    data_50 = resp_50.json()
    engine_comp_50 = next(c for c in data_50["components"] if c["name"] == "Engine")
    assert engine_comp_50["health"] == 78

def test_inventory_and_resources(client):
    # Spares
    resp_spares = client.get("/api/inventory?base_id=all")
    assert resp_spares.status_code == 200
    spares = resp_spares.json()
    assert len(spares) >= 5
    assert any(s["partNumber"] == "HP-9042" for s in spares)

    # Technicians
    resp_techs = client.get("/api/technicians?base_id=all")
    assert resp_techs.status_code == 200
    assert len(resp_techs.json()) >= 5

    # Bays
    resp_bays = client.get("/api/bays?base_id=all")
    assert resp_bays.status_code == 200
    assert len(resp_bays.json()) >= 4

def test_work_orders_crud(client):
    # 1. Get initial work orders
    resp_list = client.get("/api/work-orders?base_id=all")
    assert resp_list.status_code == 200
    initial_count = len(resp_list.json())

    # 2. Create new work order
    new_wo_payload = {
        "aircraft": "Tejas T-04",
        "component": "Hydraulic Pump Overhaul",
        "type": "Overhaul",
        "status": "Scheduled",
        "scheduledDate": "14 Oct 2024",
        "estHours": 18,
        "priority": "High",
        "baseId": "base-bravo"
    }
    resp_create = client.post("/api/work-orders", json=new_wo_payload)
    assert resp_create.status_code == 200
    created = resp_create.json()
    assert created["id"].startswith("WO-")
    assert created["aircraft"] == "Tejas T-04"

    # 3. Patch work order schedule
    patch_payload = {
        "status": "In Progress",
        "scheduledDate": "15 Oct 2024"
    }
    resp_patch = client.patch(f"/api/work-orders/{created['id']}", json=patch_payload)
    assert resp_patch.status_code == 200
    updated = resp_patch.json()
    assert updated["status"] == "In Progress"
    assert updated["scheduledDate"] == "15 Oct 2024"

    # 4. Verify decision was logged
    resp_ledger = client.get("/api/ledger?base_id=all")
    assert resp_ledger.status_code == 200
    actions = [e["action"] for e in resp_ledger.json()]
    assert "CREATE_WORK_ORDER" in actions
    assert "UPDATE_WORK_ORDER_SCHEDULE" in actions

def test_optimizer_simulation(client):
    # Compare endpoint
    resp_comp = client.get("/api/optimizer/compare")
    assert resp_comp.status_code == 200
    reco = resp_comp.json()
    assert reco["daysRecovered"] == 2.92
    assert "HP-9042" in reco["title"]

    # What-if simulation
    sim_payload = {
        "delta_spares": {"HP-9042": 0},
        "delta_technicians": {"Hydraulics Specialist": 1},
        "delta_bays": 0,
        "cross_base_transfer": True
    }
    resp_sim = client.post("/api/optimizer/simulate", json=sim_payload)
    assert resp_sim.status_code == 200
    sim_res = resp_sim.json()
    assert sim_res["aircraft_days_recovered"] >= 2.5
    assert sim_res["projectedFleetReadinessPct"] >= 85

def test_maintenance_bays_alias_and_optimizer_post(client):
    # Test /api/maintenance-bays endpoint alias
    resp_mb = client.get("/api/maintenance-bays?base_id=all")
    assert resp_mb.status_code == 200
    bays = resp_mb.json()
    assert len(bays) >= 4

    # Test POST /api/optimizer/compare
    resp_post_comp = client.post("/api/optimizer/compare")
    assert resp_post_comp.status_code == 200
    reco = resp_post_comp.json()
    assert reco["daysRecovered"] == 2.92
    assert "tradeOff" in reco

def test_ledger_decision_and_csv_export(client):
    # 1. Post a commander override decision
    payload = {
        "actor": "Air Commander",
        "action": "OVERRIDE_MAINTENANCE_SEQUENCE",
        "previous_state": "Queued in normal FIFO",
        "resulting_state": "Expedited to Flightline Ready",
        "notes": "Operational surge requires early turn of tail T-04",
        "baseId": "base-bravo",
        "isOverride": True,
        "overrideReason": "Urgent combat air patrol sortie deployment"
    }
    resp = client.post("/api/ledger/decision", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["isOverride"] is True
    assert data["overrideReason"] == "Urgent combat air patrol sortie deployment"

    # 2. Test CSV export of ledger
    resp_csv = client.get("/api/ledger/export/csv?base_id=all")
    assert resp_csv.status_code == 200
    assert "text/csv" in resp_csv.headers.get("content-type", "")
    assert "OVERRIDE_MAINTENANCE_SEQUENCE" in resp_csv.text

