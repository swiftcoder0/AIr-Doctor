import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.models import MockPredictionResponse, RiskLevel, TrustGrade

class MLPredictionAdapter:
    """
    Interface for ML model inference.
    Supports 'mock' mode currently, with full hook points for 'trained' mode
    once the model is trained in Jupyter and saved (e.g. joblib, onnx, or pytorch).
    """
    def __init__(self, mode: str = "mock", model_artifact_path: Optional[str] = None):
        self.mode = mode
        self.model_artifact_path = model_artifact_path
        self.model_version = "AirDoctor-Synthetic-RUL-v0.9.2-MOCK"

    def predict_component_health(
        self,
        aircraft_id: str,
        component_id: str,
        component_health: float,
        current_operating_hours: float,
        data_trust_grade: TrustGrade,
        sensor_values: Dict[str, float]
    ) -> MockPredictionResponse:
        """
        Executes feature preprocessing and inference.
        Returns Remaining Useful Life (RUL) range and risk category.
        """
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # 1. Feature Preprocessing (explicit order for training reproducibility)
        # Features: [current_health, log_operating_hours, trust_penalty, sensor_variance]
        feature_vector = {
            "component_health_score": component_health,
            "operating_hours": current_operating_hours,
            "trust_grade_numerical": {"A": 1.0, "B": 0.8, "C": 0.5, "D": 0.2}.get(data_trust_grade, 0.5),
            "sensor_telemetry_inputs": sensor_values
        }

        warnings: List[str] = [
            "SIMULATED ESTIMATE: Generated in MOCK inference mode using synthetic boundary parameters.",
            "Operational usage is strictly for non-critical demonstration and planning."
        ]

        if data_trust_grade in ["C", "D"]:
            warnings.append(f"UNRELIABLE INPUT: Low telemetry trust grade ({data_trust_grade}). Prediction confidence degraded.")

        # 2. Mock RUL Calculation based on physical health curve
        # Degraded components have compressed RUL horizons
        if component_health >= 90:
            min_rul = 280.0
            max_rul = 420.0
            risk_band: RiskLevel = "LOW"
            explanation = "Telemetry trend reflects nominal component health. Predicted degradation slope is flat across current operational cycle."
        elif component_health >= 78:
            min_rul = 120.0
            max_rul = 210.0
            risk_band: RiskLevel = "MEDIUM"
            explanation = "Moderate wear detected. Recommended to inspect seals and lubrication within standard 150-hour inspection window."
        else:
            min_rul = 14.0
            max_rul = 45.0
            risk_band: RiskLevel = "HIGH"
            explanation = "Accelerated wear indicator triggered. Degradation velocity exceeds nominal thresholds. Immediate depot service recommended."

        # Adjust for data trust grade
        if data_trust_grade in ["C", "D"]:
            # Widen error bounds due to sensor uncertainty
            min_rul = max(5.0, min_rul * 0.6)
            max_rul = max_rul * 1.4

        return MockPredictionResponse(
            aircraft_id=aircraft_id,
            component_id=component_id,
            model_mode="mock" if self.mode == "mock" else "trained",
            remaining_useful_life_range=[round(min_rul, 1), round(max_rul, 1)],
            risk_band=risk_band,
            horizon_criteria="Next 50 to 150 flight hours based on simulated sortie profiles",
            trust_grade=data_trust_grade,
            explanation=explanation,
            feature_provenance=feature_vector,
            model_version=self.model_version,
            prediction_timestamp=now_iso,
            warnings=warnings
        )

prediction_service = MLPredictionAdapter(mode="mock")
