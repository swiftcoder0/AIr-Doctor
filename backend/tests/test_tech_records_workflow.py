import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_tech_records_stats():
    resp = client.get("/api/tech-records/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_records" in data
    assert "verified_records" in data
    assert "pending_verification" in data
    assert "incomplete_conflicting" in data
    assert data["total_records"] >= 12468
    assert data["verified_records"] >= 9842

def test_tech_records_list_and_filters():
    # 1. Fetch all records
    resp = client.get("/api/tech-records")
    assert resp.status_code == 200
    records = resp.json()
    assert len(records) >= 5
    ids = [r["id"] for r in records]
    assert "REC-2026-1048" in ids
    assert "REC-2026-1047" in ids
    assert "REC-2026-1046" in ids

    # 2. Filter by aircraft Rafale
    resp_rafale = client.get("/api/tech-records?aircraft_id=Rafale")
    assert resp_rafale.status_code == 200
    rafale_records = resp_rafale.json()
    assert all("rafale" in r["aircraft_id"].lower() or "rafale" in r["aircraft_model"].lower() for r in rafale_records)

    # 3. Filter by record type
    resp_insp = client.get("/api/tech-records?record_type=Inspection")
    assert resp_insp.status_code == 200
    insp_records = resp_insp.json()
    assert all("inspection" in r["record_type"].lower() for r in insp_records)

def test_tech_records_upload_pdf():
    sample_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    resp = client.post(
        "/api/tech-records/upload-pdf",
        files={"file": ("Inspection_M88.pdf", sample_pdf_content, "application/pdf")},
        data={"aircraft_id": "Rafale R-01", "record_type": "Inspection Record"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "extracted_fields" in data
    assert data["extracted_fields"]["aircraft_id"] is not None
    assert "confidence_score" in data

def test_tech_records_upload_csv():
    sample_csv = "date,aircraft,component,finding,work_performed,technician\n18 Oct 2026,Rafale R-01,Engine (M88),Turbine check nominal,Borescope executed,Cpl. Arjun Singh"
    resp = client.post(
        "/api/tech-records/upload-csv",
        files={"file": ("records.csv", sample_csv.encode("utf-8"), "text/csv")},
        data={"aircraft_id": "Rafale R-01", "record_type": "Maintenance History"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["total_rows"] >= 1
    assert data["valid_rows"] >= 1
    assert "column_mappings" in data

def test_tech_records_commit_and_rbac():
    # 1. Viewer role should be blocked from committing
    resp_blocked = client.post(
        "/api/tech-records/commit",
        headers={"X-AirDoctor-Role": "Viewer"},
        json={
            "aircraft_id": "Rafale R-01",
            "record_type": "Inspection Record",
            "date": "19 Oct 2026",
            "component": "Engine (M88)",
            "source": "PDF Import",
            "status": "Verified",
        },
    )
    assert resp_blocked.status_code == 403

    # 2. Planner role (Technical Records) can commit
    resp_commit = client.post(
        "/api/tech-records/commit",
        headers={"X-AirDoctor-Role": "Planner"},
        json={
            "aircraft_id": "Rafale R-01",
            "record_type": "Inspection Record",
            "date": "19 Oct 2026",
            "component": "Engine (M88)",
            "source": "PDF Import",
            "finding": "Annual hot section borescope inspection verified nominal.",
            "work_performed": "Passed QA audit checklist with zero defects.",
            "parts_replaced": "None",
            "status": "Verified",
            "reviewer": "Flt Lt. Meera (QA Officer)",
        },
    )
    assert resp_commit.status_code == 200
    committed = resp_commit.json()
    assert committed["id"].startswith("REC-2026-")
    assert committed["status"] == "Verified"
    assert committed["aircraft_id"] == "Rafale R-01"
