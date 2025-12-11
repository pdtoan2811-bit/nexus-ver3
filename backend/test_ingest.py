import requests
import json

API_URL = "http://localhost:8002/api/v2"

def test_ingest():
    # Test with Unicode characters that previously caused crashes
    text = "Testing Unicode: Tiếng Việt, Español, 🚀 Rocket"
    
    print(f"Sending: {text}")
    try:
        response = requests.post(f"{API_URL}/ingest/text", json={"content": text, "folder": "Inbox"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_ingest()
