import React, { useState, useEffect } from 'react';
import GraphCanvas from './components/GraphCanvas';
import ChatInterface from './components/ChatInterface';
import IngestionWidget from './components/IngestionWidget';
import NodeInspector from './components/NodeInspector';
import { getGraph, calculateContext, sendMessage } from './api';
import PromptConfigModal from './components/PromptConfigModal';
import { PlusCircle, Settings } from 'lucide-react';

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [depthMode, setDepthMode] = useState('F0');
  const [contextData, setContextData] = useState(null); 
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isPromptConfigOpen, setIsPromptConfigOpen] = useState(false);

  // Helper to find full node object from ID
  const selectedNodeData = selectedNodeIds.length === 1 
    ? graphData.nodes.find(n => n.id === selectedNodeIds[0]) 
    : null;

  const fetchGraph = async () => {
      try {
        const data = await getGraph();
        setGraphData(data);
      } catch (error) {
        console.error("Failed to load graph:", error);
      }
    };

  // Initial Load
  useEffect(() => {
    fetchGraph();
  }, []);


  // REQ-UI-02: Update Context when selection or depth changes
  const handleContextCalculation = async () => {
    if (selectedNodeIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const result = await calculateContext(selectedNodeIds, depthMode);
      setContextData(result);
      // Reset chat history for new session or append? 
      // SRS implies "Chat with Selection" starts a session.
      // We will clear history if session ID changes.
      if (!contextData || contextData.session_id !== result.session_id) {
         setChatHistory([]);
      }
    } catch (error) {
      console.error("Context calculation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (prompt) => {
    if (!contextData?.session_id) return;
    
    // Optimistic UI update
    const tempMsg = { role: 'user', content: prompt, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, tempMsg]);
    
    try {
      const responseMsg = await sendMessage(contextData.session_id, prompt);
      setChatHistory(prev => [...prev, responseMsg]);
    } catch (error) {
      console.error("Message failed:", error);
      // Ideally show error in chat
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* REQ-UI-03: Split-Screen Layout (60% Graph / 40% Chat) */}
      <div className="w-[60%] h-full border-r border-gray-700 relative">
        {/* Header Actions */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
            <button 
                onClick={() => setIsPromptConfigOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded shadow-lg border border-gray-600"
                title="Prompt Configuration"
            >
                <Settings className="w-5 h-5" />
            </button>
        </div>

        {/* Floating Action Button for Upload - Only show if widget is closed */}
        {!isIngestionOpen && (
            <button 
            onClick={() => setIsIngestionOpen(true)}
            className="absolute bottom-6 right-6 z-20 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110"
            title="Ingest Document"
            >
            <PlusCircle className="w-6 h-6" />
            </button>
        )}

        <GraphCanvas 
          nodes={graphData.nodes} 
          edges={graphData.edges}
          selectedNodeIds={selectedNodeIds}
          onSelectionChange={setSelectedNodeIds}
          contextNodes={contextData?.context_nodes || []}
          depthMode={depthMode}
          onDepthChange={setDepthMode}
          onTriggerContext={handleContextCalculation}
          onRefresh={fetchGraph}
        />

        {/* Node Inspector - Shows when exactly one node is selected */}
        <NodeInspector 
            node={selectedNodeData} 
            onClose={() => setSelectedNodeIds([])} 
            onRefresh={fetchGraph}
        />
      </div>
      
      <div className="w-[40%] h-full flex flex-col">
        <ChatInterface 
          history={chatHistory} 
          onSendMessage={handleSendMessage}
          dominantModule={contextData?.dominant_module}
          contextCount={contextData?.context_nodes?.length || 0}
          isLoading={isLoading}
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
    </div>
  );
}

export default App;

