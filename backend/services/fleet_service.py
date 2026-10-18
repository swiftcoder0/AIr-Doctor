import json
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models import AircraftORM, BaseInfoORM, AircraftComponentORM, DataTrustRecordORM
from backend.schemas import (
    BaseInfo,
    FleetSummary,
    FleetTableItem,
    AircraftData,
    AircraftComponent,
    ComponentKeyParams,
    ComponentProjection,
    AircraftModelConfig,
    ComponentRulPrediction,
)
from backend.services.model_loader import predict_component_rul

def get_all_bases(db: Session) -> List[BaseInfo]:
    bases = db.query(BaseInfoORM).all()
    return [
        BaseInfo(
            id=b.id,
            name=b.name,
            code=b.code,
            location=b.location,
            squadron=b.squadron,
            aircraftCount=b.aircraft_count,
            dataFreshness=b.data_freshness,
            syncStatus=b.sync_status,
        )
        for b in bases
    ]

def get_fleet_summary(db: Session, base_id: str = "all") -> FleetSummary:
    query = db.query(AircraftORM).filter(AircraftORM.id.notin_(["rafale", "tejas"]))
    if base_id != "all":
        query = query.filter(AircraftORM.base_id == base_id)
    
    aircraft_list = query.all()
    total = len(aircraft_list)
    if total == 0:
        return FleetSummary(totalAircraft=0, readyToFly=0, inMaintenance=0, attentionRequired=0, averageFleetHealth=0, fleetReadinessScore=0)

    ready = sum(1 for a in aircraft_list if a.status.lower() == "ready")
    maint = sum(1 for a in aircraft_list if a.status.lower() == "maintenance")
    attn = sum(1 for a in aircraft_list if a.status.lower() == "attention")
    avg_health = round(sum(a.overall_health for a in aircraft_list) / total)
    readiness = round((ready / total) * 100)

    return FleetSummary(
        totalAircraft=total,
        readyToFly=ready,
        inMaintenance=maint,
        attentionRequired=attn,
        averageFleetHealth=avg_health,
        fleetReadinessScore=readiness,
    )

def get_fleet_table(db: Session, base_id: str = "all", type_filter: str = "All") -> List[FleetTableItem]:
    query = db.query(AircraftORM).filter(AircraftORM.id.notin_(["rafale", "tejas"]))
    if base_id != "all":
        query = query.filter(AircraftORM.base_id == base_id)
    if type_filter != "All":
        query = query.filter(AircraftORM.type == type_filter)

    items = query.all()
    return [
        FleetTableItem(
            id=a.id,
            code=a.code,
            name=a.name,
            type=a.type,
            status=a.status,
            health=a.overall_health,
            nextFlight=a.next_flight or "Ready",
            baseId=a.base_id,
            issue=a.issue_detected,
        )
        for a in items
    ]

def _orm_to_component(c: AircraftComponentORM, future_hours: int = 0, has_unverified_trust: bool = False) -> AircraftComponent:
    health = c.health
    status = c.status
    risk = c.maintenance_risk
    insight = c.insight

    projections = {}
    if c.future_projections_json:
        try:
            projections_raw = json.loads(c.future_projections_json)
            for h_str, proj in projections_raw.items():
                projections[h_str] = ComponentProjection(
                    health=proj["health"],
                    status=proj["status"],
                    risk=proj["risk"],
                    insight=proj["insight"],
                )
            if future_hours > 0 and str(future_hours) in projections_raw:
                target_p = projections_raw[str(future_hours)]
                health = target_p["health"]
                status = target_p["status"]
                risk = target_p["risk"]
                insight = target_p["insight"]
        except Exception:
            pass

    key_params = None
    if c.key_parameters_json:
        try:
            kp_dict = json.loads(c.key_parameters_json)
            key_params = ComponentKeyParams(**kp_dict)
        except Exception:
            pass

    hotspots = [0.0, 0.0, 0.0]
    if c.hotspot_position_json:
        try:
            hotspots = json.loads(c.hotspot_position_json)
        except Exception:
            pass

    # Drop-In Model Slot inference (or deterministic fallback)
    rul_pred_raw = predict_component_rul(
        component_name=c.name,
        health_score=float(health),
        future_hours=future_hours,
        has_unverified_trust_anomalies=has_unverified_trust,
    )
    rul_pred = ComponentRulPrediction(**rul_pred_raw)

    return AircraftComponent(
        id=c.id,
        name=c.name,
        health=health,
        status=status,
        currentValue=c.current_value,
        normalRange=c.normal_range,
        operatingHours=c.operating_hours,
        lastInspection=c.last_inspection,
        maintenanceRisk=risk,
        insight=insight,
        hotspotPosition=hotspots,
        category=c.category,
        keyParameters=key_params,
        futureProjections=projections if projections else None,
        rulPrediction=rul_pred,
    )

def get_3d_aircraft_list(db: Session, base_id: str = "all") -> List[AircraftData]:
    query = db.query(AircraftORM).filter(AircraftORM.id.in_(["rafale", "tejas"]))
    if base_id != "all":
        query = query.filter(AircraftORM.base_id == base_id)
    records = query.all()

    results = []
    for a in records:
        comps = [_orm_to_component(c, 0) for c in a.components]
        cfg = None
        if a.model_config_json:
            try:
                cfg_dict = json.loads(a.model_config_json)
                cfg = AircraftModelConfig(**cfg_dict)
            except Exception:
                pass

        results.append(AircraftData(
            id=a.id,
            code=a.code,
            name=a.name,
            fullName=a.full_name,
            type=a.type,
            status=a.status,
            statusLabel=a.status_label,
            overallHealth=a.overall_health,
            baseId=a.base_id,
            baseName=a.base_name,
            squadron=a.squadron,
            modelPath=a.model_path,
            modelFormat=a.model_format,
            flightHours=a.flight_hours,
            lastMaintenance=a.last_maintenance,
            nextMaintenance=a.next_maintenance,
            nextMaintenanceHours=a.next_maintenance_hours,
            nextFlight=a.next_flight,
            issueDetected=a.issue_detected,
            components=comps,
            thumbnail=a.thumbnail,
            modelConfig=cfg,
        ))
    return results

def get_aircraft_health_detail(db: Session, aircraft_id: str, future_hours: int = 0) -> Optional[AircraftData]:
    # Support lookup by id (e.g. 'rafale', 'tejas', 'rafale-r01', etc.)
    target_id = aircraft_id.lower()
    if target_id not in ["rafale", "tejas"]:
        if "tejas" in target_id or target_id.startswith("t-"):
            target_id = "tejas"
        else:
            target_id = "rafale"

    a = db.query(AircraftORM).filter(AircraftORM.id == target_id).first()
    if not a:
        return None

    # Check for unverified Grade C / D records affecting this base/aircraft
    unverified_trust_count = db.query(DataTrustRecordORM).filter(
        DataTrustRecordORM.quality_grade.in_(["C", "D"]),
        DataTrustRecordORM.verification_status != "VERIFIED",
        (DataTrustRecordORM.base_id == a.base_id) | (DataTrustRecordORM.base_id == "all")
    ).count()
    has_unverified_trust = (unverified_trust_count > 0)

    comps = [_orm_to_component(c, future_hours, has_unverified_trust) for c in a.components]
    avg_health = round(sum(c.health for c in comps) / max(1, len(comps))) if comps else a.overall_health
    has_maint_req = any(c.status == "Maintenance Required" for c in comps)
    has_monitor = any(c.status == "Monitor" for c in comps)

    status = "MAINTENANCE" if has_maint_req else "ALERT" if has_monitor else a.status
    status_label = "Projected Maintenance" if has_maint_req else "Degraded Performance" if has_monitor else a.status_label

    cfg = None
    if a.model_config_json:
        try:
            cfg = AircraftModelConfig(**json.loads(a.model_config_json))
        except Exception:
            pass

    return AircraftData(
        id=a.id,
        code=a.code,
        name=a.name,
        fullName=a.full_name,
        type=a.type,
        status=status,
        statusLabel=status_label,
        overallHealth=avg_health,
        baseId=a.base_id,
        baseName=a.base_name,
        squadron=a.squadron,
        modelPath=a.model_path,
        modelFormat=a.model_format,
        flightHours=a.flight_hours,
        lastMaintenance=a.last_maintenance,
        nextMaintenance=a.next_maintenance,
        nextMaintenanceHours=a.next_maintenance_hours,
        nextFlight=a.next_flight,
        issueDetected=a.issue_detected,
        components=comps,
        thumbnail=a.thumbnail,
        modelConfig=cfg,
    )
