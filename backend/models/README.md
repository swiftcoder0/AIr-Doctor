# AirDoctor Machine Learning — Drop-In RUL Model Slot

This directory hosts trained Remaining Useful Life (RUL) regression models for military aircraft components (e.g. Rafale M88 turbofan, Tejas 210-bar hydraulic pumps, Uttam AESA radar TR modules).

## Target Model Artifact
**Expected File Path:** `backend/models/airdoctor_rul_lgbm.joblib`

When present, the AirDoctor backend automatically loads and prioritizes this LightGBM model via `joblib.load()`. When absent, AirDoctor transparently activates the high-fidelity deterministic physics-based RUL slot.

---

## Input Feature Contract
The model expects a 2D tabular array or pandas DataFrame with the following **6 numeric input features**:

| Feature Name | Type | Unit / Range | Description |
| :--- | :--- | :--- | :--- |
| `telemetry_temp` | `float` | `20.0 – 950.0 °C` | Exhaust gas temperature (EGT) or hydraulic reservoir temperature |
| `telemetry_vibration` | `float` | `0.1 – 8.0 mm/s` | High-frequency accelerometer RMS vibration reading |
| `telemetry_pressure` | `float` | `50.0 – 350.0 bar` | Hydraulic accumulator pressure or oil line pressure |
| `degradation_rate` | `float` | `0.05 – 0.65 %/h` | Wear accumulation gradient per operational flight hour |
| `health_score` | `float` | `0.0 – 100.0 %` | Current composite health score of the component |
| `future_hours` | `float` | `0.0 – 100.0 h` | Projected flight hours beyond current timestamp (`0`, `10`, `25`, `50`) |

---

## Output Contract
The model (or pipeline) should yield predictions mapped into the following dictionary:

```python
{
    "rul_p10": float,          # 10th percentile conservative lower bound (flight hours)
    "rul_p50": float,          # Median expected Remaining Useful Life (flight hours)
    "rul_p90": float,          # 90th percentile optimistic upper bound (flight hours)
    "risk_range_pct": float,   # Probability of impending mission-critical failure (0.0% – 100.0%)
    "shap_drivers": [          # Top 3 sensor attribution drivers (e.g., TreeSHAP / attribution values)
        {"name": "Hydraulic Cavitation Pressure", "contribution_pct": 48.0},
        {"name": "Return Line Temperature", "contribution_pct": 32.0},
        {"name": "RMS High-Frequency Vibration", "contribution_pct": 20.0}
    ]
}
```

---

## Example Python Training & Export Snippet
```python
import lightgbm as lgb
import joblib

# X shape: (N, 6), y shape: (N,)
model = lgb.LGBMRegressor(
    n_estimators=100,
    learning_rate=0.05,
    max_depth=5,
    random_state=42
)
model.fit(X_train, y_train)

# Save into backend drop-in slot
joblib.dump(model, "backend/models/airdoctor_rul_lgbm.joblib")
```

---

## Data-Trust Uncertainty Penalty
If unverified telemetry records with Quality Grade `C` or `D` exist for an aircraft in `DataTrustRecordORM`, AirDoctor automatically applies a **+12% wider confidence band penalty** (`trust_penalty_applied = True`) to account for sensor noise and data drift.
