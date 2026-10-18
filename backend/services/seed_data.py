import json
from sqlalchemy.orm import Session
from backend.models import (
    BaseInfoORM,
    AircraftORM,
    AircraftComponentORM,
    SparePartORM,
    TechnicianORM,
    MaintenanceBayORM,
    WorkOrderORM,
    ImportBatchORM,
    DataTrustRecordORM,
    DecisionLedgerORM,
)

def seed_database_if_empty(db: Session):
    """
    Seeds initial synthetic records for Base Alpha and Base Bravo if the database is uninitialized.
    If records already exist, it preserves them so user edits/imports persist across restarts.
    """
    # Check if already seeded
    if db.query(BaseInfoORM).first() is not None:
        return

    # 1. Seed Bases
    bases = [
        BaseInfoORM(
            id="all",
            name="Central HQ",
            code="HQ-CENTRAL",
            location="Integrated Air Operations Command",
            squadron="Combined Eastern & Western Wings",
            aircraft_count=24,
            data_freshness="Live (4s latency)",
            sync_status="SYNCED",
        ),
        BaseInfoORM(
            id="base-alpha",
            name="Base Alpha (Ambala AFS)",
            code="AFS-AMB",
            location="Ambala, Haryana",
            squadron="No. 17 Squadron (Golden Arrows)",
            aircraft_count=12,
            data_freshness="Updated 2 min ago",
            sync_status="SYNCED",
        ),
        BaseInfoORM(
            id="base-bravo",
            name="Base Bravo (Sulur AFS)",
            code="AFS-SLR",
            location="Sulur, Coimbatore",
            squadron="No. 45 Squadron (Flying Daggers)",
            aircraft_count=12,
            data_freshness="Updated 6 min ago",
            sync_status="SYNCED",
        ),
    ]
    db.add_all(bases)
    db.flush()

    # 2. Seed 24-Aircraft Fleet Table Items as Aircraft records
    fleet_records = [
        ("rafale-r01", "Rafale R-01", "Rafale", "Rafale", "Ready", "Ready to Fly", 92, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "12 Oct", None, "1,248 h", "42 h ago", "126 h", 126),
        ("rafale-r02", "Rafale R-02", "Rafale", "Rafale", "Maintenance", "In Scheduled Maintenance", 64, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "-", "Scheduled Engine Borescope", "1,890 h", "12 h ago", "0 h", 0),
        ("tejas-t03", "Tejas T-03", "Tejas", "Tejas", "Ready", "Ready to Fly", 88, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "11 Oct", None, "840 h", "24 h ago", "160 h", 160),
        ("tejas-t04", "Tejas T-04", "Tejas", "Tejas", "Attention", "Attention Required (Pressure Drop)", 46, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "-", "Hydraulic Pressure Drop (82 bar)", "980 h", "8 h ago", "0 h", 0),
        ("rafale-r03", "Rafale R-03", "Rafale", "Rafale", "Ready", "Ready to Fly", 94, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "14 Oct", None, "1,120 h", "50 h ago", "150 h", 150),
        ("rafale-r04", "Rafale R-04", "Rafale", "Rafale", "Ready", "Ready to Fly", 91, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "13 Oct", None, "1,310 h", "30 h ago", "170 h", 170),
        ("rafale-r05", "Rafale R-05", "Rafale", "Rafale", "Ready", "Ready to Fly", 89, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "15 Oct", None, "950 h", "10 h ago", "190 h", 190),
        ("rafale-r06", "Rafale R-06", "Rafale", "Rafale", "Maintenance", "In Scheduled Maintenance", 58, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "-", "Avionics Bus Recalibration", "1,640 h", "18 h ago", "0 h", 0),
        ("rafale-r07", "Rafale R-07", "Rafale", "Rafale", "Ready", "Ready to Fly", 96, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "12 Oct", None, "780 h", "60 h ago", "220 h", 220),
        ("rafale-r08", "Rafale R-08", "Rafale", "Rafale", "Ready", "Ready to Fly", 90, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "16 Oct", None, "1,410 h", "40 h ago", "160 h", 160),
        ("rafale-r09", "Rafale R-09", "Rafale", "Rafale", "Ready", "Ready to Fly", 93, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "17 Oct", None, "1,190 h", "35 h ago", "165 h", 165),
        ("rafale-r10", "Rafale R-10", "Rafale", "Rafale", "Ready", "Ready to Fly", 87, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "18 Oct", None, "1,520 h", "25 h ago", "175 h", 175),
        ("rafale-r11", "Rafale R-11", "Rafale", "Rafale", "Ready", "Ready to Fly", 95, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "13 Oct", None, "890 h", "45 h ago", "205 h", 205),
        ("rafale-r12", "Rafale R-12", "Rafale", "Rafale", "Ready", "Ready to Fly", 92, "base-alpha", "Base Alpha (Ambala AFS)", "No. 17 Squadron", "19 Oct", None, "1,050 h", "55 h ago", "145 h", 145),
        ("tejas-t01", "Tejas T-01", "Tejas", "Tejas", "Ready", "Ready to Fly", 86, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "12 Oct", None, "720 h", "32 h ago", "168 h", 168),
        ("tejas-t02", "Tejas T-02", "Tejas", "Tejas", "Ready", "Ready to Fly", 89, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "13 Oct", None, "810 h", "28 h ago", "172 h", 172),
        ("tejas-t05", "Tejas T-05", "Tejas", "Tejas", "Ready", "Ready to Fly", 91, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "14 Oct", None, "640 h", "14 h ago", "186 h", 186),
        ("tejas-t06", "Tejas T-06", "Tejas", "Tejas", "Maintenance", "In Scheduled Maintenance", 62, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "-", "Landing Gear Shock Check", "1,150 h", "20 h ago", "0 h", 0),
        ("tejas-t07", "Tejas T-07", "Tejas", "Tejas", "Attention", "Attention Required", 50, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "-", "Radar TR Module Degradation", "1,220 h", "16 h ago", "0 h", 0),
        ("tejas-t08", "Tejas T-08", "Tejas", "Tejas", "Ready", "Ready to Fly", 85, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "15 Oct", None, "910 h", "22 h ago", "178 h", 178),
        ("tejas-t09", "Tejas T-09", "Tejas", "Tejas", "Ready", "Ready to Fly", 88, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "16 Oct", None, "790 h", "38 h ago", "162 h", 162),
        ("tejas-t10", "Tejas T-10", "Tejas", "Tejas", "Ready", "Ready to Fly", 92, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "17 Oct", None, "680 h", "42 h ago", "158 h", 158),
        ("tejas-t11", "Tejas T-11", "Tejas", "Tejas", "Maintenance", "In Scheduled Maintenance", 55, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "-", "Turbofan Fuel Nozzle Replacement", "1,380 h", "15 h ago", "0 h", 0),
        ("tejas-t12", "Tejas T-12", "Tejas", "Tejas", "Ready", "Ready to Fly", 84, "base-bravo", "Base Bravo (Sulur AFS)", "No. 45 Squadron", "18 Oct", None, "860 h", "36 h ago", "164 h", 164),
    ]

    for item in fleet_records:
        aid, code, name, atype, status, status_label, health, base_id, base_name, sq, next_flight, issue, fh, lm, nm, nmh = item
        m_format = "glb" if atype == "Rafale" else "obj"
        m_path = f"/models/{'rafale.glb' if atype == 'Rafale' else 'tejas.obj'}"
        
        ac_orm = AircraftORM(
            id=aid,
            code=code,
            name=name,
            full_name=f"{name} ({code}) – Combat Aircraft",
            type=atype,
            status=status,
            status_label=status_label,
            overall_health=health,
            base_id=base_id,
            base_name=base_name,
            squadron=sq,
            model_path=m_path,
            model_format=m_format,
            flight_hours=fh,
            last_maintenance=lm,
            next_maintenance=nm,
            next_maintenance_hours=nmh,
            next_flight=next_flight or "Ready",
            issue_detected=issue,
            thumbnail=m_path,
            model_config_json=json.dumps({
                "initialCameraPosition": [7.5, 3.8, 8.2] if atype == "Rafale" else [6.8, 3.2, 7.5],
                "initialTarget": [0, 0.4, 0],
                "scaleMultiplier": 1.0,
                "rotationOffset": [0, -1.047, 0],
                "groundOffset": -1.2,
            })
        )
        db.add(ac_orm)

    # 3. Add Full 3D Digital Twin Anchors ('rafale' and 'tejas')
    rafale_orm = AircraftORM(
        id="rafale",
        code="Rafale R-01",
        name="RAFALE",
        full_name="Dassault Rafale – Multirole Fighter",
        type="Rafale",
        status="Ready",
        status_label="Ready to Fly",
        overall_health=92,
        base_id="base-alpha",
        base_name="Base Alpha (Ambala AFS)",
        squadron="No. 17 Squadron (Golden Arrows)",
        model_path="/models/rafale.glb",
        model_format="glb",
        flight_hours="1,248 h",
        last_maintenance="42 h ago",
        next_maintenance="126 h",
        next_maintenance_hours=126,
        next_flight="12 Oct",
        thumbnail="/models/rafale.glb",
        model_config_json=json.dumps({
            "initialCameraPosition": [7.5, 3.8, 8.2],
            "initialTarget": [0, 0.4, 0],
            "scaleMultiplier": 1.0,
            "rotationOffset": [0, -1.047, 0],
            "groundOffset": -1.2,
        })
    )
    db.add(rafale_orm)

    tejas_orm = AircraftORM(
        id="tejas",
        code="Tejas T-04",
        name="TEJAS",
        full_name="HAL Tejas – Light Combat Aircraft (LCA)",
        type="Tejas",
        status="Attention",
        status_label="Attention Required",
        overall_health=46,
        base_id="base-bravo",
        base_name="Base Bravo (Sulur AFS)",
        squadron="No. 45 Squadron (Flying Daggers)",
        model_path="/models/tejas.obj",
        model_format="obj",
        flight_hours="980 h",
        last_maintenance="8 h ago",
        next_maintenance="0 h",
        next_maintenance_hours=0,
        next_flight="-",
        issue_detected="Hydraulic Pressure Drop (82 bar)",
        thumbnail="/models/tejas.obj",
        model_config_json=json.dumps({
            "initialCameraPosition": [6.8, 3.2, 7.5],
            "initialTarget": [0, 0.2, 0],
            "scaleMultiplier": 1.0,
            "rotationOffset": [0, -1.047, 0],
            "groundOffset": -1.2,
        })
    )
    db.add(tejas_orm)
    db.flush()

    # 4. Seed Components for 'rafale' and 'tejas'
    rafale_comps = [
        ("engine", "Engine", 88, "Normal", "98.4 kN thrust", "95% – 105% N1", "1,248 h", "42 h ago", "LOW", "Dual Snecma M88 turbofans operating nominally.", [0.65, 0.35, -2.4], "propulsion", {"pressure": "210 bar", "temperature": "620 °C", "operatingHours": "1,248 h", "nextService": "126 h"}),
        ("avionics", "Avionics", 95, "Normal", "RBE2 AESA Active", "99.4% T/R modules", "1,248 h", "42 h ago", "LOW", "Thales RBE2 active array operating with 99.4% active elements.", [0.1, -0.05, 3.8], "avionics", {"pressure": "1.02 bar", "temperature": "38 °C", "operatingHours": "1,248 h", "nextService": "200 h"}),
        ("hydraulics", "Hydraulic System", 91, "Normal", "212 bar", "200 – 220 bar", "1,248 h", "42 h ago", "LOW", "Dual 350-bar redundant architecture holding stable return line pressure.", [0.7, -0.25, -0.8], "hydraulics", {"pressure": "212 bar", "temperature": "65 °C", "operatingHours": "1,248 h", "nextService": "126 h"}),
        ("landing-gear", "Landing Gear", 94, "Normal", "14.8 bar nitrogen", "14.0 – 15.5 bar", "1,248 h", "12 h ago", "LOW", "Shock strut nitrogen inflation nominal.", [0, -1.1, 0.4], "landing", {"pressure": "14.8 bar", "temperature": "24 °C", "operatingHours": "1,248 h", "nextService": "180 h"}),
        ("structure", "Airframe & Fuselage", 97, "Normal", "No strain anomalies", "Nominal aero-elastic", "1,248 h", "42 h ago", "LOW", "Carbon composite and titanium load bearing ribs intact.", [0, 0.5, 0.8], "structure", {"pressure": "Nominal", "temperature": "22 °C", "operatingHours": "1,248 h", "nextService": "350 h"}),
        ("aerodynamics", "Wings & Canards", 93, "Normal", "Active fly-by-wire", "Trim error < 0.1°", "1,248 h", "42 h ago", "LOW", "All-moving foreplanes tracking flight director inputs.", [-2.2, 0.05, -1.2], "aerodynamics", {"pressure": "Nominal", "temperature": "25 °C", "operatingHours": "1,248 h", "nextService": "240 h"}),
        ("fuel", "Fuel Feed & Tanks", 90, "Normal", "Feed rate 3.4 kg/s", "Balanced feed", "1,248 h", "42 h ago", "LOW", "In-flight refuelling probe and inert gas fire-suppression operational.", [0, 0.1, -0.4], "propulsion", {"pressure": "3.4 bar", "temperature": "32 °C", "operatingHours": "1,248 h", "nextService": "160 h"}),
        ("cooling", "Environmental Cooling", 96, "Normal", "Flow rate 14.2 kg/min", "Cabin + Avionics", "1,248 h", "42 h ago", "LOW", "Auxiliary power unit and air-cycle machine operating at 98% efficiency.", [0.2, 0.4, 1.6], "avionics", {"pressure": "1.8 bar", "temperature": "18 °C", "operatingHours": "1,248 h", "nextService": "210 h"}),
        ("weapons-bus", "Stores Management", 99, "Normal", "MIL-STD-1760", "Bus status 100%", "1,248 h", "42 h ago", "LOW", "Digital weapons release and jettison logic circuits fully verified.", [1.8, -0.15, -1.6], "structure", {"pressure": "Nominal", "temperature": "20 °C", "operatingHours": "1,248 h", "nextService": "400 h"}),
        ("spectra-ew", "EW Suite (SPECTRA)", 94, "Normal", "360° detection", "Radar/laser/missile", "1,248 h", "42 h ago", "LOW", "Internal electronic warfare suite jamming channels calibrated.", [0, 1.2, -3.2], "avionics", {"pressure": "Nominal", "temperature": "36 °C", "operatingHours": "1,248 h", "nextService": "190 h"}),
    ]

    for cid, cname, chealth, cstatus, cval, crange, chours, cinsp, crisk, cins, chot, ccat, ckey in rafale_comps:
        db.add(AircraftComponentORM(
            id=f"rafale-{cid}",
            aircraft_id="rafale",
            name=cname,
            health=chealth,
            status=cstatus,
            current_value=cval,
            normal_range=crange,
            operating_hours=chours,
            last_inspection=cinsp,
            maintenance_risk=crisk,
            insight=cins,
            category=ccat,
            hotspot_position_json=json.dumps(chot),
            key_parameters_json=json.dumps(ckey),
            future_projections_json=json.dumps({
                "10": {"health": chealth - 2, "status": "Normal", "risk": "LOW", "insight": "Minor thermal accumulation."},
                "25": {"health": chealth - 5, "status": "Normal", "risk": "LOW", "insight": "Nominal degradation curve."},
                "50": {"health": chealth - 10, "status": "Monitor" if chealth - 10 < 85 else "Normal", "risk": "MEDIUM" if chealth - 10 < 85 else "LOW", "insight": "Scheduled service threshold reached."},
            })
        ))

    tejas_comps = [
        ("tejas-hydraulics", "Hydraulic System", 46, "Maintenance Required", "82 bar (Critical Drop)", "180 – 210 bar", "980 h", "8 h ago", "HIGH", "Primary pump cavitation detected. High-pressure pump seal worn; requires spare HP-9042.", [0.55, -0.2, -0.7], "hydraulics", {"pressure": "82 bar", "temperature": "88 °C", "operatingHours": "980 h", "nextService": "Immediate"}),
        ("tejas-engine", "Turbofan Engine (F404-IN20)", 84, "Normal", "84.5 kN with reheat", "Nominal FADEC", "980 h", "24 h ago", "LOW", "GE F404-IN20 turbofan operating within envelope.", [0, 0.25, -2.2], "propulsion", {"pressure": "205 bar", "temperature": "640 °C", "operatingHours": "980 h", "nextService": "120 h"}),
        ("tejas-radar", "Uttam AESA Radar", 78, "Monitor", "91.2% active T/R modules", "95% – 100%", "980 h", "16 h ago", "MEDIUM", "Module 4 subarray shows phase noise drift. Calibration recommended.", [0, 0.05, 3.5], "avionics", {"pressure": "1.01 bar", "temperature": "42 °C", "operatingHours": "980 h", "nextService": "48 h"}),
        ("tejas-landing", "Landing Gear & Actuators", 86, "Normal", "14.2 bar nitrogen", "13.5 – 15.0 bar", "980 h", "12 h ago", "LOW", "Main shock absorbing struts nominal.", [0, -1.05, 0.3], "landing", {"pressure": "14.2 bar", "temperature": "26 °C", "operatingHours": "980 h", "nextService": "150 h"}),
        ("tejas-fbw", "Digital Flight Control (DFCS)", 92, "Normal", "Quadruplex FBW", "All 4 channels synced", "980 h", "8 h ago", "LOW", "Primary flight control computers nominal.", [0, 0.4, 0.6], "aerodynamics", {"pressure": "Nominal", "temperature": "28 °C", "operatingHours": "980 h", "nextService": "250 h"}),
        ("tejas-structure", "Composite Airframe", 95, "Normal", "No micro-crack strain", "Aero-elastic nominal", "980 h", "40 h ago", "LOW", "45% carbon fiber composite skin shows zero delamination.", [0, 0.3, 0.2], "structure", {"pressure": "Nominal", "temperature": "24 °C", "operatingHours": "980 h", "nextService": "300 h"}),
        ("tejas-fuel", "Fuel & In-Flight Refuel", 88, "Normal", "Transfer rate 2.8 kg/s", "Gravity & pressure feed", "980 h", "18 h ago", "LOW", "Internal wing tanks and drop tank transfer valves nominal.", [0, 0.1, -0.3], "propulsion", {"pressure": "2.8 bar", "temperature": "34 °C", "operatingHours": "980 h", "nextService": "180 h"}),
        ("tejas-cockpit", "Glass Cockpit & HUD", 96, "Normal", "55° Wide HUD active", "MFDs 100% luminance", "980 h", "12 h ago", "LOW", "Elbit wide-angle HUD and smart multi-function displays operational.", [0, 0.6, 1.8], "avionics", {"pressure": "Nominal", "temperature": "21 °C", "operatingHours": "980 h", "nextService": "320 h"}),
        ("tejas-wings", "Compound Delta Wings", 91, "Normal", "Leading edge slats sync", "Servo lag < 12ms", "980 h", "16 h ago", "LOW", "Actuators responding accurately across speed envelope.", [-1.9, -0.05, -1.0], "aerodynamics", {"pressure": "Nominal", "temperature": "26 °C", "operatingHours": "980 h", "nextService": "220 h"}),
        ("tejas-ew", "Mayawi EW Suite", 89, "Normal", "Radar warning receiver", "Chaff/Flare armed", "980 h", "20 h ago", "LOW", "Internal self-protection jammer and laser receiver ready.", [0, 1.0, -2.8], "avionics", {"pressure": "Nominal", "temperature": "35 °C", "operatingHours": "980 h", "nextService": "190 h"}),
    ]

    for cid, cname, chealth, cstatus, cval, crange, chours, cinsp, crisk, cins, chot, ccat, ckey in tejas_comps:
        db.add(AircraftComponentORM(
            id=cid,
            aircraft_id="tejas",
            name=cname,
            health=chealth,
            status=cstatus,
            current_value=cval,
            normal_range=crange,
            operating_hours=chours,
            last_inspection=cinsp,
            maintenance_risk=crisk,
            insight=cins,
            category=ccat,
            hotspot_position_json=json.dumps(chot),
            key_parameters_json=json.dumps(ckey),
            future_projections_json=json.dumps({
                "10": {"health": max(20, chealth - 4), "status": cstatus, "risk": crisk, "insight": "Cavitation degrades hydraulic return."},
                "25": {"health": max(15, chealth - 12), "status": "Maintenance Required", "risk": "HIGH", "insight": "Flight safety lock activates."},
                "50": {"health": max(10, chealth - 25), "status": "Maintenance Required", "risk": "HIGH", "insight": "Complete hydraulic line pressure loss."},
            })
        ))

    # 5. Seed Spares Inventory
    spares = [
        SparePartORM(
            id="sp-01",
            part_number="HP-9042",
            name="Hydraulic Pump Kit",
            applicable_subsystem="Hydraulic System",
            base_id="base-bravo",
            quantity_on_hand=0,
            stock_alpha=1,
            stock_bravo=0,
            minimum_required=2,
            shortage_status="CRITICAL_SHORTAGE",
            supplier_lead_time="6–8 weeks",
            supplier_lead_time_days=49,
            cross_base_available_qty=1,
            cross_base_transfer_hours=14,
            cross_base_source="Base Alpha (Ambala)",
            compatible_aircraft="Tejas (Mk1 / Mk1A)",
            condition="Serviceable",
        ),
        SparePartORM(
            id="sp-02",
            part_number="ENG-318",
            name="Engine Control Unit",
            applicable_subsystem="Engine",
            base_id="base-alpha",
            quantity_on_hand=3,
            stock_alpha=3,
            stock_bravo=2,
            minimum_required=2,
            shortage_status="IN_STOCK",
            supplier_lead_time="2–3 weeks",
            supplier_lead_time_days=18,
            cross_base_available_qty=2,
            cross_base_transfer_hours=14,
            cross_base_source="Base Bravo (Sulur)",
            compatible_aircraft="Rafale / Tejas",
            condition="Serviceable",
        ),
        SparePartORM(
            id="sp-03",
            part_number="AV-2210",
            name="Avionics Module",
            applicable_subsystem="Avionics",
            base_id="base-alpha",
            quantity_on_hand=5,
            stock_alpha=5,
            stock_bravo=4,
            minimum_required=2,
            shortage_status="IN_STOCK",
            supplier_lead_time="1–2 weeks",
            supplier_lead_time_days=10,
            cross_base_available_qty=4,
            cross_base_transfer_hours=14,
            cross_base_source="Base Bravo (Sulur)",
            compatible_aircraft="Rafale / Tejas",
            condition="Serviceable",
        ),
        SparePartORM(
            id="sp-04",
            part_number="LG-552",
            name="Landing Gear Actuator",
            applicable_subsystem="Landing Gear",
            base_id="base-bravo",
            quantity_on_hand=1,
            stock_alpha=2,
            stock_bravo=1,
            minimum_required=1,
            shortage_status="IN_STOCK",
            supplier_lead_time="3–4 weeks",
            supplier_lead_time_days=24,
            cross_base_available_qty=2,
            cross_base_transfer_hours=14,
            cross_base_source="Base Alpha (Ambala)",
            compatible_aircraft="Tejas (Mk1)",
            condition="Serviceable",
        ),
        SparePartORM(
            id="sp-05",
            part_number="HP-9042A",
            name="Hydraulic Pump Kit (Compatible Variant)",
            applicable_subsystem="Hydraulic System",
            base_id="base-alpha",
            quantity_on_hand=1,
            stock_alpha=1,
            stock_bravo=0,
            minimum_required=1,
            shortage_status="LOW_STOCK",
            supplier_lead_time="4–6 weeks",
            supplier_lead_time_days=35,
            cross_base_available_qty=0,
            cross_base_transfer_hours=14,
            cross_base_source=None,
            compatible_aircraft="Tejas (Mk1)",
            condition="Serviceable",
        ),
    ]
    db.add_all(spares)

    # 6. Seed Technicians
    technicians = [
        TechnicianORM(
            id="tech-01",
            name="MWO R. Sharma",
            badge_number="IAF-TECH-4091",
            trade="Hydraulics Specialist",
            base_id="base-bravo",
            status="AVAILABLE",
            assigned_aircraft="Tejas AR-02",
            shift="Shift Alpha (06:00 - 14:00)",
        ),
        TechnicianORM(
            id="tech-02",
            name="Sgt. V. Nair",
            badge_number="IAF-TECH-3812",
            trade="Turbofan Propulsion",
            base_id="base-alpha",
            status="AVAILABLE",
            assigned_aircraft="Rafale R-01",
            shift="Shift Bravo (14:00 - 22:00)",
        ),
        TechnicianORM(
            id="tech-03",
            name="Cpl. A. Sen",
            badge_number="IAF-TECH-5120",
            trade="Avionics & Radar",
            base_id="base-alpha",
            status="ON_JOB",
            assigned_aircraft="Rafale R-01",
            shift="Shift Alpha (06:00 - 14:00)",
        ),
        TechnicianORM(
            id="tech-04",
            name="Sgt. K. Pillai",
            badge_number="IAF-TECH-3944",
            trade="Composite Airframe",
            base_id="base-bravo",
            status="AVAILABLE",
            shift="Shift Alpha (06:00 - 14:00)",
        ),
        TechnicianORM(
            id="tech-05",
            name="JWO M. Gupta",
            badge_number="IAF-TECH-2908",
            trade="Hydraulics Specialist",
            base_id="base-alpha",
            status="AVAILABLE",
            shift="Shift Alpha (06:00 - 14:00)",
        ),
    ]
    db.add_all(technicians)

    # 7. Seed Maintenance Bays
    bays = [
        MaintenanceBayORM(
            id="bay-slr-01",
            name="Bay 1 (Heavy Depot Hangar)",
            base_id="base-bravo",
            type="Heavy Depot Bay",
            status="OCCUPIED",
            occupied_by_aircraft="Tejas T-04 (AR-02)",
            active_job="Hydraulic Pump Kit Replacement",
            estimated_free_time="In 48h (Awaiting Spares)",
        ),
        MaintenanceBayORM(
            id="bay-slr-02",
            name="Bay 2 (Quick-Turn Flightline)",
            base_id="base-bravo",
            type="Flightline Quick-Turn Bay",
            status="AVAILABLE",
            estimated_free_time="Immediate",
        ),
        MaintenanceBayORM(
            id="bay-amb-01",
            name="Bay 1 (Depot Overhaul)",
            base_id="base-alpha",
            type="Heavy Depot Bay",
            status="OCCUPIED",
            occupied_by_aircraft="Rafale R-02",
            active_job="Scheduled Borescope",
            estimated_free_time="In 12h",
        ),
        MaintenanceBayORM(
            id="bay-amb-02",
            name="Bay 2 (Quick-Turn Flightline)",
            base_id="base-alpha",
            type="Flightline Quick-Turn Bay",
            status="AVAILABLE",
            estimated_free_time="Immediate",
        ),
    ]
    db.add_all(bays)

    # 8. Seed Work Orders
    work_orders = [
        WorkOrderORM(
            id="WO-1042",
            aircraft="Tejas AR-02",
            component="Hydraulic System",
            type="Overhaul",
            status="Delayed",
            scheduled_date="12 Oct 2024",
            est_hours=24,
            priority="High",
            base_id="base-bravo",
            delay_reason="Awaiting spare part HP-9042 (Lead time 6-8 weeks from supplier).",
            assigned_bay="Bay 1 (Depot)",
            assigned_tech="MWO R. Sharma",
            required_spare="HP-9042",
        ),
        WorkOrderORM(
            id="WO-1041",
            aircraft="Rafale R-01",
            component="Engine",
            type="Inspection",
            status="Scheduled",
            scheduled_date="11 Oct 2024",
            est_hours=12,
            priority="Medium",
            base_id="base-alpha",
            assigned_bay="Bay 2 (Quick-Turn)",
            assigned_tech="Sgt. V. Nair",
        ),
        WorkOrderORM(
            id="WO-1040",
            aircraft="Tejas AR-01",
            component="Avionics",
            type="Check",
            status="Scheduled",
            scheduled_date="15 Oct 2024",
            est_hours=8,
            priority="Medium",
            base_id="base-bravo",
            assigned_bay="Bay 2 (Quick-Turn)",
            assigned_tech="Cpl. A. Sen",
        ),
        WorkOrderORM(
            id="WO-1039",
            aircraft="Rafale R-02",
            component="Landing Gear",
            type="Repair",
            status="Completed",
            scheduled_date="08 Oct 2024",
            est_hours=16,
            priority="Low",
            base_id="base-alpha",
            assigned_bay="Bay 1 (Depot)",
            assigned_tech="Sgt. K. Pillai",
        ),
        WorkOrderORM(
            id="WO-1038",
            aircraft="Tejas AR-03",
            component="Flight Control",
            type="Inspection",
            status="Scheduled",
            scheduled_date="16 Oct 2024",
            est_hours=10,
            priority="Low",
            base_id="base-bravo",
            assigned_bay="Bay 1 (Depot)",
            assigned_tech="JWO M. Gupta",
        ),
        WorkOrderORM(
            id="WO-1037",
            aircraft="Rafale R-03",
            component="Hydraulic System",
            type="Overhaul",
            status="Delayed",
            scheduled_date="14 Oct 2024",
            est_hours=28,
            priority="High",
            base_id="base-alpha",
            delay_reason="Bay 1 contention with scheduled heavy inspection.",
            assigned_bay="Bay 1 (Depot)",
            assigned_tech="MWO R. Sharma",
        ),
    ]
    db.add_all(work_orders)

    # 9. Seed Data Trust Records
    trust_records = [
        DataTrustRecordORM(
            id="dtr-01",
            base_id="base-bravo",
            category="aircraft_health",
            record_id="TLM-SLR-8921-HYD",
            source_system="Tejas Integrated Vehicle Health Monitoring (IVHM)",
            timestamp="2024-10-01",
            quality_grade="D",
            requires_human_verification=True,
            verification_status="NEEDS_REVIEW",
            detected_issues_json=json.dumps([
                "Critical issue: Hydraulic pressure transducer registered 82 bar (drop below 180 bar safety gate).",
                "Inconsistent units: Telemetry stream momentarily toggled between PSI and Bar.",
            ]),
            ground_truth_label="Hardware seal degradation confirmed; kit HP-9042 required.",
            payload_json=json.dumps({"date": "2024-10-01", "aircraft": "T-04", "component": "Hydraulic Pump", "value": "85", "unit": "bar"}),
        ),
        DataTrustRecordORM(
            id="dtr-02",
            base_id="base-alpha",
            category="aircraft_health",
            record_id="TLM-AMB-1248-ENG",
            source_system="Rafale Health Usage Monitoring System (HUMS)",
            timestamp="2024-10-01",
            quality_grade="A",
            requires_human_verification=False,
            verification_status="VERIFIED",
            detected_issues_json=json.dumps([]),
            payload_json=json.dumps({"date": "2024-10-01", "aircraft": "T-04", "component": "Engine Temp", "value": "620", "unit": "°C"}),
        ),
        DataTrustRecordORM(
            id="dtr-03",
            base_id="base-bravo",
            category="spares_inventory",
            record_id="INV-SLR-0419-HP",
            source_system="Base Bravo Automated Warehouse & Stock",
            timestamp="2024-10-02",
            quality_grade="C",
            requires_human_verification=True,
            verification_status="NEEDS_REVIEW",
            detected_issues_json=json.dumps([
                "Stale timestamp: Physical shelf barcode last verified 72 hours ago.",
                "Missing field: Batch release certificate number missing in record.",
            ]),
            ground_truth_label="Bin empty; kit was allocated without barcode scan.",
            payload_json=json.dumps({"date": "2024-10-02", "aircraft": "T-04", "component": "Vibration", "value": "0.8", "unit": "mm/s"}),
        ),
        DataTrustRecordORM(
            id="dtr-04",
            base_id="base-alpha",
            category="maintenance_records",
            record_id="MNT-AMB-0144-NDT",
            source_system="Central Depot Maintenance ERP",
            timestamp="2024-10-02",
            quality_grade="A",
            requires_human_verification=False,
            verification_status="VERIFIED",
            detected_issues_json=json.dumps([]),
            payload_json=json.dumps({"date": "2024-10-02", "aircraft": "T-04", "component": "Oil Pressure", "value": "210", "unit": "psi"}),
        ),
        DataTrustRecordORM(
            id="dtr-05",
            base_id="base-bravo",
            category="technicians_bays",
            record_id="ROSTER-SLR-06-10",
            source_system="Aircrew & Ground Engineer Duty Roster",
            timestamp="2024-10-03",
            quality_grade="B",
            requires_human_verification=False,
            verification_status="VERIFIED",
            detected_issues_json=json.dumps([
                "Minor variance: Tech shift handoff logged 15 minutes after official shift start.",
            ]),
            payload_json=json.dumps({"date": "2024-10-03", "aircraft": "T-04", "component": "Fuel Flow", "value": "450", "unit": "kg/h"}),
        ),
    ]
    db.add_all(trust_records)

    # 10. Seed Decision Ledger
    ledger_entries = [
        DecisionLedgerORM(
            id="dec-01",
            timestamp="2024-10-01T08:30:00Z",
            actor="Air Commander",
            action="INITIALIZE_CENTRAL_FLEET_COMMAND",
            previous_state="Standalone Single-Base View",
            resulting_state="24-Aircraft Fleet Command Center Active",
            notes="Established multi-base telemetry bridge across Base Alpha (Ambala) and Base Bravo (Sulur).",
            base_id="all",
            is_override=False,
        ),
        DecisionLedgerORM(
            id="dec-02",
            timestamp="2024-10-01T12:45:00Z",
            actor="Air Commander",
            action="FLAG_HYDRAULIC_PRESSURE_MAINTENANCE",
            previous_state="Tejas T-04: READY",
            resulting_state="Tejas T-04: ATTENTION_REQUIRED",
            notes="IVHM detected 82 bar hydraulic pressure drop. Work Order WO-1042 queued for seal replacement.",
            base_id="base-bravo",
            is_override=False,
        ),
    ]
    db.add_all(ledger_entries)

    # 11. Seed Import Batches
    import_batches = [
        ImportBatchORM(
            id="imp-01",
            timestamp="2024-10-01 10:00 UTC",
            base_id="base-alpha",
            base_name="Base Alpha (Ambala AFS)",
            category="aircraft_health",
            filename="ambala_flight_telemetry_oct01.csv",
            records_count=140,
            valid_count=138,
            flagged_count=2,
            status="ACCEPTED",
        ),
        ImportBatchORM(
            id="imp-02",
            timestamp="2024-10-02 12:00 UTC",
            base_id="base-bravo",
            base_name="Base Bravo (Sulur AFS)",
            category="spares_inventory",
            filename="sulur_depot_spares_oct02.csv",
            records_count=48,
            valid_count=44,
            flagged_count=4,
            status="ACCEPTED",
        ),
    ]
    db.add_all(import_batches)

    db.commit()
