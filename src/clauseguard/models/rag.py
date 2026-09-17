from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class StatutoryPolicy(BaseModel):
    """Immutable representation of a legal policy or compliance benchmark."""
    model_config = ConfigDict(frozen=True)

    policy_id: str
    jurisdiction: str
    policy_text: str

class AuditFinding(BaseModel):
    """
    Structured telemetry for a specific clause audit.
    Designed to be serialized directly to the Next.js presentation layer.
    """
    is_compliant: bool = Field(..., description="Boolean flag indicating if the clause passes statutory requirements.")
    violation_summary: Optional[str] = Field(None, description="Concise explanation of the compliance breach, if any.")
    redlined_proposal: Optional[str] = Field(None, description="LLM-generated counter-clause mitigating the risk.")
    reference_policies: List[str] = Field(default_factory=list, description="IDs of the matched ChromaDB policies.")