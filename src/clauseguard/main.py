import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from clauseguard.api.routes import router as analyze_router
from clauseguard.services.classifier import ClauseRiskClassifier
from clauseguard.services.rag.vector_store import PolicyVectorStore
from clauseguard.services.rag.llm_engine import ClauseAuditEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

logging.getLogger("groq").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("watchfiles").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Instantiates ML models and vector indices into memory before accepting HTTP traffic.
    """
    load_dotenv()
    logger.info("Initializing ClauseGuard Microservices...")

    # Classical ML Pipeline
    model_dir = Path(__file__).resolve().parent.parent.parent / "models"
    classifier = ClauseRiskClassifier(model_dir=model_dir)
    classifier.load_model()
    app.state.classifier = classifier

    # Vector DB
    storage_path = Path(__file__).resolve().parent.parent.parent / "storage" / "chroma"
    vector_store = PolicyVectorStore(storage_path)
    app.state.vector_store = vector_store

    # LLM Orchestrator
    audit_engine = ClauseAuditEngine()
    app.state.audit_engine = audit_engine

    logger.info("Microservices successfully bound to application state. Ready for traffic.")
    yield

    logger.info("Shutting down microservices. Releasing memory.")

def create_app() -> FastAPI:
    app = FastAPI(
        title="ClauseGuard Risk Engine",
        description="Automated Public Tender & Contract Risk Analyzer",
        version="0.1.0",
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analyze_router)
    
    @app.get("/health", tags=["Telemetry"])
    async def health_check():
        """Lightweight readiness probe for cloud monitoring and pre-warming."""
        return {"status": "operational", "engine": "ClauseGuard Core", "version": "1.0.0"}

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("clauseguard.main:app", host="0.0.0.0", port=8000, reload=True)