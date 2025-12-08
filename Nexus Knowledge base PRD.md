# **`Product Requirements Document (PRD)`**

## **`Project Name: Nexus Core – The Evidence-Based Knowledge Weaver`**

| `Document Metadata` | `Details` |
| :---- | :---- |
| `Product Owner` | `[Your Name]` |
| `Version` | `2.0 (Integrated Chat Module)` |
| `Last Updated` | `December 8, 2025` |
| `Status` | `Architecture & Design Phase` |
| `Core Tech Stack` | `Gemini 1.5 Flash (Reasoning), NetworkX (Graph Logic), React Flow (Visualization), LangChain (Chat History)` |

---

## **`1. Executive Summary`**

**`Nexus Core`** `is a "Reasoning Engine" that maps disconnected datasets (tickets, SRS, research) into a Justified Knowledge Graph.`

**`Version 2.0`** `introduces the Contextual Chat Module. This allows users to "program" the AI's context window visually. Instead of chatting with a generic bot, the user selects specific nodes on the graph (e.g., "Inventory Cluster") and defines a connection depth (F1/F2). The system then "hydrates" a chat session with only that specific knowledge, ensuring hyper-relevant, hallucination-free answers.`

### **`Key Value Proposition`**

* **`Visual Context Injection:`** `Don't just prompt; point. Select the exact data you want the AI to consider.`  
* **`Traceable Reasoning:`** `Every chat response cites the specific Graph Nodes used as context.`  
* **`Project-Based Memory:`** `Manage chat histories filtered by specific modules (e.g., "Chats regarding Tax Law" vs. "Chats regarding Mobile App").`

---

## **`2. Core Philosophy`**

1. **`Edge Reification:`** `A link is not a line; it is a document with evidence.`  
2. **`Graph-Native RAG:`** `The "Context Window" is not retrieved by fuzzy search; it is defined by Graph Topology (User Selection + Neighbor Depth).`

---

## **`3. System Architecture`**

### **`Component A: The Registry (The Constitution)`**

`A master configuration file defining the "Universe" (Entities, Rules, Logic).`

### **`Component B: The Weaver (The Logic Engine)`**

`Ingests data and builds the "Justified Graph" where every edge explains why it exists.`

### **`Component C: The Chat Bridge (The New Module)`**

`A dynamic context assembler.`

* **`Input:`** `User Selection (Nodes) + Depth Setting (F1/F2).`  
* **`Process:`** `Traverses the graph to gather "Justified Edges" and "Node Metadata" within the blast radius.`  
* **`Output:`** `A System Prompt containing a structured "Mini-Knowledge Base" for the specific session.`

---

## **`4. Functional Requirements`**

### **`4.1 Context Management & Reasoning`**

* **`FR-01 (Registry Load):`** `Initialize via project_context.yaml.`  
* **`FR-02 (Entity Normalization):`** `Resolve synonyms (e.g., "Shopee" = ENT-SHOPEE).`  
* **`FR-03 (Edge Justification):`** `Every link must have text explaining the connection and a confidence score.`

### **`4.2 The Chat Module (NEW)`**

* **`FR-04 (Visual Selection):`** `User must be able to "Lasso Select" or "Click-Select" multiple nodes on the graph canvas.`  
* **`FR-05 (Context Depth - F1/F2):`**  
  * **`Setting F0:`** `Context = Selected Nodes only.`  
  * **`Setting F1 (Direct Neighbors):`** `Context = Selected Nodes + All directly connected nodes.`  
  * **`Setting F2 (Extended Network):`** `Context = Selected Nodes + Neighbors + Neighbors of Neighbors.`  
* **`FR-06 (Chat Filtering):`** `Chat sessions must be tagged with the "Dominant Module" of the selected nodes (e.g., if 80% of context nodes are "Omnichannel", the chat is tagged "Omnichannel").`  
* **`FR-07 (Citation):`** `Chat responses must explicitly link back to Node IDs when making claims (e.g., "According to [SRS-4.2]...").`

### **`4.3 Chat History Management`**

* **`FR-08 (Session Persistence):`** `Chats are saved as objects linked to the Project ID.`  
* **`FR-09 (State Restoration):`** `Opening an old chat re-highlights the nodes that were used as its context on the graph.`

---

## **`5. UI/UX Specification`**

### **`5.1 The Split-Screen Workspace`**

`The screen is divided: Left 60% (Graph Canvas) | Right 40% (Chat Console).`

### **`5.2 The Graph Canvas (Context Selector)`**

* **`Interaction:`**  
  * `User holds Shift + Drag to select a cluster of red "Ticket Nodes".`  
  * `A floating toolbar appears: "Chat with Selection".`  
  * **`Depth Toggle:`** `A slider or button group: [ Just Selection ] | [ + Connected (F1) ] | [ + Extended (F2) ].`  
* **`Visual Feedback:`**  
  * **`Selected Nodes:`** `High contrast, glowing border.`  
  * **`Context Nodes (F1/F2):`** `Lower opacity glow (showing they are "in memory").`  
  * **`Ignored Nodes:`** `Dimmed/Greyscale (showing the AI is "blind" to them).`

### **`5.3 The Chat Console`**

* **`Header:`** `Shows the "Context Summary" (e.g., Memory: 12 Tickets, 2 SRS Docs).`  
* **`History Panel:`** `A sidebar drawer listing past chats.`  
  * *`Filters:`* `Dropdown to filter by Module (e.g., "Show only 'POS' chats").`  
  * *`Search:`* `Search text within past conversations.`  
* **`Message Input:`** `Standard chat interface.`  
* **`Response Area:`** `Text stream.`  
  * *`Feature:`* `Hovering over a citation [TICKET-99] in the chat highlights the node on the Graph Canvas (Left Screen).`

---

## **`6. Data Structures`**

### **`6.1 The "Chat Session" Object`**

`JSON`  
`{`  
  `"session_id": "CHAT-2025-12-08-001",`  
  `"project_id": "SAPO-PLATFORM-V1",`  
  `"created_at": "2025-12-08T14:30:00Z",`  
  `"title": "Investigating Shopee Sync Failures",`  
    
  `// The Logical Logic`  
  `"context_config": {`  
    `"selected_node_ids": ["TICKET-101", "TICKET-102", "TICKET-103"],`  
    `"neighbor_depth": "F1",`   
    `"resolved_context_node_ids": ["TICKET-101", "...", "SRS-SEC-4"] // The actual list fed to LLM`  
  `},`  
    
  `// The Organization Logic`  
  `"tags": {`  
    `"primary_module": "Omnichannel",`  
    `"topic_cluster": "Inventory Sync"`  
  `},`  
    
  `"messages": [] // Array of message objects`  
`}`

### **`6.2 The "Message" Object`**

`JSON`  
`{`  
  `"message_id": "MSG-005",`  
  `"role": "assistant",`  
  `"content": "The conflict arises because [TICKET-101] reports an immediate timeout, but [SRS-SEC-4] requires a 30s wait. We should adjust the config.",`  
  `"cited_nodes": ["TICKET-101", "SRS-SEC-4"] // Used for UI highlighting`  
`}`

---

## **`7. Operational Workflow (The User Journey)`**

1. **`The Hunt:`** `User sees a red cluster of bug tickets on the Graph.`  
2. **`The Selection:`** `User lassos the cluster.`  
3. **`The Context Setting:`**  
   * `User thinks: "Is this just a bug, or a logic error?"`  
   * `User selects Depth: F1 (Include direct neighbors).`  
   * *`Result:`* `The graph highlights the tickets AND the SRS documents linked to them.`  
4. **`The Conversation:`**  
   * `User clicks "Chat".`  
   * `Prompt: "Based on these tickets and the connected SRS, generate a fix proposal."`  
   * `Gemini (Contextualized): "The tickets indicate a timeout. However, the connected SRS [SRS-4] mandates a retry logic that isn't firing. This is an implementation bug, not a spec gap."`  
5. **`The Save:`** `User names the chat "Shopee Retry Analysis" and it is saved under the "Omnichannel" filter.`

