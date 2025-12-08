import dagre from 'dagre';

export const getLayoutedElements = (nodes, edges, config = {}) => {
  const {
    nodeWidth = 280, // Increased for better spacing
    nodeHeight = 120,
    rankSep = 150, // Vertical spacing between ranks
    nodeSep = 100, // Horizontal spacing between nodes
    rankDir = 'LR'
  } = config;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ 
    rankdir: rankDir,
    ranksep: rankSep,
    nodesep: nodeSep
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
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
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
