import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

from clauseguard.models.document import ClauseSegment, ClauseType
from clauseguard.models.rag import StatutoryPolicy
from clauseguard.services.rag.vector_store import PolicyVectorStore
from clauseguard.services.rag.llm_engine import ClauseAuditEngine

async def main():
    load_dotenv()
    
    if not os.environ.get("GROQ_API_KEY"):
        print("ERROR: GROQ_API_KEY not found in environment. Please add it to .env")
        return

    # 1. Initialize Vector Store
    storage_path = Path(__file__).resolve().parent.parent.parent.parent / "storage" / "chroma"
    vector_store = PolicyVectorStore(storage_path)
    
    # 2. Seed statutory policies
    benchmarks = [
        StatutoryPolicy(
            policy_id="FAR-52.249-2",
            jurisdiction="Federal",
            policy_text="The Government may terminate performance of work under this contract in whole or, from time to time, in part if the Contracting Officer determines that a termination is in the Government's interest. The contractor requires 30 days notice."
        ),
        StatutoryPolicy(
            policy_id="UCC-2-316",
            jurisdiction="Commercial",
            policy_text="To exclude or modify the implied warranty of merchantability, the language must mention merchantability and in case of a writing must be conspicuous."
        )
    ]
    vector_store.index_policies(benchmarks)
    
    # 3. Simulate an extracted high-risk clause
    risky_clause = ClauseSegment(
        segment_id="Section 4.1",
        clause_type=ClauseType.SECTION,
        content="The Client may terminate this agreement immediately at any time without prior written notice to the Vendor.",
        page_start=1,
        page_end=1
    )
    
    print(f"\nEvaluating Clause: {risky_clause.content}")
    
    # 4. Retrieve matching policies (RAG Step 1)
    relevant_policies = vector_store.retrieve_relevant_policies(risky_clause.content)
    print(f"\nRetrieved {len(relevant_policies)} relevant policies from ChromaDB.")
    
    # 5. Execute LLM Audit (RAG Step 2)
    audit_engine = ClauseAuditEngine()
    finding = await audit_engine.evaluate_clause(risky_clause, relevant_policies)
    
    print("\n--- LLM Audit Finding ---")
    print(finding.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(main())