import requests
import json

API_URL = "http://localhost:8002/api/v2"

def check_graph_edges():
    try:
        response = requests.get(f"{API_URL}/graph")
        if response.status_code == 200:
            data = response.json()
            edges = data.get("edges", [])
            print(f"Total Edges: {len(edges)}")
            for i, edge in enumerate(edges[:5]): # Print first 5
                print(f"Edge {i}: {json.dumps(edge, indent=2)}")
            
            # Check for specific types
            types = set(e.get("type", "N/A") for e in edges)
            print(f"\nFound Edge Types: {types}")
        else:
            print(f"Failed to fetch graph: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_graph_edges()
