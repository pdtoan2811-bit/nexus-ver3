# Request Log

## Request ID: REQ-001
**Date:** 2025-12-08
**User Query:** "read and implement" (Initial Prototype)
**Deliverables:**
- Scaffolded Backend (FastAPI).
- Scaffolded Frontend (React + Tailwind).
- Implemented `Weaver` graph logic (F0-F2).
- Implemented `ChatBridge` with Gemini.
- Created `start_nexus.bat` for easy launch.

## Request ID: REQ-002
**Date:** 2025-12-08
**User Query:** "get me something like a bat file to run everything at once"
**Deliverables:**
- Created `start_nexus.bat`.

## Request ID: REQ-003
**Date:** 2025-12-08
**User Query:** "this is my key... use gemini flash 2.5"
**Deliverables:**
- Updated Backend to use `gemini-2.5-flash-preview-09-2025`.
- Updated batch file to set `GEMINI_API_KEY`.

## Request ID: REQ-004
**Date:** 2025-12-08
**User Query:** "Cant see the Frontend... fix bat file"
**Deliverables:**
- Refactored `start_nexus.bat` to handle Node.js installation detection and environment setup robustly.

## Request ID: REQ-005
**Date:** 2025-12-08
**User Query:** "remove placeholder data, file management system, ingest documents"
**Deliverables:**
- Removed seed data.
- Implemented Persistence (JSON).
- Implemented File Upload API & UI.
- Implemented Ingestion Logic.

## Request ID: REQ-006
**Date:** 2025-12-08
**User Query:** "why it takes forever to upload... fix"
**Deliverables:**
- Fixed `uvicorn` reload loop by moving data directory.
- Added absolute path resolution.
- Added debug logs.

## Request ID: REQ-007
**Date:** 2025-12-08
**User Query:** "stuck at uploading... fix"
**Deliverables:**
- Fixed `Content-Type` header issue in `api.js` (Boundary bug).
- Implemented `IngestionWidget` (Minimizable, Progress, Logs).
- Added timeouts and better error handling.

## Request ID: REQ-008 (Current)
**Date:** 2025-12-08
**User Query:** "Graph drag link not working, file content view, AI metadata parsing"
**Status:** In Progress
**Plan:**
1.  **Graph Interaction**: Implement `onConnect` in React Flow with a "Justification" prompt to create edges.
2.  **Node Viewer**: Add a UI component to view node content/metadata.
3.  **AI Ingestion**: Integrate Gemini to parse metadata (Title, Summary) during file upload.
