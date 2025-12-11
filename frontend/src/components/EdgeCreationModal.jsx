import React, { useState, useEffect } from 'react';
import { Link2, Save, X, Sparkles, Wand2, ArrowLeftRight } from 'lucide-react';
import { suggestEdgeJustification } from '../api';

const EdgeCreationModal = ({ isOpen, onClose, onConfirm, sourceId, targetId, autoAssistEnabled }) => {
    const [selectedType, setSelectedType] = useState('reference');
    const [justification, setJustification] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Auto-generate on open if enabled
    useEffect(() => {
        if (isOpen && autoAssistEnabled && sourceId && targetId) {
            handleAiEnhance();
        } else {
            if (!isOpen) {
                setJustification('');
                setSelectedType('reference'); // Reset type
            }
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
        if (justification.trim() || selectedType === 'contains') { // Hierarchy can be implicit
            onConfirm(justification, selectedType);
            setJustification('');
            setSelectedType('reference');
        } else {
            alert("Please provide a justification for this connection.");
        }
    };

    const ConnectionType = ({ type, label, icon: Icon, color, description }) => (
        <button
            onClick={() => setSelectedType(type)}
            className={`
                flex items-start gap-3 p-3 rounded-xl border transition-all text-left group
                ${selectedType === type
                    ? `bg-${color}-900/30 border-${color}-500 ring-1 ring-${color}-500/50`
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }
            `}
        >
            <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400 group-hover:scale-110 transition-transform`}>
                <Icon size={18} />
            </div>
            <div>
                <div className={`text-sm font-bold ${selectedType === type ? 'text-white' : 'text-gray-300'}`}>
                    {label}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                    {description}
                </div>
            </div>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-[600px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="p-5 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white font-semibold text-lg">
                        <Link2 className="w-5 h-5 text-blue-400" />
                        New Connection
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Context Visualization */}
                    <div className="flex items-center justify-between text-xs text-gray-400 bg-black/40 p-3 rounded-lg border border-white/5 font-mono">
                        <div className="flex-1 truncate text-center pr-2 text-blue-300" title={sourceId}>{sourceId}</div>
                        <div className="text-gray-600 font-bold px-2">→</div>
                        <div className="flex-1 truncate text-center pl-2 text-green-300" title={targetId}>{targetId}</div>
                    </div>

                    {/* Type Selection Grid */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Relationship Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <ConnectionType
                                type="reference"
                                label="Reference"
                                icon={Link2}
                                color="blue"
                                description="Standard link. Related concepts."
                            />
                            <ConnectionType
                                type="agree"
                                label="Agree"
                                icon={Sparkles}
                                color="green"
                                description="Source supports Target."
                            />
                            <ConnectionType
                                type="disagree"
                                label="Disagree"
                                icon={X}
                                color="red"
                                description="Source contradicts Target."
                            />
                            <ConnectionType
                                type="contains"
                                label="Hierarchy"
                                icon={Link2}
                                color="yellow"
                                description="Parent/Child relationship."
                            />
                            <ConnectionType
                                type="mutual"
                                label="Mutual"
                                icon={ArrowLeftRight}
                                color="purple"
                                description="Bidirectional link."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Reasoning (Justification)</label>
                            {isGenerating && <span className="text-xs text-purple-400 animate-pulse flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Generating...</span>}
                        </div>

                        <textarea
                            autoFocus
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            disabled={isGenerating}
                            className="w-full h-24 bg-black/30 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-600 disabled:opacity-50 transition-all"
                            placeholder={autoAssistEnabled ? "Generating..." : "Why are these connected? (Optional for Hierarchy)"}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="p-5 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center">

                    {/* Action: AI Enhance */}
                    <button
                        onClick={handleAiEnhance}
                        disabled={isGenerating}
                        className="px-3 py-2 rounded-lg text-xs font-bold text-purple-300 bg-purple-900/20 border border-purple-500/20 hover:bg-purple-900/40 hover:text-purple-200 flex items-center gap-2 transition-all"
                        title="Use AI to generate justification"
                    >
                        {isGenerating ? <Wand2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI Enhance
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`
                                px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-lg transition-all
                                ${selectedType === 'disagree'
                                    ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                                    : selectedType === 'agree'
                                        ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20'
                                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                                }
                            `}
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
