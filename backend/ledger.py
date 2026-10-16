from datetime import datetime, timezone
from typing import List, Optional
import csv
import io
from backend.models import DecisionLedgerEntry, CreateDecisionRequest
from backend.generator import fleet_db

def get_ledger_entries(actor: Optional[str] = None, scenario_id: Optional[str] = None) -> List[DecisionLedgerEntry]:
    """Returns append-only audit ledger records."""
    entries = fleet_db.decision_ledger
    if actor:
        entries = [e for e in entries if e.actor == actor]
    if scenario_id:
        entries = [e for e in entries if e.scenario_id == scenario_id]
    return sorted(entries, key=lambda x: x.timestamp, reverse=True)

def append_decision_entry(request: CreateDecisionRequest) -> DecisionLedgerEntry:
    """Appends an immutable audit event to the decision ledger."""
    new_id = f"dec-{len(fleet_db.decision_ledger) + 1:04d}"
    entry = DecisionLedgerEntry(
        id=new_id,
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        actor=request.actor or "demo-ops-officer",
        action=request.action,
        previous_state=request.previous_state,
        resulting_state=request.resulting_state,
        notes=request.notes,
        scenario_id=fleet_db.active_scenario
    )
    fleet_db.decision_ledger.append(entry)
    return entry

def export_ledger_to_csv() -> str:
    """Generates a downloadable CSV string of the audit history."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp (UTC)", "Actor", "Action", "Previous State", "Resulting State", "Notes", "Scenario ID"])
    for e in sorted(fleet_db.decision_ledger, key=lambda x: x.timestamp):
        writer.writerow([e.id, e.timestamp, e.actor, e.action, e.previous_state, e.resulting_state, e.notes, e.scenario_id])
    return output.getvalue()
