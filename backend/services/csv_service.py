import csv
import io
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from backend.models import ImportBatchORM, DataTrustRecordORM, DecisionLedgerORM
from backend.schemas import CsvPreviewResponse, CsvRowError, CsvCommitResponse

VALID_UNITS = {"bar", "psi", "°c", "c", "mm/s", "kg/h", "kn", "rpm", "v", "a", "kpa", "hours", "h"}

CATEGORY_REQUIRED_HEADERS = {
    "aircraft_health": ["date", "aircraft", "component", "value", "unit"],
    "maintenance_records": ["date", "aircraft", "component", "action", "technician"],
    "spares_inventory": ["part_number", "name", "subsystem", "quantity", "min_required"],
    "technicians_bays": ["name", "trade", "badge", "shift", "status"],
}

def parse_and_validate_csv(
    file_content: str,
    category: str,
    base_id: str
) -> CsvPreviewResponse:
    """
    Parses CSV text, validates category headers, types, units, and duplicate records.
    Returns row-level errors, preview rows, and trust grade.
    """
    if category not in CATEGORY_REQUIRED_HEADERS:
        return CsvPreviewResponse(
            valid=False,
            total_rows=0,
            valid_rows_count=0,
            flagged_rows_count=0,
            category=category,
            base_id=base_id,
            preview_rows=[],
            errors=[CsvRowError(row_number=0, field="category", error=f"Unsupported data category '{category}'", rejected_value=category)],
            trust_grade="D"
        )

    required_headers = CATEGORY_REQUIRED_HEADERS[category]
    reader = csv.DictReader(io.StringIO(file_content.strip()))
    
    if not reader.fieldnames:
        return CsvPreviewResponse(
            valid=False,
            total_rows=0,
            valid_rows_count=0,
            flagged_rows_count=0,
            category=category,
            base_id=base_id,
            preview_rows=[],
            errors=[CsvRowError(row_number=0, field="headers", error="CSV file has no headers", rejected_value="")],
            trust_grade="D"
        )

    # Normalize header names (lowercase, stripped)
    file_headers = [h.strip().lower() for h in reader.fieldnames if h]
    missing_headers = [rh for rh in required_headers if rh not in file_headers]
    if missing_headers:
        return CsvPreviewResponse(
            valid=False,
            total_rows=0,
            valid_rows_count=0,
            flagged_rows_count=0,
            category=category,
            base_id=base_id,
            preview_rows=[],
            errors=[CsvRowError(row_number=0, field="headers", error=f"Missing required headers: {', '.join(missing_headers)}", rejected_value=file_headers)],
            trust_grade="D"
        )

    rows = []
    errors: List[CsvRowError] = []
    seen_row_signatures = set()
    row_num = 1

    for raw_row in reader:
        # Standardize keys
        row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
        row_signature = tuple(sorted(row.items()))

        # Check for duplicates
        if row_signature in seen_row_signatures:
            errors.append(CsvRowError(
                row_number=row_num,
                field="row",
                error="Duplicate row detected in batch",
                rejected_value=str(row)
            ))
        else:
            seen_row_signatures.add(row_signature)

        # Field-level validations
        if category == "aircraft_health":
            # 1. Date format check
            date_val = row.get("date", "")
            if not date_val:
                errors.append(CsvRowError(row_number=row_num, field="date", error="Date is required", rejected_value=date_val))
            else:
                try:
                    datetime.strptime(date_val, "%Y-%m-%d")
                except ValueError:
                    errors.append(CsvRowError(row_number=row_num, field="date", error="Invalid date format, expected YYYY-MM-DD", rejected_value=date_val))

            # 2. Value numeric check
            val_str = row.get("value", "")
            try:
                num_val = float(val_str)
                if num_val < 0:
                    errors.append(CsvRowError(row_number=row_num, field="value", error="Negative sensor value detected", rejected_value=val_str))
            except ValueError:
                errors.append(CsvRowError(row_number=row_num, field="value", error="Value must be a valid number", rejected_value=val_str))

            # 3. Unit validation
            unit_val = row.get("unit", "").lower()
            if unit_val not in VALID_UNITS:
                errors.append(CsvRowError(row_number=row_num, field="unit", error=f"Unrecognized engineering unit '{unit_val}'", rejected_value=unit_val))

        elif category == "spares_inventory":
            try:
                qty = int(row.get("quantity", "0"))
                if qty < 0:
                    errors.append(CsvRowError(row_number=row_num, field="quantity", error="Quantity cannot be negative", rejected_value=row.get("quantity")))
            except ValueError:
                errors.append(CsvRowError(row_number=row_num, field="quantity", error="Quantity must be integer", rejected_value=row.get("quantity")))

        rows.append(row)
        row_num += 1

    total_rows = len(rows)
    flagged_rows_count = len({err.row_number for err in errors if err.row_number > 0})
    valid_rows_count = max(0, total_rows - flagged_rows_count)

    # Determine Trust Grade
    if total_rows == 0:
        grade = "D"
    elif flagged_rows_count == 0:
        grade = "A"
    elif (flagged_rows_count / total_rows) <= 0.10:
        grade = "B"
    elif (flagged_rows_count / total_rows) <= 0.30:
        grade = "C"
    else:
        grade = "D"

    return CsvPreviewResponse(
        valid=flagged_rows_count == 0,
        total_rows=total_rows,
        valid_rows_count=valid_rows_count,
        flagged_rows_count=flagged_rows_count,
        category=category,
        base_id=base_id,
        preview_rows=rows[:5],  # top 5 preview rows
        errors=errors,
        trust_grade=grade,
    )

def commit_csv_import(
    db: Session,
    base_id: str,
    category: str,
    filename: str,
    rows: List[Dict[str, Any]]
) -> CsvCommitResponse:
    """
    Commits validated rows into the SQLite database, stores the import batch,
    creates DataTrust records, and logs the decision into the audit ledger.
    """
    batch_id = f"imp-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    base_name = "Base Alpha (Ambala AFS)" if base_id == "base-alpha" else "Base Bravo (Sulur AFS)" if base_id == "base-bravo" else "Central HQ"

    flagged_count = 0
    trust_records = []

    for idx, row in enumerate(rows):
        rec_id = f"dtr-{uuid.uuid4().hex[:6]}"
        is_flagged = False
        issues = []

        # Simple verification checks
        if category == "aircraft_health":
            try:
                val = float(row.get("value", "0"))
                if val < 50 and "hydraul" in row.get("component", "").lower():
                    is_flagged = True
                    issues.append(f"Low hydraulic reading: {val} bar")
            except Exception:
                is_flagged = True
                issues.append("Non-numeric sensor reading")

        if is_flagged:
            flagged_count += 1

        dtr = DataTrustRecordORM(
            id=rec_id,
            base_id=base_id,
            category=category,
            record_id=f"REC-{category.upper()[:3]}-{idx+1:04d}",
            source_system=f"CSV Upload: {filename}",
            timestamp=row.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
            quality_grade="D" if is_flagged else "A",
            requires_human_verification=is_flagged,
            verification_status="NEEDS_REVIEW" if is_flagged else "VERIFIED",
            detected_issues_json=json.dumps(issues),
            payload_json=json.dumps(row),
        )
        trust_records.append(dtr)

    db.add_all(trust_records)

    # Compute overall batch trust grade
    if len(rows) == 0:
        grade = "D"
    elif flagged_count == 0:
        grade = "A"
    elif (flagged_count / len(rows)) <= 0.10:
        grade = "B"
    elif (flagged_count / len(rows)) <= 0.30:
        grade = "C"
    else:
        grade = "D"

    # Save Import Batch record
    batch = ImportBatchORM(
        id=batch_id,
        timestamp=now_str,
        base_id=base_id,
        base_name=base_name,
        category=category,
        filename=filename,
        records_count=len(rows),
        valid_count=len(rows) - flagged_count,
        flagged_count=flagged_count,
        status="ACCEPTED" if grade in ["A", "B"] else "PENDING_REVIEW",
    )
    db.add(batch)

    # Append to Decision Ledger
    ledger_entry = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor="Ground Telemetry Ingest Officer",
        action="COMMIT_CSV_IMPORT_BATCH",
        previous_state="OFFLINE_CSV_BATCH_SUBMITTED",
        resulting_state=f"INGESTED_{len(rows)}_RECORDS ({batch_id})",
        notes=f"Committed {len(rows)} records for {category} at {base_name}. Quality Grade: {grade}.",
        scenario_id=None,
        base_id=base_id,
        is_override=False,
    )
    db.add(ledger_entry)

    db.commit()

    return CsvCommitResponse(
        success=True,
        batch_id=batch_id,
        imported_count=len(rows),
        flagged_count=flagged_count,
        trust_grade=grade,
        message=f"Successfully imported {len(rows)} records from {filename} with Data Trust Grade {grade}.",
    )
