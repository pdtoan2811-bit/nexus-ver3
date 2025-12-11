from typing import Dict, Any, List
import logging
import json
from .base import BaseAgent
from uuid import uuid4

logger = logging.getLogger(__name__)

class Architect(BaseAgent):
    """
    The Builder Agent.
    Creates Shadow Nodes (Proposals) based on requirements.
    """
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Drafts a new shadow node.
        Request params: {"title": "...", "description": "...", "type": "...", "parent_id": "..."}
        """
        action = request.get("action")
        params = request.get("params", {}) # Ensure params is a dict
        
        if params is None:
             # Fallback if params is None
             params = {}

        if action == "create_node":
            return await self.create_node(params)
        
        return {"error": f"Unknown action: {action}"}

    async def create_node(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates node content and creates a SHADOW node.
        """
        title = params.get("title", "Untitled Shadow Node")
        description = params.get("description", "No description provided.")
        node_type = params.get("type", "backend_task")
        
        # 1. Generate Rich Content via LLM
        system_instruction = self.prompt_registry.get(
            "architect_create",
            title=title,
            node_type=node_type,
            description=description
        ) if self.prompt_registry else "FATAL: No Prompt Registry"
        
        content = await self.generate_llm_response("Draft node content.", system_instruction)
        
        # 2. Create Node ID
        base_id = title.replace(" ", "_").upper()[:20]
        node_id = f"GHOST_{base_id}_{uuid4().hex[:4]}"
        
        # 3. Add to Weaver as Shadow Node
        # We also store the 'intended' relations if provided, though Link Smith usually handles edges.
        meta = {
            "title": title,
            "summary": description[:200], # Short summary
            "node_type": "child", # Default graph level
            "shadow_type": node_type, # Specific agent type
            "tags": ["shadow", "proposal", node_type]
        }
        
        try:
            self.weaver.add_shadow_node(node_id, content, meta)
            return {
                "status": "success",
                "node_id": node_id,
                "message": f"Shadow Node {node_id} created."
            }
        except Exception as e:
            logger.error(f"Architect failed to create node: {e}")
            return {"error": str(e)}
