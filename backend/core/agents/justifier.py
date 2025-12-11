from typing import Dict, Any, List
import logging
import json
from .base import BaseAgent

logger = logging.getLogger(__name__)

class Justifier(BaseAgent):
    """
    The Compliance Agent.
    Validates Shadow Nodes against policies and constraints.
    """
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates a specific node or all shadow nodes.
        """
        action = request.get("action")
        params = request.get("params", {})
        
        if action == "validate_node":
            return await self.validate_node(params.get("node_id"))
        
        return {"error": f"Unknown action: {action}"}

    async def validate_node(self, node_id: str) -> Dict[str, Any]:
        """
        Checks a node for conflicts.
        """
        if not self.weaver.graph.has_node(node_id):
            return {"error": "Node not found"}
            
        node = self.weaver.graph.nodes[node_id]
        
        # 1. Retrieve Policies (For now, we simulate a policy doc or read a specific node)
        # In a real scenario, Cartographer would fetch "Policy" nodes.
        # We'll hardcode some logical constraints for the demo or use LLM "Common Sense".
        
        system_instruction = self.prompt_registry.get(
            "justifier_validate",
            title=node.get('title'),
            content=node.get('content')
        ) if self.prompt_registry else "FATAL: No Prompt Registry"
        
        response = await self.generate_llm_response("Validate properties.", system_instruction)
        
        try:
            result = json.loads(response)
            
            # If conflict, update the node metadata
            if result.get("status") == "conflict":
                updates = {
                    "status": "conflict", # Only shadow nodes usually have this, but we can flag real ones too
                    "conflict_reason": result.get("reason")
                }
                self.weaver.update_node(node_id, updates)
                
            return result
        except Exception as e:
            logger.error(f"Justifier validation failed: {e}")
            return {"error": str(e)}
