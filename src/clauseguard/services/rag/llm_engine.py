import os
import json
import logging
import re
from typing import Optional
from groq import AsyncGroq, APIError

from clauseguard.models.document import ClauseSegment
from clauseguard.models.rag import AuditFinding, StatutoryPolicy

logger = logging.getLogger(__name__)

class ClauseAuditEngine:
    """
    Enterprise-grade Asynchronous LLM Orchestrator.
    
    Architecture Enhancements:
    - Utilizes 'openai/gpt-oss-20b' to bypass decommissioned LLaMA endpoints on the developer tier.
    - Implements a pre-and-post parsing regex pipeline to purge <think> tags and conversational leakage.
    - Employs strict JSON extraction to survive markdown-wrapped hallucinations.
    """

    SYSTEM_PROMPT = """You are an elite enterprise legal auditor.
Analyze the provided contract CLAUSE against the retrieved statutory POLICIES.
You MUST output ONLY a valid JSON object matching this exact schema:
{
  "is_compliant": boolean,
  "violation_summary": string or null (explain the breach concisely),
  "redlined_proposal": string or null (rewrite the clause to comply with the policies)
}
DO NOT use <think> tags. DO NOT output conversational filler."""

    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is missing. Check your .env file.")
        
        self.client = AsyncGroq(api_key=api_key)
        self.model_name = "openai/gpt-oss-120b"

    def _sanitize_string(self, text: Optional[str]) -> Optional[str]:
        """Purges residual AI monologue from parsed JSON strings."""
        if not text:
            return None
        # Aggressively strip internal reasoning tags if the LLM injected them inside the JSON values
        clean_text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
        # Strip common hallucinated prefixes
        clean_text = re.sub(r'^\s*(Here is the analysis|Explanation):?\s*', '', clean_text, flags=re.IGNORECASE)
        return clean_text.strip()

    async def evaluate_clause(self, clause: ClauseSegment, policies: list[StatutoryPolicy]) -> AuditFinding:
        """
        Executes the RAG prompt against the Groq API, scrubs the response of hallucinations, 
        and securely maps it to the strictly typed AuditFinding contract.
        """
        policy_context = "\n\n".join([f"[{p.policy_id}]: {p.policy_text}" for p in policies])
        
        user_prompt = f"""
POLICIES:
{policy_context if policy_context else "No specific statutory policies found. Use general legal best practices."}

CLAUSE TO AUDIT:
{clause.content}
"""
        try:
            response = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model_name,
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            
            raw_response = response.choices[0].message.content.strip()
            
            # 1. Pre-parsing sanitization to prevent malformed JSON crashes
            clean_payload = re.sub(r'<think>.*?</think>', '', raw_response, flags=re.DOTALL | re.IGNORECASE).strip()
            
            # 2. Failsafe for Markdown code block hallucinations
            if clean_payload.startswith("```json"):
                clean_payload = clean_payload.replace("```json", "").replace("```", "").strip()
            
            # 3. Secure deserialization
            parsed_data = json.loads(clean_payload)
            
            # 4. Post-parsing sanitization for nested string fields
            return AuditFinding(
                is_compliant=parsed_data.get("is_compliant", False),
                violation_summary=self._sanitize_string(parsed_data.get("violation_summary")),
                redlined_proposal=self._sanitize_string(parsed_data.get("redlined_proposal")),
                reference_policies=[p.policy_id for p in policies]
            )

        except APIError as e:
            logger.error(f"Groq Inference API Failure: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM payload: {raw_response}. Error: {e}")
            return AuditFinding(
                is_compliant=False,
                violation_summary="System Error: The inference engine failed to return a structurally valid payload.",
                redlined_proposal=None,
                reference_policies=[]
            )
        except Exception as e:
            logger.exception("Unexpected catastrophic failure in RAG orchestration.")
            raise