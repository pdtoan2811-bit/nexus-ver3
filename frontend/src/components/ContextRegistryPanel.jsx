import React, { useEffect, useState } from 'react';
import { getContext } from '../api';
import { RefreshCw, Book, Folder, Layers } from 'lucide-react';

const ContextRegistryPanel = ({ isOpen, onClose }) => {
  const [registry, setRegistry] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchContext = async () => {
    setLoading(true);
    try {
      const data = await getContext();
      setRegistry(data);
    } catch (error) {
      console.error("Failed to load registry:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContext();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-gray-900 border-r border-gray-700 shadow-2xl z-30 flex flex-col transform transition-transform duration-300 ease-in-out">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
          <Book className="w-5 h-5" />
          Context Registry
        </h2>
        <div className="flex gap-2">
            <button 
            onClick={fetchContext} 
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            title="Refresh"
            >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white font-bold"
            >
                ✕
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <p className="text-xs text-gray-500 italic">
            This registry defines the semantic structure of your knowledge base. 
            Nexus automatically evolves this structure as you add new content.
        </p>

        {registry && registry.topics && Object.entries(registry.topics).map(([topicName, topicData]) => (
          <div key={topicName} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center gap-2">
              <Folder className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-gray-200">{topicName}</span>
            </div>
            
            <div className="p-3">
                <p className="text-xs text-gray-400 mb-3">{topicData.description}</p>
                
                <div className="space-y-2">
                    {topicData.modules && Object.entries(topicData.modules).map(([modName, modDesc]) => (
                        <div key={modName} className="flex flex-col pl-2 border-l-2 border-blue-900/50">
                            <div className="flex items-center gap-2">
                                <Layers className="w-3 h-3 text-blue-400" />
                                <span className="text-sm text-gray-300">{modName}</span>
                            </div>
                            <span className="text-xs text-gray-500 ml-5 truncate" title={modDesc}>
                                {modDesc || "No description"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextRegistryPanel;

