import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, Box, PlayCircle, ExternalLink, Loader2, AlertCircle, Folder, Layers, GitCommit } from 'lucide-react';

const CustomNode = memo(({ data, selected }) => {
  const isVideo = !!data.video_id;
  const isLoading = data.status === 'loading';
  const isError = data.status === 'error';
  const nodeType = data.node_type || 'child';
  const mainColor = data.color || '#0A84FF'; // Default iOS Blue

  // --- LOADING STATE ---
  if (isLoading) {
      return (
        <div className="relative rounded-2xl w-64 h-24 overflow-hidden shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl bg-black/40 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="flex items-center gap-3 z-10">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-xs font-medium text-gray-300 tracking-wide animate-pulse">Processing...</span>
            </div>
        </div>
      );
  }

  // --- ERROR STATE ---
  if (isError) {
      return (
        <div className="relative rounded-2xl w-64 overflow-hidden shadow-2xl ring-1 ring-red-500/50 backdrop-blur-2xl bg-red-900/20 p-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-red-200">Error</h3>
                    <p className="text-[10px] text-red-300/80 mt-1 leading-relaxed">
                        {data.error || "Failed to load."}
                    </p>
                </div>
            </div>
            <Handle type="target" position={Position.Left} className="!bg-red-500/50 border-0 w-2 h-2" />
            <Handle type="source" position={Position.Right} className="!bg-red-500/50 border-0 w-2 h-2" />
        </div>
      );
  }

  // --- 1. TOPIC NODE (Root Level) ---
  // Large, Pill-like, "Section Header" feel with optional thumbnail
  if (nodeType === 'topic') {
      const hasThumbnail = !!data.thumbnail;
      const isVideo = !!data.video_id;
      
      return (
        <div className={`relative group transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${selected ? 'scale-105' : 'hover:scale-102'}
        `}>
            {/* Glow Effect */}
            <div 
                className={`absolute -inset-1 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                style={{ backgroundColor: mainColor }}
            />
            
            <div className="relative backdrop-blur-3xl bg-gray-900/80 border border-white/10 rounded-[1.5rem] overflow-hidden min-w-[320px] shadow-2xl flex flex-col">
                {/* Colored Stripe */}
                <div className="h-1.5 w-full" style={{ backgroundColor: mainColor }} />
                
                {/* Thumbnail Section (if available) */}
                {hasThumbnail && (
                    <div className="relative w-full overflow-hidden" style={{ height: '200px', maxHeight: '200px' }}>
                        <img 
                            src={
                                data.thumbnail.startsWith('http') 
                                    ? data.thumbnail 
                                    : `http://localhost:8000${data.thumbnail}`
                            }
                            alt="Topic thumbnail"
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg" />
                            </div>
                        )}
                        {/* Topic Badge Overlay */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 flex items-center gap-2">
                            <Folder size={12} style={{ color: mainColor }} />
                            <span className="text-[9px] uppercase tracking-wider font-bold text-white">Topic</span>
                        </div>
                    </div>
                )}
                
                <div className={`p-6 flex items-center gap-5 ${hasThumbnail ? '' : ''}`}>
                    {!hasThumbnail && (
                        <div 
                            className="p-3.5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 shadow-inner border border-white/5 shrink-0"
                        >
                            <Folder size={28} style={{ color: mainColor }} />
                        </div>
                    )}
                    <div className={hasThumbnail ? 'w-full' : ''}>
                        {!hasThumbnail && (
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-1 block">Topic</span>
                        )}
                        <h2 className={`font-bold text-white leading-tight tracking-tight drop-shadow-sm ${hasThumbnail ? 'text-xl' : 'text-2xl'}`}>
                            {data.title || data.label}
                        </h2>
                    </div>
                </div>
                
                {data.summary && (
                    <div className={`text-xs text-gray-400 font-medium leading-relaxed opacity-80 ${hasThumbnail ? 'px-6 pb-6' : 'px-6 pb-6'}`}>
                        {data.summary}
                    </div>
                )}
            </div>
            
            {/* Large Touch Targets for Connections */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className="w-6 h-full !bg-transparent border-0 rounded-r-[1.5rem] -right-3 z-50 cursor-crosshair"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <Handle 
                type="target" 
                position={Position.Left} 
                className="w-6 h-full !bg-transparent border-0 rounded-l-[1.5rem] -left-3 z-50" 
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
        </div>
      );
  }

  // --- 2. MODULE NODE (Level 1) ---
  // Structured Card, "Container" feel with optional thumbnail
  if (nodeType === 'module') {
      const hasThumbnail = !!data.thumbnail;
      const isVideo = !!data.video_id;
      
      return (
        <div className={`relative group transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${selected ? 'scale-105' : 'hover:scale-102'}
        `}>
            {/* Subtle Glow */}
            <div 
                className={`absolute -inset-0.5 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                style={{ backgroundColor: mainColor }}
            />

            <div className="relative backdrop-blur-2xl bg-gray-800/90 border border-white/10 rounded-2xl overflow-hidden w-72 shadow-xl flex flex-col">
                {/* Thumbnail Section (if available) */}
                {hasThumbnail && (
                    <div className="relative w-full overflow-hidden" style={{ height: '160px', maxHeight: '160px' }}>
                        <img 
                            src={
                                data.thumbnail.startsWith('http') 
                                    ? data.thumbnail 
                                    : `http://localhost:8000${data.thumbnail}`
                            }
                            alt="Module thumbnail"
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent" />
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                <PlayCircle className="w-10 h-10 text-white/90 drop-shadow-lg" />
                            </div>
                        )}
                        {/* Module Badge Overlay */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                            <Layers size={10} style={{ color: mainColor }} />
                            <span className="text-[8px] uppercase tracking-wider font-bold text-white">Module</span>
                        </div>
                    </div>
                )}
                
                {!hasThumbnail && (
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
                        <Layers size={14} style={{ color: mainColor }} />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Module</span>
                    </div>
                )}
                
                <div className={`${hasThumbnail ? 'p-4' : 'p-4'}`}>
                    <h3 className={`font-bold text-gray-100 leading-tight mb-2 ${hasThumbnail ? 'text-base' : 'text-lg'}`}>
                        {data.title || data.label}
                    </h3>
                    {data.summary && (
                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                            {data.summary}
                        </p>
                    )}
                </div>
                
                {/* Bottom Accent Line */}
                <div className="h-1 w-full absolute bottom-0 left-0 opacity-50" style={{ backgroundColor: mainColor }} />
            </div>

            {/* Large Touch Targets */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className="w-4 h-full !bg-transparent border-0 -left-2 z-50"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                className="w-4 h-full !bg-transparent border-0 -right-2 z-50 cursor-crosshair"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
        </div>
      );
  }

  // --- 3. CHILD / PARENT NODES (Standard) ---
  return (
    <div className={`relative group transition-all duration-300 ease-out
        ${selected 
            ? 'scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
            : 'hover:scale-102 hover:shadow-xl'
        }
    `}>
      <div className={`
        backdrop-blur-xl bg-gray-900/80 
        border ${selected ? 'border-white/30' : 'border-white/10'}
        rounded-xl 
        overflow-hidden
        w-64
        shadow-lg
        flex flex-col
      `}>
        {/* Header Media */}
        {(isVideo || data.thumbnail) ? (
            <div className="relative w-full group/video cursor-pointer overflow-hidden flex items-center justify-center bg-black/20" style={{ minHeight: '128px', maxHeight: '200px' }}>
                <img 
                    src={
                        data.thumbnail 
                            ? (data.thumbnail.startsWith('http') ? data.thumbnail : `http://localhost:8000${data.thumbnail}`)
                            : `https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`
                    } 
                    alt="Thumbnail" 
                    className="w-full h-auto object-contain opacity-90 group-hover/video:opacity-100 group-hover/video:scale-105 transition-all duration-500"
                    style={{ maxHeight: '200px', width: '100%' }}
                    onError={(e) => {
                        // Fallback if image fails to load
                        e.target.style.display = 'none';
                    }}
                />
                {isVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/40 transition-colors">
                        <PlayCircle className="w-10 h-10 text-white/90 drop-shadow-lg" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
                )}
                
                {/* Type Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                    {nodeType === 'parent' ? <Box size={10} className="text-white" /> : <GitCommit size={10} className="text-gray-300" />}
                    <span className="text-[9px] font-bold uppercase tracking-wide text-white">
                        {nodeType === 'parent' ? 'Parent' : 'Child'}
                    </span>
                </div>

                {/* Link */}
                {isVideo && (
                    <a 
                        href={`https://www.youtube.com/watch?v=${data.video_id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-white hover:text-black transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={10} />
                    </a>
                )}
            </div>
        ) : (
            // Minimal Header for Text Nodes
            <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-white/5">
                 <div className="flex items-center gap-2">
                    {nodeType === 'parent' ? (
                        <Box size={12} style={{ color: mainColor }} />
                    ) : (
                        <FileText size={12} className="text-gray-400" />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        {nodeType}
                    </span>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mainColor }} />
            </div>
        )}

        <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-100 leading-snug line-clamp-3 mb-2">
                {data.title || data.label}
            </h3>

            {data.summary && (
                <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-3 border-l-2 border-white/10 pl-2">
                    {data.summary}
                </p>
            )}
        </div>
      </div>

      {/* LARGE INVISIBLE HANDLES for easier connecting */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-4 h-full !bg-transparent border-0 -left-2 z-50"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-4 h-full !bg-transparent border-0 -right-2 z-50 cursor-crosshair"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
});

export default CustomNode;
