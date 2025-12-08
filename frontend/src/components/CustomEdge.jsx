import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        id={id} 
        style={{
            stroke: selected ? '#3b82f6' : '#4b5563', // Blue when selected, Gray otherwise
            strokeWidth: selected ? 2 : 1,
            opacity: selected ? 1 : 0.4,
            transition: 'all 0.3s ease'
        }}
      />
      
      {/* Edge Label - Only show when selected/hovered (handled by group logic in parent usually, but here explicit selected prop) */}
      {(selected || label) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`
                px-3 py-1.5 
                rounded-full 
                bg-black/80 backdrop-blur-md 
                border border-white/10 
                text-[10px] text-gray-300 font-medium 
                shadow-lg
                transition-all duration-300
                ${selected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 hover:opacity-100 hover:scale-100'}
            `}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;

