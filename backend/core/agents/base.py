from typing import Dict, Any, List, Optional
import logging
import os
import google.generativeai as genai
from abc import ABC, abstractmethod

# Fix import to be absolute based on where this file is
# backend/core/agents/base.py -> backend.core.graph_logic
from core.graph_logic import Weaver
# We avoid importing PromptRegistry here to avoid circular imports if Prompts use Agents (unlikely) 
# but type checking might want it. passing Any for now or rely on dynamic typing.

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """
    Abstract Base Class for all Nexus Agents.
    """
    def __init__(self, weaver: Weaver, prompt_registry=None):
        self.weaver = weaver
        self.prompt_registry = prompt_registry
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                # Using 1.5-flash as standard, can be overridden by subclasses
                self.model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                logger.error(f"Failed to configure Gemini in Agent {self.__class__.__name__}: {e}")

    async def generate_llm_response(self, prompt: str, system_instruction: str = None) -> str:
        """
        Helper to call LLM with error handling.
        """
        if not self.model:
            return "LLM Unavailable"
            
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"{system_instruction}\n\n{prompt}"
            
        try:
            response = await self.model.generate_content_async(full_prompt)
            return response.text.replace('```json', '').replace('```', '').strip()
        except Exception as e:
            logger.error(f"LLM Call failed in {self.__class__.__name__}: {e}")
            return f"Error: {str(e)}"

    @abstractmethod
    async def process_request(self, request: Any) -> Dict[str, Any]:
        """
        Main entry point for the agent's specific logic.
        """
        pass
