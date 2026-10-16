from typing import List, Dict, Any
from backend.models import (
    BottleneckItem,
    WhatIfRequest,
    WhatIfResult,
    MaintenanceJob
)
from backend.generator import fleet_db

def compute_bottlenecks() -> List[BottleneckItem]:
    """
    Ranks bottlenecks by estimated aircraft-days recovered.
    """
    bottlenecks: List[BottleneckItem] = []
    
    # Check 1: Swashplate bearing shortage for helicopters
    rotor_bearing = next((sp for sp in fleet_db.spares if sp.id == "sp-rotor-03"), None)
    if rotor_bearing and rotor_bearing.quantity_on_hand == 0:
        bottlenecks.append(BottleneckItem(
            rank=1,
            resource_type="spare_part",
            resource_name=f"{rotor_bearing.name} ({rotor_bearing.part_number})",
            shortage_description=f"Zero units on hand with {rotor_bearing.lead_time_days}-day delivery lead time.",
            affected_aircraft_ids=["gen-h203"],
            estimated_aircraft_days_recovered=8.0,
            mitigation_action="Expedite supplier priority consignment (+1 unit) or cannibalize decommissioned airframe."
        ))

    # Check 2: Hydraulic pump core and seal kits for jets
    pump_spare = next((sp for sp in fleet_db.spares if sp.id == "sp-pump-02"), None)
    if pump_spare and pump_spare.quantity_on_hand <= 1:
        bottlenecks.append(BottleneckItem(
            rank=2,
            resource_type="spare_part",
            resource_name=f"{pump_spare.name} ({pump_spare.part_number})",
            shortage_description=f"Stock at {pump_spare.quantity_on_hand} vs minimum reorder level {pump_spare.min_reorder_level}.",
            affected_aircraft_ids=["gen-j102"],
            estimated_aircraft_days_recovered=3.5,
            mitigation_action="Release emergency depot buffer at Support Depot Gamma."
        ))

    # Check 3: Hydraulics Specialist technicians at Forward Base Alpha
    avail_hyd_techs = [t for t in fleet_db.technicians if t.trade == "Hydraulics Specialist" and t.status == "Available" and t.base == "Forward Base Alpha"]
    if len(avail_hyd_techs) <= 2:
        bottlenecks.append(BottleneckItem(
            rank=3,
            resource_type="technician",
            resource_name="Level-2+ Hydraulics Specialist (Forward Base Alpha)",
            shortage_description=f"Only {len(avail_hyd_techs)} available specialist on station; multi-aircraft concurrent hydraulic maintenance queued.",
            affected_aircraft_ids=["gen-j102", "gen-j105"],
            estimated_aircraft_days_recovered=2.8,
            mitigation_action="Reassign 1 Hydraulics Specialist from Evening shift or transfer from Support Depot Gamma."
        ))

    # Check 4: Maintenance bay occupancy
    occupied_bays = [b for b in fleet_db.bays if b.status != "Available"]
    if len(occupied_bays) >= 3:
        bottlenecks.append(BottleneckItem(
            rank=4,
            resource_type="maintenance_bay",
            resource_name="Heavy Maintenance Bay Slot (Base Alpha)",
            shortage_description=f"{len(occupied_bays)} of {len(fleet_db.bays)} total bays occupied or undergoing floor refit.",
            affected_aircraft_ids=["gen-j105"],
            estimated_aircraft_days_recovered=1.5,
            mitigation_action="Accelerate Bay 3 clearance or authorize outdoor apron inspection shelter."
        ))

    return bottlenecks

def run_what_if_simulation(request: WhatIfRequest) -> WhatIfResult:
    """
    Calculates scenario outcome if spares, technicians, or bays are adjusted.
    """
    baseline_ready = sum(1 for a in fleet_db.aircraft_dict.values() if a.status == "READY")
    total_aircraft = len(fleet_db.aircraft_dict)
    baseline_readiness_pct = round((baseline_ready / total_aircraft) * 100.0, 1)

    projected_ready = baseline_ready
    days_recovered = 0.0

    # 1. Spare adjustments
    for part_id, delta in request.delta_spares.items():
        if delta > 0:
            if part_id == "sp-rotor-03": # Swashplate bearing
                projected_ready += 1 # GEN-H203 unblocked
                days_recovered += 8.0 * delta
            elif part_id in ["sp-pump-02", "sp-hyd-01"]:
                if projected_ready < total_aircraft:
                    projected_ready += 1 # GEN-J102 unblocked
                days_recovered += 3.5 * delta
            elif part_id == "sp-act-04":
                days_recovered += 1.8 * delta

    # 2. Technician adjustments
    for trade, delta in request.delta_technicians.items():
        if delta > 0:
            if "Hydraulics" in trade:
                days_recovered += 2.8 * delta
            elif "Rotorcraft" in trade:
                days_recovered += 3.2 * delta

    # 3. Bay adjustments
    if request.delta_bays > 0:
        days_recovered += 1.5 * request.delta_bays

    # Bound projected ready count
    projected_ready = min(total_aircraft, projected_ready)
    projected_readiness_pct = round((projected_ready / total_aircraft) * 100.0, 1)

    # Filter remaining bottlenecks
    remaining = compute_bottlenecks()
    if any(k == "sp-rotor-03" and v > 0 for k, v in request.delta_spares.items()):
        remaining = [b for b in remaining if "Swashplate" not in b.resource_name]
    if any("Hydraulics" in k and v > 0 for k, v in request.delta_technicians.items()):
        remaining = [b for b in remaining if "Hydraulics Specialist" not in b.resource_name]
    if request.delta_bays > 0:
        remaining = [b for b in remaining if b.resource_type != "maintenance_bay"]

    explanation = (
        f"Simulated intervention yields an estimated recovery of {round(days_recovered, 1)} aircraft-days. "
        f"Ready fleet expands from {baseline_ready} to {projected_ready} airframes ({projected_readiness_pct}% readiness)."
    )

    return WhatIfResult(
        baseline_ready_count=baseline_ready,
        projected_ready_count=projected_ready,
        baseline_avg_readiness_pct=baseline_readiness_pct,
        projected_avg_readiness_pct=projected_readiness_pct,
        aircraft_days_recovered=round(days_recovered, 1),
        remaining_bottlenecks=remaining,
        explanation=explanation
    )
