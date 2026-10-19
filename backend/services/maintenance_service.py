import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.database import engine, Base
from backend.models import (
    MaintenanceWorkOrderORM,
    MaintenanceSignOffORM,
    DecisionLedgerORM,
    TechnicianORM,
    MaintenanceBayORM,
)
from backend.schemas import (
    MaintenanceWorkOrderSchema,
    MaintenanceStageSchema,
    MaintenancePartRequirementSchema,
    MaintenanceDocumentSchema,
    MaintenanceActivitySchema,
    MaintenanceBlockingItemSchema,
    MaintenanceKpiSchema,
    UpdateStageRequestSchema,
    InspectionSignOffRequestSchema,
    ConfirmPartReceiptRequestSchema,
    TechnicianRosterSchema,
    HangarBayStatusSchema,
)

SEED_WORK_ORDERS = [
    {
        "id": "WO-1042",
        "aircraft": "Tejas T-04",
        "aircraft_model": "Tejas Mk1A",
        "issue": "Landing Gear – Hydraulic Leak",
        "priority": "High",
        "current_stage": "Awaiting Parts",
        "stage_index": 4,
        "eta": "22 Oct 2026",
        "expected_completion": "22 Oct 2026, 16:00",
        "status": "In Progress",
        "assigned_team": "Bay 2 – Team Alpha",
        "assigned_bay": "Bay 2 (Quick-Turn)",
        "assigned_tech": "MWO R. Sharma",
        "opened_date": "20 Oct 2026, 09:15",
        "estimated_duration": "~ 48 hours",
        "delay_reason": "Waiting for Hydraulic Pump (REQ-2045) from Central Depot (BRD).",
        "linked_requests": "REQ-2045 (Hydraulic Pump)",
        "blocking_items": [
            {
                "id": "BLK-1",
                "name": "Hydraulic Pump – In Transit",
                "status": "In Transit",
                "link_tab": "parts-materials",
                "link_id": "REQ-2045",
            }
        ],
        "next_action": "Confirm part receipt and start repair.",
        "image_url": "/tejas_hangar.jpg",
        "stages": [
            {
                "step": 1,
                "name": "Work Order Created",
                "code": "WO_CREATED",
                "status": "completed",
                "actual_time": "20 Oct 09:15",
                "responsible": "Sqn Ldr. K. Verma (45 Sqn)",
                "notes": "Work order initialized following post-sortie telemetry check.",
            },
            {
                "step": 2,
                "name": "Aircraft Received",
                "code": "AIRCRAFT_RECEIVED",
                "status": "completed",
                "actual_time": "20 Oct 11:30",
                "responsible": "Hangar Line Crew",
                "notes": "Towed to Bay 2 and grounded on jack stands.",
            },
            {
                "step": 3,
                "name": "Inspection & Diagnosis",
                "code": "INSPECTION_DIAGNOSIS",
                "status": "completed",
                "actual_time": "20 Oct 14:00",
                "responsible": "MWO R. Sharma (Hydraulics Lead)",
                "notes": "Port main gear actuator seals cracked; pressure drop verified.",
            },
            {
                "step": 4,
                "name": "Awaiting Part (REQ-2045)",
                "code": "AWAITING_PARTS",
                "status": "blocked",
                "expected_time": "ETA: 21 Oct 10:00",
                "responsible": "Logistics Dispatch BRD Sulur",
                "blocker_detail": "Hydraulic Pump HYD-5562 in transit via C-130J flight IL-402.",
            },
            {
                "step": 5,
                "name": "Repair & Testing",
                "code": "REPAIR_TESTING",
                "status": "upcoming",
                "expected_time": "Planned: 21 Oct – 22 Oct",
                "responsible": "Team Alpha",
                "notes": "Actuator replacement and 3000 PSI pressure cycling test.",
            },
            {
                "step": 6,
                "name": "Inspection & Sign-off",
                "code": "INSPECTION_SIGNOFF",
                "status": "upcoming",
                "expected_time": "Target: 22 Oct 16:00",
                "responsible": "Quality Assurance Inspector",
                "notes": "Independent multi-point quality check and leak containment verification.",
            },
            {
                "step": 7,
                "name": "Return to Service",
                "code": "RETURN_TO_SERVICE",
                "status": "upcoming",
                "expected_time": "Pending",
                "responsible": "Chief Engineering Officer",
                "notes": "Final sortie clearance gate approval.",
            },
        ],
        "required_parts": [
            {
                "part_number": "HYD-5562",
                "part_name": "Hydraulic Pump",
                "required_qty": 1,
                "received_qty": 0,
                "status": "In Transit",
                "image_url": "/spares/hydraulic_pump.png",
                "linked_request_id": "REQ-2045",
            },
            {
                "part_number": "BRK-9812",
                "part_name": "Seal Kit",
                "required_qty": 2,
                "received_qty": 2,
                "status": "Received",
                "image_url": "/spares/brake_disc.png",
                "linked_request_id": "REQ-2042",
            },
            {
                "part_number": "FIT-4431",
                "part_name": "Mounting Bracket",
                "required_qty": 1,
                "received_qty": 0,
                "status": "Awaiting",
                "image_url": "/spares/fcs_actuator.png",
                "linked_request_id": "REQ-2049",
            },
        ],
        "related_documents": [
            {
                "id": "DOC-1042-WO",
                "title": "Work Order (WO-1042)",
                "file_type": "PDF",
                "file_size": "450 KB",
                "download_url": "#",
                "linked_ref": "WO-1042",
            },
            {
                "id": "DOC-1042-INSP",
                "title": "Inspection Report (Initial)",
                "file_type": "PDF",
                "file_size": "320 KB",
                "download_url": "#",
                "linked_ref": "REC-2026-1042",
            },
            {
                "id": "DOC-1042-DIAG",
                "title": "Diagnostic Notes",
                "file_type": "PDF",
                "file_size": "280 KB",
                "download_url": "#",
                "linked_ref": "DIAG-5501",
            },
            {
                "id": "DOC-1042-LOG",
                "title": "Linked Logistics Request",
                "file_type": "LOG",
                "file_size": "REQ-2045",
                "download_url": "#",
                "linked_ref": "REQ-2045",
            },
        ],
        "activity_log": [
            {
                "id": "ACT-4",
                "title": "Part dispatched from Central Depot",
                "timestamp": "21 Oct 2026, 08:45",
                "actor": "Central Depot (BRD)",
                "icon_type": "dispatch",
                "notes": "HYD-5562 loaded onto flight IL-402 with priority manifest.",
            },
            {
                "id": "ACT-3",
                "title": "Inspection completed",
                "timestamp": "20 Oct 2026, 14:00",
                "actor": "MWO R. Sharma",
                "icon_type": "inspection",
                "notes": "Failure localized to return valve seal ring.",
            },
            {
                "id": "ACT-2",
                "title": "Aircraft received by agency",
                "timestamp": "20 Oct 2026, 11:30",
                "actor": "Line Crew (Bay 2)",
                "icon_type": "received",
                "notes": "Safe grounding certificate signed.",
            },
            {
                "id": "ACT-1",
                "title": "Work order created",
                "timestamp": "20 Oct 2026, 09:15",
                "actor": "Sqn Ldr. K. Verma",
                "icon_type": "created",
                "notes": "Priority High assigned based on mission schedule.",
            },
        ],
        "base_id": "afs-ambala",
    },
    {
        "id": "WO-1038",
        "aircraft": "Rafale RB-01",
        "aircraft_model": "Rafale EH",
        "issue": "Engine Sensor Replacement",
        "priority": "High",
        "current_stage": "Repair & Testing",
        "stage_index": 5,
        "eta": "20 Oct 2026",
        "expected_completion": "20 Oct 2026, 18:00",
        "status": "In Progress",
        "assigned_team": "Bay 1 – Team Bravo",
        "assigned_bay": "Bay 1 (Depot)",
        "assigned_tech": "Sgt. V. Nair",
        "opened_date": "18 Oct 2026, 10:00",
        "estimated_duration": "~ 36 hours",
        "delay_reason": None,
        "linked_requests": "REQ-2038 (EGT Sensor)",
        "blocking_items": [],
        "next_action": "Execute turbine temperature sensor harness calibration.",
        "image_url": "/tejas_hangar.jpg",
        "stages": [
            {"step": 1, "name": "Work Order Created", "code": "WO_CREATED", "status": "completed", "actual_time": "18 Oct 10:00", "responsible": "Wg Cdr. Roy"},
            {"step": 2, "name": "Aircraft Received", "code": "AIRCRAFT_RECEIVED", "status": "completed", "actual_time": "18 Oct 12:00", "responsible": "Bay 1 Crew"},
            {"step": 3, "name": "Inspection & Diagnosis", "code": "INSPECTION_DIAGNOSIS", "status": "completed", "actual_time": "18 Oct 15:30", "responsible": "Sgt. V. Nair"},
            {"step": 4, "name": "Awaiting Part", "code": "AWAITING_PARTS", "status": "completed", "actual_time": "19 Oct 09:00", "responsible": "AFS Ambala Stores"},
            {"step": 5, "name": "Repair & Testing", "code": "REPAIR_TESTING", "status": "active", "expected_time": "20 Oct 18:00", "responsible": "Team Bravo"},
            {"step": 6, "name": "Inspection & Sign-off", "code": "INSPECTION_SIGNOFF", "status": "upcoming", "expected_time": "Target: 21 Oct 10:00", "responsible": "QA Inspector"},
            {"step": 7, "name": "Return to Service", "code": "RETURN_TO_SERVICE", "status": "upcoming", "expected_time": "Pending", "responsible": "Base Engineering Officer"},
        ],
        "required_parts": [
            {"part_number": "ENG-774A", "part_name": "Engine Control Unit", "required_qty": 1, "received_qty": 1, "status": "Received", "image_url": "/spares/ecu_774a.png"}
        ],
        "related_documents": [
            {"id": "DOC-1038", "title": "Engine Diagnostics Log", "file_type": "PDF", "file_size": "410 KB", "linked_ref": "WO-1038"}
        ],
        "activity_log": [
            {"id": "ACT-1038-2", "title": "Sensor harness installation commenced", "timestamp": "20 Oct 2026, 11:00", "actor": "Sgt. V. Nair", "icon_type": "update"},
            {"id": "ACT-1038-1", "title": "ECU replacement received from stores", "timestamp": "19 Oct 2026, 09:00", "actor": "Logistics Depot", "icon_type": "received"}
        ],
        "base_id": "afs-ambala",
    },
    {
        "id": "WO-1031",
        "aircraft": "Tejas T-12",
        "aircraft_model": "Tejas Mk1",
        "issue": "Avionics Module Repair",
        "priority": "Medium",
        "current_stage": "Inspection",
        "stage_index": 6,
        "eta": "19 Oct 2026",
        "expected_completion": "19 Oct 2026, 17:30",
        "status": "Inspection",
        "assigned_team": "Bay 3 – Avionics Lab",
        "assigned_bay": "Bay 3 (Avionics Clean Bay)",
        "assigned_tech": "Cpl. A. Sen",
        "opened_date": "16 Oct 2026, 14:20",
        "estimated_duration": "~ 24 hours",
        "delay_reason": None,
        "linked_requests": "REQ-2031 (Avionics Bus LRU)",
        "blocking_items": [],
        "next_action": "Complete final mil-bus diagnostic sign-off.",
        "image_url": "/tejas_hangar.jpg",
        "stages": [
            {"step": 1, "name": "Work Order Created", "code": "WO_CREATED", "status": "completed", "actual_time": "16 Oct 14:20", "responsible": "Sqn Ldr. Verma"},
            {"step": 2, "name": "Aircraft Received", "code": "AIRCRAFT_RECEIVED", "status": "completed", "actual_time": "16 Oct 16:00", "responsible": "Bay 3 Techs"},
            {"step": 3, "name": "Inspection & Diagnosis", "code": "INSPECTION_DIAGNOSIS", "status": "completed", "actual_time": "17 Oct 10:00", "responsible": "Cpl. A. Sen"},
            {"step": 4, "name": "Awaiting Part", "code": "AWAITING_PARTS", "status": "completed", "actual_time": "18 Oct 11:00", "responsible": "Central Depot"},
            {"step": 5, "name": "Repair & Testing", "code": "REPAIR_TESTING", "status": "completed", "actual_time": "19 Oct 13:00", "responsible": "Cpl. A. Sen"},
            {"step": 6, "name": "Inspection & Sign-off", "code": "INSPECTION_SIGNOFF", "status": "active", "expected_time": "19 Oct 17:30", "responsible": "Flt Lt. Nair"},
            {"step": 7, "name": "Return to Service", "code": "RETURN_TO_SERVICE", "status": "upcoming", "expected_time": "Target: 20 Oct", "responsible": "Engineering Officer"},
        ],
        "required_parts": [
            {"part_number": "AV-5510", "part_name": "Avionics Module", "required_qty": 1, "received_qty": 1, "status": "Received", "image_url": "/spares/avionics_module.png"}
        ],
        "related_documents": [
            {"id": "DOC-1031", "title": "Mil-STD-1553 Bus Verification", "file_type": "PDF", "file_size": "290 KB", "linked_ref": "WO-1031"}
        ],
        "activity_log": [
            {"id": "ACT-1031-1", "title": "Inspection checklist initiated", "timestamp": "19 Oct 2026, 14:00", "actor": "Flt Lt. Nair", "icon_type": "inspection"}
        ],
        "base_id": "afs-ambala",
    },
    {
        "id": "WO-1027",
        "aircraft": "Su-30MKI S-03",
        "aircraft_model": "Su-30MKI Flanker",
        "issue": "Brake System Overhaul",
        "priority": "High",
        "current_stage": "Completed",
        "stage_index": 7,
        "eta": "17 Oct 2026",
        "expected_completion": "17 Oct 2026, 15:00",
        "status": "Completed",
        "assigned_team": "Bay 1 – Team Bravo",
        "assigned_bay": "Bay 1 (Depot)",
        "assigned_tech": "Sgt. K. Pillai",
        "opened_date": "14 Oct 2026, 08:30",
        "estimated_duration": "~ 30 hours",
        "delay_reason": None,
        "linked_requests": "REQ-2027 (Carbon Brake Pack)",
        "blocking_items": [],
        "next_action": "Sortie gate released; log verified in Technical Records.",
        "image_url": "/tejas_hangar.jpg",
        "stages": [
            {"step": 1, "name": "Work Order Created", "code": "WO_CREATED", "status": "completed", "actual_time": "14 Oct 08:30", "responsible": "Line Engineering"},
            {"step": 2, "name": "Aircraft Received", "code": "AIRCRAFT_RECEIVED", "status": "completed", "actual_time": "14 Oct 10:00", "responsible": "Bay 1 Crew"},
            {"step": 3, "name": "Inspection & Diagnosis", "code": "INSPECTION_DIAGNOSIS", "status": "completed", "actual_time": "14 Oct 14:00", "responsible": "Sgt. K. Pillai"},
            {"step": 4, "name": "Awaiting Part", "code": "AWAITING_PARTS", "status": "completed", "actual_time": "15 Oct 11:00", "responsible": "ASP Chandigarh"},
            {"step": 5, "name": "Repair & Testing", "code": "REPAIR_TESTING", "status": "completed", "actual_time": "16 Oct 16:00", "responsible": "Team Bravo"},
            {"step": 6, "name": "Inspection & Sign-off", "code": "INSPECTION_SIGNOFF", "status": "completed", "actual_time": "17 Oct 12:00", "responsible": "Quality Officer"},
            {"step": 7, "name": "Return to Service", "code": "RETURN_TO_SERVICE", "status": "completed", "actual_time": "17 Oct 15:00", "responsible": "Air Commodore Sen"},
        ],
        "required_parts": [
            {"part_number": "BRK-9087", "part_name": "Brake Disc", "required_qty": 2, "received_qty": 2, "status": "Received", "image_url": "/spares/brake_disc.png"}
        ],
        "related_documents": [
            {"id": "DOC-1027", "title": "Brake System Sign-Off Certificate", "file_type": "PDF", "file_size": "520 KB", "linked_ref": "WO-1027"}
        ],
        "activity_log": [
            {"id": "ACT-1027-1", "title": "Returned to operational service", "timestamp": "17 Oct 2026, 15:00", "actor": "Air Commodore Sen", "icon_type": "signoff"}
        ],
        "base_id": "asp-chandigarh",
    },
    {
        "id": "WO-1025",
        "aircraft": "Rafale RB-04",
        "aircraft_model": "Rafale EH",
        "issue": "Fuel Pump Replacement",
        "priority": "Medium",
        "current_stage": "Awaiting Parts",
        "stage_index": 4,
        "eta": "24 Oct 2026",
        "expected_completion": "24 Oct 2026, 14:00",
        "status": "In Progress",
        "assigned_team": "Bay 4 – Propulsion",
        "assigned_bay": "Bay 4 (Engine Test Cell)",
        "assigned_tech": "JWO M. Gupta",
        "opened_date": "19 Oct 2026, 11:45",
        "estimated_duration": "~ 40 hours",
        "delay_reason": "Low pressure fuel booster pump in transit from HAL Nashik.",
        "linked_requests": "REQ-2025 (Fuel Pump Unit)",
        "blocking_items": [
            {"id": "BLK-2", "name": "Fuel Booster Pump – In Transit", "status": "In Transit", "link_tab": "parts-materials", "link_id": "REQ-2025"}
        ],
        "next_action": "Await fuel booster pump delivery and stage calibration rig.",
        "image_url": "/tejas_hangar.jpg",
        "stages": [
            {"step": 1, "name": "Work Order Created", "code": "WO_CREATED", "status": "completed", "actual_time": "19 Oct 11:45", "responsible": "Sqn Ldr. A. Sharma"},
            {"step": 2, "name": "Aircraft Received", "code": "AIRCRAFT_RECEIVED", "status": "completed", "actual_time": "19 Oct 13:30", "responsible": "Bay 4 Crew"},
            {"step": 3, "name": "Inspection & Diagnosis", "code": "INSPECTION_DIAGNOSIS", "status": "completed", "actual_time": "19 Oct 16:00", "responsible": "JWO M. Gupta"},
            {"step": 4, "name": "Awaiting Part", "code": "AWAITING_PARTS", "status": "blocked", "expected_time": "ETA: 22 Oct 11:00", "responsible": "HAL Nashik Depot", "blocker_detail": "Inter-base freight booked."},
            {"step": 5, "name": "Repair & Testing", "code": "REPAIR_TESTING", "status": "upcoming", "expected_time": "Planned: 22 Oct – 23 Oct", "responsible": "Propulsion Team"},
            {"step": 6, "name": "Inspection & Sign-off", "code": "INSPECTION_SIGNOFF", "status": "upcoming", "expected_time": "Target: 24 Oct 10:00", "responsible": "QA Officer"},
            {"step": 7, "name": "Return to Service", "code": "RETURN_TO_SERVICE", "status": "upcoming", "expected_time": "Pending", "responsible": "Engineering Officer"},
        ],
        "required_parts": [
            {"part_number": "HYD-2209", "part_name": "Fuel Pump Unit", "required_qty": 1, "received_qty": 0, "status": "In Transit", "image_url": "/spares/hydraulic_pump.png", "linked_request_id": "REQ-2025"}
        ],
        "related_documents": [
            {"id": "DOC-1025", "title": "Fuel System Flow Diagnostics", "file_type": "PDF", "file_size": "340 KB", "linked_ref": "WO-1025"}
        ],
        "activity_log": [
            {"id": "ACT-1025-1", "title": "Requisition submitted to HAL Nashik", "timestamp": "19 Oct 2026, 17:00", "actor": "Logistics Liaison", "icon_type": "dispatch"}
        ],
        "base_id": "afs-ambala",
    },
]

SEED_TECHNICIANS = [
    {
        "id": "tech-01",
        "name": "MWO R. Sharma",
        "badge_number": "IAF-ENG-4401",
        "trade": "Hydraulics & Flight Controls",
        "qualifications": ["Tejas Mk1A Master Cert", "High-Pressure Hydraulics", "Non-Destructive Testing Level II"],
        "shift": "Shift Alpha (06:00 - 14:00)",
        "status": "On Job",
        "assigned_work_order": "WO-1042",
        "assigned_aircraft": "Tejas T-04",
        "base_id": "afs-ambala",
        "experience_years": 16,
    },
    {
        "id": "tech-02",
        "name": "Sgt. V. Nair",
        "badge_number": "IAF-ENG-5112",
        "trade": "Propulsion & Turbofans",
        "qualifications": ["Snecma M88 Engine Cert", "AL-31FP Gas Turbine Lead", "FADEC Diagnostics"],
        "shift": "Shift Alpha (06:00 - 14:00)",
        "status": "On Job",
        "assigned_work_order": "WO-1038",
        "assigned_aircraft": "Rafale RB-01",
        "base_id": "afs-ambala",
        "experience_years": 12,
    },
    {
        "id": "tech-03",
        "name": "Cpl. A. Sen",
        "badge_number": "IAF-ENG-6204",
        "trade": "Avionics & Radar EW",
        "qualifications": ["Mil-STD-1553 Bus Specialist", "AESA Radar Alignment", "Glass Cockpit Line Test"],
        "shift": "Shift Bravo (14:00 - 22:00)",
        "status": "On Job",
        "assigned_work_order": "WO-1031",
        "assigned_aircraft": "Tejas T-12",
        "base_id": "afs-ambala",
        "experience_years": 7,
    },
    {
        "id": "tech-04",
        "name": "JWO M. Gupta",
        "badge_number": "IAF-ENG-4980",
        "trade": "Airframe & Composites",
        "qualifications": ["Carbon Composite Autoclave Repair", "Titanium Structural Welder", "Fuel Cell Sealing"],
        "shift": "Shift Bravo (14:00 - 22:00)",
        "status": "On Job",
        "assigned_work_order": "WO-1025",
        "assigned_aircraft": "Rafale RB-04",
        "base_id": "afs-ambala",
        "experience_years": 14,
    },
    {
        "id": "tech-05",
        "name": "Sgt. K. Pillai",
        "badge_number": "IAF-ENG-5430",
        "trade": "Mechanical & Undercarriage",
        "qualifications": ["Heavy Landing Gear Overhaul", "Pneumatic Brakes Lead", "Emergency Arrestor Systems"],
        "shift": "Shift Charlie (22:00 - 06:00)",
        "status": "Available",
        "assigned_work_order": None,
        "assigned_aircraft": None,
        "base_id": "asp-chandigarh",
        "experience_years": 11,
    },
    {
        "id": "tech-06",
        "name": "Cpl. D. Ghosh",
        "badge_number": "IAF-ENG-7102",
        "trade": "Electrical & Power Systems",
        "qualifications": ["Starter-Generator Overhaul", "Lithium Battery Safety", "Bus Transformer Inspection"],
        "shift": "Shift Alpha (06:00 - 14:00)",
        "status": "Available",
        "assigned_work_order": None,
        "assigned_aircraft": None,
        "base_id": "afs-ambala",
        "experience_years": 5,
    },
]

SEED_HANGAR_BAYS = [
    {
        "id": "bay-01",
        "name": "Bay 1 (Depot)",
        "bay_type": "Heavy Depot Bay",
        "status": "Occupied",
        "occupied_by": "Rafale RB-01",
        "active_job": "Engine Sensor Replacement (WO-1038)",
        "estimated_free_time": "Today, 18:00",
        "compatible_aircraft": ["Rafale EH", "Su-30MKI", "Tejas Mk1A"],
        "base_id": "afs-ambala",
        "environmental_control": True,
    },
    {
        "id": "bay-02",
        "name": "Bay 2 (Quick-Turn)",
        "bay_type": "Quick-Turn Maintenance Bay",
        "status": "Occupied",
        "occupied_by": "Tejas T-04",
        "active_job": "Landing Gear – Hydraulic Leak (WO-1042)",
        "estimated_free_time": "22 Oct 2026, 16:00",
        "compatible_aircraft": ["Tejas Mk1", "Tejas Mk1A", "Mirage 2000"],
        "base_id": "afs-ambala",
        "environmental_control": True,
    },
    {
        "id": "bay-03",
        "name": "Bay 3 (Avionics Clean Bay)",
        "bay_type": "Class 10,000 Clean Room Bay",
        "status": "Occupied",
        "occupied_by": "Tejas T-12",
        "active_job": "Avionics Module Repair (WO-1031)",
        "estimated_free_time": "Today, 17:30",
        "compatible_aircraft": ["Tejas Mk1A", "Rafale EH", "Su-30MKI"],
        "base_id": "afs-ambala",
        "environmental_control": True,
    },
    {
        "id": "bay-04",
        "name": "Bay 4 (Engine Test Cell)",
        "bay_type": "Acoustic Test Cell",
        "status": "Occupied",
        "occupied_by": "Rafale RB-04",
        "active_job": "Fuel Pump Replacement (WO-1025)",
        "estimated_free_time": "24 Oct 2026, 14:00",
        "compatible_aircraft": ["Rafale EH", "Su-30MKI"],
        "base_id": "afs-ambala",
        "environmental_control": True,
    },
    {
        "id": "bay-05",
        "name": "Bay 5 (Composite Bay)",
        "bay_type": "Composite Repair Facility",
        "status": "Available",
        "occupied_by": None,
        "active_job": None,
        "estimated_free_time": "Available Now",
        "compatible_aircraft": ["Tejas Mk1A", "Rafale EH"],
        "base_id": "afs-ambala",
        "environmental_control": True,
    },
    {
        "id": "bay-06",
        "name": "Bay 6 (Inspection Gate)",
        "bay_type": "Flight Clearance & Release Gate",
        "status": "Available",
        "occupied_by": None,
        "active_job": None,
        "estimated_free_time": "Available Now",
        "compatible_aircraft": ["All IAF Types"],
        "base_id": "afs-ambala",
        "environmental_control": False,
    },
]

def ensure_maintenance_seed_data(db: Session):
    """Populates Maintenance Control Centre ORM tables if currently empty."""
    Base.metadata.create_all(bind=engine)
    existing_count = db.query(MaintenanceWorkOrderORM).count()
    if existing_count == 0:
        for wo in SEED_WORK_ORDERS:
            orm_item = MaintenanceWorkOrderORM(
                id=wo["id"],
                aircraft=wo["aircraft"],
                aircraft_model=wo["aircraft_model"],
                issue=wo["issue"],
                priority=wo["priority"],
                current_stage=wo["current_stage"],
                stage_index=wo["stage_index"],
                eta=wo["eta"],
                expected_completion=wo["expected_completion"],
                status=wo["status"],
                assigned_team=wo["assigned_team"],
                assigned_bay=wo["assigned_bay"],
                assigned_tech=wo["assigned_tech"],
                opened_date=wo["opened_date"],
                estimated_duration=wo["estimated_duration"],
                delay_reason=wo["delay_reason"],
                linked_requests=wo["linked_requests"],
                next_action=wo["next_action"],
                image_url=wo.get("image_url", "/tejas_hangar.jpg"),
                stages_json=json.dumps(wo["stages"]),
                required_parts_json=json.dumps(wo["required_parts"]),
                related_documents_json=json.dumps(wo["related_documents"]),
                activity_log_json=json.dumps(wo["activity_log"]),
                blocking_items_json=json.dumps(wo["blocking_items"]),
                base_id=wo["base_id"],
            )
            db.add(orm_item)
        db.commit()


def get_maintenance_kpis(db: Session) -> MaintenanceKpiSchema:
    ensure_maintenance_seed_data(db)
    all_wos = db.query(MaintenanceWorkOrderORM).all()
    
    total = len(all_wos) or 12
    in_prog = sum(1 for w in all_wos if w.status == "In Progress") or 6
    awaiting_p = sum(1 for w in all_wos if "Awaiting" in w.current_stage or w.status == "Awaiting Parts") or 3
    ready_insp = sum(1 for w in all_wos if w.status == "Inspection" or w.stage_index == 6) or 2
    overdue = sum(1 for w in all_wos if w.delay_reason is not None and w.status != "Completed") or 1

    return MaintenanceKpiSchema(
        assigned_work_orders=total,
        assigned_delta="+2 Under Maintenance",
        in_progress=in_prog,
        awaiting_parts=awaiting_p,
        ready_for_inspection=ready_insp,
        overdue=overdue,
        is_demo_data=True,
    )


def _orm_to_schema(orm: MaintenanceWorkOrderORM) -> MaintenanceWorkOrderSchema:
    return MaintenanceWorkOrderSchema(
        id=orm.id,
        aircraft=orm.aircraft,
        aircraft_model=orm.aircraft_model,
        issue=orm.issue,
        priority=orm.priority,
        current_stage=orm.current_stage,
        stage_index=orm.stage_index,
        eta=orm.eta,
        expected_completion=orm.expected_completion,
        status=orm.status,
        assigned_team=orm.assigned_team,
        assigned_bay=orm.assigned_bay,
        assigned_tech=orm.assigned_tech,
        opened_date=orm.opened_date,
        estimated_duration=orm.estimated_duration,
        delay_reason=orm.delay_reason,
        linked_requests=orm.linked_requests,
        blocking_items=[MaintenanceBlockingItemSchema(**b) for b in json.loads(orm.blocking_items_json or "[]")],
        next_action=orm.next_action,
        image_url=orm.image_url or "/tejas_hangar.jpg",
        stages=[MaintenanceStageSchema(**s) for s in json.loads(orm.stages_json or "[]")],
        required_parts=[MaintenancePartRequirementSchema(**p) for p in json.loads(orm.required_parts_json or "[]")],
        related_documents=[MaintenanceDocumentSchema(**d) for d in json.loads(orm.related_documents_json or "[]")],
        activity_log=[MaintenanceActivitySchema(**a) for a in json.loads(orm.activity_log_json or "[]")],
        base_id=orm.base_id,
    )


def list_maintenance_work_orders(
    db: Session,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    search_query: Optional[str] = None,
) -> List[MaintenanceWorkOrderSchema]:
    ensure_maintenance_seed_data(db)
    query = db.query(MaintenanceWorkOrderORM)

    items = query.all()
    results = []
    for item in items:
        # Filter status
        if status_filter and status_filter.lower() not in ("all", ""):
            sf = status_filter.lower()
            if sf == "in progress" and item.status != "In Progress":
                continue
            elif sf == "awaiting parts" and "Awaiting" not in item.current_stage:
                continue
            elif sf == "inspection" and item.status != "Inspection":
                continue
            elif sf == "completed" and item.status != "Completed":
                continue

        # Filter priority
        if priority_filter and priority_filter.lower() not in ("all", ""):
            if item.priority.lower() != priority_filter.lower():
                continue

        # Search query
        if search_query and search_query.strip():
            sq = search_query.strip().lower()
            combined = f"{item.id} {item.aircraft} {item.aircraft_model} {item.issue} {item.current_stage} {item.assigned_team}".lower()
            if sq not in combined:
                continue

        results.append(_orm_to_schema(item))

    return results


def get_maintenance_work_order_by_id(db: Session, wo_id: str) -> Optional[MaintenanceWorkOrderSchema]:
    ensure_maintenance_seed_data(db)
    wo = db.query(MaintenanceWorkOrderORM).filter(MaintenanceWorkOrderORM.id == wo_id).first()
    if not wo:
        return None
    return _orm_to_schema(wo)


def update_work_order_stage(
    db: Session,
    req: UpdateStageRequestSchema,
    actor_name: str = "MWO R. Sharma",
) -> MaintenanceWorkOrderSchema:
    wo = db.query(MaintenanceWorkOrderORM).filter(MaintenanceWorkOrderORM.id == req.work_order_id).first()
    if not wo:
        raise ValueError(f"Work order {req.work_order_id} not found.")

    old_stage = wo.current_stage
    stages = json.loads(wo.stages_json or "[]")
    activity_log = json.loads(wo.activity_log_json or "[]")
    now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M")

    # Update stage array
    target_idx = req.target_stage_index
    for s in stages:
        if s["step"] < target_idx:
            s["status"] = "completed"
        elif s["step"] == target_idx:
            s["status"] = "active"
            if req.actual_time:
                s["actual_time"] = req.actual_time
            if req.responsible_person:
                s["responsible"] = req.responsible_person
            if req.notes:
                s["notes"] = req.notes
        else:
            s["status"] = "upcoming"

    wo.current_stage = req.stage_name
    wo.stage_index = target_idx

    # Update status accordingly
    if target_idx == 7:
        wo.status = "Completed"
        wo.next_action = "Aircraft flight line released."
    elif target_idx == 6:
        wo.status = "Inspection"
        wo.next_action = "Authorized QA inspector sign-off required."
    elif target_idx == 4:
        wo.status = "In Progress"
        wo.next_action = "Confirm part receipt from Logistics."
    else:
        wo.status = "In Progress"
        wo.next_action = f"Continue stage {req.stage_name}."

    # Record in Activity Log
    new_act = {
        "id": f"ACT-{uuid.uuid4().hex[:4].upper()}",
        "title": f"Stage advanced to {req.stage_name}",
        "timestamp": now_str,
        "actor": actor_name,
        "icon_type": "update",
        "notes": req.notes or f"Workflow progressed to Step {target_idx}.",
    }
    activity_log.insert(0, new_act)

    wo.stages_json = json.dumps(stages)
    wo.activity_log_json = json.dumps(activity_log)

    # Record in Decision Ledger
    ledger = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=actor_name,
        action="UPDATE_WORKFLOW_STAGE",
        previous_state=f"{wo.id}: Stage {old_stage}",
        resulting_state=f"{wo.id}: Stage {req.stage_name} (Step {target_idx})",
        notes=f"Advanced {wo.aircraft} to {req.stage_name}. Notes: {req.notes or 'None'}",
        base_id=wo.base_id,
        is_override=False,
    )
    db.add(ledger)
    db.commit()
    db.refresh(wo)
    return _orm_to_schema(wo)


def confirm_part_receipt_in_work_order(
    db: Session,
    req: ConfirmPartReceiptRequestSchema,
    actor_name: str = "Hangar Spares Custodian",
) -> MaintenanceWorkOrderSchema:
    wo = db.query(MaintenanceWorkOrderORM).filter(MaintenanceWorkOrderORM.id == req.work_order_id).first()
    if not wo:
        raise ValueError(f"Work order {req.work_order_id} not found.")

    parts = json.loads(wo.required_parts_json or "[]")
    blocking_items = json.loads(wo.blocking_items_json or "[]")
    activity_log = json.loads(wo.activity_log_json or "[]")
    stages = json.loads(wo.stages_json or "[]")
    now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M")

    # Update matching part
    found = False
    for p in parts:
        if p["part_number"] == req.part_number:
            p["received_qty"] = p.get("received_qty", 0) + req.quantity_received
            if p["received_qty"] >= p["required_qty"]:
                p["status"] = "Received"
            found = True

    if not found:
        raise ValueError(f"Part {req.part_number} is not listed in required parts for {wo.id}.")

    # If all parts received, resolve blocker
    all_received = all(p.get("received_qty", 0) >= p["required_qty"] for p in parts)
    if all_received:
        blocking_items = []
        wo.delay_reason = None
        # Advance stage from Awaiting Parts to Repair & Testing if active
        if wo.stage_index == 4:
            wo.stage_index = 5
            wo.current_stage = "Repair & Testing"
            wo.next_action = "Execute component replacement and testing."
            for s in stages:
                if s["step"] <= 4:
                    s["status"] = "completed"
                elif s["step"] == 5:
                    s["status"] = "active"

    # Add to Activity Log
    activity_log.insert(0, {
        "id": f"ACT-{uuid.uuid4().hex[:4].upper()}",
        "title": f"Part received: {req.part_number} (Qty: {req.quantity_received})",
        "timestamp": now_str,
        "actor": req.received_by or actor_name,
        "icon_type": "received",
        "notes": f"Part verified and inspected. Storage: {req.storage_location or 'Hangar Tool Bay 2'}.",
    })

    wo.required_parts_json = json.dumps(parts)
    wo.blocking_items_json = json.dumps(blocking_items)
    wo.activity_log_json = json.dumps(activity_log)
    wo.stages_json = json.dumps(stages)

    # Decision Ledger
    ledger = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=req.received_by or actor_name,
        action="CONFIRM_PART_RECEIPT",
        previous_state=f"{wo.id}: Awaiting {req.part_number}",
        resulting_state=f"{wo.id}: Received {req.part_number} x {req.quantity_received}",
        notes=f"Part receipt confirmed for {wo.id}. Storage: {req.storage_location or 'Bay 2'}.",
        base_id=wo.base_id,
        is_override=False,
    )
    db.add(ledger)
    db.commit()
    db.refresh(wo)
    return _orm_to_schema(wo)


def record_inspection_sign_off(
    db: Session,
    req: InspectionSignOffRequestSchema,
) -> MaintenanceWorkOrderSchema:
    wo = db.query(MaintenanceWorkOrderORM).filter(MaintenanceWorkOrderORM.id == req.work_order_id).first()
    if not wo:
        raise ValueError(f"Work order {req.work_order_id} not found.")

    now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M")
    sig_id = f"SIG-{uuid.uuid4().hex[:4].upper()}"

    # Log Sign-Off record
    signoff = MaintenanceSignOffORM(
        id=sig_id,
        work_order_id=wo.id,
        timestamp=now_str,
        inspector_name=req.inspector_name,
        inspector_service_id=req.inspector_service_id,
        result=req.result,
        checklist_json=json.dumps(req.checklist_items),
        notes=req.sign_off_notes,
        release_authorized=req.authorize_release,
    )
    db.add(signoff)

    stages = json.loads(wo.stages_json or "[]")
    activity_log = json.loads(wo.activity_log_json or "[]")

    if req.result == "PASSED" and req.authorize_release:
        wo.current_stage = "Return to Service"
        wo.stage_index = 7
        wo.status = "Completed"
        wo.next_action = "Sortie flight clearance authorized and signed."
        for s in stages:
            s["status"] = "completed"
    elif req.result == "PASSED":
        wo.current_stage = "Inspection & Sign-off"
        wo.stage_index = 6
        wo.status = "Inspection"
        wo.next_action = "Quality check passed; awaiting final commander release sign-off."
    else:
        wo.current_stage = "Repair & Testing"
        wo.stage_index = 5
        wo.status = "In Progress"
        wo.next_action = "Quality inspection failed; re-work required by maintenance team."

    activity_log.insert(0, {
        "id": f"ACT-{uuid.uuid4().hex[:4].upper()}",
        "title": f"Inspection sign-off: {req.result}",
        "timestamp": now_str,
        "actor": f"{req.inspector_name} ({req.inspector_service_id})",
        "icon_type": "signoff",
        "notes": req.sign_off_notes or f"Inspection completed with result: {req.result}.",
    })

    wo.stages_json = json.dumps(stages)
    wo.activity_log_json = json.dumps(activity_log)

    # Decision Ledger
    ledger = DecisionLedgerORM(
        id=f"dec-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        actor=f"{req.inspector_name} ({req.inspector_service_id})",
        action="INSPECTION_SIGN_OFF",
        previous_state=f"{wo.id}: Inspection Stage",
        resulting_state=f"{wo.id}: {req.result} (Release: {req.authorize_release})",
        notes=f"Inspection sign-off {sig_id} for {wo.aircraft}. {req.sign_off_notes}",
        base_id=wo.base_id,
        is_override=False,
    )
    db.add(ledger)
    db.commit()
    db.refresh(wo)
    return _orm_to_schema(wo)


def get_technicians_roster(db: Session) -> List[TechnicianRosterSchema]:
    return [TechnicianRosterSchema(**t) for t in SEED_TECHNICIANS]


def get_hangar_bays_status(db: Session) -> List[HangarBayStatusSchema]:
    return [HangarBayStatusSchema(**b) for b in SEED_HANGAR_BAYS]
