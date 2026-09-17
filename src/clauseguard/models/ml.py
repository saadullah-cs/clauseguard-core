from enum import StrEnum
from pydantic import BaseModel, ConfigDict, Field


class RiskLevel(StrEnum):
    """Discrete risk categorization for dashboard visualization."""
    SAFE = "SAFE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ClauseCategory(StrEnum):
    """Target classes for the supervised classification model."""
    INDEMNITY = "INDEMNITY"
    TERMINATION = "TERMINATION"
    FORCE_MAJEURE = "FORCE_MAJEURE"
    LIABILITY_LIMITATION = "LIABILITY_LIMITATION"
    WARRANTY = "WARRANTY"
    GENERAL = "GENERAL"


class ClausePredictionResult(BaseModel):
    """
    Immutable representation of the ML inference result.
    Enforces risk score bounds and maps continuous probability to discrete risk levels.
    """
    model_config = ConfigDict(frozen=True)

    segment_id: str
    predicted_category: ClauseCategory
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Confidence/Severity metric")
    risk_level: RiskLevel

    @classmethod
    def compute_risk_level(cls, score: float) -> RiskLevel:
        """Determines the discrete risk echelon based on the continuous score."""
        if score < 20.0:
            return RiskLevel.SAFE
        elif score < 40.0:
            return RiskLevel.LOW
        elif score < 70.0:
            return RiskLevel.MEDIUM
        elif score < 90.0:
            return RiskLevel.HIGH
        return RiskLevel.CRITICAL