from typing import List, Dict, Any, Optional
from backend.models import DataTrustRecord
from backend.generator import fleet_db

def get_data_trust_records(grade_filter: Optional[str] = None) -> List[DataTrustRecord]:
    """Returns synthetic data trust records, optionally filtered by quality grade."""
    records = fleet_db.trust_records
    if grade_filter and grade_filter in ["A", "B", "C", "D"]:
        return [r for r in records if r.quality_grade == grade_filter]
    return records

def get_verify_first_records() -> List[DataTrustRecord]:
    """Returns records flagged as requiring human verification before automated model acceptance."""
    return [r for r in fleet_db.trust_records if r.requires_human_verification]

def get_data_trust_stats() -> Dict[str, Any]:
    """Summarizes fleet telemetry data trust distribution across grades A-D."""
    records = fleet_db.trust_records
    total = len(records)
    distribution = {
        "A": sum(1 for r in records if r.quality_grade == "A"),
        "B": sum(1 for r in records if r.quality_grade == "B"),
        "C": sum(1 for r in records if r.quality_grade == "C"),
        "D": sum(1 for r in records if r.quality_grade == "D"),
    }
    flagged_count = sum(1 for r in records if r.requires_human_verification)
    
    return {
        "total_evaluated_records": total,
        "grade_distribution": distribution,
        "human_verification_queue_count": flagged_count,
        "trust_health_index": round((distribution["A"] * 1.0 + distribution["B"] * 0.75 + distribution["C"] * 0.4) / max(1, total) * 100.0, 1),
        "guidance": "High-risk decisions must not depend solely on C or D graded telemetry without physical inspection."
    }
