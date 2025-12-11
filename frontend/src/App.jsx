import React, { useState, useEffect, useCallback, useRef } from 'react';
import GraphCanvas from './components/GraphCanvas';
import ChatInterface from './components/ChatInterface';
import IngestionWidget from './components/IngestionWidget';
import EdgeInspector from './components/EdgeInspector';
import FileExplorer from './components/FileExplorer';



import EdgeCreationModal from './components/EdgeCreationModal';
import { getGraph, calculateContext, sendMessage, createEdge, getSettings, ingestText, manualSave, exportCanvas } from './api';
import PromptConfigModal from './components/PromptConfigModal';
import SettingsModal from './components/SettingsModal';
import CanvasManager from './components/CanvasManager';
import { PlusCircle, Settings, BookOpen, Sliders, LayoutGrid, Save, Download, CheckCircle2 } from 'lucide-react';

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [depthMode, setDepthMode] = useState('F0');
  const [contextData, setContextData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isPromptConfigOpen, setIsPromptConfigOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isCanvasManagerOpen, setIsCanvasManagerOpen] = useState(false);
  const [appSettings, setAppSettings] = useState({});
  const [documentViewNode, setDocumentViewNode] = useState(null); // For document view mode
  const [chatMode, setChatMode] = useState('document'); // 'document' or 'multi-node'
  const [saveStatus, setSaveStatus] = useState({ saved: false, message: '', timestamp: null });

  // Layout State
  const [chatWidth, setChatWidth] = useState(40); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const prevChatWidth = useRef(40);

  // Edge Creation Modal State
  const [edgeModalState, setEdgeModalState] = useState({
    isOpen: false,
    source: null,
    target: null
  });

  // Helper to find full node object from ID
  const selectedNodeData = selectedNodeIds.length === 1
    ? graphData.nodes.find(n => n.id === selectedNodeIds[0])
    : null;

  // Refresh Triggers
  const [fileSystemRefreshTrigger, setFileSystemRefreshTrigger] = useState(0);

  const fetchGraph = async () => {
    try {
      const data = await getGraph();
      setGraphData(data);
    } catch (error) {
      console.error("Failed to load graph:", error);
    }
  };

  // Unified Refresh: Updates Graph AND File System
  const refreshSystem = useCallback(() => {
    fetchGraph();
    setFileSystemRefreshTrigger(prev => prev + 1);
  }, []);

  const fetchSettings = async () => {
    try {
      const s = await getSettings();
      setAppSettings(s || {});
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  // Manual Save Handler
  // Manual Save Handler
  const handleManualSave = useCallback(async () => {
    try {
      const result = await manualSave();
      setSaveStatus({
        saved: true,
        message: result.message,
        timestamp: new Date().toLocaleTimeString()
      });
      // Clear status after 3 seconds
      setTimeout(() => {
        setSaveStatus({ saved: false, message: '', timestamp: null });
      }, 3000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus({
        saved: false,
        message: error.message || "Save failed",
        timestamp: null
      });
      setTimeout(() => {
        setSaveStatus({ saved: false, message: '', timestamp: null });
      }, 3000);
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      await exportCanvas();
      setSaveStatus({
        saved: true,
        message: "Backup exported successfully",
        timestamp: new Date().toLocaleTimeString()
      });
      setTimeout(() => {
        setSaveStatus({ saved: false, message: '', timestamp: null });
      }, 3000);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export backup: " + (error.message || "Unknown error"));
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchGraph();
    fetchSettings();
  }, []);

  useEffect(() => {
    // Keyboard shortcut for save (Ctrl+S)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  // Reload settings when modal closes (in case they changed)
  useEffect(() => {
    if (!isSettingsOpen) {
      fetchSettings();
    }
  }, [isSettingsOpen]);

  // Handle Canvas Switch
  const handleCanvasSwitch = () => {
    setChatHistory([]); // Clear chat history on switch
    fetchGraph(); // Reload graph
    fetchSettings(); // Reload settings (context might change)
  };

  // Resizing Logic
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseEvent) => {
    if (isResizing) {
      const newWidth = (1 - mouseEvent.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) { // Limits
        setChatWidth(newWidth);
        if (isChatMaximized) setIsChatMaximized(false);
      }
    }
  }, [isResizing, isChatMaximized]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const toggleChatMaximize = () => {
    if (isChatMaximized) {
      setChatWidth(prevChatWidth.current);
      setIsChatMaximized(false);
    } else {
      prevChatWidth.current = chatWidth;
      setChatWidth(100);
      setIsChatMaximized(true);
    }
  };


  // REQ-UI-02: Update Context when selection or depth changes
  const handleContextCalculation = useCallback(async (nodeIds = null) => {
    const idsToUse = nodeIds || selectedNodeIds;
    if (idsToUse.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await calculateContext(idsToUse, depthMode);
      setContextData(prev => {
        if (!prev || prev.session_id !== result.session_id) {
          setChatHistory([]);
        }
        return result;
      });
    } catch (error) {
      console.error("Context calculation failed:", error);
      // Ensure loading is set to false even on error
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNodeIds, depthMode]);

  // Handler for Chat button - switches to multi-node mode and creates context
  const handleChatButtonClick = useCallback(async () => {
    // Switch to multi-node mode first
    setChatMode('multi-node');

    // Use selected nodes or current document node
    const nodesToUse = selectedNodeIds.length > 0
      ? selectedNodeIds
      : (documentViewNode ? [documentViewNode.id] : []);

    if (nodesToUse.length > 0) {
      // Clear document view when switching to multi-node mode
      setDocumentViewNode(null);
      // Calculate context with selected nodes
      await handleContextCalculation(nodesToUse);
    } else {
      // If no nodes selected, just switch mode (user can select nodes after)
      setDocumentViewNode(null);
      // Show a message or prompt user to select nodes
      if (selectedNodeIds.length === 0) {
        // User needs to select nodes first
        console.log("Please select nodes to create context");
      }
    }

    // Ensure chat panel is visible (not minimized)
    if (isChatMaximized) {
      // Chat is already maximized, good
    } else if (chatWidth < 30) {
      // If chat is too narrow, expand it a bit
      setChatWidth(40);
    }
  }, [selectedNodeIds, documentViewNode, handleContextCalculation, isChatMaximized, chatWidth]);

  const handleOpenDocumentView = useCallback(async (node) => {
    // Open document in chat section
    setDocumentViewNode(node);
    setSelectedEdge(null);
    setIsLoading(true);
    try {
      // Create context for this document
      const result = await calculateContext([node.id], 'F0');
      setContextData(result);
      setChatHistory([]);
    } catch (err) {
      console.error("Failed to load document context:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch between document mode and multi-node mode
  const handleSwitchChatMode = useCallback(async (newMode) => {
    setChatMode(newMode);

    if (newMode === 'multi-node') {
      // Switch to multi-node mode: use selected nodes or current document node
      const nodesToUse = selectedNodeIds.length > 0
        ? selectedNodeIds
        : (documentViewNode ? [documentViewNode.id] : []);

      if (nodesToUse.length > 0) {
        setDocumentViewNode(null); // Clear document view
        await handleContextCalculation(nodesToUse);
      }
    } else {
      // Switch to document mode: if we have a single selected node, open it
      if (selectedNodeIds.length === 1) {
        const nodeData = graphData.nodes.find(n => n.id === selectedNodeIds[0]);
        if (nodeData) {
          await handleOpenDocumentView(nodeData);
        }
      } else if (documentViewNode) {
        // Keep current document view
        await handleOpenDocumentView(documentViewNode);
      }
    }
  }, [selectedNodeIds, documentViewNode, graphData.nodes, handleContextCalculation, handleOpenDocumentView]);

  const handleSendMessage = async (prompt) => {
    // Get current session ID
    let sessionId = contextData?.session_id;

    // If no session exists, create one based on current mode
    if (!sessionId) {
      let nodesToUse = [];

      if (documentViewNode) {
        // Document mode: use the document node
        nodesToUse = [documentViewNode.id];
      } else if (chatMode === 'multi-node' && selectedNodeIds.length > 0) {
        // Multi-node mode: use selected nodes
        nodesToUse = selectedNodeIds;
      } else if (selectedNodeIds.length > 0) {
        // Fallback: use selected nodes
        nodesToUse = selectedNodeIds;
      } else {
        // No nodes selected - show error
        console.error("No nodes selected for chat");
        alert("Please select nodes first, then click Chat button to create context.");
        return;
      }

      // Create context with selected nodes
      try {
        setIsLoading(true);
        const result = await calculateContext(nodesToUse, depthMode);

        // Use the result directly, not the state (which may not be updated yet)
        if (!result?.session_id) {
          console.error("Failed to create chat session");
          setIsLoading(false);
          alert("Failed to create chat context. Please try again.");
          return;
        }

        sessionId = result.session_id;
        setContextData(result);
        setChatHistory([]);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to create context:", error);
        setIsLoading(false);
        alert("Failed to create chat context: " + (error.message || "Unknown error"));
        return;
      }
    }

    // Double check we have a session_id before proceeding
    if (!sessionId) {
      console.error("No session_id available");
      return;
    }

    // Optimistic UI update
    const tempMsg = { role: 'user', content: prompt, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, tempMsg]);

    setIsLoading(true);
    try {
      const responseMsg = await sendMessage(sessionId, prompt);
      setChatHistory(prev => [...prev, responseMsg]);
    } catch (error) {
      console.error("Message failed:", error);
      // Remove the optimistic message on error
      setChatHistory(prev => prev.slice(0, -1));
      alert("Failed to send message: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDocumentView = () => {
    setDocumentViewNode(null);
    setContextData(null);
    setChatHistory([]);
    setSelectedNodeIds([]); // Clear selection when closing
  };

  // Refresh document view after updates
  const handleDocumentRefresh = async () => {
    const updatedData = await getGraph();
    setGraphData(updatedData);
    // Reload the current document if it's open
    if (documentViewNode) {
      const updatedNode = updatedData.nodes.find(n => n.id === documentViewNode.id);
      if (updatedNode) {
        setDocumentViewNode(updatedNode);
      }
    }
  };

  const handleExpandContext = async () => {
    // Increase depth mode to include more nodes
    const depthMap = { 'F0': 'F1', 'F1': 'F2', 'F2': 'F2' };
    const newDepth = depthMap[depthMode] || 'F2';
    setDepthMode(newDepth);

    setIsLoading(true);
    try {
      // Recalculate context with new depth
      if (selectedNodeIds.length > 0) {
        const result = await calculateContext(selectedNodeIds, newDepth);
        setContextData(result);
        if (!contextData || contextData.session_id !== result.session_id) {
          setChatHistory([]);
        }
      } else if (documentViewNode) {
        const result = await calculateContext([documentViewNode.id], newDepth);
        setContextData(result);
        if (!contextData || contextData.session_id !== result.session_id) {
          setChatHistory([]);
        }
      }
    } catch (error) {
      console.error("Context expansion failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurnToDoc = async (content) => {
    if (!content) return;
    try {
      await ingestText(content, "AI Insights", "Uncategorized");
      fetchGraph();
      alert("AI Response saved as a new document node!");
    } catch (e) {
      console.error("Failed to save doc:", e);
      alert("Failed to save document.");
    }
  };

  // Callback for node selection to prevent flicker loop
  const handleSelectionChange = useCallback((ids) => {
    setSelectedNodeIds(ids);
    if (ids.length > 0) {
      setSelectedEdge(null);
      // In document mode: Open single document in chat section
      // In multi-node mode: Don't auto-calculate context on selection
      // User must click Chat button to create context (prevents flickering)
      if (chatMode === 'document') {
        const nodeData = graphData.nodes.find(n => n.id === ids[0]);
        if (nodeData) {
          handleOpenDocumentView(nodeData);
        }
      }
      // In multi-node mode, we don't auto-calculate context
      // User needs to click Chat button explicitly to avoid flickering
    } else {
      // Clear selection: Close document view only if it matches
      // (Don't close if user is just deselecting)
    }
  }, [graphData.nodes, chatMode, handleOpenDocumentView]);

  const handleEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNodeIds([]);
  }, []);

  const handleConnectRequest = useCallback((params) => {
    setEdgeModalState({
      isOpen: true,
      source: params.source,
      target: params.target
    });
  }, []);

  const handleEdgeConfirm = async (justification, type, newSource, newTarget) => {
    // defaults to state if not passed, but modal now passes effective values
    const source = newSource || edgeModalState.source;
    const target = newTarget || edgeModalState.target;

    if (!source || !target) return;

    try {
      await createEdge(source, target, justification, type);
      setEdgeModalState({ isOpen: false, source: null, target: null });
      refreshSystem();
    } catch (error) {
      console.error("Failed to create edge:", error);
      alert(`Failed to create edge: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">

      {/* LEFT PANEL: Graph (Dynamic Width) */}
      <div
        style={{ width: isChatMaximized ? '0%' : `${100 - chatWidth}%` }}
        className={`h-full relative transition-all duration-300 ${isChatMaximized ? 'opacity-0 overflow-hidden' : 'opacity-100'}`}
      >
        {/* Header Actions - Absolute positioned on top of graph */}
        <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
          {/* Save Status Indicator */}
          {saveStatus.saved && (
            <div className="bg-green-600/90 backdrop-blur text-white px-3 py-1.5 rounded-lg shadow-lg border border-green-500/30 flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveStatus.message}</span>
              {saveStatus.timestamp && <span className="text-green-200">({saveStatus.timestamp})</span>}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleManualSave}
              className="bg-green-600/80 backdrop-blur hover:bg-green-500 text-white p-2 rounded-xl shadow-lg border border-green-500/30 transition-colors"
              title="Save All Data (Ctrl+S)"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="bg-purple-600/80 backdrop-blur hover:bg-purple-500 text-white p-2 rounded-xl shadow-lg border border-purple-500/30 transition-colors"
              title="Export Backup (ZIP)"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCanvasManagerOpen(true)}
              className="bg-gray-900/80 backdrop-blur hover:bg-gray-800 text-gray-300 p-2 rounded-xl shadow-lg border border-white/10 transition-colors"
              title="Manage Canvases"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-gray-900/80 backdrop-blur hover:bg-gray-800 text-gray-300 p-2 rounded-xl shadow-lg border border-white/10 transition-colors"
              title="System Settings"
            >
              <Sliders className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsRegistryOpen(!isRegistryOpen)}
              className={`p-2 rounded-xl shadow-lg border border-white/10 transition-colors ${isRegistryOpen ? 'bg-blue-600 text-white' : 'bg-gray-900/80 backdrop-blur hover:bg-gray-800 text-gray-300'}`}
              title="Context Registry"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPromptConfigOpen(true)}
              className="bg-gray-900/80 backdrop-blur hover:bg-gray-800 text-gray-300 p-2 rounded-xl shadow-lg border border-white/10 transition-colors"
              title="Prompt Configuration"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Action Button for Upload */}
        {!isIngestionOpen && (
          <button
            onClick={() => setIsIngestionOpen(true)}
            className="absolute bottom-8 right-8 z-20 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-105"
            title="Ingest Document"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
        )}

        <GraphCanvas
          nodes={graphData.nodes}
          edges={graphData.edges}
          selectedNodeIds={selectedNodeIds}
          onSelectionChange={handleSelectionChange}
          onEdgeClick={handleEdgeClick}
          onConnectRequest={handleConnectRequest}
          contextNodes={contextData?.context_nodes || []}
          depthMode={depthMode}
          onDepthChange={setDepthMode}
          onTriggerContext={handleChatButtonClick}
          onRefresh={refreshSystem}
        />

        <EdgeInspector
          edge={selectedEdge}
          onClose={() => setSelectedEdge(null)}
          onRefresh={refreshSystem}
        />

        <FileExplorer
          isOpen={isRegistryOpen}
          onClose={() => setIsRegistryOpen(false)}
          refreshTrigger={fileSystemRefreshTrigger}
          onNodeSelect={(node) => {
            console.log("Selected node:", node);
            // Future: canvasRef.current.focusNode(node.id)
            // If it's a document, we might want to open it
            if (node.type === 'document') {
              // Determine if we should open in document view
              // For now, we reuse the selection logic
              handleSelectionChange([node.id]);
            }
          }}
        />

        <EdgeCreationModal
          isOpen={edgeModalState.isOpen}
          onClose={() => setEdgeModalState({ isOpen: false, source: null, target: null })}
          onConfirm={handleEdgeConfirm}
          sourceId={edgeModalState.source}
          targetId={edgeModalState.target}
          autoAssistEnabled={appSettings.manual_connection_ai_assist}
        />
      </div>

      {/* DRAG HANDLE */}
      {!isChatMaximized && (
        <div
          className="w-1 hover:w-1.5 h-full bg-[#1C1C1E] hover:bg-blue-500/50 cursor-col-resize z-30 transition-all duration-150 flex items-center justify-center group"
          onMouseDown={startResizing}
        >
          <div className="h-8 w-0.5 bg-gray-600 group-hover:bg-white rounded-full" />
        </div>
      )}

      {/* RIGHT PANEL: Chat (Dynamic Width) */}
      <div
        style={{ width: `${chatWidth}%` }}
        className="h-full flex flex-col relative transition-all duration-300 z-10"
      >
        <ChatInterface
          history={chatHistory}
          onSendMessage={handleSendMessage}
          dominantModule={contextData?.dominant_module}
          contextCount={contextData?.context_nodes?.length || (documentViewNode ? 1 : 0)}
          isLoading={isLoading}
          onTurnToDoc={handleTurnToDoc}
          onToggleMaximize={toggleChatMaximize}
          isMaximized={isChatMaximized}
          documentNode={documentViewNode}
          onCloseDocument={handleCloseDocumentView}
          chatMode={chatMode}
          onSwitchChatMode={handleSwitchChatMode}
          selectedNodeIds={selectedNodeIds}
          onExpandContext={handleExpandContext}
          onRefresh={handleDocumentRefresh}
        />
      </div>

      <IngestionWidget
        isOpen={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onUploadSuccess={fetchGraph}
      />

      <PromptConfigModal
        isOpen={isPromptConfigOpen}
        onClose={() => setIsPromptConfigOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CanvasManager
        isOpen={isCanvasManagerOpen}
        onClose={() => setIsCanvasManagerOpen(false)}
        onSwitch={handleCanvasSwitch}
      />
    </div>
  );
}

export default App;
