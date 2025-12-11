import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, FileText, Sparkles, BrainCircuit, Edit2, Trash2, Save, RotateCcw, PlayCircle, ExternalLink, Box, Layers, Palette, Wand2, GitFork, ArrowUpCircle, MessageSquare } from 'lucide-react';
import { analyzeNode, updateNode, deleteNode, getContext, rewriteNode, expandNode } from '../api';

const NodeInspector = ({ node, onClose, onRefresh, onViewDocument }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [isExpandingDown, setIsExpandingDown] = useState(false);
    const [isExpandingUp, setIsExpandingUp] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [registry, setRegistry] = useState(null);

    // Load Context for Dropdowns
    useEffect(() => {
        const fetchContext = async () => {
            try {
                const data = await getContext();
                setRegistry(data);
            } catch (error) {
                console.error("Failed to load registry:", error);
            }
        };
        if (isEditing) fetchContext();
    }, [isEditing]);

    useEffect(() => {
        if (node) {
            setEditForm({
                title: node.title || node.label || node.id,
                summary: node.summary || '',
                style: node.style || 'default', // Replaces node_type
                parent_id: node.parent_id || '', // New field for hierarchy
                tags: (node.tags || []).join(', '),
                content: node.content || ''
            });
            setIsEditing(false);
        }
    }, [node]);

    if (!node) return null;

    const isVideo = !!node.video_id;
    const hasThumbnail = !!node.thumbnail;

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

    const handleRewrite = async () => {
        setIsRewriting(true);
        try {
            await rewriteNode(node.id);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Rewrite failed:", error);
            alert("Failed to rewrite node: " + error.message);
        } finally {
            setIsRewriting(false);
        }
    };

    const handleExpand = async (direction) => {
        if (direction === "down") setIsExpandingDown(true);
        else setIsExpandingUp(true);

        try {
            await expandNode(node.id, direction);
            if (onRefresh) onRefresh();
            alert(direction === "down" ? "Node broken down into sub-components!" : "Node abstracted into parent concept!");
        } catch (error) {
            console.error("Expansion failed:", error);
            alert("Failed to expand node: " + error.message);
        } finally {
            if (direction === "down") setIsExpandingDown(false);
            else setIsExpandingUp(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete node "${node.id}"? This action cannot be undone.`)) {
            try {
                await deleteNode(node.id);
                if (onRefresh) onRefresh();
                onClose();
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Failed to delete node.");
            }
        }
    };

    const handleSave = async () => {
        try {
            const updates = {
                ...editForm,
                tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t)
            };
            await updateNode(node.id, updates, editForm.thumbnailFile);
            setIsEditing(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update node.");
        }
    };

    const styleOptions = [
        { value: 'default', label: 'Default' },
        { value: 'card', label: 'Card' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'highlight', label: 'Highlight' }
    ];

    return (
        <div className="absolute top-4 right-4 z-40 w-96 max-h-[90vh] bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95 text-gray-200">
            {/* Header */}
            {(isVideo || hasThumbnail) && !isEditing ? (
                <div className="relative h-48 w-full shrink-0 group/video">
                    <img
                        src={node.thumbnail || `https://img.youtube.com/vi/${node.video_id}/mqdefault.jpg`}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/20 to-transparent" />

                    {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <a
                                href={`https://www.youtube.com/watch?v=${node.video_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transform transition-transform hover:scale-110 group-hover/video:scale-110"
                            >
                                <PlayCircle className="w-16 h-16 text-white/90 drop-shadow-lg hover:text-blue-400 transition-colors" />
                            </a>
                        </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white/80 hover:text-white transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h2 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                            {node.title || node.label || node.id}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-blue-300 font-mono uppercase px-1 bg-blue-900/40 rounded border border-blue-500/30">
                                {isVideo ? 'VIDEO' : (node.type || 'WEB')}
                            </span>
                            {node.style && (
                                <span className="text-xs text-gray-900 font-bold px-1.5 py-0.5 rounded border border-white/20 uppercase bg-gray-300">
                                    {node.style}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[#151517] p-4 border-b border-white/10 flex justify-between items-start shrink-0">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-lg font-bold text-white break-words truncate" title={node.id}>
                            {isEditing ? 'Editing Node' : (node.title || node.label || node.id)}
                        </h2>
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs text-blue-400 font-mono uppercase px-1 bg-blue-900/30 rounded border border-blue-800/50 inline-block">
                                {node.type || 'Node'}
                            </span>
                            {!isEditing && node.style && (
                                <span className="text-xs text-gray-900 font-bold px-1.5 rounded border border-white/20 uppercase flex items-center bg-gray-400">
                                    {node.style}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-gray-700 mx-1" />
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                {isEditing ? (
                    /* EDIT FORM */
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Title</label>
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        {/* Thumbnail Upload */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Thumbnail Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditForm({ ...editForm, thumbnailFile: e.target.files[0] })}
                                className="w-full text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-900/40 file:text-blue-300 hover:file:bg-blue-900/60"
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Visual Style</label>
                                <select
                                    value={editForm.style}
                                    onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                                >
                                    {styleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Parent Folder (ID)</label>
                                <input
                                    type="text"
                                    value={editForm.parent_id}
                                    onChange={(e) => setEditForm({ ...editForm, parent_id: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Current Folder ID"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Tags</label>
                            <input
                                type="text"
                                value={editForm.tags}
                                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Summary</label>
                            <textarea
                                value={editForm.summary}
                                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                className="w-full h-24 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none resize-none"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    /* VIEW MODE */
                    <>
                        {/* AI Expansion Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold border-b border-white/10 pb-2">
                                <Sparkles className="w-4 h-4" />
                                AI Actions
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Break Down */}
                                <button
                                    onClick={() => handleExpand('down')}
                                    disabled={isExpandingDown}
                                    className="bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 rounded p-2 text-left transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-2 text-purple-300 text-xs font-bold mb-1">
                                        {isExpandingDown ? <Wand2 className="w-3 h-3 animate-spin" /> : <GitFork className="w-3 h-3 rotate-180" />}
                                        Break Down
                                    </div>
                                    <div className="text-[10px] text-gray-400 leading-tight">
                                        Create MECE sub-nodes (Lower Level)
                                    </div>
                                </button>

                                {/* Abstract */}
                                <button
                                    onClick={() => handleExpand('up')}
                                    disabled={isExpandingUp}
                                    className="bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 rounded p-2 text-left transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-2 text-blue-300 text-xs font-bold mb-1">
                                        {isExpandingUp ? <Wand2 className="w-3 h-3 animate-spin" /> : <ArrowUpCircle className="w-3 h-3" />}
                                        Abstract
                                    </div>
                                    <div className="text-[10px] text-gray-400 leading-tight">
                                        Create parent concept (Upper Level)
                                    </div>
                                </button>
                            </div>

                            <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                <span className="text-xs text-gray-400">Content Refinement</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRewrite}
                                        disabled={isRewriting}
                                        className="text-xs bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                        title="Rewrite description based on connected nodes"
                                    >
                                        {isRewriting ? <Wand2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                        Context Rewrite
                                    </button>

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isAnalyzing ? <BrainCircuit className="w-3 h-3 animate-pulse" /> : <Sparkles className="w-3 h-3" />}
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-purple-900/10 border border-purple-500/20 p-3 rounded text-sm text-gray-300 italic">
                            "{node.summary || "No summary available. Click regenerate."}"
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                            {node.tags && node.tags.length > 0 ? (
                                node.tags.map((tag, i) => (
                                    <span key={i} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded-full border border-white/10">
                                        #{tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-500">No tags</span>
                            )}
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 p-3 rounded border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                    <Palette className="w-3 h-3" /> Style
                                </div>
                                <div className="font-semibold text-sm text-gray-200 capitalize">
                                    {node.style || 'Default'}
                                </div>
                            </div>
                            <div className="bg-black/30 p-3 rounded border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                    <Layers className="w-3 h-3" /> Type
                                </div>
                                <div className="font-semibold text-sm text-gray-200">
                                    {node.type || 'Document'}
                                </div>
                            </div>
                        </div>

                        {/* File Content */}
                        <div>
                            <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold">
                                    <FileText className="w-4 h-4" />
                                    Original Content
                                </div>
                                {onViewDocument && (
                                    <button
                                        onClick={() => {
                                            onViewDocument(node);
                                            onClose();
                                        }}
                                        className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-blue-500/30 transition-all"
                                        title="View in Chat Section"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        View in Chat
                                    </button>
                                )}
                            </div>
                            <div className="bg-[#151517] p-3 rounded border border-white/10 font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                                {node.content || "No content available."}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NodeInspector;
