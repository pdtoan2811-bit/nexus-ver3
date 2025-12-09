import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, BrainCircuit, FilePlus, Sparkles, Maximize2, Minimize2, X, FileText, ArrowLeft, Plus, Network, Edit2, Trash2, Save, RotateCcw, Wand2, GitFork, ArrowUpCircle, Layers, Palette, Users, FileText as FileTextIcon } from 'lucide-react';
import { analyzeNode, updateNode, deleteNode, getContext, rewriteNode, expandNode } from '../api';

const ChatInterface = ({ 
  history, 
  onSendMessage, 
  dominantModule, 
  contextCount,
  isLoading,
  onTurnToDoc,
  onToggleMaximize,
  isMaximized,
  onToggleSidebar,
  // Document view props
  documentNode,
  onCloseDocument,
  onExpandContext,
  onRefresh, // For refreshing graph after updates
  // Mode switching props
  chatMode = 'document',
  onSwitchChatMode,
  selectedNodeIds = []
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const isDocumentMode = !!documentNode;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [registry, setRegistry] = useState(null);
  
  // AI Actions state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isExpandingDown, setIsExpandingDown] = useState(false);
  const [isExpandingUp, setIsExpandingUp] = useState(false);

  // Load Context for Dropdowns when editing
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const data = await getContext();
        setRegistry(data);
      } catch (error) {
        console.error("Failed to load registry:", error);
      }
    };
    if (isEditing && documentNode) {
      fetchContext();
    }
  }, [isEditing, documentNode]);

  // Initialize edit form when document changes
  useEffect(() => {
    if (documentNode && !isEditing) {
      setEditForm({
        title: documentNode.title || documentNode.label || documentNode.id,
        summary: documentNode.summary || '',
        module: documentNode.module || 'General',
        main_topic: documentNode.main_topic || 'Uncategorized',
        node_type: documentNode.node_type || 'child',
        color: documentNode.color || '',
        tags: (documentNode.tags || []).join(', '),
        content: documentNode.content || '',
        thumbnailFile: null,
        thumbnailPreview: null
      });
    }
  }, [documentNode, isEditing]);

  useEffect(() => {
    if (isDocumentMode && messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = 0;
    } else if (!isDocumentMode) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [documentNode, isDocumentMode]);

  useEffect(() => {
    if (!isDocumentMode) {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isLoading, isDocumentMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  // AI Actions Handlers
  const handleAnalyze = async () => {
    if (!documentNode) return;
    setIsAnalyzing(true);
    try {
      await analyzeNode(documentNode.id);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze node: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewrite = async () => {
    if (!documentNode) return;
    setIsRewriting(true);
    try {
      await rewriteNode(documentNode.id);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Rewrite failed:", error);
      alert("Failed to rewrite node: " + error.message);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleExpand = async (direction) => {
    if (!documentNode) return;
    if (direction === "down") setIsExpandingDown(true);
    else setIsExpandingUp(true);

    try {
      await expandNode(documentNode.id, direction);
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
    if (!documentNode) return;
    if (window.confirm(`Are you sure you want to delete node "${documentNode.id}"? This action cannot be undone.`)) {
      try {
        await deleteNode(documentNode.id);
        if (onRefresh) onRefresh();
        if (onCloseDocument) onCloseDocument();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete node.");
      }
    }
  };

  const handleSave = async () => {
    if (!documentNode) return;
    try {
      const updates = {
        ...editForm,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      
      // Remove preview and file from updates (they're not part of the node data)
      const { thumbnailFile, thumbnailPreview, ...nodeUpdates } = updates;
      
      // Upload with thumbnail file if provided
      await updateNode(documentNode.id, nodeUpdates, thumbnailFile);
      setIsEditing(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update node: " + (error.message || "Unknown error"));
    }
  };

  const nodeTypeOptions = [
    { value: 'topic', label: 'Topic (Level 0)' },
    { value: 'module', label: 'Module (Level 1)' },
    { value: 'parent', label: 'Parent Node (Level 2)' },
    { value: 'child', label: 'Child Node (Level 3)' },
  ];

  // Document view content - Full metadata and content display with all actions
  const renderDocumentContent = () => {
    if (!documentNode) return null;

    const isVideo = !!documentNode.video_id;
    const hasThumbnail = !!documentNode.thumbnail;

    if (isEditing) {
      // EDIT MODE
      return (
        <div className="space-y-4 sm:space-y-6 w-full">
          <div className="bg-[#1C1C1E] p-3 sm:p-4 rounded-xl border border-white/10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-white">Editing Document</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Title</label>
                <input 
                  type="text" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Node Type</label>
                  <select 
                    value={editForm.node_type}
                    onChange={(e) => setEditForm({...editForm, node_type: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  >
                    {nodeTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Color Override</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={editForm.color || '#000000'}
                      onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                      className="h-10 w-10 rounded cursor-pointer bg-transparent border border-white/10"
                    />
                    {editForm.color && (
                      <button 
                        onClick={() => setEditForm({...editForm, color: ''})}
                        className="text-xs text-gray-400 hover:text-white underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Main Topic</label>
                  {registry ? (
                    <select 
                      value={editForm.main_topic}
                      onChange={(e) => {
                        setEditForm({
                          ...editForm, 
                          main_topic: e.target.value,
                          module: ''
                        });
                      }}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Topic...</option>
                      {Object.keys(registry.topics).map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-gray-500">Loading...</div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Module</label>
                  {registry && editForm.main_topic && registry.topics[editForm.main_topic] ? (
                    <select 
                      value={editForm.module}
                      onChange={(e) => setEditForm({...editForm, module: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Module...</option>
                      <option value="General">General</option>
                      {Object.keys(registry.topics[editForm.main_topic].modules || {}).map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={editForm.module}
                      onChange={(e) => setEditForm({...editForm, module: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                      placeholder="Module Name"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Tags</label>
                <input 
                  type="text" 
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Summary</label>
                <textarea 
                  value={editForm.summary}
                  onChange={(e) => setEditForm({...editForm, summary: e.target.value})}
                  className="w-full h-32 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Thumbnail Image</label>
                <div className="space-y-2">
                  {editForm.thumbnailPreview && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
                      <img 
                        src={editForm.thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {documentNode?.thumbnail && !editForm.thumbnailPreview && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
                      <img 
                        src={
                          documentNode.thumbnail.startsWith('http') 
                            ? documentNode.thumbnail 
                            : `http://localhost:8000${documentNode.thumbnail}`
                        }
                        alt="Current thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm({
                            ...editForm, 
                            thumbnailFile: file,
                            thumbnailPreview: reader.result
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  />
                  {editForm.thumbnailFile && (
                    <button
                      onClick={() => setEditForm({...editForm, thumbnailFile: null, thumbnailPreview: null})}
                      className="text-xs text-gray-400 hover:text-white underline"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // VIEW MODE
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#1C1C1E] p-3 sm:p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* AI Actions Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold border-b border-white/10 pb-2">
            <Sparkles className="w-4 h-4" />
            AI Actions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button 
              onClick={() => handleExpand('down')}
              disabled={isExpandingDown}
              className="bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 rounded-xl p-3 text-left transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-2 text-purple-300 text-xs font-bold mb-1">
                {isExpandingDown ? <Wand2 className="w-3 h-3 animate-spin"/> : <GitFork className="w-3 h-3 rotate-180" />}
                Break Down
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">
                Create MECE sub-nodes (Lower Level)
              </div>
            </button>

            <button 
              onClick={() => handleExpand('up')}
              disabled={isExpandingUp}
              className="bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 rounded-xl p-3 text-left transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold mb-1">
                {isExpandingUp ? <Wand2 className="w-3 h-3 animate-spin"/> : <ArrowUpCircle className="w-3 h-3" />}
                Abstract
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">
                Create parent concept (Upper Level)
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
            <span className="text-xs text-gray-400">Content Refinement</span>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={handleRewrite}
                disabled={isRewriting}
                className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition-colors"
                title="Rewrite description based on connected nodes"
              >
                {isRewriting ? <Wand2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                Context Rewrite
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                {isAnalyzing ? <BrainCircuit className="w-3 h-3 animate-pulse" /> : <Sparkles className="w-3 h-3" />}
                Regenerate
              </button>
            </div>
          </div>
        </div>

        {/* Document Header with Thumbnail */}
        {(isVideo || hasThumbnail) && (
          <div className="relative h-48 sm:h-64 w-full rounded-xl overflow-hidden">
            <img 
              src={documentNode.thumbnail || `https://img.youtube.com/vi/${documentNode.video_id}/mqdefault.jpg`} 
              alt="Document thumbnail" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <a 
                  href={`https://www.youtube.com/watch?v=${documentNode.video_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transform transition-transform hover:scale-110"
                >
                  <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center border-2 border-white/30">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-[#1C1C1E] p-3 sm:p-4 rounded-xl border border-white/10">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Type
            </div>
            <div className="text-sm font-semibold text-white capitalize break-words">
              {documentNode.node_type || 'Child'}
            </div>
          </div>
          <div className="bg-[#1C1C1E] p-3 sm:p-4 rounded-xl border border-white/10">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3" />
              Topic
            </div>
            <div className="text-sm font-semibold text-white break-words">
              {documentNode.main_topic || 'Uncategorized'}
            </div>
          </div>
          <div className="bg-[#1C1C1E] p-3 sm:p-4 rounded-xl border border-white/10">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2">Module</div>
            <div className="text-sm font-semibold text-white break-words">
              {documentNode.module || 'General'}
            </div>
          </div>
          <div className="bg-[#1C1C1E] p-3 sm:p-4 rounded-xl border border-white/10">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2">Created</div>
            <div className="text-sm font-semibold text-gray-300 break-words">
              {documentNode.created_at ? new Date(documentNode.created_at).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Summary */}
        {documentNode.summary && (
          <div className="bg-purple-900/10 border border-purple-500/20 p-3 sm:p-4 rounded-xl">
            <div className="text-xs text-purple-400 uppercase font-bold mb-2">Summary</div>
            <div className="text-sm text-gray-300 italic leading-relaxed break-words">
              "{documentNode.summary}"
            </div>
          </div>
        )}

        {/* Tags */}
        {documentNode.tags && documentNode.tags.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {documentNode.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-white/5 text-gray-300 px-3 py-1.5 rounded-full border border-white/10">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="w-full overflow-hidden">
          <div className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Original Content
          </div>
          <div className="prose prose-invert prose-sm max-w-none w-full
            text-gray-300
            prose-headings:text-gray-100 prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-xl sm:text-2xl prose-h1:mb-4 sm:mb-6 prose-h1:mt-2
            prose-h2:text-lg sm:text-xl prose-h2:mb-3 sm:mb-4 prose-h2:mt-6 sm:mt-8
            prose-h3:text-base sm:text-lg prose-h3:mb-2 sm:mb-3 prose-h3:mt-4 sm:mt-6
            prose-p:leading-7 sm:leading-8 prose-p:text-[14px] sm:text-[15px] prose-p:text-gray-300 prose-p:mb-3 sm:mb-4 prose-p:break-words
            prose-a:text-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:break-words
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:my-3 sm:my-4 prose-ul:list-disc prose-ul:pl-4 sm:pl-6
            prose-ol:my-3 sm:my-4 prose-ol:list-decimal prose-ol:pl-4 sm:pl-6
            prose-li:my-1 prose-li:text-gray-300 prose-li:break-words
            prose-code:text-[#FF79C6] prose-code:bg-[#1E1E1E] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[12px] sm:text-[13px] prose-code:break-all
            prose-pre:bg-[#151517] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-3 sm:p-4 prose-pre:overflow-x-auto
            prose-blockquote:border-l-2 prose-blockquote:border-purple-500/50 prose-blockquote:bg-purple-500/5 prose-blockquote:px-4 sm:px-5 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-400
            prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:my-4
            prose-table:w-full prose-table:overflow-x-auto prose-table:block prose-table:whitespace-nowrap
            prose-th:text-gray-400 prose-th:font-medium prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:p-2 sm:p-3 prose-th:border-b prose-th:border-white/10
            prose-td:p-2 sm:p-3 prose-td:border-b prose-td:border-white/5 prose-td:text-gray-300 prose-td:break-words
            bg-[#151517] p-4 sm:p-6 rounded-xl border border-white/10 overflow-x-hidden
          ">
            {documentNode.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {documentNode.content}
              </ReactMarkdown>
            ) : (
              <div className="text-gray-500 italic">No content available for this document.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] border-l border-white/10 font-sans transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0D0D0D]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
            {isDocumentMode && (
              <button
                onClick={onCloseDocument}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
                title="Back to Chat"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="bg-purple-500/10 p-2 rounded-xl shrink-0">
                {isDocumentMode ? (
                  <FileText className="w-5 h-5 text-blue-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-purple-400" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-white tracking-wide truncate">
                  {isDocumentMode ? (documentNode.title || documentNode.id) : 'Nexus AI'}
            </h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                    <span className="text-[11px] text-gray-400 font-medium">
                        {isDocumentMode 
                          ? 'Document View' 
                          : chatMode === 'multi-node'
                            ? (contextCount > 0 ? `${contextCount} Nodes Context` : selectedNodeIds.length > 0 ? `${selectedNodeIds.length} Selected` : 'Select Nodes')
                            : (contextCount > 0 ? `${contextCount} Nodes Context` : 'Ready')
                        }
                    </span>
                    {!isDocumentMode && dominantModule && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-300 rounded border border-white/5">
                    {dominantModule}
                </span>
            )}
        </div>
            </div>
        </div>
        
        {/* Window Controls */}
        <div className="flex items-center gap-1 shrink-0">
            {/* Mode Switch Button */}
            {onSwitchChatMode && (
              <button
                onClick={() => onSwitchChatMode(chatMode === 'document' ? 'multi-node' : 'document')}
                className={`p-2 rounded-lg transition-colors ${
                  chatMode === 'multi-node' 
                    ? 'bg-blue-600/80 text-white hover:bg-blue-500' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={chatMode === 'document' ? 'Switch to Multi-Node Context Mode' : 'Switch to Document Mode'}
              >
                {chatMode === 'document' ? <Users className="w-4 h-4" /> : <FileTextIcon className="w-4 h-4" />}
              </button>
            )}
            {!isDocumentMode && onExpandContext && contextCount > 0 && (
              <button
                onClick={onExpandContext}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Add More Nodes to Context"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button 
                onClick={onToggleMaximize}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
            >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesAreaRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-0 bg-[#0D0D0D]">
        <div className={`mx-auto w-full p-4 sm:p-6 space-y-6 sm:space-y-10 ${isMaximized ? 'max-w-5xl' : 'max-w-2xl'}`}>
            {isDocumentMode ? (
              // Document View Mode - Full document display with all actions
              <>
                <div className="flex flex-col items-start w-full mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                      DOCUMENT
                    </span>
                  </div>
                  <div className="w-full overflow-x-hidden">
                    {renderDocumentContent()}
                  </div>
                </div>
                
                {/* Conversation Section */}
                {history.length > 0 && (
                  <div className="border-t border-white/10 pt-8 mt-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Network className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-gray-300">Conversation</span>
                    </div>
                    {history.map((msg, idx) => (
                      <div key={idx} className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-6`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-3 pl-1">
                            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                              NEXUS
                            </span>
                          </div>
                        )}
                        <div className={`relative ${
                          msg.role === 'user' 
                            ? 'bg-[#1C1C1E] text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] border border-white/5 shadow-sm' 
                            : 'w-full pl-1'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-invert prose-sm max-w-none 
                              text-gray-300
                              prose-headings:text-gray-100 prose-headings:font-bold prose-headings:tracking-tight
                              prose-h1:text-2xl prose-h1:mb-6 prose-h1:mt-2
                              prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-8
                              prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-6
                              prose-p:leading-8 prose-p:text-[15px] prose-p:text-gray-300 prose-p:mb-4
                              prose-a:text-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                              prose-strong:text-white prose-strong:font-semibold
                              prose-ul:my-4 prose-ul:list-disc prose-ul:pl-4
                              prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-4
                              prose-li:my-1 prose-li:text-gray-300
                              prose-code:text-[#FF79C6] prose-code:bg-[#1E1E1E] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px]
                              prose-pre:bg-[#151517] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4
                              prose-blockquote:border-l-2 prose-blockquote:border-purple-500/50 prose-blockquote:bg-purple-500/5 prose-blockquote:px-5 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-400
                              prose-th:text-gray-400 prose-th:font-medium prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:p-3 prose-th:border-b prose-th:border-white/10
                              prose-td:p-3 prose-td:border-b prose-td:border-white/5 prose-td:text-gray-300
                            ">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Chat Mode
              <>
        {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm text-center py-32 space-y-4">
                    <div className="p-4 rounded-full bg-white/5">
                      <BrainCircuit className="w-8 h-8 text-gray-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-400">
                        {chatMode === 'multi-node' ? 'No nodes selected' : 'No context selected'}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {chatMode === 'multi-node' 
                          ? 'Select one or more nodes on the graph to create a multi-node context' 
                          : 'Select nodes on the graph to begin analysis'}
                      </p>
                    </div>
            </div>
        ) : (
            history.map((msg, idx) => (
                    <div key={idx} className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                    {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 pl-1">
                          <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            NEXUS
                          </span>
                        </div>
                    )}
                    
                      <div className={`relative ${
                        msg.role === 'user' 
                          ? 'bg-[#1C1C1E] text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] border border-white/5 shadow-sm' 
                          : 'w-full pl-1'
                    }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none 
                            text-gray-300
                            prose-headings:text-gray-100 prose-headings:font-bold prose-headings:tracking-tight
                            prose-h1:text-2xl prose-h1:mb-6 prose-h1:mt-2
                            prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-8
                            prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-6
                            prose-p:leading-8 prose-p:text-[15px] prose-p:text-gray-300 prose-p:mb-4
                            prose-a:text-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-white prose-strong:font-semibold
                            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-4
                            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-4
                            prose-li:my-1 prose-li:text-gray-300
                            prose-code:text-[#FF79C6] prose-code:bg-[#1E1E1E] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px]
                            prose-pre:bg-[#151517] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4
                            prose-blockquote:border-l-2 prose-blockquote:border-purple-500/50 prose-blockquote:bg-purple-500/5 prose-blockquote:px-5 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-400
                            prose-th:text-gray-400 prose-th:font-medium prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:p-3 prose-th:border-b prose-th:border-white/10
                            prose-td:p-3 prose-td:border-b prose-td:border-white/5 prose-td:text-gray-300
                          ">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                               </ReactMarkdown>

                            {/* Action Bar */}
                            <div className="mt-6 flex justify-start opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button 
                                onClick={() => onTurnToDoc(msg.content)}
                                className="text-xs font-medium flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all border border-white/5 hover:border-white/10"
                                title="Save as Document"
                              >
                                <FilePlus className="w-3.5 h-3.5" />
                                <span>Save to Graph</span>
                              </button>
                            </div>
                           </div> 
                        ) : (
                          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                </div>
            ))
        )}
              </>
            )}
            
            {/* Thinking State */}
        {isLoading && (
              <div className="flex flex-col items-start w-full animate-pulse pl-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-purple-400">NEXUS</span>
                </div>
                <div className="space-y-3 w-full max-w-2xl">
                  <div className="h-4 bg-white/5 rounded w-3/4"></div>
                  <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  <div className="h-4 bg-white/5 rounded w-5/6"></div>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-[#0D0D0D] border-t border-white/5">
        <div className={`mx-auto w-full relative ${isMaximized ? 'max-w-5xl' : 'max-w-2xl'}`}>
          <form onSubmit={handleSubmit} className="relative group">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              placeholder={isDocumentMode ? "Ask about this document..." : (contextCount > 0 ? "Ask a follow-up..." : "Select nodes and click Chat to begin...")}
              className="w-full bg-[#1C1C1E] text-white border border-white/10 rounded-2xl pl-4 sm:pl-5 pr-12 sm:pr-14 py-3 sm:py-4 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 placeholder-gray-600 text-[14px] sm:text-[15px] transition-all shadow-lg shadow-black/20"
              disabled={isLoading}
            />
            <button 
                type="submit"
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-0 disabled:scale-75 transition-all duration-200 shadow-lg shadow-purple-900/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] text-gray-600 font-medium tracking-wide">
              AI generated content may be inaccurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
