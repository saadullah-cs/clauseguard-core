from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from clauseguard.models.document import ClauseSegment
from clauseguard.models.ml import ClausePredictionResult, RiskLevel
from clauseguard.models.rag import AuditFinding

class ClauseAnalysisResult(BaseModel):
    """Aggregate domain object binding extraction, classification, and RAG verification."""
    model_config = ConfigDict(frozen=True)

    segment: ClauseSegment
    classification: ClausePredictionResult
    audit: Optional[AuditFinding] = Field(
        None, 
        description="Populated only if the classical ML pipeline flags the clause for deep LLM inspection."
    )

class DocumentAnalysisResponse(BaseModel):
    """Canonical HTTP response payload for the Next.js dashboard."""
    model_config = ConfigDict(frozen=True)

    document_name: str
    total_clauses: int
    overall_risk_score: float = Field(..., description="Weighted average of clause risk scores.")
    critical_flags: int
    results: List[ClauseAnalysisResult]