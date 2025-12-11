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
  data
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  // Determine Style based on Edge Type
  const edgeType = selected ? 'selected' : (data?.type || 'reference');

  /* 
     ANIMATIONS defined inline for now, or ensure they are in global CSS. 
     We will use style tags for uniqueness if needed, but standard CSS class is better.
     Assuming 'animate-flow' is added to index.css
  */

  const getStrokeStyle = () => {
    switch (edgeType) {
      case 'selected': return '#3b82f6'; // Blue
      case 'contains': return '#F59E0B'; // Gold/Amber-500
      case 'agree': return '#10B981';    // Emerald-500
      case 'disagree': return '#EF4444'; // Red-500
      case 'mutual': return '#8B5CF6';   // Violet-500 for mutual
      default: return '#4b5563';         // Gray-600
    }
  };

  const getStrokeWidth = () => {
    if (selected) return 3;
    if (edgeType === 'contains') return 2.5; // Thicker for hierarchy
    if (edgeType === 'agree') return 2;
    return 1.5;
  };

  const getStrokeDasharray = () => {
    if (edgeType === 'disagree') return '5,5'; // Dashed for disagreement
    if (edgeType === 'contains') return '10,5'; // Dashed for flow animation
    if (edgeType === 'mutual') return '10,2';  // Dotted
    return '0';
  };

  // Dynamic animation style
  const animationStyle = {};
  if (edgeType === 'contains') {
    animationStyle.animation = 'dash-flow 1s linear infinite';
  } else if (edgeType === 'agree') {
    // Pulse effect could be done via filter or width, but simple dash flow is clearer for 'flow'
    // Let's make agree a slower, smooth flow or static glow
    animationStyle.filter = 'drop-shadow(0 0 2px #10B981)';
  } else if (edgeType === 'mutual') {
    animationStyle.animation = 'dash-flow-reverse 2s linear infinite';
  }

  return (
    <>
      {/* Glow Effect for electricity/agree */}
      {(edgeType === 'contains' || edgeType === 'agree') && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: getStrokeStyle(),
            strokeWidth: getStrokeWidth() + 4,
            opacity: 0.1,
            filter: 'blur(4px)',
          }}
        />
      )}

      <BaseEdge
        path={edgePath}
        id={id}
        style={{
          stroke: getStrokeStyle(),
          strokeWidth: getStrokeWidth(),
          strokeDasharray: getStrokeDasharray(),
          opacity: (selected || edgeType !== 'reference') ? 1 : 0.4,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          ...animationStyle
        }}
      />

      {/* Edge Label */}
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
                bg-black/90 backdrop-blur-md 
                border border-white/10 
                text-[10px] font-bold 
                shadow-lg
                transition-all duration-300
                ${selected ? 'opacity-100 scale-100 z-50' : 'opacity-0 scale-90 hover:opacity-100 hover:scale-100'}
            `}
          >
            <span style={{ color: getStrokeStyle() }}>
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;

