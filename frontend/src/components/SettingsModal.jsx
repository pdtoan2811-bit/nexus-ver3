import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, X, Sliders, Sparkles, GitBranch, PenTool } from 'lucide-react';
import { getSettings, updateSettings } from '../api';

const SettingsModal = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState({
        auto_linking: {
            enabled: true,
            max_connections: 3,
            threshold: 0.6
        },
        manual_connection_ai_assist: false,
        expansion: {
            max_subnodes: 5
        },
        content_generation: {
            tone: "Technical",
            detail_level: "High"
        }
    });
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchSettings = async () => {
                setLoading(true);
                try {
                    const data = await getSettings();
                    if (data) {
                        // Deep merge to ensure all keys exist
                        setSettings(prev => ({
                             ...prev, 
                             ...data,
                             auto_linking: { ...prev.auto_linking, ...(data.auto_linking || {}) },
                             expansion: { ...prev.expansion, ...(data.expansion || {}) },
                             content_generation: { ...prev.content_generation, ...(data.content_generation || {}) }
                        }));
                    }
                } catch (e) {
                    console.error("Failed to load settings:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchSettings();
        }
    }, [isOpen]);

    const handleChange = (section, key, value) => {
        if (section) {
            setSettings(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: value
                }
            }));
        } else {
             // Root level setting
             setSettings(prev => ({
                 ...prev,
                 [key]: value
             }));
        }
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            await updateSettings(settings);
            setIsDirty(false);
            onClose();
        } catch (e) {
            console.error("Failed to save settings:", e);
            alert("Failed to save settings.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-600 rounded-2xl w-[600px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                    <div className="flex items-center gap-3 text-white font-semibold text-lg">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <Sliders className="w-5 h-5 text-blue-400" />
                        </div>
                        System Configuration
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 bg-gray-800/50 overflow-y-auto custom-scrollbar">
                    
                    {/* Content Generation Section */}
                    <div className="space-y-4">
                        <h3 className="text-white font-medium flex items-center gap-2 border-b border-white/10 pb-2">
                            <PenTool className="w-4 h-4 text-pink-400" />
                            AI Content Generation
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Tone & Style</label>
                                <select 
                                    value={settings.content_generation?.tone || "Technical"}
                                    onChange={(e) => handleChange('content_generation', 'tone', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                                >
                                    <option value="Technical">Technical (Precise)</option>
                                    <option value="Concise">Concise (Brief)</option>
                                    <option value="Creative">Creative (Expansive)</option>
                                    <option value="Academic">Academic (Formal)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Detail Level</label>
                                <select 
                                    value={settings.content_generation?.detail_level || "High"}
                                    onChange={(e) => handleChange('content_generation', 'detail_level', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                                >
                                    <option value="High">High (Comprehensive)</option>
                                    <option value="Medium">Medium (Balanced)</option>
                                    <option value="Low">Low (Summary only)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Hierarchy Expansion Section */}
                    <div className="space-y-4">
                        <h3 className="text-white font-medium flex items-center gap-2 border-b border-white/10 pb-2">
                            <GitBranch className="w-4 h-4 text-orange-400" />
                            Hierarchy Expansion (MECE)
                        </h3>
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Sub-nodes per Breakdown</label>
                                <span className="text-xs font-mono text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                                    {settings.expansion?.max_subnodes || 5}
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="2" 
                                max="10" 
                                value={settings.expansion?.max_subnodes || 5}
                                onChange={(e) => handleChange('expansion', 'max_subnodes', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Controls how many sub-components the AI creates when breaking down a node.</p>
                        </div>
                    </div>

                    {/* Manual Connection Assist */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    AI Assist for Manual Connections
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Automatically generate justification when connecting nodes.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={settings.manual_connection_ai_assist || false}
                                    onChange={(e) => handleChange(null, 'manual_connection_ai_assist', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    </div>
                    
                    {/* Auto-Linking Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-green-400" />
                                    Auto-Linking (The Weaver)
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Automatically connect new nodes to existing context.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={settings.auto_linking?.enabled ?? true}
                                    onChange={(e) => handleChange('auto_linking', 'enabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {settings.auto_linking?.enabled && (
                            <div className="bg-black/20 rounded-xl p-4 space-y-4 border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Connections</label>
                                        <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{settings.auto_linking.max_connections}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="10" 
                                        value={settings.auto_linking.max_connections}
                                        onChange={(e) => handleChange('auto_linking', 'max_connections', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Limit the number of edges created per ingestion.</p>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confidence Threshold</label>
                                        <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded">{settings.auto_linking.threshold}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.1" 
                                        max="1.0" 
                                        step="0.05"
                                        value={settings.auto_linking.threshold}
                                        onChange={(e) => handleChange('auto_linking', 'threshold', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Minimum AI confidence score required to create a link.</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-700 bg-gray-900 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!isDirty || loading}
                        className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
