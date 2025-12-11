import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, X } from 'lucide-react';
import * as API from '../api'; // Import as namespace to debug missing exports

// Structure definition for the UI side (Labels, Descriptions)
// The actual template content will be hydrated from the backend.
const PROMPT_DEFINITIONS = {
    nexus_prime_system: {
        id: 'nexus_prime_system',
        label: 'Nexus Prime (Manager)',
        description: 'System prompt for the Orchestrator Agent. Defines how it decomposes user requests.',
        template: '' // Loaded from API
    },
    cartographer_search: {
        id: 'cartographer_search',
        label: 'Cartographer (Search)',
        description: 'Prompt used for finding relevant nodes based on a query.',
        template: ''
    },
    architect_create: {
        id: 'architect_create',
        label: 'Architect (Builder)',
        description: 'Prompt for drafting new Shadow Nodes (Proposals).',
        template: ''
    },
    justifier_validate: {
        id: 'justifier_validate',
        label: 'Justifier (Validation)',
        description: 'Prompt for validating nodes against policies.',
        template: ''
    },
    link_smith_justify: {
        id: 'link_smith_justify',
        label: 'Link Smith (Connector)',
        description: 'Prompt for justifying connections between nodes.',
        template: ''
    }
};

const PromptConfigModal = ({ isOpen, onClose }) => {
    // Initialize with safe defaults
    const [prompts, setPrompts] = useState(PROMPT_DEFINITIONS);
    const [activeTab, setActiveTab] = useState('nexus_prime_system');
    const [isDirty, setIsDirty] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null); // UI Error state

    // Fetch prompts on mount or open
    useEffect(() => {
        if (isOpen) {
            loadPrompts();
        }
    }, [isOpen]);

    const loadPrompts = async () => {
        // Defensive check for API availability
        if (!API || typeof API.getPrompts !== 'function') {
            console.error("API.getPrompts is not available");
            setError("API Error: getPrompts function missing.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await API.getPrompts();
            if (data && typeof data === 'object') {
                setPrompts(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(key => {
                        // Ensure we treat the value as string
                        if (data[key] !== undefined && data[key] !== null) {
                            next[key] = { ...next[key], template: String(data[key]) };
                        }
                    });
                    return next;
                });
            } else {
                console.warn("Invalid data received from getPrompts", data);
            }
        } catch (error) {
            console.error("Failed to load prompts:", error);
            setError("Failed to load prompts. Server might be offline.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (val) => {
        setPrompts(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], template: val || '' } // Ensure never undefined
        }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!API || typeof API.updatePrompt !== 'function') {
            alert("API Error: updatePrompt function missing.");
            return;
        }

        try {
            const currentPrompt = prompts[activeTab];
            await API.updatePrompt(activeTab, currentPrompt.template);
            setIsDirty(false);
            alert(`Saved configuration for ${currentPrompt.label}`);
        } catch (e) {
            console.error(e);
            alert("Failed to save configuration.");
        }
    };

    const handleReset = () => {
        if (confirm("Discard unsaved changes?")) {
            loadPrompts();
            setIsDirty(false);
        }
    };

    if (!isOpen) return null;

    // Safety fallback for rendering
    const activePrompt = prompts[activeTab] || PROMPT_DEFINITIONS['nexus_prime_system'];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-600 rounded-lg w-[900px] h-[700px] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <Settings className="w-5 h-5 text-blue-400" />
                        <span>Agent Prompt Studio</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-72 border-r border-gray-700 bg-gray-900/50 overflow-y-auto">
                        {Object.values(prompts).map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    if (isDirty && activeTab !== p.id) {
                                        if (!confirm("You have unsaved changes. Switch anyway?")) return;
                                        setIsDirty(false);
                                    }
                                    setActiveTab(p.id);
                                }}
                                className={`w-full text-left p-4 text-sm border-b border-gray-800 hover:bg-gray-800 transition-colors ${activeTab === p.id ? 'bg-blue-900/30 text-blue-200 border-l-4 border-l-blue-500' : 'text-gray-400'
                                    }`}
                            >
                                <div className="font-medium">{p.label}</div>
                            </button>
                        ))}
                    </div>

                    {/* Editor */}
                    <div className="flex-1 flex flex-col bg-gray-800 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center z-10">
                                <span className="text-blue-500 animate-pulse">Loading...</span>
                            </div>
                        )}

                        <div className="p-4 border-b border-gray-700 bg-gray-800">
                            <h3 className="text-white font-medium text-lg">{activePrompt?.label || 'Unknown'}</h3>
                            <p className="text-sm text-gray-400 mt-1">{activePrompt?.description || 'No description'}</p>
                            {error && <div className="mt-2 text-red-400 text-xs bg-red-900/30 p-2 rounded">{error}</div>}
                        </div>

                        <textarea
                            className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 outline-none resize-none leading-relaxed"
                            value={activePrompt?.template || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            spellCheck={false}
                        />

                        <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-between items-center">
                            <span className="text-xs text-gray-500 italic">
                                Variables: {'{{variable}}'}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2 rounded hover:bg-gray-800"
                                >
                                    <RefreshCw className="w-3 h-3" /> Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium"
                                >
                                    <Save className="w-4 h-4" /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptConfigModal;

