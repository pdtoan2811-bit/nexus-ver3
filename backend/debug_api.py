
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8002"

def test_endpoint(name, method, url, payload=None):
    print(f"Testing {name} [{method} {url}]...")
    try:
        start = time.time()
        if method == "GET":
            response = requests.get(f"{BASE_URL}{url}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{url}", json=payload)
        
        duration = time.time() - start
        print(f"  Status: {response.status_code}")
        print(f"  Time: {duration:.2f}s")
        if response.status_code == 200:
            print(f"  Success! Response snippet: {str(response.json())[:100]}")
        else:
            print(f"  ERROR: {response.text}")
    except Exception as e:
        print(f"  EXCEPTION: {e}")

if __name__ == "__main__":
    print(f"--- DIAGNOSTIC START ---")
    
    # 1. Test Prompts (Prompt Studio issue)
    test_endpoint("Get Prompts", "GET", "/api/v2/prompts")

    # 2. Test File Tree (New feature)
    test_endpoint("Get File Tree", "GET", "/api/v2/file-tree")
    
    # 3. Test Ingest (Add Node issue)
    test_endpoint("Ingest Text", "POST", "/api/v2/ingest/text", {
        "content": "Debug Node Content",
        "module": "Debug",
        "main_topic": "Debug"
    })
    
    print(f"--- DIAGNOSTIC END ---")
