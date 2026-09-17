import logging
from pathlib import Path
from typing import List
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

from clauseguard.models.rag import StatutoryPolicy

logger = logging.getLogger(__name__)

class PolicyVectorStore:
    """
    In-memory / Local persistent vector store for statutory regulations.
    
    Architecture:
    - Uses ChromaDB's PersistentClient to maintain state across microservice reloads.
    - Employs sentence-transformers (all-MiniLM-L6-v2) for zero-cost, local vectorization.
    - Configured for Cosine Similarity (default) to match clause semantics against policy intent.
    """

    def __init__(self, storage_path: Path):
        self.storage_path = storage_path
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize persistent client targeting local disk
        self.client = chromadb.PersistentClient(
            path=str(self.storage_path),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Default local embedding function
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        # Get or create the collection for regulatory compliance
        self.collection = self.client.get_or_create_collection(
            name="statutory_policies",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"Vector store initialized at {self.storage_path}")

    def index_policies(self, policies: List[StatutoryPolicy]) -> None:
        """
        Embeds and indexes a batch of statutory policies.
        Upserts based on policy_id to prevent duplication during re-indexing.
        """
        if not policies:
            return

        ids = [p.policy_id for p in policies]
        documents = [p.policy_text for p in policies]
        metadatas = [{"jurisdiction": p.jurisdiction} for p in policies]

        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Successfully upserted {len(policies)} policies into vector space.")

    def retrieve_relevant_policies(self, query_text: str, top_k: int = 2) -> List[StatutoryPolicy]:
        """
        Executes a semantic K-Nearest Neighbors (KNN) search.
        
        Args:
            query_text: The extracted contract clause to audit.
            top_k: Number of most similar policies to retrieve.
            
        Returns:
            List[StatutoryPolicy]: The matched benchmark policies.
        """
        results = self.collection.query(
            query_texts=[query_text],
            n_results=top_k
        )

        policies = []
        if results and results['documents'] and results['documents'][0]:
            doc_list = results['documents'][0]
            id_list = results['ids'][0]
            meta_list = results['metadatas'][0]
            
            for i in range(len(doc_list)):
                policies.append(
                    StatutoryPolicy(
                        policy_id=id_list[i],
                        jurisdiction=meta_list[i].get("jurisdiction", "UNKNOWN"),
                        policy_text=doc_list[i]
                    )
                )
        return policies