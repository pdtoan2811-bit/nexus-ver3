from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from core.agents import NexusPrime, Cartographer, Architect, Justifier, LinkSmith, TheReaper
from core.graph_logic import Weaver
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/agents", tags=["agents"])

# Schemas
class AgentRequest(BaseModel):
    agent_name: str
    action: str
    params: Optional[Dict[str, Any]] = {}
    
class AgentResponse(BaseModel):
    agent: str
    result: Dict[str, Any]

# Dependency to get Weaver instance (assuming it's a singleton or we pass the one from main)
# For simplicity, we'll create a new instance or reuse if we can inject. 
# Since Weaver is stateful (loads from disk), creating a new instance is "okay" but better to share.
# We will use a dependency injection pattern or import a global "weaver" if available.
# But `main.py` initializes `weaver`. 
# We'll import `weaver` from a shared module if we refactored, but since we didn't refactor `main.py` to export `weaver`,
# we will rely on the `request` state or similar. 
# Actually, the best way without major refactor is to import `weaver` from `main`? No, circular import.

# Solution: We will inject the weaver instance via a dependency override or just use the singleton nature if modified.
# However, Weaver in `graph_logic.py` is a class.
# Let's instantiate the agents here, but they need the SAME weaver instance as the main app.
# We can pass the weaver instance to the router function if we define the router factory.

class AgentManager:
    def __init__(self, weaver: Weaver, prompt_registry=None):
        self.weaver = weaver
        self.prompt_registry = prompt_registry
        self.agents = {
            "Nexus Prime": NexusPrime(weaver, prompt_registry),
            "Cartographer": Cartographer(weaver, prompt_registry),
            "Architect": Architect(weaver, prompt_registry),
            "Justifier": Justifier(weaver, prompt_registry),
            "Link Smith": LinkSmith(weaver, prompt_registry),
            "The Reaper": TheReaper(weaver, prompt_registry)
        }
        
    async def process(self, agent_name: str, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        agent = self.agents.get(agent_name)
        if not agent:
            available = list(self.agents.keys())
            # fuzzy match?
            return {"error": f"Agent '{agent_name}' not found.", "available_agents": available}
            
        request = {"action": action, "params": params}
        
        try:
            return await agent.process_request(request)
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return {"error": str(e)}

# We'll assign this in main.py
agent_manager: AgentManager = None 

def get_agent_manager():
    if not agent_manager:
        raise HTTPException(status_code=503, detail="Agent Manager not initialized")
    return agent_manager

@router.post("/execute", response_model=AgentResponse)
async def execute_agent(payload: AgentRequest, mgr: AgentManager = Depends(get_agent_manager)):
    """
    Directly execute an agent action.
    """
    result = await mgr.process(payload.agent_name, payload.action, payload.params)
    return {"agent": payload.agent_name, "result": result}

@router.post("/instruct")
async def instruct_squad(prompt: str, mgr: AgentManager = Depends(get_agent_manager)):
    """
    High-level instruction that goes to Nexus Prime first (Manager).
    """
    # 1. Nexus Prime generates Plan
    prime = mgr.agents["Nexus Prime"]
    plan = await prime.process_request(prompt)
    
    if "error" in plan:
        return {"status": "error", "plan": plan}
        
    # 2. Return plan to UI (Shadow Mode logic - we don't auto-execute tasks yet, or we do?)
    # "Customer View": "The AI's proposals... *Green Ghost*... *Red Ghost*"
    # This implies we might want to EXECUTE the "Architect" tasks to create Shadow Nodes immediately, 
    # but maybe not commit them.
    
    # Requirement: "The user sees the Graph... but also gets a peek at the Agent Processing Layer"
    # "Phase 1: Architecting... Architect (Builder) -> drafts shadow node"
    
    execution_results = []
    
    # Process tasks from plan
    tasks = plan.get("tasks", [])
    for task in tasks:
        agent_name = task.get("agent")
        action = task.get("action")
        params = task.get("params", {})
        
        if agent_name in mgr.agents:
            # We execute Architect/Cartographer tasks automatically to populate the UI
            if agent_name in ["Cartographer", "Architect", "Justifier"]:
                 res = await mgr.process(agent_name, action, params)
                 execution_results.append({"task": task, "result": res})
            else:
                 # Link Smith / Reaper tasks might be deferred until "Commit"?
                 # Or we execute them if the user asked to "Delete".
                 # For safety, let's execute everything that produces "Shadow" output.
                 pass
                 
    return {
        "status": "success",
        "intent": plan.get("intent"),
        "plan": tasks,
        "results": execution_results
    }
