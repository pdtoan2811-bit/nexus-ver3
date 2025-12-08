import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, Box } from 'lucide-react';

const CustomNode = memo(({ data, selected }) => {
  // Apple-style: Subtle gradients, backdrop blur, smooth shadows
  // Obsidian-style: Dark, minimal, clean typography
  
  return (
    <div className={`relative group transition-all duration-300 ease-out
        ${selected 
            ? 'scale-105 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
            : 'hover:scale-102 hover:shadow-lg'
        }
    `}>
      {/* Glassmorphism Container */}
      <div className="
        backdrop-blur-xl bg-gray-900/80 
        border border-white/10 
        rounded-2xl 
        overflow-hidden
        w-64
        shadow-xl
      ">
        {/* Header Gradient */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${
            data.module === 'Payments' ? 'from-green-400 to-emerald-600' :
            data.module === 'Auth' ? 'from-purple-400 to-pink-600' :
            'from-blue-400 to-indigo-600'
        }`} />

        <div className="p-4">
            {/* Icon & Type */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400">
                    {data.type === 'module' ? <Box size={14} /> : <FileText size={14} />}
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                        {data.module || 'General'}
                    </span>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-gray-100 leading-snug line-clamp-2 mb-2">
                {data.title || data.label}
            </h3>

            {/* Summary (if available) */}
            {data.summary && (
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed border-t border-white/5 pt-2 mt-2">
                    {data.summary}
                </p>
            )}
        </div>
      </div>

      {/* Handles - Hidden unless hovering or selected to reduce noise */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500/50 border-0 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-500/50 border-0 !opacity-0 group-hover:!opacity-100 transition-opacity" />
    </div>
  );
});

export default CustomNode;

