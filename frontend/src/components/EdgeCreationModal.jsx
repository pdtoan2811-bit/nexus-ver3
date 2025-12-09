import React, { useState, useEffect } from 'react';
import { Link2, Save, X, Sparkles, Wand2 } from 'lucide-react';
import { suggestEdgeJustification } from '../api';

const EdgeCreationModal = ({ isOpen, onClose, onConfirm, sourceId, targetId, autoAssistEnabled }) => {
    const [justification, setJustification] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Auto-generate on open if enabled
    useEffect(() => {
        if (isOpen && autoAssistEnabled && sourceId && targetId) {
            handleAiEnhance();
        } else {
             // Reset when opening manually without auto-assist
             if (!isOpen) setJustification(''); 
        }
    }, [isOpen, autoAssistEnabled, sourceId, targetId]);

    if (!isOpen) return null;

    const handleAiEnhance = async () => {
        if (!sourceId || !targetId) return;
        
        setIsGenerating(true);
        try {
            // Use current text as hint
            const result = await suggestEdgeJustification(sourceId, targetId, justification);
            if (result && result.justification) {
                setJustification(result.justification);
            }
        } catch (e) {
            console.error("AI Suggestion failed:", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = () => {
        if (justification.trim()) {
            onConfirm(justification);
            setJustification('');
        } else {
            alert("Please provide a justification for this connection.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-600 rounded-xl w-[450px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <Link2 className="w-4 h-4 text-blue-400" />
                        New Connection
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Context Visualization */}
                    <div className="flex items-center justify-between text-xs text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex-1 truncate text-center pr-2 font-mono text-blue-300" title={sourceId}>{sourceId}</div>
                        <div className="text-gray-600 font-bold">→</div>
                        <div className="flex-1 truncate text-center pl-2 font-mono text-green-300" title={targetId}>{targetId}</div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-xs text-gray-500 uppercase font-bold">Reasoning (Justification)</label>
                             {isGenerating && <span className="text-xs text-purple-400 animate-pulse flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Generating...</span>}
                        </div>
                        
                        <textarea 
                            autoFocus
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            disabled={isGenerating}
                            className="w-full h-32 bg-black/30 border border-gray-600 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none resize-none placeholder-gray-600 disabled:opacity-50"
                            placeholder={autoAssistEnabled ? "Generating..." : "e.g. 'Sub-module of...', 'Depends on...', 'Contradicts...'"}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-between items-center">
                    
                    {/* Action: AI Enhance */}
                    <button 
                        onClick={handleAiEnhance}
                        disabled={isGenerating}
                        className="px-3 py-2 rounded-lg text-xs font-bold text-purple-300 bg-purple-900/30 border border-purple-500/30 hover:bg-purple-900/50 hover:text-purple-200 flex items-center gap-2 transition-colors"
                        title="Use AI to generate justification based on node content"
                    >
                        {isGenerating ? <Wand2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI Enhance
                    </button>

                    <div className="flex gap-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <Save className="w-4 h-4" />
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EdgeCreationModal;
