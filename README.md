# AirDoctor — Aircraft Health & Readiness Intelligence

[![Deploy AirDoctor to GitHub Pages](https://github.com/swiftcoder0/AIr-Doctor/actions/workflows/deploy.yml/badge.svg)](https://github.com/swiftcoder0/AIr-Doctor/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://swiftcoder0.github.io/AIr-Doctor/)

**Live Application Demo:** [https://swiftcoder0.github.io/AIr-Doctor/](https://swiftcoder0.github.io/AIr-Doctor/)  
**Repository:** [https://github.com/swiftcoder0/AIr-Doctor](https://github.com/swiftcoder0/AIr-Doctor)

**Classification Notice:** `SYNTHETIC / UNCLASSIFIED DATA` — This software is a non-operational prototype demonstration system. All aircraft designations, tail numbers, sensor readings, failure trends, supply quantities, and readiness models are fictional.

---

## Architecture Overview

AirDoctor is an enterprise aviation readiness intelligence platform that pairs 3D interactive airframe health exploration with deterministic supply chain simulation, human-in-the-loop data trust scoring, and an immutable decision ledger.

```
airdoctor/
├── backend/                       # Python FastAPI Backend
│   ├── generator.py               # Deterministic seeded synthetic fleet generator (24 aircraft)
│   ├── models.py                  # Pydantic schemas (Aircraft, Spares, Techs, Trust, Ledger)
│   ├── prediction_service.py      # Replaceable ML prediction service (Mock + Trained adapter)
│   ├── planner.py                 # Constraint engine, bottleneck ranker, and what-if calculator
│   ├── trust_engine.py            # Data trust grading (A-D) and human verification queue
│   ├── ledger.py                  # Append-only audit history log and CSV export
│   ├── main.py                    # FastAPI application and CORS middleware
│   └── tests/                     # Pytest suite verifying all API endpoints and calculations
├── src/                           # React 19 + TypeScript + Vite + Tailwind CSS Frontend
│   ├── components/
│   │   ├── Header/                # UnclassifiedBanner + Ops navigation header
│   │   ├── Sidebar/               # 5 Primary views: Command Center, 3D, Planner, Trust, Ledger
│   │   ├── Dashboard/             # Fleet summary metrics
│   │   ├── AircraftSelector/      # 24-aircraft fleet overview with multi-facet filters
│   │   ├── AircraftViewer/        # Generic 3D models (Jet & Helicopter) with exploded view
│   │   ├── HealthPanel/           # Radial circular health gauge
│   │   ├── ComponentStatus/       # Subsystem health breakdown
│   │   ├── ComponentDetail/       # Telemetry detail modal + ML prediction provenance
│   │   ├── Scenarios/             # 7 Operational scenario controls
│   │   ├── Planner/               # Readiness sandbox, what-if evaluator, bottleneck ranker
│   │   ├── DataTrust/             # Trust grades A-D, Verify First queue, anomaly flags
│   │   └── Ledger/                # Audit history timeline + CSV export
│   ├── data/                      # Client-side synthetic dataset mirrors
│   ├── services/                  # API client with seamless offline fallback
│   ├── types/                     # Comprehensive TypeScript data interfaces
│   └── App.tsx                    # Root layout and application state
├── public/models/                 # Preserved 3D model assets
└── package.json                   # Frontend dependencies
```

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20+ / v22+
- **Python**: 3.11+ / 3.12+ / 3.13+

### 2. Frontend Setup
```powershell
# Navigate to project root
cd c:\Users\aditya\Downloads\airdoctor

# Install npm dependencies (if not already installed)
npm install

# Run the development server
npm run dev
```
The frontend will start at **`http://127.0.0.1:5173/`**.

### 3. Backend Setup
```powershell
# In a separate terminal, navigate to project root
cd c:\Users\aditya\Downloads\airdoctor

# Install required Python packages
python -m pip install fastapi uvicorn pydantic pytest httpx

# Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is available at **`http://127.0.0.1:8000/api/docs`**.

### 4. Running Tests
```powershell
# Frontend build check
npm run build

# Backend pytest suite (10 automated tests)
python -m pytest backend/tests
```

---

## Supported Operational Scenarios

AirDoctor features 7 deterministic scenarios accessible via the top scenario control bar:

1. **Baseline Fleet Deployment**: Standard operational tempo across 24 generic aircraft (14 Jets, 10 Helicopters), 3 squadrons, and 2 bases. Nominal 75–83% readiness.
2. **Spares Constrained**: Severe supply chain bottleneck; hydraulic pump cores and swashplate bearings zeroed with 3x supplier lead time.
3. **Technician Constrained**: Surge exercise drains Level-2+ Hydraulics and Rotorcraft specialists from depot station; single-shift coverage delays repairs.
4. **Maintenance Bay Constrained**: Major hangar bay retrofits close 4 out of 6 bays; queue backlogs extend ground times.
5. **Poor Data Quality**: Telemetry transponder noise injects sensor scale errors, missing values, and negative readings, dropping trust grades and expanding the "Verify First" queue.
6. **Campaign Recovery Surge**: High operational surge increases fleet utilization to 92%, compressing maintenance intervals and heightening thermal stress.
7. **Disconnected Base**: Forward Base Alpha communication and replenishment links disrupted; forces reliance strictly on local spare buffers.

---

## Readiness Planner & What-If Sandbox

The Readiness Planner ranks resource bottlenecks by **estimated aircraft-days recovered**:
- Calculates projected readiness based on constraint programming.
- Interactive what-if controls allow adding/subtracting:
  - `±1 Spare Part` (e.g. Swashplate Duplex Bearing, Hydraulic Pump Core)
  - `±1 Technician` (e.g. Hydraulics Specialist, Rotorcraft Systems Tech)
  - `±1 Maintenance Bay` (e.g. Auxiliary Hangar Bay Slot)
- Side-by-side comparison displays baseline vs projected ready aircraft, readiness percentage, and net aircraft-days recovered.
- Approvals commit directly to the immutable Decision Ledger.

---

## Data Trust & "Verify First" Queue

AirDoctor enforces the safety principle: **Never treat low-quality data as trustworthy merely because a model returns an answer.**
- Grades synthetic records **A through D** based on timeliness, completeness, scale plausibility, and checksum validity.
- Detects anomalies: missing fields, stale timestamps (>48h), unit mismatches (e.g. microsecond vs millisecond jitter), and implausible values (negative vibration, extreme temperatures).
- Injected errors are kept strictly separate from hidden ground-truth values so models can be evaluated honestly.
- Flags high-risk records into the **Verify First** queue for mandatory human inspection prior to automated model acceptance.

---

## Decision Ledger & Audit Trail

- Append-only audit history recording every scenario change, work order generation, and what-if authorization.
- Fields: `Timestamp (UTC)`, `Actor`, `Action`, `Previous State`, `Resulting State`, `Notes`, `Scenario ID`.
- Downloadable CSV audit reports triggered directly from the UI or via `GET /api/ledger/export/csv`.

---

## Machine Learning Integration Contract

The backend contains a replaceable prediction service (`backend/prediction_service.py`) designed to interface with models trained in Jupyter/Python.

### Current Status: MOCK Mode
- Computes deterministic Remaining Useful Life (RUL) ranges and risk bands (`LOW`, `MEDIUM`, `HIGH`).
- Explicit feature vector:
  ```python
  {
      "component_health_score": float,
      "operating_hours": float,
      "trust_grade_numerical": float, # A: 1.0, B: 0.8, C: 0.5, D: 0.2
      "sensor_telemetry_inputs": dict
  }
  ```

### How to Connect a Trained Model:
1. Train your model in Jupyter (e.g. using scikit-learn, XGBoost, or PyTorch) and export the artifact (e.g., `model_rul.joblib` or `model_rul.onnx`) into `backend/data/`.
2. Open `backend/prediction_service.py` and instantiate `MLPredictionAdapter` with `mode="trained"` and `model_artifact_path="backend/data/model_rul.joblib"`.
3. Load the model inside `predict_component_health(...)` to replace the heuristic calculation without altering the API contract.
