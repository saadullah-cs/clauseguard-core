import logging
from pathlib import Path
from fastapi import Request

from clauseguard.services.classifier import ClauseRiskClassifier
from clauseguard.services.rag.vector_store import PolicyVectorStore
from clauseguard.services.rag.llm_engine import ClauseAuditEngine

logger = logging.getLogger(__name__)

def get_classifier(request: Request) -> ClauseRiskClassifier:
    """Retrieves the globally instantiated Random Forest pipeline."""
    return request.app.state.classifier

def get_vector_store(request: Request) -> PolicyVectorStore:
    """Retrieves the globally instantiated ChromaDB client."""
    return request.app.state.vector_store

def get_audit_engine(request: Request) -> ClauseAuditEngine:
    """Retrieves the globally instantiated Groq asynchronous orchestrator."""
    return request.app.state.audit_engine