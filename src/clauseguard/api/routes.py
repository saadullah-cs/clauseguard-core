import asyncio
import shutil
import tempfile
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from clauseguard.models.api import DocumentAnalysisResponse, ClauseAnalysisResult
from clauseguard.models.ml import RiskLevel
from clauseguard.models.document import ClauseGuardError, CorruptedDocumentError
from clauseguard.parsers.pdf import LegalDocumentParser
from clauseguard.services.classifier import ClauseRiskClassifier
from clauseguard.services.rag.vector_store import PolicyVectorStore
from clauseguard.services.rag.llm_engine import ClauseAuditEngine
from clauseguard.api.dependencies import get_classifier, get_vector_store, get_audit_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/analyze", tags=["Risk Engine"])

# Throttles concurrent LLM requests to prevent Groq API 429 Rate Limit crashes
CONCURRENCY_LIMIT = 5

@router.post("/", response_model=DocumentAnalysisResponse)
async def analyze_contract(
    file: UploadFile = File(...),
    classifier: ClauseRiskClassifier = Depends(get_classifier),
    vector_store: PolicyVectorStore = Depends(get_vector_store),
    audit_engine: ClauseAuditEngine = Depends(get_audit_engine)
) -> DocumentAnalysisResponse:
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF is supported.")

    # 1. Stream the file to disk chunk-by-chunk to prevent RAM exhaustion on 50MB+ files
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp_path = Path(tmp.name)
        try:
            shutil.copyfileobj(file.file, tmp)
        except Exception as e:
            logger.error(f"I/O Error during streaming upload: {e}")
            raise HTTPException(status_code=500, detail="Storage I/O failure.")
        finally:
            file.file.close()

    try:
        parser = LegalDocumentParser(tmp_path)
        extraction_result = parser.parse()
        
        if not extraction_result.segments:
            raise HTTPException(status_code=422, detail="No extractable text detected.")

        analysis_results: list[ClauseAnalysisResult] = []
        rag_tasks = []
        rag_indices = []
        semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

        # Semaphore-wrapped execution block
        async def bounded_audit(segment, policies):
            async with semaphore:
                return await audit_engine.evaluate_clause(segment, policies)

        for i, segment in enumerate(extraction_result.segments):
            prediction = classifier.predict(segment)
            
            if prediction.risk_level in (RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL):
                policies = vector_store.retrieve_relevant_policies(segment.content, top_k=2)
                coro = bounded_audit(segment, policies)
                rag_tasks.append(coro)
                rag_indices.append(i)
                analysis_results.append(ClauseAnalysisResult(segment=segment, classification=prediction))
            else:
                analysis_results.append(ClauseAnalysisResult(segment=segment, classification=prediction))

        if rag_tasks:
            logger.info(f"Throttling {len(rag_tasks)} LLM audit requests (Max Concurrency: {CONCURRENCY_LIMIT}).")
            audit_results = await asyncio.gather(*rag_tasks, return_exceptions=True)
            for idx_in_task_list, original_index in enumerate(rag_indices):
                audit = audit_results[idx_in_task_list]
                if isinstance(audit, Exception):
                    logger.warning(f"Audit failed for node {original_index}: {audit}")
                    continue
                current = analysis_results[original_index]
                analysis_results[original_index] = ClauseAnalysisResult(
                    segment=current.segment,
                    classification=current.classification,
                    audit=audit
                )

        # Failsafe for ZeroDivisionError if pipeline outputs zero parsed nodes
        if not analysis_results:
            raise HTTPException(status_code=422, detail="Extraction yielded zero valid clauses.")

        total_risk = sum(res.classification.risk_score for res in analysis_results)
        critical_count = sum(1 for res in analysis_results if res.classification.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL))

        return DocumentAnalysisResponse(
            document_name=file.filename,
            total_clauses=len(analysis_results),
            overall_risk_score=round(total_risk / len(analysis_results), 2),
            critical_flags=critical_count,
            results=analysis_results
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Catastrophic failure in analysis pipeline.")
        raise HTTPException(status_code=500, detail=f"Risk engine failure: {str(e)}")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()