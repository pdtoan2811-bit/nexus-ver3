# **`Software Requirements Specification (SRS)`**

## **`Project: Nexus Core v2.0 – Integrated Chat Module`**

| `Document Metadata` | `Details` |
| :---- | :---- |
| `Project Name` | `Nexus Core (The Evidence-Based Knowledge Weaver)` |
| `Module` | `Contextual Chat & Graph Visualization` |
| `Version` | `2.0.1` |
| `Status` | `Draft (Architecture Approved)` |
| `Author` | `[AI Assistant] for Product Owner` |
| `Date` | `December 8, 2025` |

---

## **`1. Introduction`**

### **`1.1 Purpose`**

`The purpose of this document is to define the functional and non-functional requirements for the Contextual Chat Module of Nexus Core. This module introduces a "Human-in-the-Loop" Context Window definition, allowing users to visually select graph nodes to construct a "Mini-Knowledge Base" for the Gemini 1.5 Flash reasoning engine.`

### **`1.2 Scope`**

`The scope includes:`

1. **`Frontend:`** `React Flow enhancements for "Lasso Selection" and visual state management (Active/Context/Ignored).`  
2. **`Backend:`** `The "Chat Bridge" logic that traverses NetworkX graphs based on F1/F2 depth settings.`  
3. **`Persistence:`** `Storage of chat sessions with their specific topological state (preserving the "moment" of the graph).`

### **`1.3 Definitions & Acronyms`**

* **`Graph-Native RAG:`** `Retrieval Augmented Generation where context is defined by explicit graph edges, not vector similarity search.`  
* **`Blast Radius:`** `The set of nodes included in the context based on the depth setting.`  
* **`F0 (Zero Depth):`** `Strictly the user-selected nodes.`  
* **`F1 (First Degree):`** `Selected nodes + direct neighbors.`  
* **`F2 (Second Degree):`** `Selected nodes + neighbors + neighbors of neighbors.`  
* **`Hydration:`** `The process of resolving Node IDs into full textual content for the LLM System Prompt.`

---

## **`2. System Architecture & Logic`**

### **`2.1 Logic Flow (The Chat Bridge)`**

`The system operates on a "Select $\rightarrow$ Traverse $\rightarrow$ Hydrate" pipeline.`

1. **`Input:`** `User selection vector [NodeIDs] + DepthInteger (0, 1, or 2).`  
2. **`Traversal:`**  
   * `The backend queries the Weaver (NetworkX instance).`  
   * `Calculates the subgraph $G'$ based on the depth setting.`  
   * `Filters edges based on confidence_score (Threshold defined in Registry).`  
3. **`Hydration:`**  
   * `Retrieves "Justified Edge" text (the logic explaining the link).`  
   * `Retrieves "Node Metadata" (content of the ticket/SRS).`  
4. **`Output:`** `A structured JSON context block injected into the Gemini System Instruction.`

---

## **`3. Functional Requirements`**

### **`3.1 Context Management & Graph Logic`**

**`REQ-LOG-01: Graph Topology Traversal`**

* `The system MUST support variable depth traversal using NetworkX.`  
* **`Input:`** `List of source_nodes.`  
* **`Logic:`**  
  * `IF Depth = F0: Return source_nodes.`  
  * `IF Depth = F1: Return source_nodes AND all target_nodes where edge exists.`  
  * `IF Depth = F2: Return result of F1 AND all immediate neighbors of F1 set.`

**`REQ-LOG-02: Blast Radius Calculation Limit`**

* `To prevent token overflow, the "Blast Radius" MUST be capped at a configurable token limit (default: 100k tokens).`  
* `If F2 expansion exceeds the limit, the system shall prioritize nodes with the highest edge_confidence score until the limit is reached.`

**`REQ-LOG-03: Dominant Module Tagging`**

* `The system shall analyze the module attribute of all nodes within the resolved context.`  
* `The Chat Session shall be automatically tagged with the module appearing in $>50\%$ of the context nodes.`  
* `If no module exceeds 50%, tag as "Cross-Module".`

### **`3.2 User Interface (React Flow & Workspace)`**

**`REQ-UI-01: Visual Selection (Lasso)`**

* `Users MUST be able to perform a "Lasso Select" (Shift + Drag) on the Graph Canvas.`  
* **`State: Selected:`** `Nodes inside the lasso render with a High Contrast Glowing Border (#FF0000 for Tickets, #00FF00 for SRS).`

**`REQ-UI-02: Visual Feedback for Context Depth`**

* `Upon selecting a Depth (F1/F2), the graph MUST update visually without losing the user's original selection.`  
* **`State: Implicit Context:`** `Nodes added via F1/F2 expansion render with a Low Opacity Glow (50%).`  
* **`State: Ignored:`** `All nodes outside the Blast Radius render in Grayscale/Dimmed opacity (20%).`

**`REQ-UI-03: Split-Screen Layout`**

* `The viewport shall be fixed at a 60% (Graph) / 40% (Chat) split.`  
* **`REQ-UI-03.a:`** `Hovering a citation link in the Chat (Right) MUST pan the Graph (Left) to center on the cited node.`

### **`3.3 Chat Interaction & Gemini Integration`**

**`REQ-CHAT-01: System Prompt Generation`**

* `The Chat Bridge MUST construct a dynamic system prompt for every new session containing:`  
  1. `The Role: "You are Nexus, an evidence-based reasoning engine."`  
  2. `The Constraint: "You must only answer based on the provided Context Nodes. Do not use outside knowledge."`  
  3. `The Data: The hydrated content of the calculated Blast Radius.`

**`REQ-CHAT-02: Citation Enforcement`**

* `The LLM output MUST follow a strict citation format: [NODE-ID].`  
* `The frontend MUST parse [NODE-ID] strings into clickable/hoverable elements.`

### **`3.4 Session Persistence`**

**`REQ-DATA-01: Snapshot Storage`**

* `Saving a chat session MUST save the resolved_context_node_ids.`  
* `It is NOT required to save the full graph state, only the IDs required to re-highlight the graph upon reloading the history.`

---

## **`4. External Interface Requirements`**

### **`4.1 API Endpoints (REST)`**

**`POST`** `/api/v2/chat/context`

* **`Purpose:`** `Calculates the blast radius before the chat begins.`

**`Payload:`**  
`JSON`  
`{`  
  `"selected_nodes": ["TICKET-101", "TICKET-102"],`  
  `"depth_mode": "F1"`  
`}`

*   
* **`Response:`** `Returns the list of context_nodes for UI highlighting and the session_id.`

**`POST`** `/api/v2/chat/message`

* **`Purpose:`** `Sends the prompt to Gemini.`

**`Payload:`**  
`JSON`  
`{`  
  `"session_id": "CHAT-123",`  
  `"user_prompt": "Analyze the retry logic."`  
`}`

* 

---

## **`5. Non-Functional Requirements (NFRs)`**

**`NFR-01: Traceability`**

* `100% of claims made by the AI must be traceable to a Graph Node. "Hallucination" (making claims without a node citation) is considered a critical bug.`

**`NFR-02: Latency`**

* `Graph Traversal (F1/F2 calculation) must complete in $< 200ms$ for graphs under 10,000 nodes.`  
* `Total "Time to First Token" from Gemini should be $< 3s$.`

**`NFR-03: Context Window Optimization`**

* `The system must strip unnecessary JSON keys from Node Metadata (e.g., created_at, modified_by) before sending to Gemini to conserve context window space, unless specifically relevant to the query.`

---

## **`6. Data Models`**

### **`6.1 Chat Session Schema`**

*`Implemented in MongoDB/PostgreSQL JSONB`*

`JSON`  
`{`  
  `"session_id": "String (UUID)",`  
  `"project_id": "String",`  
  `"meta": {`  
    `"created_at": "ISO8601",`  
    `"title": "String (Auto-generated or User-defined)",`  
    `"dominant_module": "String (e.g., 'Omnichannel')"`  
  `},`  
  `"graph_state": {`  
    `"root_selection": ["String (NodeIDs)"],`  
    `"depth_setting": "Enum(F0, F1, F2)",`  
    `"effective_context": ["String (NodeIDs)"] // The calculated blast radius`  
  `},`  
  `"messages": [`  
    `{`  
      `"id": "String (UUID)",`  
      `"role": "user | assistant",`  
      `"content": "String (Markdown)",`  
      `"citations": ["String (NodeID)"],`  
      `"timestamp": "ISO8601"`  
    `}`  
  `]`  
`}`

---

### **`Notes for Engineering`**

* **`The "Weaver" Metaphor:`** `In the UI, avoid generic terms like "Loading...". Use specific micro-copy like "Resolving Topology..." or "Hydrating Context..." to reinforce the product identity.`  
* **`Edge Reification:`** `Remember that in the backend, Edges are First-Class Citizens. When fetching context for F1, the text on the edge (the justification) is as important as the text in the node. Do not drop edge attributes.`

