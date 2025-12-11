import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Save, RotateCcw, Link2, ArrowRight, Sparkles, AlertCircle, GitMerge, ArrowLeftRight } from 'lucide-react';
import { updateEdge, deleteEdge, createEdge } from '../api';

const EdgeInspector = ({ edge, onClose, onRefresh }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [justification, setJustification] = useState('');
    const [selectedType, setSelectedType] = useState('reference');
    const [isSwapped, setIsSwapped] = useState(false);

    useEffect(() => {
        if (edge) {
            setJustification(edge.label || '');
            setSelectedType(edge.data?.type || 'reference');
            setIsEditing(false);
            setIsSwapped(false);
        }
    }, [edge]);

    if (!edge) return null;

    // Derived source/target based on swap state
    const displaySource = isSwapped ? edge.target : edge.source;
    const displayTarget = isSwapped ? edge.source : edge.target;

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete this connection?`)) {
            try {
                await deleteEdge(edge.source, edge.target);
                if (onRefresh) onRefresh();
                onClose();
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Failed to delete edge.");
            }
        }
    };

    const handleSave = async () => {
        try {
            if (isSwapped) {
                if (window.confirm("Swapping direction will replace the existing connection. Continue?")) {
                    await deleteEdge(edge.source, edge.target);
                    await createEdge(edge.target, edge.source, justification, selectedType);
                } else {
                    return;
                }
            } else {
                await updateEdge(edge.source, edge.target, {
                    justification,
                    type: selectedType
                });
            }
            setIsEditing(false);
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update edge.");
        }
    };

    const ConnectionType = ({ type, label, icon: Icon, color, description }) => (
        <button
            onClick={() => setSelectedType(type)}
            className={`
            flex items-center gap-2 p-2 rounded-lg border transition-all w-full text-left
            ${selectedType === type
                    ? `bg-${color}-900/30 border-${color}-500 ring-1 ring-${color}-500/50`
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }
        `}
        >
            <div className={`p-1.5 rounded-md bg-${color}-500/20 text-${color}-400`}>
                <Icon size={14} />
            </div>
            <div className="flex-1">
                <div className={`text-xs font-bold ${selectedType === type ? 'text-white' : 'text-gray-400'}`}>
                    {label}
                </div>
                {selectedType === type && (
                    <div className="text-[9px] text-gray-400 leading-tight">
                        {description}
                    </div>
                )}
            </div>
        </button>
    );

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95 ring-1 ring-white/10 animate-in fade-in zoom-in duration-200">

            <div className="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-semibold">
                    <Link2 className="w-4 h-4 text-blue-400" />
                    Connection Details
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-5 space-y-4">
                {/* Source -> Target Visual */}
                <div className="flex items-center justify-between text-xs text-gray-400 bg-black/40 p-3 rounded-lg border border-white/5 group/viz relative">
                    <span className="truncate max-w-[40%] font-mono text-blue-300 font-bold" title={displaySource}>{displaySource}</span>

                    {isEditing ? (
                        <button
                            onClick={() => setIsSwapped(!isSwapped)}
                            className={`p-1.5 rounded-full transition-all border ${isSwapped ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-white hover:bg-gray-700'}`}
                            title="Click to Swap Direction"
                        >
                            <ArrowLeftRight className="w-3 h-3" />
                        </button>
                    ) : (
                        <ArrowRight className="w-3 h-3 text-gray-600" />
                    )}

                    <span className="truncate max-w-[40%] font-mono text-green-300 font-bold" title={displayTarget}>{displayTarget}</span>

                    {isEditing && isSwapped && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-900/90 text-yellow-200 text-[9px] px-2 py-0.5 rounded-full border border-yellow-500/30 whitespace-nowrap">
                            Direction Swapped
                        </div>
                    )}
                </div>

                {/* Conflict Warning */}
                {isEditing && isSwapped && (
                    <div className="flex gap-2 items-start p-2 bg-yellow-900/20 rounded-lg border border-yellow-500/20 text-yellow-200 text-[10px]">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="font-bold">Warning:</span> Swapping direction implies the relationship logic is reversed. Please verify the Type and Justification.
                        </div>
                    </div>
                )}

                {isEditing ? (
                    <div className="space-y-4">

                        {/* Type Selector */}
                        <div className="grid grid-cols-2 gap-2">
                            <ConnectionType type="reference" label="Reference" icon={Link2} color="blue" description="Related concepts" />
                            <ConnectionType type="agree" label="Agree" icon={Sparkles} color="green" description="Supports" />
                            <ConnectionType type="disagree" label="Disagree" icon={X} color="red" description="Contradicts" />
                            <ConnectionType type="contains" label="Hierarchy" icon={GitMerge} color="yellow" description="Parent/Child" />
                            <ConnectionType type="mutual" label="Mutual" icon={ArrowLeftRight} color="purple" description="Bidirectional" />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Justification</label>
                            <textarea
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                className="w-full h-20 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                            >
                                <Save className="w-3 h-3" /> {isSwapped ? "Save & Swap" : "Save Changes"}
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setIsSwapped(false); }}
                                className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-3 h-3" /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-xl border ${edge.data?.type === 'agree' ? 'bg-green-900/20 border-green-500/30' :
                            edge.data?.type === 'disagree' ? 'bg-red-900/20 border-red-500/30' :
                                edge.data?.type === 'contains' ? 'bg-yellow-900/20 border-yellow-500/30' :
                                    edge.data?.type === 'mutual' ? 'bg-purple-900/20 border-purple-500/30' :
                                        'bg-blue-900/20 border-blue-500/20'
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <label className={`text-[10px] uppercase font-bold ${edge.data?.type === 'agree' ? 'text-green-400' :
                                    edge.data?.type === 'disagree' ? 'text-red-400' :
                                        edge.data?.type === 'contains' ? 'text-yellow-400' :
                                            edge.data?.type === 'mutual' ? 'text-purple-400' :
                                                'text-blue-400'
                                    }`}>
                                    {edge.data?.type?.toUpperCase() || "REFERENCE"}
                                </label>
                                {edge.data?.type === 'contains' && <GitMerge className="w-3 h-3 text-yellow-500" />}
                                {edge.data?.type === 'agree' && <Sparkles className="w-3 h-3 text-green-500" />}
                                {edge.data?.type === 'disagree' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                {edge.data?.type === 'mutual' && <ArrowLeftRight className="w-3 h-3 text-purple-500" />}
                            </div>
                            <p className="text-sm text-gray-200 leading-relaxed italic">
                                "{edge.label || "Linked"}"
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-white/5"
                            >
                                <Edit2 className="w-3 h-3" /> Edit Connection
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EdgeInspector;
