import asyncio
import logging
import sys
import os
import requests

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.graph_logic import Weaver
from core.api_agents import AgentManager
from core.prompts import PromptRegistry

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("TestPrompts")

BASE_URL = "http://localhost:8000/api/v2/prompts"

def test_api():
    logger.info("Testing Prompt API...")
    
    # 1. List Prompts
    try:
        res = requests.get(BASE_URL)
        if res.status_code != 200:
            logger.error(f"Failed to list prompts: {res.text}")
            return
        logger.info(f"Listed prompts: {len(res.json())} found.")
    except Exception as e:
        # If server is not running, we cannot test API externally easily without request mocking
        # But for this environment, we assume server might NOT be running yet.
        # So we will verify the code logic via importing if requests fail.
        logger.warning(f"API Server likely not running ({e}). Testing Internal Logic instead.")
        test_internal_logic()
        return

    # 2. Update Prompt
    key = "nexus_prime_system"
    new_val = "You are a test agent."
    
    res = requests.post(f"{BASE_URL}/{key}", json={"value": new_val})
    if res.status_code == 200:
        logger.info("Updated prompt successfully.")
    else:
        logger.error(f"Failed to update prompt: {res.text}")
        
    # 3. Verify Persistence
    res = requests.get(f"{BASE_URL}/{key}")
    if res.json()["value"] == new_val:
        logger.info("Verification Successful: persistence working.")
    else:
        logger.error("Verification Failed: persistence mismatch.")

def test_internal_logic():
    logger.info("Testing PromptRegistry Internal Logic...")
    registry = PromptRegistry()
    
    # 1. Get Default
    val = registry.get("nexus_prime_system")
    logger.info(f"Default value length: {len(val)}")
    
    # 2. Update
    registry.update("nexus_prime_system", "TEST_VALUE")
    
    # 3. Verify
    val_new = registry.get("nexus_prime_system")
    if val_new == "TEST_VALUE":
        logger.info("Registry Update Successful.")
    else:
        logger.error("Registry Update Failed.")
        
    # 4. Check File Persistence
    # Reload registry
    reg2 = PromptRegistry()
    if reg2.get("nexus_prime_system") == "TEST_VALUE":
        logger.info("Persistence Validated (File I/O).")
    else:
         logger.error("Persistence Failed.")

if __name__ == "__main__":
    test_api()
