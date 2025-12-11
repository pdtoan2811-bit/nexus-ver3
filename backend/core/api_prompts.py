from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List
from core.prompts import PromptRegistry

router = APIRouter(prefix="/api/v2/prompts", tags=["prompts"])

# We need a way to access the global prompt registry. 
# We'll rely on dependency injection or a global instance set in main.py
prompt_registry: PromptRegistry = None

def get_prompt_registry():
    if not prompt_registry:
        raise HTTPException(status_code=503, detail="Prompt Registry not initialized")
    return prompt_registry

class PromptUpdateRequest(BaseModel):
    value: str

@router.get("")
def list_prompts(registry: PromptRegistry = Depends(get_prompt_registry)):
    return registry.prompts

@router.get("/{key}")
def get_prompt(key: str, registry: PromptRegistry = Depends(get_prompt_registry)):
    if key not in registry.prompts:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"key": key, "value": registry.prompts[key]}

@router.post("/{key}")
def update_prompt(key: str, payload: PromptUpdateRequest, registry: PromptRegistry = Depends(get_prompt_registry)):
    registry.update(key, payload.value)
    return {"status": "success", "message": "Prompt updated", "key": key, "value": payload.value}
