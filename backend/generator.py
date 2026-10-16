import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Tuple, Any
from backend.models import (
    AircraftSummary,
    AircraftDetail,
    AircraftComponent,
    SensorReading,
    ComponentTrendPoint,
    SparePart,
    Technician,
    MaintenanceBay,
    MaintenanceJob,
    DataTrustRecord,
    DecisionLedgerEntry,
    ScenarioId,
    BottleneckItem
)

# Deterministic Seed for Reproducibility
RANDOM_SEED = 42

SQUADRONS = [
    "Squadron 101 - Desert Falcons",
    "Squadron 204 - Mountain Guardians",
    "Squadron 305 - Coastal Patrol",
]

BASES = [
    "Forward Base Alpha",
    "Support Depot Gamma",
]

JET_COMPONENTS_DEF = [
    ("jet-engine", "Turbofan Propulsion Unit", "propulsion", [0.45, 0.3, -2.2], "98.4 kN thrust", "95 – 105 kN", "Turbofan operating within nominal core temperature envelope."),
    ("jet-intake", "Air Intake & Compression Duct", "aerodynamics", [0.75, -0.2, 0.5], "0.98 Mach duct eff.", "0.95 – 1.00 Mach", "Boundary layer diverters clear; compression ramp response nominal."),
    ("jet-fcs", "Digital Flight Control Avionics", "avionics", [2.2, -0.1, -1.6], "Quad-bus < 5ms latency", "< 8 ms latency", "Triple-modular redundant flight control computer online."),
    ("jet-hydraulics", "Main Hydraulic Circuit", "hydraulics", [0.55, -0.25, -0.7], "210 bar line pressure", "200 – 220 bar", "Dual 350-bar accumulator return loop operating normally."),
    ("jet-gear", "Landing Gear & Retract System", "landing", [0.0, -1.0, 1.2], "14.6 bar shock strut", "14.0 – 15.5 bar", "Nitrogen pre-charge within tolerance; brake heat sink 90%."),
    ("jet-radome", "Radar & Forward Radome", "avionics", [0.0, 0.0, 3.4], "AESA Array 100% T/R", "> 98% T/R modules", "Multi-mode solid state synthetic aperture radar active."),
    ("jet-wings", "Compound Wing & Spar Assembly", "structure", [1.7, 0.0, -0.6], "0.14 micro-strain", "< 0.40 micro-strain", "Ultrasonic non-destructive testing detects zero structural micro-cracking."),
    ("jet-control-surfaces", "Aileron & Elevon Actuators", "aerodynamics", [1.9, -0.15, -1.9], "0.02 deg backlash", "< 0.05 deg backlash", "Trailing edge flight surfaces responsive to servo command loop."),
    ("jet-tail", "Vertical Stabilizer & Rudder", "aerodynamics", [0.0, 1.5, -1.8], "0.01 mm deflection", "< 0.05 mm deflection", "Rudder hinge bearing backlash within standard limits."),
    ("jet-ecs", "Environmental Control System", "structure", [0.3, -0.15, 0.0], "0.84 bar cabin diff.", "0.80 – 0.90 bar", "Cockpit bleed-air pressurization nominal; cabin cooling active.")
]

HELI_COMPONENTS_DEF = [
    ("heli-engine", "Turboshaft Power Unit", "propulsion", [0.0, 0.9, -0.5], "1,350 shp output", "1,300 – 1,420 shp", "Twin turboshaft gas generator core running smooth."),
    ("heli-main-rotor", "Main Rotor Head & Swashplate", "aerodynamics", [0.0, 1.8, 0.2], "100.2% rotor RPM", "98 – 102% RPM", "Hydraulic swashplate cyclic and collective linkage tracking nominal."),
    ("heli-gearbox", "Main Transmission & Gearbox", "propulsion", [0.0, 1.1, -0.1], "76 deg C oil temp", "70 – 85 deg C", "Epicyclic reduction gears free of metallic debris in chip detector."),
    ("heli-tail-rotor", "Tail Rotor Drive & Fenestron", "aerodynamics", [0.0, 0.8, -4.6], "4,200 RPM drive shaft", "4,100 – 4,300 RPM", "Tail gearbox chip detector clean; intermediate shaft bearing aligned."),
    ("heli-fcs", "Automatic Flight Control (AFCS)", "avionics", [0.0, 0.2, 0.8], "4-axis auto-trim OK", "Pitch/Roll < 2% dev", "Stability augmentation system holding hands-off hover trim."),
    ("heli-hydraulics", "Dual Hydraulic Boost System", "hydraulics", [0.4, 0.5, 0.0], "205 bar booster pressure", "200 – 220 bar", "Primary and secondary servo booster circuits balanced."),
    ("heli-skids", "Landing Gear Shock Struts", "landing", [0.7, -1.2, 0.3], "12.2 mm strut displacement", "10 – 15 mm displacement", "Energy-absorbing cross-tubes and damper reservoirs verified."),
    ("heli-blades", "Composite Rotor Blade Set", "aerodynamics", [2.5, 1.8, 0.2], "0.08 mm dynamic track error", "< 0.15 mm track error", "Carbon-fiber composite spar blade balance check verified."),
    ("heli-vibration", "Active Vibration Absorber", "structure", [0.0, 0.4, -0.8], "0.04 g 1/rev vibration", "< 0.10 g vibration", "Pendulum dampers in main hub tuned to rotational harmonic."),
    ("heli-avionics", "Cockpit Avionics & Mission Pod", "avionics", [0.0, -0.1, 1.8], "MIL-STD-1553B Nominal", "Zero packet drop", "Integrated mission display and health monitoring processor synced.")
]

def generate_sensor_trends(base_health: float, rng: random.Random) -> Tuple[List[SensorReading], List[ComponentTrendPoint]]:
    readings = []
    trend_history = []
    base_time = datetime.now(timezone.utc)
    
    # 6 historical sorties
    for i in range(6, -1, -1):
        dt = base_time - timedelta(hours=i * 14)
        ts_str = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        health_pt = max(20.0, min(100.0, base_health + (6 - i) * (rng.uniform(-2.0, 1.5))))
        trend_history.append(ComponentTrendPoint(
            timestamp=ts_str,
            value=round(rng.uniform(190.0, 215.0), 1),
            health_score=round(health_pt, 1)
        ))
    
    readings.append(SensorReading(
        metric_name="Core Operational Metric",
        value=round(rng.uniform(94.0, 102.5), 2),
        unit="index",
        timestamp=base_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        status="nominal" if base_health > 80 else ("caution" if base_health > 65 else "critical")
    ))
    return readings, trend_history

class SyntheticFleetDatabase:
    def __init__(self, seed: int = RANDOM_SEED):
        self.seed = seed
        self.active_scenario: ScenarioId = "baseline"
        self.decision_ledger: List[DecisionLedgerEntry] = []
        self._generate_all()

    def _generate_all(self):
        rng = random.Random(self.seed)
        
        self.aircraft_dict: Dict[str, AircraftDetail] = {}
        self.spares: List[SparePart] = []
        self.technicians: List[Technician] = []
        self.bays: List[MaintenanceBay] = []
        self.jobs: List[MaintenanceJob] = []
        self.trust_records: List[DataTrustRecord] = []
        
        # 1. Generate 24 Generic Aircraft
        # 14 Jets (Tail: GEN-J101 .. GEN-J114)
        # 10 Helicopters (Tail: GEN-H201 .. GEN-H210)
        jet_names = [
            "AeroJet Mark-IV", "Falcon-X Fighter", "Viper-J Multirole", "Condor-9 Strike",
            "SwiftJet-3 Recon", "AeroJet Mark-IV", "Falcon-X Fighter", "Viper-J Multirole",
            "StormJet Interceptor", "AeroJet Mark-IV", "Falcon-X Fighter", "Condor-9 Strike",
            "SwiftJet-3 Recon", "Viper-J Multirole"
        ]
        
        heli_names = [
            "RotorLift H-12", "AeroHeli Utility-8", "SkyRotor Recon-6", "HeavyLift H-20",
            "RotorLift H-12", "AeroHeli Utility-8", "SkyRotor Recon-6", "HeavyLift H-20",
            "RotorLift H-12", "AeroHeli Utility-8"
        ]

        # Preset specific aircraft for key demonstration scenarios
        for idx in range(14):
            ac_id = f"gen-j{101 + idx}"
            tail = f"GEN-J{101 + idx}"
            name = jet_names[idx]
            squadron = SQUADRONS[idx % len(SQUADRONS)]
            base = BASES[0] if idx < 9 else BASES[1]
            
            # Seed health
            if idx == 0: # Primary demo jet - READY
                status = "READY"
                overall_health = 94.0
                active_issue = None
            elif idx == 1: # Secondary demo jet - in MAINTENANCE with hydraulic issue
                status = "MAINTENANCE"
                overall_health = 68.0
                active_issue = "Main Hydraulic Circuit Pressure Drop (174 bar)"
            elif idx == 4: # ATTENTION required
                status = "ATTENTION"
                overall_health = 77.0
                active_issue = "Aileron Actuator Backlash High"
            elif idx % 4 == 0:
                status = "MAINTENANCE"
                overall_health = round(rng.uniform(62.0, 74.0), 1)
                active_issue = "Turbofan Core Thermal Inspection Scheduled"
            else:
                status = "READY"
                overall_health = round(rng.uniform(88.0, 98.0), 1)
                active_issue = None

            # Generate 10 jet components
            components = []
            for c_id, c_name, c_cat, c_hotspot, c_curr, c_range, c_ins in JET_COMPONENTS_DEF:
                # If aircraft is maintenance, degrade matching component
                c_health = max(10.0, min(100.0, overall_health + rng.uniform(-4.0, 4.0)))
                c_status = "Normal"
                c_risk = "LOW"
                c_curr_val = c_curr
                c_insight = c_ins
                
                if ac_id == "gen-j102" and c_id == "jet-hydraulics":
                    c_health = 58.0
                    c_status = "Maintenance Required"
                    c_risk = "HIGH"
                    c_curr_val = "174 bar"
                    c_insight = "Hydraulic pressure below nominal operational minimum. High seal bypass leakage simulated."
                elif ac_id == "gen-j105" and c_id == "jet-control-surfaces":
                    c_health = 72.0
                    c_status = "Monitor"
                    c_risk = "MEDIUM"
                    c_curr_val = "0.045 deg backlash"
                    c_insight = "Elevon servo actuator approaching wear limit. Recalibration advised."
                elif c_health < 70:
                    c_status = "Maintenance Required"
                    c_risk = "HIGH"
                elif c_health < 82:
                    c_status = "Monitor"
                    c_risk = "MEDIUM"

                s_readings, t_history = generate_sensor_trends(c_health, rng)
                
                components.append(AircraftComponent(
                    id=c_id,
                    name=c_name,
                    category=c_cat,
                    health=round(c_health, 1),
                    status=c_status,
                    current_value=c_curr_val,
                    normal_range=c_range,
                    operating_hours=f"{int(rng.uniform(600, 1800))} h",
                    last_inspection=f"{int(rng.uniform(12, 72))} h ago",
                    maintenance_risk=c_risk,
                    insight=c_insight,
                    hotspot_position=c_hotspot,
                    sensor_readings=s_readings,
                    trend_history=t_history,
                    data_trust_grade="A" if idx != 6 else "C"
                ))

            flight_hrs = f"{int(rng.uniform(700, 2400))} h"
            last_maint = f"{int(rng.uniform(10, 60))} h ago"
            next_maint = 0 if status == "MAINTENANCE" else int(rng.uniform(40, 160))

            detail = AircraftDetail(
                id=ac_id,
                tail_number=tail,
                name=name,
                aircraft_class="jet",
                squadron=squadron,
                base=base,
                status=status,
                overall_health=overall_health,
                utilization_rate=round(rng.uniform(0.65, 0.88), 2),
                projected_availability_days=round(0.0 if status == "MAINTENANCE" else rng.uniform(4.0, 14.0), 1),
                flight_hours=flight_hrs,
                last_maintenance=last_maint,
                next_maintenance_hours=next_maint,
                active_issue=active_issue,
                components_count=10,
                components=components,
                maintenance_history=[
                    {"date": "2026-09-18", "type": "Scheduled 100-Hr Airframe Inspection", "technician": "Sgt. Sharma", "outcome": "Satisfactory"},
                    {"date": "2026-08-04", "type": "Hydraulic Actuator Filter Replacement", "technician": "Cpl. V. Rao", "outcome": "Flushed and Cleared"}
                ]
            )
            self.aircraft_dict[ac_id] = detail

        # 10 Helicopters (Tail: GEN-H201 .. GEN-H210)
        for idx in range(10):
            ac_id = f"gen-h{201 + idx}"
            tail = f"GEN-H{201 + idx}"
            name = heli_names[idx]
            squadron = SQUADRONS[(idx + 1) % len(SQUADRONS)]
            base = BASES[0] if idx < 6 else BASES[1]
            
            if idx == 0: # Primary demo heli - READY
                status = "READY"
                overall_health = 92.5
                active_issue = None
            elif idx == 2: # Secondary demo heli - MAINTENANCE
                status = "MAINTENANCE"
                overall_health = 64.0
                active_issue = "Main Rotor Swashplate Bearing Vibration High"
            elif idx % 3 == 0:
                status = "ATTENTION"
                overall_health = 78.0
                active_issue = "Tail Rotor Drive Shaft Bearing Temperature Elevated"
            else:
                status = "READY"
                overall_health = round(rng.uniform(85.0, 96.0), 1)
                active_issue = None

            components = []
            for c_id, c_name, c_cat, c_hotspot, c_curr, c_range, c_ins in HELI_COMPONENTS_DEF:
                c_health = max(10.0, min(100.0, overall_health + rng.uniform(-3.5, 3.5)))
                c_status = "Normal"
                c_risk = "LOW"
                c_curr_val = c_curr
                c_insight = c_ins
                
                if ac_id == "gen-h203" and c_id == "heli-main-rotor":
                    c_health = 59.0
                    c_status = "Maintenance Required"
                    c_risk = "HIGH"
                    c_curr_val = "0.28 g 1/rev vibration"
                    c_insight = "Swashplate bearing accelerometer shows anomalous harmonic peak. Teardown inspection required."
                elif c_health < 70:
                    c_status = "Maintenance Required"
                    c_risk = "HIGH"
                elif c_health < 82:
                    c_status = "Monitor"
                    c_risk = "MEDIUM"

                s_readings, t_history = generate_sensor_trends(c_health, rng)
                
                components.append(AircraftComponent(
                    id=c_id,
                    name=c_name,
                    category=c_cat,
                    health=round(c_health, 1),
                    status=c_status,
                    current_value=c_curr_val,
                    normal_range=c_range,
                    operating_hours=f"{int(rng.uniform(400, 1600))} h",
                    last_inspection=f"{int(rng.uniform(8, 48))} h ago",
                    maintenance_risk=c_risk,
                    insight=c_insight,
                    hotspot_position=c_hotspot,
                    sensor_readings=s_readings,
                    trend_history=t_history,
                    data_trust_grade="A" if idx != 3 else "B"
                ))

            detail = AircraftDetail(
                id=ac_id,
                tail_number=tail,
                name=name,
                aircraft_class="helicopter",
                squadron=squadron,
                base=base,
                status=status,
                overall_health=overall_health,
                utilization_rate=round(rng.uniform(0.60, 0.85), 2),
                projected_availability_days=round(0.0 if status == "MAINTENANCE" else rng.uniform(3.0, 12.0), 1),
                flight_hours=f"{int(rng.uniform(500, 2100))} h",
                last_maintenance=f"{int(rng.uniform(12, 55))} h ago",
                next_maintenance_hours=0 if status == "MAINTENANCE" else int(rng.uniform(30, 140)),
                active_issue=active_issue,
                components_count=10,
                components=components,
                maintenance_history=[
                    {"date": "2026-09-22", "type": "Transmission Epicyclic Magnetic Plug Check", "technician": "WO K. Roy", "outcome": "Debris Free"},
                    {"date": "2026-08-11", "type": "Tail Rotor Drive Shaft Dynamic Balancing", "technician": "Sgt. P. Sen", "outcome": "Calibrated"}
                ]
            )
            self.aircraft_dict[ac_id] = detail

        # 2. Spare Parts Catalog & Inventory
        self.spares = [
            SparePart(id="sp-hyd-01", part_number="HYD-SEAL-KIT-01", name="High-Pressure Hydraulic Seal Kit", applicable_class=["jet", "helicopter"], quantity_on_hand=3, min_reorder_level=5, status="Low Stock", lead_time_days=4, cost_synthetic_usd=850.0, affected_components=["jet-hydraulics", "heli-hydraulics"]),
            SparePart(id="sp-pump-02", part_number="PUMP-CORE-350", name="Main Hydraulic Variable Pump Core", applicable_class=["jet"], quantity_on_hand=1, min_reorder_level=2, status="Low Stock", lead_time_days=7, cost_synthetic_usd=14200.0, affected_components=["jet-hydraulics"]),
            SparePart(id="sp-rotor-03", part_number="ROTOR-BEARING-H12", name="Swashplate Duplex Bearing Assembly", applicable_class=["helicopter"], quantity_on_hand=0, min_reorder_level=2, status="Critical Shortage", lead_time_days=11, cost_synthetic_usd=9800.0, affected_components=["heli-main-rotor"]),
            SparePart(id="sp-act-04", part_number="ELEVON-ACTUATOR-M4", name="Electro-Hydraulic Servo Actuator", applicable_class=["jet"], quantity_on_hand=2, min_reorder_level=3, status="Low Stock", lead_time_days=5, cost_synthetic_usd=18500.0, affected_components=["jet-control-surfaces", "jet-fcs"]),
            SparePart(id="sp-flt-05", part_number="OIL-FILTER-CARTRIDGE", name="Micro-Synthetic Lube Oil Filter", applicable_class=["jet", "helicopter"], quantity_on_hand=14, min_reorder_level=8, status="Adequate", lead_time_days=2, cost_synthetic_usd=140.0, affected_components=["jet-engine", "heli-gearbox"]),
            SparePart(id="sp-probe-06", part_number="EGT-THERMOCOUPLE-S", name="Turbine Exhaust Gas Temp Probe", applicable_class=["jet", "helicopter"], quantity_on_hand=6, min_reorder_level=4, status="Adequate", lead_time_days=3, cost_synthetic_usd=620.0, affected_components=["jet-engine", "heli-engine"]),
            SparePart(id="sp-brk-07", part_number="BRAKE-CARBON-DISC", name="Carbon Multi-Disc Brake Assembly", applicable_class=["jet"], quantity_on_hand=4, min_reorder_level=4, status="Adequate", lead_time_days=4, cost_synthetic_usd=5200.0, affected_components=["jet-gear"]),
            SparePart(id="sp-vib-08", part_number="VIB-ELASTOMER-H", name="Hub Elastomeric Damper Bushing", applicable_class=["helicopter"], quantity_on_hand=2, min_reorder_level=3, status="Low Stock", lead_time_days=6, cost_synthetic_usd=2100.0, affected_components=["heli-vibration", "heli-blades"]),
        ]

        # 3. Technician Roster (14 technicians across 5 trades)
        self.technicians = [
            Technician(id="tech-01", name="Master Sgt. R. Nair", trade="Hydraulics Specialist", certification_level=3, shift="Morning", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-02", name="Sgt. Ankit Verma", trade="Hydraulics Specialist", certification_level=2, shift="Evening", status="Assigned", base="Forward Base Alpha", current_job_id="job-j102-hyd"),
            Technician(id="tech-03", name="Cpl. Manish Tiwari", trade="Hydraulics Specialist", certification_level=1, shift="Night", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-04", name="Sgt. T. Balakrishnan", trade="Hydraulics Specialist", certification_level=2, shift="Morning", status="Available", base="Support Depot Gamma"),
            Technician(id="tech-05", name="Chief WO Vikram Singh", trade="Rotorcraft Systems", certification_level=3, shift="Morning", status="Assigned", base="Forward Base Alpha", current_job_id="job-h203-swash"),
            Technician(id="tech-06", name="Sgt. Deepali Joshi", trade="Rotorcraft Systems", certification_level=2, shift="Evening", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-07", name="Cpl. S. Mukherjee", trade="Rotorcraft Systems", certification_level=1, shift="Night", status="On Leave", base="Support Depot Gamma"),
            Technician(id="tech-08", name="Master Sgt. K. Pillai", trade="Propulsion Specialist", certification_level=3, shift="Morning", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-09", name="Sgt. Rohan Kulkarni", trade="Propulsion Specialist", certification_level=2, shift="Evening", status="Available", base="Support Depot Gamma"),
            Technician(id="tech-10", name="Cpl. Tarun Das", trade="Propulsion Specialist", certification_level=2, shift="Night", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-11", name="Sgt. Neha Rawat", trade="Avionics Tech", certification_level=2, shift="Morning", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-12", name="Cpl. Farhan Ahmed", trade="Avionics Tech", certification_level=1, shift="Evening", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-13", name="Master Sgt. O. P. Yadav", trade="Structural Airframe Tech", certification_level=3, shift="Morning", status="Available", base="Forward Base Alpha"),
            Technician(id="tech-14", name="Sgt. George Mathew", trade="Structural Airframe Tech", certification_level=2, shift="Morning", status="Available", base="Support Depot Gamma"),
        ]

        # 4. Maintenance Bays (6 bays across 2 bases)
        self.bays = [
            MaintenanceBay(id="bay-fba-01", bay_name="Hangar Bay 1 (Heavy Jet)", base="Forward Base Alpha", status="Occupied", current_aircraft_id="gen-j102", estimated_clearance_hours=14.5),
            MaintenanceBay(id="bay-fba-02", bay_name="Hangar Bay 2 (Rotorcraft)", base="Forward Base Alpha", status="Occupied", current_aircraft_id="gen-h203", estimated_clearance_hours=26.0),
            MaintenanceBay(id="bay-fba-03", bay_name="Hangar Bay 3 (Fast Turnaround)", base="Forward Base Alpha", status="Available", current_aircraft_id=None, estimated_clearance_hours=0.0),
            MaintenanceBay(id="bay-fba-04", bay_name="Hangar Bay 4 (Avionics Cleanroom)", base="Forward Base Alpha", status="Available", current_aircraft_id=None, estimated_clearance_hours=0.0),
            MaintenanceBay(id="bay-sdg-01", bay_name="Depot Bay Alpha (Overhaul)", base="Support Depot Gamma", status="Available", current_aircraft_id=None, estimated_clearance_hours=0.0),
            MaintenanceBay(id="bay-sdg-02", bay_name="Depot Bay Beta (Composite/NDT)", base="Support Depot Gamma", status="Under Maintenance", current_aircraft_id=None, estimated_clearance_hours=48.0),
        ]

        # 5. Maintenance Jobs
        self.jobs = [
            MaintenanceJob(
                id="job-j102-hyd",
                aircraft_id="gen-j102",
                aircraft_tail="GEN-J102",
                component_id="jet-hydraulics",
                component_name="Main Hydraulic Circuit",
                title="P1: Hydraulic Circuit Return Manifold Replacement & Leakage Rectification",
                priority="P1 - Critical",
                status="In Progress",
                trade_required="Hydraulics Specialist",
                bay_required="Hangar Bay 1 (Heavy Jet)",
                parts_required=["HYD-SEAL-KIT-01", "PUMP-CORE-350"],
                estimated_duration_hours=18.0,
                bottleneck_type="spares",
                bottleneck_reason="Pump Core lead time delayed by 3 days. Awaiting warehouse issue voucher.",
                aircraft_days_impact=3.5
            ),
            MaintenanceJob(
                id="job-h203-swash",
                aircraft_id="gen-h203",
                aircraft_tail="GEN-H203",
                component_id="heli-main-rotor",
                component_name="Main Rotor Head & Swashplate",
                title="P1: Rotor Hub Swashplate Bearing Teardown & Dynamic Re-track",
                priority="P1 - Critical",
                status="Awaiting Parts",
                trade_required="Rotorcraft Systems",
                bay_required="Hangar Bay 2 (Rotorcraft)",
                parts_required=["ROTOR-BEARING-H12"],
                estimated_duration_hours=28.0,
                bottleneck_type="spares",
                bottleneck_reason="Zero stock for ROTOR-BEARING-H12 (11-day supplier lead time). Aircraft grounded.",
                aircraft_days_impact=8.0
            ),
            MaintenanceJob(
                id="job-j105-act",
                aircraft_id="gen-j105",
                aircraft_tail="GEN-J105",
                component_id="jet-control-surfaces",
                component_name="Aileron & Elevon Actuators",
                title="P2: Outboard Elevon Dual-Servo Calibration & Zero-Backlash Shim",
                priority="P2 - High",
                status="Queued",
                trade_required="Hydraulics Specialist",
                bay_required="Hangar Bay 3 (Fast Turnaround)",
                parts_required=["ELEVON-ACTUATOR-M4"],
                estimated_duration_hours=8.5,
                bottleneck_type="technicians",
                bottleneck_reason="Only 1 available Level-2 Hydraulics Specialist on current shift at Base Alpha.",
                aircraft_days_impact=1.8
            )
        ]

        # 6. Data Trust Records (Synthetic Sensor logs evaluated with grades A - D)
        # Separate hidden ground truth is maintained
        self.trust_records = [
            DataTrustRecord(
                record_id="DTR-901",
                aircraft_id="gen-j101",
                aircraft_tail="GEN-J101",
                component_id="jet-hydraulics",
                component_name="Main Hydraulic Circuit",
                metric_name="Circuit Line Pressure",
                timestamp=(datetime.now(timezone.utc) - timedelta(minutes=14)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                reported_value=210.4,
                unit="bar",
                quality_grade="A",
                issues_detected=[],
                requires_human_verification=False,
                hidden_ground_truth=210.2
            ),
            DataTrustRecord(
                record_id="DTR-902",
                aircraft_id="gen-j102",
                aircraft_tail="GEN-J102",
                component_id="jet-hydraulics",
                component_name="Main Hydraulic Circuit",
                metric_name="Circuit Line Pressure",
                timestamp=(datetime.now(timezone.utc) - timedelta(minutes=22)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                reported_value=174.1,
                unit="bar",
                quality_grade="A",
                issues_detected=[],
                requires_human_verification=False,
                hidden_ground_truth=173.8
            ),
            DataTrustRecord(
                record_id="DTR-903",
                aircraft_id="gen-j107",
                aircraft_tail="GEN-J107",
                component_id="jet-engine",
                component_name="Turbofan Propulsion Unit",
                metric_name="Exhaust Gas Temperature (EGT)",
                timestamp=(datetime.now(timezone.utc) - timedelta(days=3, hours=4)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                reported_value=682.0,
                unit="deg_C",
                quality_grade="C",
                issues_detected=["Stale timestamp (> 72h elapsed since last telemetry transponder packet)", "Telemetry packet check-sum discrepancy"],
                requires_human_verification=True,
                hidden_ground_truth=745.0 # Actual EGT is higher than old reported value
            ),
            DataTrustRecord(
                record_id="DTR-904",
                aircraft_id="gen-h204",
                aircraft_tail="GEN-H204",
                component_id="heli-gearbox",
                component_name="Main Transmission & Gearbox",
                metric_name="Reduction Gearbox Lube Pressure",
                timestamp=(datetime.now(timezone.utc) - timedelta(minutes=45)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                reported_value="N/A", # Missing field
                unit="bar",
                quality_grade="D",
                issues_detected=["Missing required float field", "Sensor transducer disconnected or power bus fault"],
                requires_human_verification=True,
                hidden_ground_truth=5.2
            ),
            DataTrustRecord(
                record_id="DTR-905",
                aircraft_id="gen-j109",
                aircraft_tail="GEN-J109",
                component_id="jet-fcs",
                component_name="Digital Flight Control Avionics",
                metric_name="Bus Transfer Jitter",
                timestamp=(datetime.now(timezone.utc) - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                reported_value=3200.0, # Inconsistent units (recorded in microseconds instead of milliseconds)
                unit="ms",
                quality_grade="C",
                issues_detected=["Inconsistent scale/units (3200ms implausible; likely microsecond encoding error)"],
                requires_human_verification=True,
                hidden_ground_truth=3.2
            ),
            DataTrustRecord(
                record_id="DTR-906",
                aircraft_id="gen-h203",
                aircraft_tail="GEN-H203",
                component_id="heli-main-rotor",
                component_name="Main Rotor Head & Swashplate",
                metric_name="Swashplate Bearing Radial Vibration",
                timestamp=(datetime.now(timezone.utc) - timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                reported_value=-4.5, # Implausible negative vibration
                unit="g_peak",
                quality_grade="D",
                issues_detected=["Negative vibration reading is physically impossible", "Inverted polarity signal wire or ADC saturation"],
                requires_human_verification=True,
                hidden_ground_truth=0.28
            )
        ]

        # 7. Initial Decision Ledger Log
        self.decision_ledger = [
            DecisionLedgerEntry(
                id="dec-init-01",
                timestamp=(datetime.now(timezone.utc) - timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                actor="system-init",
                action="INITIALIZE_FLEET_BASELINES",
                previous_state="OFFLINE",
                resulting_state="FLEET_MONITORED_24",
                notes="Seeded synthetic fleet baseline (14 jets, 10 helicopters across 3 squadrons and 2 bases).",
                scenario_id="baseline"
            ),
            DecisionLedgerEntry(
                id="dec-init-02",
                timestamp=(datetime.now(timezone.utc) - timedelta(hours=2, minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                actor="maintenance-officer-01",
                action="GROUND_AIRCRAFT_FOR_INSPECTION",
                previous_state="GEN-H203: READY",
                resulting_state="GEN-H203: MAINTENANCE",
                notes="Initiated mandatory rotor hub teardown following high vibration alert on swashplate bearing.",
                scenario_id="baseline"
            )
        ]

    def activate_scenario(self, scenario_id: ScenarioId) -> Dict[str, Any]:
        """Applies coherent state changes to fleet, inventory, bays, and trust based on scenario."""
        self.active_scenario = scenario_id
        
        # Reset to base seed first
        self._generate_all()
        
        if scenario_id == "baseline":
            pass # Default deterministic state

        elif scenario_id == "spares_constrained":
            # Severely deplete spare parts inventory and blow out lead times
            for sp in self.spares:
                if "hyd" in sp.id or "pump" in sp.id or "act" in sp.id or "rotor" in sp.id:
                    sp.quantity_on_hand = 0
                    sp.status = "Critical Shortage"
                    sp.lead_time_days = int(sp.lead_time_days * 2.8) + 5
            # Push 3 additional aircraft into delay
            self.aircraft_dict["gen-j101"].status = "ATTENTION"
            self.aircraft_dict["gen-j101"].active_issue = "Awaiting Hydraulic O-Ring Replacements"
            self.jobs[0].bottleneck_reason = "CRITICAL: Zero stock on seal kits nationwide. Lead time expanded to 16 days."
            self.jobs[0].aircraft_days_impact = 9.2

        elif scenario_id == "technician_constrained":
            # 60% of technicians marked On Leave / Deployed
            for tech in self.technicians:
                if tech.trade in ["Hydraulics Specialist", "Rotorcraft Systems"]:
                    tech.status = "On Leave"
                    tech.current_job_id = None
            self.jobs[1].bottleneck_type = "technicians"
            self.jobs[1].bottleneck_reason = "No certified Level 3 Rotorcraft Systems technician available on station."
            self.jobs[1].aircraft_days_impact = 12.0

        elif scenario_id == "bay_constrained":
            # 4 out of 6 bays unavailable / retrofitting
            self.bays[0].status = "Under Maintenance"
            self.bays[2].status = "Under Maintenance"
            self.bays[4].status = "Under Maintenance"
            for j in self.jobs:
                j.status = "Awaiting Bay"
                j.bottleneck_type = "bays"
                j.bottleneck_reason = "Depot and Forward hangar bays undergoing environmental seal upgrade."
                j.aircraft_days_impact += 4.5

        elif scenario_id == "poor_data_quality":
            # Corrupt sensor feeds and downgrade trust grades across 10 aircraft
            for ac in self.aircraft_dict.values():
                for c in ac.components:
                    if random.Random(self.seed + hash(c.id)).random() < 0.4:
                        c.data_trust_grade = "D"
            # Add degraded trust records
            self.trust_records.append(DataTrustRecord(
                record_id="DTR-SCEN-01",
                aircraft_id="gen-j101",
                aircraft_tail="GEN-J101",
                component_id="jet-engine",
                component_name="Turbofan Propulsion Unit",
                metric_name="Core Turbine Inlet Temp",
                timestamp=(datetime.now(timezone.utc) - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                reported_value=9999.0, # extreme implausible value
                unit="deg_C",
                quality_grade="D",
                issues_detected=["Extreme implausible value (9999°C exceeds physical melting point)", "Sensor bus ADC runaway"],
                requires_human_verification=True,
                hidden_ground_truth=940.0
            ))

        elif scenario_id == "campaign_recovery":
            # Surge fleet utilization to 92%, compress flight intervals
            for ac in self.aircraft_dict.values():
                ac.utilization_rate = min(0.95, ac.utilization_rate + 0.18)
                if ac.status == "READY":
                    ac.overall_health = max(75.0, ac.overall_health - 4.5)

        elif scenario_id == "disconnected_base":
            # Forward Base Alpha isolated from central supply line
            for sp in self.spares:
                sp.lead_time_days += 14
            for bay in self.bays:
                if bay.base == "Forward Base Alpha":
                    bay.estimated_clearance_hours += 24.0

        # Append to audit ledger
        self.decision_ledger.append(DecisionLedgerEntry(
            id=f"dec-scen-{len(self.decision_ledger)+1}",
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            actor="demo-ops-commander",
            action="ACTIVATE_SCENARIO",
            previous_state=f"Scenario: {self.active_scenario}",
            resulting_state=f"Scenario: {scenario_id}",
            notes=f"Simulated environmental / operational constraint activated: {scenario_id}",
            scenario_id=scenario_id
        ))

        return {"status": "success", "active_scenario": scenario_id}

# Global singleton database instance
fleet_db = SyntheticFleetDatabase()
