import requests
import json

API_URL = "http://localhost:8002/api/v2"

def create_test_data():
    # 1. Create two nodes
    node1 = {"title": "Concept Alpha", "content": "This is the first concept."}
    node2 = {"title": "Concept Beta", "content": "This is the second concept."}
    
    # Ingest nodes
    r1 = requests.post(f"{API_URL}/ingest/text", json={"content": "Concept Alpha", "folder": "Inbox"})
    r2 = requests.post(f"{API_URL}/ingest/text", json={"content": "Concept Beta", "folder": "Inbox"})
    
    if r1.status_code == 200 and r2.status_code == 200:
        id1 = r1.json().get("node_id")
        id2 = r2.json().get("node_id")
        print(f"Created nodes: {id1}, {id2}")
        
        # 2. Create typed edge
        edge_payload = {
            "source": id1,
            "target": id2,
            "justification": "Testing Agree Link",
            "type": "agree"
        }
        r3 = requests.post(f"{API_URL}/ingest/edge", json=edge_payload)
        print(f"Create Edge Status: {r3.status_code} - {r3.text}")
        
    else:
        print("Failed to create nodes")

if __name__ == "__main__":
    create_test_data()
