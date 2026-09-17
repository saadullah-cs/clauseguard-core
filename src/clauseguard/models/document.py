from enum import StrEnum
from typing import List
from pydantic import BaseModel, Field, ConfigDict


class ClauseGuardError(Exception):
    """Base exception for the ClauseGuard domain."""


class CorruptedDocumentError(ClauseGuardError):
    """Raised when PDF structure is unreadable, encrypted, or heavily malformed."""


class ClauseType(StrEnum):
    """Canonical classification for structural contract components."""
    HEADER = "HEADER"
    ARTICLE = "ARTICLE"
    SECTION = "SECTION"
    PARAGRAPH = "PARAGRAPH"
    UNKNOWN = "UNKNOWN"


class ClauseSegment(BaseModel):
    """
    Immutable representation of a segmented contract clause.
    Guarantees structural integrity before vectorization.
    """
    model_config = ConfigDict(frozen=True)

    segment_id: str = Field(..., description="Canonical ID (e.g., 'ARTICLE I', 'Section 1.1')")
    clause_type: ClauseType
    content: str = Field(..., min_length=1, description="Raw cleaned text of the clause")
    page_start: int
    page_end: int


class DocumentExtractionResult(BaseModel):
    """Payload representing a fully ingested and structurally verified contract."""
    model_config = ConfigDict(frozen=True)

    filename: str
    total_pages: int
    segments: List[ClauseSegment]