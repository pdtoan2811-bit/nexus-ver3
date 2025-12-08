import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';

const ElegantEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected
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
        markerEnd={markerEnd} 
        style={{
            ...style,
            strokeWidth: selected ? 2 : 1.5,
            stroke: selected ? '#3b82f6' : '#4b5563', // Blue when selected, Gray-600 default
            opacity: selected ? 1 : 0.4, // Fade out unselected edges
            transition: 'all 0.3s ease'
        }} 
      />
      
      {/* Only show label if selected or hovered (handled by CSS group hover logic usually, but ReactFlow handles selection) */}
      {selected && label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nopan nodrag"
          >
            <div className="px-2 py-1 rounded-md bg-black/80 border border-gray-700 text-[10px] text-gray-300 shadow-lg backdrop-blur-sm max-w-[150px] text-center leading-tight">
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default ElegantEdge;

