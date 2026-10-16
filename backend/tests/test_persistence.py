import tempfile
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from backend.database import Base, get_db
from backend.models import WorkOrderORM, DecisionLedgerORM
from backend.services.seed_data import seed_database_if_empty
from backend.main import app

def test_persistence_across_restarts():
    # Create a real temporary SQLite file database on disk
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        file_db_url = f"sqlite:///{db_path}"
        engine_file = create_engine(file_db_url, connect_args={"check_same_thread": False})
        SessionFile = sessionmaker(bind=engine_file)

        # 1. First run: Initialize tables and seed
        Base.metadata.create_all(bind=engine_file)
        session1 = SessionFile()
        seed_database_if_empty(session1)
        initial_wo_count = session1.query(WorkOrderORM).count()
        assert initial_wo_count >= 6

        # 2. Add a user-created work order and a decision
        custom_wo = WorkOrderORM(
            id="WO-CUSTOM-999",
            aircraft="Tejas T-04",
            component="Custom Test Actuator",
            type="Repair",
            status="Scheduled",
            scheduled_date="20 Oct 2024",
            est_hours=6,
            priority="Low",
            base_id="base-bravo",
        )
        session1.add(custom_wo)
        session1.commit()
        session1.close()

        # 3. Simulate Server Restart: Open a brand-new session on the same database file
        session2 = SessionFile()
        # Call seed_database_if_empty again as lifespan would on restart
        seed_database_if_empty(session2)

        # 4. Verify custom work order persisted and was NOT wiped
        found_wo = session2.query(WorkOrderORM).filter(WorkOrderORM.id == "WO-CUSTOM-999").first()
        assert found_wo is not None
        assert found_wo.component == "Custom Test Actuator"
        assert session2.query(WorkOrderORM).count() == initial_wo_count + 1
        session2.close()

    finally:
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                pass

def test_chat_assistant_dynamic_query(client):
    # Query AI assistant about HP-9042
    resp = client.post("/api/chat/query", json={"prompt": "Is HP-9042 available?", "base_id": "all"})
    assert resp.status_code == 200
    data = resp.json()
    assert "HP-9042" in data["text"] or (data.get("cardData") and "HP-9042" in data["cardData"]["title"])
    assert data["cardData"] is not None
    assert len(data["cardData"]["specs"]) >= 3
