from typing import Dict, Any, List
import logging
from .base import BaseAgent

logger = logging.getLogger(__name__)

class Cartographer(BaseAgent):
    """
    The Navigator Agent.
    Finds relevant nodes in the graph to anchor new work.
    """
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a search/navigation request.
        Request params: {"query": "search term"}
        """
        action = request.get("action")
        params = request.get("params", {})
        
        if action == "find_nodes":
            return await self.find_nodes(params.get("query", ""))
        
        return {"error": f"Unknown action: {action}"}

    async def find_nodes(self, query: str) -> Dict[str, Any]:
        """
        Semantic search for nodes.
        For now, we will use a simple keyword/tag match or LLM-based filter if we had embeddings.
        Since we don't have embeddings yet, we'll use the LLM to 'filter' the lightweight node summaries.
        """
        # Get all node summaries
        candidates = self.weaver.get_node_summaries()
        
        # If no nodes, return empty
        if not candidates:
            return {"found_nodes": []}
            
        # Use LLM to filter
        candidates_json = str(candidates)[:10000] # truncate if too large
        
        system_instruction = self.prompt_registry.get(
            "cartographer_search",
            query=query,
            candidates_json=candidates_json
        ) if self.prompt_registry else "FATAL: No Prompt Registry"
        
        response = await self.generate_llm_response("Find relevant nodes.", system_instruction)
        
        try:
            import json
            found_ids = json.loads(response)
            # Verify they exist
            valid_ids = [nid for nid in found_ids if self.weaver.graph.has_node(nid)]
            
            # Fetch full details for these nodes
            result = []
            for nid in valid_ids:
                node = self.weaver.graph.nodes[nid]
                result.append({"id": nid, "title": node.get("title", nid), "summary": node.get("summary")})
                
            return {"found_nodes": result}
        except Exception as e:
            logger.error(f"Cartographer search failed: {e}")
            return {"found_nodes": [], "error": str(e)}
