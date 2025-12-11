import json
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Fix: Use correct relative path logic similar to other modules
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data") # project/data
PROMPTS_FILE = os.path.join(DATA_DIR, "prompts.json")

DEFAULT_PROMPTS = {
    "nexus_prime_system": """
        You are Nexus Prime, the Chief Architect of an AI Agent Squad.
        Your goal is to decompose a User Request into a set of specific atomic tasks for your squad.
        
        Squad Members:
        1. Cartographer (Navigator): Finds existing nodes/context.
        2. Architect (Builder): Creates new Shadow Nodes (Data/API/Tasks).
        3. Link Smith (Connector): Connects nodes together.
        4. Justifier (Logic): Validates nodes against policies.
        
        Current Graph Structure:
        {structure_summary}
        
        Output Schema (JSON):
        {{
            "intent": "Summary of user intent",
            "tasks": [
                {{
                    "agent": "Cartographer",
                    "action": "find_nodes",
                    "params": {{ "query": "Find User Table" }}
                }}
            ]
        }}
    """,
    "cartographer_search": """
        You are the Cartographer. Find the top 5 most relevant nodes for the query: "{query}"
        
        Candidates:
        {candidates_json}
        
        Return JSON List of IDs:
        ["node_id_1", "node_id_2"]
    """,
    "architect_create": """
        You are the Architect. Design a detailed specification for a new system node.
        
        Title: {title}
        Type: {node_type}
        Context/Description: {description}
        
        Output: Full markdown content for this node, including technical details, acceptance criteria, or schema definitions as appropriate.
    """,
    "justifier_validate": """
        You are the Justifier. Your job is to check for logical conflicts or policy violations.
        
        Node to Validate:
        Title: {title}
        Content: {content}
        
        Context/Policies:
        1. Max budget for rewards is $50.
        2. All APIs must use JSON.
        3. No hardcoded credentials.
        
        Task: Analyze the node content. If it violates any policy, return a WARNING.
        
        Output JSON:
        {{
            "status": "valid" OR "conflict",
            "reason": "Explanation of conflict if any, else 'No conflicts detected'."
        }}
    """,
    "link_smith_justify": """
        You are Nexus. A user is manually linking two nodes. Generate a concise justification for this connection.
        
        Source: {source_title}
        Target: {target_title}
        Hint: {user_hint}
    """
}

class PromptRegistry:
    """
    Manages loading and saving of system prompts.
    """
    def __init__(self):
        self._ensure_dir()
        self.prompts = self._load_prompts()

    def _ensure_dir(self):
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)

    def _load_prompts(self) -> Dict[str, str]:
        if os.path.exists(PROMPTS_FILE):
            try:
                with open(PROMPTS_FILE, 'r') as f:
                    data = json.load(f)
                    # Merge with defaults to ensure new prompts exist
                    merged = DEFAULT_PROMPTS.copy()
                    merged.update(data)
                    return merged
            except Exception as e:
                logger.error(f"Failed to load prompts: {e}")
                return DEFAULT_PROMPTS.copy()
        else:
            self._save_prompts(DEFAULT_PROMPTS)
            return DEFAULT_PROMPTS.copy()

    def _save_prompts(self, data: Dict[str, str]):
        try:
            with open(PROMPTS_FILE, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info("Prompts saved.")
        except Exception as e:
            logger.error(f"Failed to save prompts: {e}")

    def get(self, key: str, **kwargs) -> str:
        """
        Retrieves a prompt and optionally formats it with kwargs.
        If kwargs are provided, returns the formatted string.
        If no kwargs, returns the raw template.
        """
        template = self.prompts.get(key, DEFAULT_PROMPTS.get(key, ""))
        if not template:
            return f"MISSING PROMPT: {key}"
        
        if kwargs:
            try:
                return template.format(**kwargs)
            except KeyError as e:
                logger.error(f"Missing key for prompt format {key}: {e}")
                return template # Return raw if format fails
        return template

    def update(self, key: str, value: str):
        self.prompts[key] = value
        self._save_prompts(self.prompts)
