from typing import Dict, Any
from backend.schemas import WhatIfRequest, WhatIfResult, OptimizerRecommendation

def calculate_what_if_simulation(req: WhatIfRequest) -> WhatIfResult:
    """
    Evaluates resource adjustments (spares, techs, bays, cross-base transfer)
    and computes recovered hours, aircraft-days, and projected fleet readiness.
    """
    baseline_ready_hours = 96
    effective_lead_time_hours = 96
    repair_duration = 12

    if req.cross_base_transfer:
        effective_lead_time_hours = 14

    hp_added = req.delta_spares.get("HP-9042", 0)
    if hp_added > 0:
        effective_lead_time_hours = 0

    extra_techs = req.delta_technicians.get("Hydraulics Specialist", 0)
    if extra_techs > 0:
        repair_duration = max(8, repair_duration - 4)

    projected_ready_hours = effective_lead_time_hours + repair_duration
    hours_recovered = max(0, baseline_ready_hours - projected_ready_hours)
    aircraft_days_recovered = round(hours_recovered / 24.0, 2)

    if projected_ready_hours <= 24:
        projected_readiness = 100
    elif projected_ready_hours <= 48:
        projected_readiness = 85
    else:
        projected_readiness = 50

    if effective_lead_time_hours > 24:
        active_bottleneck = f"Commercial Supplier Lead Time ({effective_lead_time_hours}h)"
    elif effective_lead_time_hours > 0:
        active_bottleneck = f"Inter-Base Transit Time ({effective_lead_time_hours}h)"
    else:
        active_bottleneck = "None (Pacing within nominal flightline timeline)"

    scenario_name = (
        "Cross-Base Transfer Scenario"
        if req.cross_base_transfer
        else "Expedited Local Spare Allocation"
        if hp_added > 0
        else "Dual-Specialist Pairing"
        if extra_techs > 0
        else "Modified Logistics Schedule"
    )

    cost_impact = (
        "₹ 45,000 (Internal courier airlift)"
        if req.cross_base_transfer
        else "₹ 1,80,000 (Commercial expedite fee)"
        if hp_added > 0
        else "₹ 0 (Nominal baseline)"
    )

    risk_assessment = (
        "LOW RISK — Mission critical airframe recovered 3 days ahead of baseline."
        if aircraft_days_recovered >= 2.5
        else "MODERATE RISK — Extended downtime remains above 24h readiness boundary."
    )

    return WhatIfResult(
        scenarioName=scenario_name,
        baselineReadyHours=baseline_ready_hours,
        projectedReadyHours=projected_ready_hours,
        hoursRecovered=hours_recovered,
        aircraft_days_recovered=aircraft_days_recovered,
        projectedFleetReadinessPct=projected_readiness,
        costImpactEst=cost_impact,
        riskAssessment=risk_assessment,
        activeBottleneck=active_bottleneck,
    )

def get_default_optimizer_recommendation() -> OptimizerRecommendation:
    return OptimizerRecommendation(
        id="rec-01",
        title="Execute Cross-Base Transfer of Hydraulic Pump Kit (HP-9042)",
        actionType="CROSS_BASE_TRANSFER",
        recommendedOption="Cross-Base Transfer from Base Alpha (Ambala Depot) to Base Bravo (Sulur AFS)",
        daysRecovered=2.92,
        rationale=(
            "Supplier delivery of HP-9042 requires 6–8 weeks (lead time 49 days). "
            "Base Alpha has 1 unit in stock. Staging an internal air transport delivers the part in 14 hours, "
            "reducing Tejas downtime from 96h to 26h."
        ),
        tradeOff="Reduces Base Alpha hydraulic pump depot buffer from 1 to 0 for 72 hours until vendor stock replenishment arrives.",
        parameters=WhatIfRequest(
            delta_spares={"HP-9042": 0},
            delta_technicians={"Hydraulics Specialist": 0},
            delta_bays=0,
            cross_base_transfer=True,
        ),
    )
