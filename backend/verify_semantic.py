
import requests
import json

BASE_URL = "http://localhost:8002/api/v2"

def create_note(content):
    res = requests.post(f"{BASE_URL}/ingest/text", json={"content": content, "folder": "SemanticTest"})
    res.raise_for_status()
    return res.json()["node_id"]

try:
    print("Creating nodes...")
    id_a = create_note("Opinion A")
    id_b = create_note("Opinion B")
    id_c = create_note("Counterpoint C")
    print(f"Nodes created: A={id_a}, B={id_b}, C={id_c}")

    print("Creating edges...")
    # A -> B (Agree)
    requests.post(f"{BASE_URL}/ingest/edge", json={
        "source": id_a,
        "target": id_b,
        "justification": "A agrees with B",
        "type": "agree"
    }).raise_for_status()

    # C -> A (Disagree)
    requests.post(f"{BASE_URL}/ingest/edge", json={
        "source": id_c,
        "target": id_a,
        "justification": "C disagrees with A",
        "type": "disagree"
    }).raise_for_status()

    # B -> C (Contains/Hierarchy)
    requests.post(f"{BASE_URL}/ingest/edge", json={
        "source": id_b,
        "target": id_c,
        "justification": "B contains C",
        "type": "contains"
    }).raise_for_status()

    print("Edges created successfully.")

except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
    if e.response is not None:
        print(f"Response: {e.response.text}")
    try:
        with open("debug_log.txt", "r") as f:
            print("--- Debug Log ---")
            print(f.read())
            print("-----------------")
    except:
        print("No debug log found.")
except Exception as e:
    print(f"Error: {e}")
