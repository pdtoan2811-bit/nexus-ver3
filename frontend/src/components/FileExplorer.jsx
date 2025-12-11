import React, { useState, useEffect } from 'react';
import { getFileTree, createFolder, ingestText } from '../api';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, RefreshCw, FolderPlus, ExternalLink } from 'lucide-react';

const FileTreeNode = ({ node, level, onSelect, onRefresh }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const hasChildren = node.children && node.children.length > 0;
    const isFolder = node.type === 'folder' || hasChildren;

    const handleClick = () => {
        if (isFolder) {
            setIsExpanded(!isExpanded);
        } else {
            onSelect(node);
        }
    };

    const handleCreateFile = async (e) => {
        e.stopPropagation();
        const name = prompt("Enter note name:");
        if (!name) return;
        try {
            await ingestText(name, "", node.id); // Create note with name as content (initially) and parent_id
            onRefresh && onRefresh();
            setIsExpanded(true); // Auto expand to show new file
        } catch (err) {
            console.error(err);
            alert("Failed to create note");
        }
    };

    const handleCreateFolder = async (e) => {
        e.stopPropagation();
        const name = prompt("Enter folder name:");
        if (!name) return;
        try {
            await createFolder(name, node.id);
            onRefresh && onRefresh();
            setIsExpanded(true);
        } catch (err) {
            console.error(err);
            alert("Failed to create folder");
        }
    };

    const indent = level * 12; // 12px indentation per level

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-800 cursor-pointer text-sm mb-0.5 rounded group
                    ${node.type === 'document' ? 'text-gray-300' : 'text-gray-200 font-medium'}
                `}
                style={{ paddingLeft: `${indent + 4}px` }}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {isFolder && (
                    <span onClick={handleToggle} className="text-gray-500 hover:text-white mr-0.5">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                )}

                {node.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                ) : (
                    <FileText className="w-3.5 h-3.5 text-gray-500 ml-5" /> // ml-5 compensates for missing chevron
                )}

                <span className="truncate flex-1">{node.label}</span>

                {/* Wrapper for Hover Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(node);
                        }}
                        className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-blue-300"
                        title="Open Document"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </button>
                    {(isFolder || node.type === 'folder' || node.type === 'document') && (
                        <>
                            <button
                                onClick={handleCreateFile}
                                className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-green-400"
                                title="New Note Inside"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-blue-400"
                                title="New Subfolder Inside"
                            >
                                <FolderPlus className="w-3 h-3" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isExpanded && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileTreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            onRefresh={onRefresh}
                        />
                    ))}
                    {node.children.length === 0 && (
                        <div
                            className="text-xs text-gray-600 py-1 pl-4 italic"
                            style={{ paddingLeft: `${indent + 28}px` }}
                        >
                            Empty
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const FileExplorer = ({ isOpen, onClose, onNodeSelect, refreshTrigger }) => {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTree();
        }
    }, [isOpen, refreshTrigger]);

    const fetchTree = async () => {
        setLoading(true);
        try {
            const data = await getFileTree();
            setTree(data || []);
        } catch (error) {
            console.error("Failed to load file tree:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            await createFolder(newFolderName); // Root folder for now
            setNewFolderName("");
            setShowNewFolderInput(false);
            fetchTree();
        } catch (e) {
            console.error(e);
            alert("Failed to create folder");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 left-0 h-full w-72 bg-[#111] border-r border-gray-800 shadow-2xl z-20 flex flex-col text-gray-300 font-sans">
            {/* Header */}
            <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-[#111]">
                <div className="font-semibold text-gray-200 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-400" />
                    Explorer
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                        className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                        title="New Folder"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={fetchTree}
                        className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                        title="Reload"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700">
                {showNewFolderInput && (
                    <form onSubmit={handleCreateFolder} className="px-2 py-1 mb-2">
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-gray-800 text-xs px-2 py-1 rounded border border-blue-900 focus:outline-none focus:border-blue-500 text-white"
                            placeholder="Folder Name..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onBlur={() => !newFolderName && setShowNewFolderInput(false)}
                        />
                    </form>
                )}

                {tree.map(node => (
                    <FileTreeNode
                        key={node.id}
                        node={node}
                        level={0}
                        onSelect={onNodeSelect}
                        onRefresh={fetchTree}
                    />
                ))}
            </div>

            <div className="p-2 border-t border-gray-800 text-[10px] text-gray-600 text-center">
                Obsidian-Style Dynamic Graph
            </div>
        </div>
    );
};

export default FileExplorer;
