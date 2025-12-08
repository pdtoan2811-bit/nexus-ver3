import networkx as nx
from typing import List, Dict, Set, Any
import logging
import json
import os
from datetime import datetime

logger = logging.getLogger(__name__)

# FIX: Use Absolute Path to prevent ambiguity
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Points to backend/
ROOT_DIR = os.path.dirname(BASE_DIR) # Points to project root/
DATA_DIR = os.path.join(ROOT_DIR, "data")
GRAPH_FILE = os.path.join(DATA_DIR, "nexus_graph.json")

class Weaver:
    """
    The Weaver (Logic Engine)
    Manages the NetworkX graph instance and provides traversal logic.
    Now supports Persistence (REQ-DATA-01).
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self._ensure_data_dir()
        self.load_graph()

    def _ensure_data_dir(self):
        if not os.path.exists(DATA_DIR):
            try:
                os.makedirs(DATA_DIR)
                logger.info(f"Created data directory at: {DATA_DIR}")
            except OSError as e:
                logger.error(f"Failed to create data directory: {e}")

    def save_graph(self):
        """Persists the current graph state to disk."""
        data = nx.node_link_data(self.graph)
        try:
            with open(GRAPH_FILE, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Graph saved to {GRAPH_FILE}")
        except Exception as e:
            logger.error(f"Failed to save graph: {e}")

    def load_graph(self):
        """Loads graph from disk or initializes empty."""
        if os.path.exists(GRAPH_FILE):
            try:
                with open(GRAPH_FILE, 'r') as f:
                    data = json.load(f)
                self.graph = nx.node_link_graph(data)
                logger.info(f"Graph loaded with {self.graph.number_of_nodes()} nodes.")
            except Exception as e:
                logger.error(f"Failed to load graph: {e}")
                self.graph = nx.DiGraph()
        else:
            logger.info("No existing graph found. Initializing empty.")
            self.graph = nx.DiGraph()

    def get_node_summaries(self, exclude_id: str = None) -> List[Dict[str, Any]]:
        """
        Returns a lightweight list of nodes for LLM analysis (ID, Title, Summary, Tags).
        Used for auto-linking context.
        """
        summaries = []
        for node_id, data in self.graph.nodes(data=True):
            if exclude_id and node_id == exclude_id:
                continue
            
            summaries.append({
                "id": node_id,
                "title": data.get("title", node_id),
                "summary": data.get("summary", ""),
                "tags": data.get("tags", []),
                "module": data.get("module", "General")
            })
        return summaries

    def add_document_node(self, filename: str, content: str, meta: Dict[str, Any] = None):
        """
        Ingests a document as a Node.
        """
        node_id = filename 
        
        base_name = os.path.splitext(filename)[0]
        if "-" in base_name:
             node_id = base_name.upper()

        attributes = {
            "type": "document",
            "content": content,
            "created_at": datetime.now().isoformat(),
            "module": "General" 
        }
        if meta:
            attributes.update(meta)
            
        self.graph.add_node(node_id, **attributes)
        self.save_graph()
        return node_id

    def add_edge(self, source: str, target: str, justification: str, confidence: float = 1.0):
        """
        Adds a justified edge between nodes.
        """
        if self.graph.has_node(source) and self.graph.has_node(target):
            self.graph.add_edge(source, target, justification=justification, confidence=confidence)
            self.save_graph()
            return True
        return False

    def delete_node(self, node_id: str) -> bool:
        """Deletes a node and its edges."""
        if self.graph.has_node(node_id):
            self.graph.remove_node(node_id)
            self.save_graph()
            return True
        return False

    def update_node(self, node_id: str, updates: Dict[str, Any]) -> bool:
        """Updates node attributes."""
        if self.graph.has_node(node_id):
            for key, value in updates.items():
                self.graph.nodes[node_id][key] = value
            self.save_graph()
            return True
        return False

    def delete_edge(self, source: str, target: str) -> bool:
        """Deletes an edge."""
        if self.graph.has_edge(source, target):
            self.graph.remove_edge(source, target)
            self.save_graph()
            return True
        return False

    def update_edge(self, source: str, target: str, updates: Dict[str, Any]) -> bool:
        """Updates edge attributes."""
        if self.graph.has_edge(source, target):
            nx.set_edge_attributes(self.graph, {(source, target): updates})
            self.save_graph()
            return True
        return False

    def get_subgraph(self, selected_node_ids: List[str], depth: int) -> Dict[str, Any]:
        """
        Calculates the subgraph based on depth setting (F0, F1, F2).
        REQ-LOG-01: Graph Topology Traversal
        """
        if not selected_node_ids:
            return {"nodes": [], "edges": []}

        valid_seeds = [n for n in selected_node_ids if self.graph.has_node(n)]
        
        context_nodes: Set[str] = set(valid_seeds)

        if depth == 0:
            pass
        elif depth == 1:
            for node in valid_seeds:
                neighbors = set(self.graph.neighbors(node)) | set(self.graph.predecessors(node))
                context_nodes.update(neighbors)
        elif depth == 2:
            f1_nodes = set(valid_seeds)
            for node in valid_seeds:
                neighbors = set(self.graph.neighbors(node)) | set(self.graph.predecessors(node))
                f1_nodes.update(neighbors)
            
            context_nodes.update(f1_nodes)
            for node in list(f1_nodes):
                if self.graph.has_node(node):
                    neighbors = set(self.graph.neighbors(node)) | set(self.graph.predecessors(node))
                    context_nodes.update(neighbors)
        
        subgraph = self.graph.subgraph(context_nodes)
        
        return {
            "nodes": [{"id": n, **subgraph.nodes[n]} for n in subgraph.nodes()],
            "edges": [{"source": u, "target": v, **subgraph.edges[u, v]} for u, v in subgraph.edges()]
        }
