import dagre from 'dagre';

export const getLayoutedElements = (nodes, edges, config = {}) => {
  const {
    rankSep = 180, // Increased for better level separation
    nodeSep = 120, // Horizontal spacing
    rankDir = 'LR' // Left-to-Right flow
  } = config;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ 
    rankdir: rankDir,
    ranksep: rankSep,
    nodesep: nodeSep,
    align: 'DL' // Align nodes to top-left of their rank
  });

  // Set Node Dimensions based on Type
  nodes.forEach((node) => {
    const type = node.data?.node_type || 'child';
    let width = 280;
    let height = 120;

    if (type === 'topic') {
        width = 350;
        height = 150;
    } else if (type === 'module') {
        width = 300;
        height = 130;
    } else if (type === 'child') {
        width = 260; // Slightly smaller
        height = 100;
    }

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: rankDir === 'LR' ? 'left' : 'top',
      sourcePosition: rankDir === 'LR' ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - (nodeWithPosition.width || 280) / 2,
        y: nodeWithPosition.y - (nodeWithPosition.height || 120) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
