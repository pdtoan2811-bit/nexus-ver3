from typing import Dict, Any, List
import logging
import json
from .base import BaseAgent

logger = logging.getLogger(__name__)

class LinkSmith(BaseAgent):
    """
    The Connector Agent.
    Finalizes Shadow Nodes (Commits them) and creates real edges.
    """
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Commits nodes or creates edges.
        """
        action = request.get("action")
        params = request.get("params", {})
        
        if action == "commit_shadow_graph":
            return await self.commit_shadow_graph()
        elif action == "create_edge":
            return await self.create_edge(params)
        
        return {"error": f"Unknown action: {action}"}

    async def commit_shadow_graph(self) -> Dict[str, Any]:
        """
        Turns all VALID shadow nodes into committed nodes.
        """
        # 1. Get all shadow nodes
        shadow_nodes = [n for n, d in self.weaver.graph.nodes(data=True) if d.get("status") == "shadow"]
        
        committed_count = 0
        errors = []
        
        for node_id in shadow_nodes:
            # Re-validate with Justifier? Or assume user approval implies validation override.
            # We assume user clicked "Approve", so we force commit.
            if self.weaver.commit_shadow_node(node_id):
                committed_count += 1
            else:
                errors.append(f"Failed to commit {node_id}")
                
        # 2. Also logic for converting proposed edges (if we stored them in metadata) 
        # For now, we assume Architect creates 'intended' edges via Weaver's add_edge (which we might need to support 'shadow edges')
        # CURRENTLY: Weaver.add_edge makes real edges. We might want to add 'status' to edges too.
        # Requirement: "Ghost lines turn Solid".
        
        return {
            "status": "success",
            "committed_count": committed_count,
            "errors": errors
        }

    async def create_edge(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a manual edge.
        """
        source = params.get("source")
        target = params.get("target")
        justification = params.get("justification", "Linked by Agent")
        
        if self.weaver.add_edge(source, target, justification):
             return {"status": "success", "message": "Edge created"}
        else:
             return {"error": "Failed to create edge (check hierarchy/existence)"}
