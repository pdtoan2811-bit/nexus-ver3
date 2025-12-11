from typing import Dict, Any, List
import logging
from .base import BaseAgent

logger = logging.getLogger(__name__)

class TheReaper(BaseAgent):
    """
    The Cleaner Agent.
    Removes rejected Shadow Nodes or garbage collects isolated nodes.
    """
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        action = request.get("action")
        
        if action == "clear_shadow_graph":
            return await self.clear_shadow_graph()
        
        return {"error": f"Unknown action: {action}"}

    async def clear_shadow_graph(self) -> Dict[str, Any]:
        """
        Removes all Shadow Nodes (rejected proposals).
        """
        count = self.weaver.clear_shadow_nodes()
        return {
            "status": "success",
            "message": f"Reaped {count} shadow nodes."
        }
