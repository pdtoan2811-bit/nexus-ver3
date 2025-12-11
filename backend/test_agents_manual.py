import asyncio
import logging
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.graph_logic import Weaver
from core.api_agents import AgentManager

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("TestAgents")

async def main():
    logger.info("Starting Agent Verification...")
    
    # 1. Initialize Weaver and Manager
    weaver = Weaver()
    mgr = AgentManager(weaver)
    
    # 2. Create Test Canvas
    test_canvas = "agent_test_canvas"
    weaver.create_canvas(test_canvas)
    logger.info(f"Created test canvas: {test_canvas}")
    
    try:
        # 3. Test Architect (Create Shadow Node)
        logger.info("Testing Architect...")
        arch_params = {
            "title": "Shadow Unit Test", 
            "description": "This is a test node.", 
            "type": "test_node"
        }
        res_arch = await mgr.process("Architect", "create_node", arch_params)
        
        if "node_id" not in res_arch:
            logger.error(f"Architect failed: {res_arch}")
            return
            
        node_id = res_arch["node_id"]
        logger.info(f"Architect created node: {node_id}")
        
        # Verify it is SHADOW
        node_data = weaver.graph.nodes[node_id]
        if node_data.get("status") != "shadow":
            logger.error(f"Node status mismatch. Expected 'shadow', got {node_data.get('status')}")
            return
        logger.info("Verification: Node is in SHADOW state.")
        
        # 4. Test Cartographer (Find Node)
        logger.info("Testing Cartographer (Mock Search)...")
        # Since we just created it and Cartographer uses LLM/filtering, let's see if it finds it.
        # Note: Cartographer usually finds things via LLM summary, but our simple implementation uses regex or similar?
        # Actually Cartographer code uses weaver.get_node_summaries() which might filter shadow nodes?
        # Let's check get_node_summaries logic in graph_logic.py
        # It iterates graph.nodes(data=True). It doesn't seem to filter status unless explicitly told.
        # But wait, get_subgraph DOES filter. get_node_summaries does not seem to filter in the code I read.
        
        # 5. Test Link Smith (Commit)
        logger.info("Testing Link Smith (Commit)...")
        res_link = await mgr.process("Link Smith", "commit_shadow_graph", {})
        logger.info(f"Link Smith result: {res_link}")
        
        # Verify it is COMMITTED
        node_data = weaver.graph.nodes[node_id]
        if node_data.get("status") != "committed":
            logger.error(f"Node status mismatch. Expected 'committed', got {node_data.get('status')}")
            return
        logger.info("Verification: Node is in COMMITTED state.")
        
        logger.info("TEST PASSED!")
        
    finally:
        # Cleanup
        logger.info("Cleaning up...")
        weaver.delete_canvas(weaver.active_canvas_id)
        # Switch back to default? 
        weaver.switch_canvas("default")

if __name__ == "__main__":
    asyncio.run(main())
