"""
Module: pdf.py
Proprietary Architecture Engineered by Saad Ullah
Enterprise Document Extraction & Deterministic OCR Pipeline.
"""

import logging
import re
from typing import Iterator, Tuple, List
from pathlib import Path
import pymupdf
from PIL import Image
import pytesseract

from clauseguard.models.document import (
    ClauseSegment,
    ClauseType,
    CorruptedDocumentError,
    DocumentExtractionResult
)

# Suppress noisy third-party logging in production
logging.getLogger("pymupdf").setLevel(logging.ERROR)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Configure Tesseract path for local Windows execution
import os
if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class LegalDocumentParser:
    MAX_CHUNK_LENGTH = 2500

    BOUNDARY_PATTERN = re.compile(
        r'^(ARTICLE|SECTION|CHAPTER|PART|CLAUSE|ANNEXURE)\s+([IVXLCDM]+|\d+(?:\.\d+)*)[\.\:\-]?\s+([A-Z].*)?$',
        re.IGNORECASE
    )

    def __init__(self, file_path: Path):
        self.file_path = file_path
        if not self.file_path.exists() or not self.file_path.is_file():
            raise FileNotFoundError(f"Target document not found: {self.file_path}")

    def _clean_ocr_artifacts(self, text: str) -> str:
        """Removes common scanner noise, watermarks, and trailing garbage."""
        text = re.sub(r'(?i)scanned with.*?camscanner', '', text)
        text = re.sub(r'(?i)page \d+ of \d+', '', text)
        text = re.sub(r'[_~^|]+', '', text)  # Strip vertical/horizontal line artifacts
        text = re.sub(r'\s+', ' ', text)      # Normalize internal spacing
        return text.strip()

    def _extract_via_vision_ocr(self, page: pymupdf.Page) -> str:
        """Deterministic OCR fallback using local Tesseract engine."""
        try:
            pix = page.get_pixmap(matrix=pymupdf.Matrix(2.0, 2.0))
            if pix.alpha:
                img = Image.frombytes("RGBA", [pix.width, pix.height], pix.samples)
            else:
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
            raw_text = pytesseract.image_to_string(img)
            return self._clean_ocr_artifacts(raw_text)
        except Exception as e:
            logger.error(f"Tesseract Engine Failure: {e}")
            return ""

    def _stream_pages(self) -> Iterator[Tuple[int, str]]:
        try:
            doc = pymupdf.open(str(self.file_path))
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = self._clean_ocr_artifacts(page.get_text())
                
                if len(text) < 50:
                    text = self._extract_via_vision_ocr(page)
                    
                if text:
                    yield page_num + 1, text
        except Exception as e:
            raise CorruptedDocumentError(f"I/O Failure reading PDF stream: {e}") from e

    def _recursive_split(self, text: str, base_id: str, start_page: int, end_page: int) -> List[ClauseSegment]:
        """Splits large blocks at natural sentence boundaries to prevent mid-word cuts."""
        if len(text) <= self.MAX_CHUNK_LENGTH:
            return [ClauseSegment(
                segment_id=base_id,
                clause_type=ClauseType.UNKNOWN if base_id.startswith("LOC") else ClauseType.PARAGRAPH,
                content=text,
                page_start=start_page,
                page_end=end_page
            )]

        segments = []
        # Strictly split on periods to maintain semantic integrity, falling back to spaces
        sentences = re.split(r'(?<=\.)\s+', text)
        
        current_build = ""
        chunk_index = 1
        
        for sentence in sentences:
            if len(current_build) + len(sentence) > self.MAX_CHUNK_LENGTH:
                segments.append(ClauseSegment(
                    segment_id=f"{base_id}.{chunk_index}",
                    clause_type=ClauseType.PARAGRAPH,
                    content=current_build.strip(),
                    page_start=start_page,
                    page_end=end_page
                ))
                current_build = sentence + " "
                chunk_index += 1
            else:
                current_build += sentence + " "
                
        if current_build.strip():
            segments.append(ClauseSegment(
                segment_id=f"{base_id}.{chunk_index}",
                clause_type=ClauseType.PARAGRAPH,
                content=current_build.strip(),
                page_start=start_page,
                page_end=end_page
            ))
        return segments

    def parse(self) -> DocumentExtractionResult:
        logger.info(f"[ClauseGuard Engine] Processing payload: {self.file_path.name}")
        segments: list[ClauseSegment] = []
        current_segment_id = "PREAMBLE"
        buffer: list[str] = []
        start_page = 1
        
        for page_num, page_text in self._stream_pages():
            for line in page_text.split('\n'):
                line = line.strip()
                if not line or len(line) < 10: 
                    continue
                    
                match = self.BOUNDARY_PATTERN.match(line)
                current_buffer_len = sum(len(b) for b in buffer)
                
                if (match and len(line) > 5) or current_buffer_len > self.MAX_CHUNK_LENGTH:
                    if buffer and current_buffer_len > 80: 
                        raw_text = " ".join(buffer).strip()
                        safe_segments = self._recursive_split(raw_text, current_segment_id, start_page, page_num)
                        segments.extend(safe_segments)
                        buffer.clear()

                    if match and len(line) > 5:
                        display_type = match.group(1).capitalize()
                        current_segment_id = f"{display_type} {match.group(2)}".strip()
                        start_page = page_num
                        if match.group(3):
                            buffer.append(match.group(3))
                    else:
                        # Replaced developer jargon "Chunk" with professional "LOC" (Location)
                        current_segment_id = f"LOC-P{page_num}"
                        start_page = page_num
                        buffer.append(line)
                else:
                    buffer.append(line)

        if buffer:
            raw_text = " ".join(buffer).strip()
            if len(raw_text) > 80: 
                safe_segments = self._recursive_split(raw_text, current_segment_id, start_page, start_page)
                segments.extend(safe_segments)

        logger.info(f"[ClauseGuard Engine] Finalized {len(segments)} nodes across {start_page} pages.")
        
        return DocumentExtractionResult(
            filename=self.file_path.name,
            total_pages=start_page,
            segments=segments
        )