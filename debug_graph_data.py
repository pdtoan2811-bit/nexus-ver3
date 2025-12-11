import json
import networkx as nx
import os

# Path to the active graph file
# Based on graph_logic.py: DATA_DIR = nexus-ver 5/data
GRAPH_FILE = r"data\canvases\default\graph.json"
# Also check legacy path just in case
LEGACY_PATH = r"data\nexus_graph.json"

def inspect_nodes():
    path = GRAPH_FILE
    if not os.path.exists(path):
        print(f"Graph file not found at {path}. Checking legacy...")
        path = LEGACY_PATH
        if not os.path.exists(path):
            print("No graph file found.")
            return

    print(f"Loading graph from: {path}")
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        nodes = data.get("nodes", [])
        print(f"Total Nodes: {len(nodes)}")
        
        missing_type = []
        unknown_type = []
        valid_folders = 0
        valid_docs = 0
        
        for n in nodes:
            nid = n.get("id")
            ntype = n.get("type")
            
            if not ntype:
                missing_type.append(nid)
            elif ntype == "folder":
                valid_folders += 1
            elif ntype == "document":
                valid_docs += 1
            else:
                unknown_type.append(f"{nid} ({ntype})")
                
        print(f"Valid Folders: {valid_folders}")
        print(f"Valid Documents: {valid_docs}")
        
        if missing_type:
            print("\n[WARNING] Nodes with NO type (invisible to File Explorer):")
            for x in missing_type: print(f" - {x}")
            
        if unknown_type:
            print("\n[WARNING] Nodes with UNKNOWN type (invisible to File Explorer):")
            for x in unknown_type: print(f" - {x}")
            
    except Exception as e:
        print(f"Error reading graph: {e}")

if __name__ == "__main__":
    inspect_nodes()
