from typing import Dict, Any, List
import json
import logging
from .base import BaseAgent
from uuid import uuid4

logger = logging.getLogger(__name__)

class NexusPrime(BaseAgent):
    """
    The Manager Agent.
    Decomposes user requests into actionable tasks for other agents.
    """
    async def process_request(self, user_prompt: str) -> Dict[str, Any]:
        """
        Analyzes the user prompt and returns a plan.
        """
        # Get Structure Summary for context
        structure_summary = self.weaver.registry.get_structure_summary()
        
        system_instruction = self.prompt_registry.get(
            "nexus_prime_system", 
            structure_summary=structure_summary
        ) if self.prompt_registry else "FATAL: No Prompt Registry"
        
        response_text = await self.generate_llm_response(user_prompt, system_instruction)
        
        try:
            plan = json.loads(response_text)
            return plan
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Nexus Prime plan: {response_text}")
            return {"error": "Failed to generate plan", "raw_response": response_text}
