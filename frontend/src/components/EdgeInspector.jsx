import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Save, RotateCcw, Link2, ArrowRight } from 'lucide-react';
import { updateEdge, deleteEdge } from '../api';

const EdgeInspector = ({ edge, onClose, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (edge) {
        setJustification(edge.label || '');
        setIsEditing(false);
    }
  }, [edge]);

  if (!edge) return null;

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
        await updateEdge(edge.source, edge.target, { justification });
        setIsEditing(false);
        if (onRefresh) onRefresh();
    } catch (error) {
        console.error("Update failed:", error);
        alert("Failed to update edge.");
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95 ring-1 ring-white/10">
      
      <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-semibold">
            <Link2 className="w-4 h-4 text-blue-400" />
            Connection
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Source -> Target Visual */}
        <div className="flex items-center justify-between text-xs text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="truncate max-w-[40%] font-mono" title={edge.source}>{edge.source}</span>
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="truncate max-w-[40%] font-mono" title={edge.target}>{edge.target}</span>
        </div>

        {isEditing ? (
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Justification</label>
                    <textarea 
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        className="w-full h-24 bg-black/30 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none resize-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleSave}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-2"
                    >
                        <Save className="w-3 h-3" /> Save
                    </button>
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-3 h-3" /> Cancel
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-lg">
                    <label className="text-[10px] text-blue-300/60 uppercase font-bold block mb-1">Logic / Reason</label>
                    <p className="text-sm text-blue-100 leading-relaxed italic">
                        "{edge.label || "Linked"}"
                    </p>
                </div>

                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-900/50 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
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

