import React, { useState } from 'react';
import { X, Calendar, Tag, FileText, Sparkles, BrainCircuit } from 'lucide-react';
import { analyzeNode } from '../api';

const NodeInspector = ({ node, onClose, onRefresh }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!node) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
        await analyzeNode(node.id);
        if (onRefresh) onRefresh();
    } catch (error) {
        console.error("Analysis failed:", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-40 w-96 max-h-[90vh] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-white break-words">{node.id}</h2>
          <span className="text-xs text-blue-400 font-mono uppercase px-1 bg-blue-900/30 rounded border border-blue-800 mt-1 inline-block">
            {node.type || 'Node'}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
        
        {/* AI Analysis Section */}
        <div className="space-y-3">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    AI Metadata
                </div>
                <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                >
                    {isAnalyzing ? (
                        <BrainCircuit className="w-3 h-3 animate-pulse" />
                    ) : (
                        <Sparkles className="w-3 h-3" />
                    )}
                    {isAnalyzing ? 'Analyzing...' : 'Regenerate'}
                </button>
             </div>

             {/* Summary Card */}
             <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded text-sm text-gray-300 italic">
                "{node.summary || "No summary available. Click regenerate."}"
             </div>

             {/* Tags */}
             <div className="flex flex-wrap gap-2">
                {node.tags && node.tags.length > 0 ? (
                    node.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full border border-gray-600">
                            #{tag}
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-gray-500">No tags</span>
                )}
             </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 p-3 rounded border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Tag className="w-3 h-3" /> Module
            </div>
            <div className="font-semibold text-sm text-gray-200">
              {node.module || 'General'}
            </div>
          </div>
          <div className="bg-black/30 p-3 rounded border border-gray-700">
             {/* Topic Cluster (New from PRD) */}
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <BrainCircuit className="w-3 h-3" /> Topic
            </div>
            <div className="font-semibold text-sm text-gray-200">
              {node.topic_cluster || 'Unclassified'}
            </div>
          </div>
        </div>

        {/* File Content */}
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold mb-2 border-b border-gray-700 pb-1">
            <FileText className="w-4 h-4" />
            Original Content
          </div>
          <div className="bg-gray-900 p-3 rounded border border-gray-700 font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
            {node.content || "No content available."}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NodeInspector;

