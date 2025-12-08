import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, X } from 'lucide-react';
import axios from 'axios';

// Default Prompts (Registry)
const DEFAULT_PROMPTS = {
    metadata_extraction: {
        id: 'metadata_extraction',
        label: 'AI Metadata Extraction',
        description: 'Used when uploading a file to generate Title, Summary, Tags, etc.',
        template: `You are Nexus, an AI Knowledge Weaver. Analyze the following document and extract structured metadata.
        
Input Text:
{content}

Requirements:
1. Title: Concise and descriptive.
2. Summary: One sentence explaining the core value/issue.
3. Module: Suggest a functional module name (e.g., "Payments", "Auth").
4. Topic Cluster: A high-level grouping.
5. Tags: List of specific keywords.

Output JSON:
{{
    "title": "String",
    "summary": "String",
    "suggested_module": "String",
    "topic_cluster": "String",
    "tags": ["String"]
}}`
    },
    auto_linking: {
        id: 'auto_linking',
        label: 'Auto-Linking Logic',
        description: 'Used to find relationships between a new node and existing candidates.',
        template: `You are Nexus. A new document node has been added to the graph. 
Your task is to identify logical connections (edges) between this new node and existing nodes.

New Node:
ID: {id}
Title: {title}
Summary: {summary}
Tags: {tags}
Module: {module}

Existing Nodes (Candidates):
{candidates}

Instructions:
1. Analyze semantic relationships.
2. Create edges ONLY if there is a strong justification.
3. Limit to top 3 strongest connections.
4. "confidence" should be between 0.0 and 1.0.

Output JSON List:
[
    {{
        "target_id": "Existing Node ID",
        "justification": "Why they are linked (max 10 words)",
        "confidence": 0.85
    }}
]
If no connections, return [].`
    },
    chat_system_instruction: {
        id: 'chat_system_instruction',
        label: 'Chat System Instruction',
        description: 'The core persona and constraints for the Chat Bot.',
        template: `You are Nexus, an evidence-based reasoning engine.
You must only answer based on the provided Context Nodes. Do not use outside knowledge.
The LLM output MUST follow a strict citation format: [NODE-ID] whenever you reference a specific piece of information.
Format your response in clean Markdown (headers, bullet points, bold text).

{hydrated_context}`
    }
};

const PromptConfigModal = ({ isOpen, onClose }) => {
    const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
    const [activeTab, setActiveTab] = useState('metadata_extraction');
    const [isDirty, setIsDirty] = useState(false);

    // In a real app, we would fetch these from the backend on mount
    // useEffect(() => fetchPrompts(), []);

    const handleChange = (val) => {
        setPrompts(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], template: val }
        }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        // Mock save to backend
        try {
            await axios.post('/api/v2/config/prompts', prompts);
            setIsDirty(false);
            alert("Prompts updated successfully (Backend implementation pending).");
        } catch (e) {
            console.error(e);
            // alert("Failed to save.");
        }
    };

    const handleReset = () => {
        if (confirm("Reset current prompt to default?")) {
            setPrompts(prev => ({
                ...prev,
                [activeTab]: { ...prev[activeTab], template: DEFAULT_PROMPTS[activeTab].template }
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-600 rounded-lg w-[800px] h-[600px] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <Settings className="w-5 h-5 text-blue-400" />
                        Prompt Engineering Config
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-gray-700 bg-gray-900/50 overflow-y-auto">
                        {Object.values(prompts).map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActiveTab(p.id)}
                                className={`w-full text-left p-3 text-sm border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                                    activeTab === p.id ? 'bg-blue-900/30 text-blue-200 border-l-4 border-l-blue-500' : 'text-gray-400'
                                }`}
                            >
                                <div className="font-medium">{p.label}</div>
                            </button>
                        ))}
                    </div>

                    {/* Editor */}
                    <div className="flex-1 flex flex-col bg-gray-800">
                        <div className="p-4 border-b border-gray-700 bg-gray-800">
                            <h3 className="text-white font-medium">{prompts[activeTab].label}</h3>
                            <p className="text-xs text-gray-400 mt-1">{prompts[activeTab].description}</p>
                        </div>
                        <textarea 
                            className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 outline-none resize-none"
                            value={prompts[activeTab].template}
                            onChange={(e) => handleChange(e.target.value)}
                            spellCheck={false}
                        />
                        <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-between items-center">
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2 rounded hover:bg-gray-800"
                            >
                                <RefreshCw className="w-3 h-3" /> Reset Default
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={!isDirty}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium"
                            >
                                <Save className="w-4 h-4" /> Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptConfigModal;

