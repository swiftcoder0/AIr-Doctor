import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_logistics_kpis_endpoint():
    response = client.get("/api/logistics/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "total_inventory_items" in data
    assert data["total_inventory_items"] == 4230
    assert "low_stock_items" in data
    assert "pending_requests" in data
    assert "transfers_in_progress" in data
    assert data["is_demo_data"] is True


def test_logistics_inventory_list_and_filters():
    # 1. All inventory
    res = client.get("/api/logistics/inventory")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 6
    part_numbers = [i["part_number"] for i in items]
    assert "RBE2-0012" in part_numbers
    assert "ENG-774A" in part_numbers
    assert "HYD-2209" in part_numbers

    # 2. Filter by aircraft
    res_rafale = client.get("/api/logistics/inventory?aircraft=Rafale")
    assert res_rafale.status_code == 200
    rafale_items = res_rafale.json()
    assert all("Rafale" in i["applicable_aircraft"] for i in rafale_items)

    # 3. Filter by search
    res_search = client.get("/api/logistics/inventory?search=Radar")
    assert res_search.status_code == 200
    search_items = res_search.json()
    assert any("RBE2-0012" in i["part_number"] for i in search_items)


def test_logistics_inventory_single_item_detail():
    res = client.get("/api/logistics/inventory/ENG-774A")
    assert res.status_code == 200
    item = res.json()
    assert item["part_number"] == "ENG-774A"
    assert "Engine" in item["category"]
    assert item["location"] == "AFS Hasimara"
    assert "Rafale" in item["applicable_aircraft"]
    assert len(item["compatibility"]) > 0


def test_logistics_reserve_part_and_rbac():
    from backend.database import SessionLocal
    from backend.models import LogisticsInventoryORM
    with SessionLocal() as db:
        item = db.query(LogisticsInventoryORM).filter(LogisticsInventoryORM.id == "inv-04").first()
        if item and item.usable_qty < 2:
            item.usable_qty = 6
            item.reserved_qty = 2
            item.status = "In Stock"
            db.commit()

    # 1. Viewer role should be denied (403 Forbidden)
    res_forbidden = client.post(
        "/api/logistics/reserve",
        json={"inventory_id": "inv-04", "part_number": "HYD-2209", "quantity": 1},
        headers={"X-AirDoctor-Role": "Viewer"},
    )
    assert res_forbidden.status_code == 403

    # 2. Planner / Commander role can reserve
    res_ok = client.post(
        "/api/logistics/reserve",
        json={
            "inventory_id": "inv-04",
            "part_number": "HYD-2209",
            "quantity": 1,
            "linked_request_or_wo": "WO-TEST-RESERVE",
            "notes": "Testing hydraulic pump reservation for Tejas line",
        },
        headers={"X-AirDoctor-Role": "Planner"},
    )
    assert res_ok.status_code == 200
    updated = res_ok.json()
    assert updated["part_number"] == "HYD-2209"
    assert updated["reserved_qty"] >= 1


def test_logistics_material_requests_crud_and_rbac():
    # 1. List requests
    res = client.get("/api/logistics/requests")
    assert res.status_code == 200
    reqs = res.json()
    assert len(reqs) >= 4
    req_ids = [r["id"] for r in reqs]
    assert "REQ-1021" in req_ids

    # 2. Create request as Viewer (denied)
    res_deny = client.post(
        "/api/logistics/requests",
        json={
            "aircraft": "Rafale B-124",
            "part_number": "ENG-774A",
            "part_name": "Engine Control Unit",
            "quantity": 1,
            "required_by": "25 Aug 2025",
            "priority": "Urgent",
            "destination_base": "AFS Hasimara",
        },
        headers={"X-AirDoctor-Role": "Viewer"},
    )
    assert res_deny.status_code == 403

    # 3. Create request as Planner (authorized)
    res_allow = client.post(
        "/api/logistics/requests",
        json={
            "aircraft": "Rafale B-124",
            "part_number": "ENG-774A",
            "part_name": "Engine Control Unit",
            "quantity": 1,
            "required_by": "25 Aug 2025",
            "priority": "Urgent",
            "destination_base": "AFS Hasimara",
            "linked_work_order_id": "WO-1044",
        },
        headers={"X-AirDoctor-Role": "Planner"},
    )
    assert res_allow.status_code == 200
    created = res_allow.json()
    assert created["part_number"] == "ENG-774A"
    assert created["aircraft"] == "Rafale B-124"


def test_logistics_transfers_and_procurement():
    # 1. Transfers
    res_trf = client.get("/api/logistics/transfers")
    assert res_trf.status_code == 200
    transfers = res_trf.json()
    assert len(transfers) >= 2

    # 2. Submit transfer
    res_new_trf = client.post(
        "/api/logistics/transfers",
        json={
            "part_number": "ENG-774A",
            "part_name": "Engine Control Unit",
            "quantity": 1,
            "source_location": "AFS Ambala",
            "destination_location": "AFS Hasimara",
        },
        headers={"X-AirDoctor-Role": "Commander"},
    )
    assert res_new_trf.status_code == 200
    trf_data = res_new_trf.json()
    assert trf_data["source_location"] == "AFS Ambala"
    assert trf_data["destination_location"] == "AFS Hasimara"

    # 3. Procurement orders
    res_po = client.get("/api/logistics/procurement")
    assert res_po.status_code == 200
    po_list = res_po.json()
    assert len(po_list) >= 2

    # 4. Stock movements history
    res_mov = client.get("/api/logistics/movements")
    assert res_mov.status_code == 200
    mov_list = res_mov.json()
    assert len(mov_list) >= 3
