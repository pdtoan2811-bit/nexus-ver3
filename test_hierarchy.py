import sys
import os

# Set encoding
sys.stdout.reconfigure(encoding='utf-8')

from backend.core.graph_logic import Weaver
import networkx as nx

def test_hierarchy():
    print("Initializing Weaver...")
    try:
        weaver = Weaver()
    except Exception as e:
        print(f"Failed to init Weaver (might need valid env): {e}")
        return

    # Create dummy nodes
    F1 = "TEST_F1"
    F2 = "TEST_F2"
    D1 = "TEST_D1"

    # Clean up previous run
    if weaver.graph.has_node(F1): weaver.delete_node(F1)
    if weaver.graph.has_node(F2): weaver.delete_node(F2)
    if weaver.graph.has_node(D1): weaver.delete_node(D1)

    # Add Test Nodes
    weaver.graph.add_node(F1, type="folder", label="Folder 1")
    weaver.graph.add_node(F2, type="folder", label="Folder 2")
    weaver.graph.add_node(D1, type="document", label="Doc 1")
    
    print("Nodes created.")

    # Test 1: Valid Folder -> Folder
    print("\n[Test 1] Folder -> Folder (Valid)")
    success = weaver.add_edge(F1, F2, "Parent of F2", type="contains")
    if success:
        print("PASS: Edge added.")
    else:
        print("FAIL: Edge rejected.")

    # Test 2: Valid Folder -> Document
    print("\n[Test 2] Folder -> Doc (Valid)")
    success = weaver.add_edge(F2, D1, "Parent of D1", type="contains")
    if success:
        print("PASS: Edge added.")
    else:
        print("FAIL: Edge rejected.")

    # Test 3: Invalid Document -> Folder (Hierarchy Rule)
    print("\n[Test 3] Doc -> Folder (Invalid Type)")
    success = weaver.add_edge(D1, F1, "Doc contains Folder?", type="contains")
    if not success:
        print("PASS: Edge rejected (Correct).")
    else:
        print("FAIL: Edge accepted (Should be rejected).")

    # Test 4: Cycle Detection
    print("\n[Test 4] Cycle (F2 -> F1 via contains)")
    # We have F1 -> F2. Adding F2 -> F1 should fail.
    success = weaver.add_edge(F2, F1, "Cycle attempt", type="contains")
    if not success:
        print("PASS: Cycle rejected.")
    else:
        print("FAIL: Cycle accepted.")

    # Cleanup
    weaver.delete_node(F1)
    weaver.delete_node(F2)
    weaver.delete_node(D1)

if __name__ == "__main__":
    test_hierarchy()
