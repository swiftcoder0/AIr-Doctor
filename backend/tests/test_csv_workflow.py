def test_valid_csv_preview_and_commit(client):
    csv_content = """date,aircraft,component,value,unit
2024-10-01,T-04,Hydraulic Pump,85,bar
2024-10-01,T-04,Engine Temp,620,°C
2024-10-02,T-04,Vibration,0.8,mm/s
2024-10-02,T-04,Oil Pressure,210,psi
"""
    # 1. Preview
    resp_prev = client.post(
        "/api/imports/preview",
        data={
            "category": "aircraft_health",
            "base_id": "base-bravo",
            "csv_text": csv_content
        }
    )
    assert resp_prev.status_code == 200
    prev_data = resp_prev.json()
    assert prev_data["valid"] is True
    assert prev_data["total_rows"] == 4
    assert prev_data["valid_rows_count"] == 4
    assert prev_data["flagged_rows_count"] == 0
    assert prev_data["trust_grade"] == "A"
    assert len(prev_data["preview_rows"]) == 4

    # 2. Commit
    commit_payload = {
        "base_id": "base-bravo",
        "category": "aircraft_health",
        "filename": "telemetry_oct_batch.csv",
        "rows": prev_data["preview_rows"]
    }
    resp_commit = client.post("/api/imports/commit", json=commit_payload)
    assert resp_commit.status_code == 200
    commit_data = resp_commit.json()
    assert commit_data["success"] is True
    assert commit_data["imported_count"] == 4

    # 3. Check import history
    resp_hist = client.get("/api/imports?base_id=base-bravo")
    assert resp_hist.status_code == 200
    filenames = [b["filename"] for b in resp_hist.json()]
    assert "telemetry_oct_batch.csv" in filenames

def test_missing_headers_rejection(client):
    csv_bad = """aircraft,component,reading
T-04,Hydraulic Pump,85
"""
    resp = client.post(
        "/api/imports/preview",
        data={
            "category": "aircraft_health",
            "base_id": "base-bravo",
            "csv_text": csv_bad
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert any("Missing required headers" in e["error"] for e in data["errors"])
    assert data["trust_grade"] == "D"

def test_invalid_units_and_values(client):
    csv_invalid = """date,aircraft,component,value,unit
2024-10-01,T-04,Hydraulic Pump,INVALID_NUM,bar
2024-10-02,T-04,Oil Pressure,210,fake_unit_xyz
2024/13/45,T-04,Engine Temp,620,°C
"""
    resp = client.post(
        "/api/imports/preview",
        data={
            "category": "aircraft_health",
            "base_id": "base-bravo",
            "csv_text": csv_invalid
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is False
    assert len(data["errors"]) >= 3
    error_fields = [e["field"] for e in data["errors"]]
    assert "value" in error_fields
    assert "unit" in error_fields
    assert "date" in error_fields

def test_duplicate_rows_detection(client):
    csv_dup = """date,aircraft,component,value,unit
2024-10-01,T-04,Hydraulic Pump,85,bar
2024-10-01,T-04,Hydraulic Pump,85,bar
"""
    resp = client.post(
        "/api/imports/preview",
        data={
            "category": "aircraft_health",
            "base_id": "base-bravo",
            "csv_text": csv_dup
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert any("Duplicate row detected" in e["error"] for e in data["errors"])
