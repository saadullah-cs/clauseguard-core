import pytest
from pathlib import Path
from unittest.mock import patch

from clauseguard.models.document import ClauseType
from clauseguard.parsers.pdf import LegalDocumentParser


@pytest.fixture
def mock_pdf_stream():
    """Simulates a complex multi-page document crossing clause boundaries."""
    return [
        (1, "This is the tender preamble.\nARTICLE I\nDefinitions\nContractor means the vendor."),
        (2, "Section 1.1\nScope\nThe scope spans multiple lines.\nARTICLE II\nTermination")
    ]


def test_state_machine_segmentation(mock_pdf_stream, tmp_path):
    """Validates heuristic boundary tracking and Pydantic object construction."""
    dummy_file = tmp_path / "mock_tender.pdf"
    dummy_file.touch()
    
    parser = LegalDocumentParser(dummy_file)
    
    # Inject the mocked generator directly into the extraction pipeline
    with patch.object(parser, '_stream_pages', return_value=iter(mock_pdf_stream)):
        result = parser.parse()
        
        assert result.filename == "mock_tender.pdf"
        assert len(result.segments) == 4
        
        # Node 1: Preamble flush
        assert result.segments[0].segment_id == "PREAMBLE"
        assert "tender preamble" in result.segments[0].content
        
        # Node 2: State transition to Article
        assert result.segments[1].segment_id == "ARTICLE I"
        assert result.segments[1].clause_type == ClauseType.ARTICLE
        assert result.segments[1].content == "Definitions Contractor means the vendor."
        
        # Node 3: State transition to Section
        assert result.segments[2].segment_id == "Section 1.1"
        assert result.segments[2].clause_type == ClauseType.SECTION
        
        # Node 4: Terminal flush
        assert result.segments[3].segment_id == "ARTICLE II"
        assert result.segments[3].content == "Termination"
        assert result.segments[3].page_start == 2