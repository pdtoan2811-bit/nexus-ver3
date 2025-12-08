import React from 'react';
import { Handle, Position } from 'reactflow';

const ElegantNode = ({ data, selected }) => {
  return (
    <div 
      className={`relative px-4 py-3 rounded-xl shadow-lg transition-all duration-300 backdrop-blur-md
        ${selected 
          ? 'bg-gray-800/90 border-2 border-blue-500 shadow-blue-500/30 scale-105' 
          : 'bg-gray-900/80 border border-gray-700 hover:border-gray-500 hover:shadow-xl'
        }
      `}
      style={{ minWidth: '180px', maxWidth: '240px' }}
    >
      {/* Handles - Hidden by default, show on hover/drag? Or just subtle dots */}
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !w-2 !h-2 !border-0" />
      
      <div className="flex flex-col gap-1">
        {/* Module Tag - Apple-like Pill */}
        {data.module && (
          <span className="self-start text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/50">
            {data.module}
          </span>
        )}
        
        {/* Title */}
        <div className="text-sm font-semibold text-gray-100 leading-tight mt-1">
          {data.label}
        </div>

        {/* Topic Cluster - Subtle footer */}
        {data.topic_cluster && (
            <div className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">
                {data.topic_cluster}
            </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-gray-500 !w-2 !h-2 !border-0" />
    </div>
  );
};

export default ElegantNode;

