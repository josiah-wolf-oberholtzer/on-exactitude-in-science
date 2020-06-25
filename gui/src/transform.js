const transform = (vertices, edges) => {
  const nodeMap = new Map();
  const linkMap = new Map();
  vertices.forEach((vertex) => {
    nodeMap.set(vertex.id, vertex);
  });
  edges.forEach((edge) => {
    nodeMap.set(edge.id, edge);
    const sourceLink = {
      id: `${edge.source}-${edge.id}`,
      source: edge.source,
      target: edge.id,
    };
    const targetLink = {
      id: `${edge.id}-${edge.target}`,
      source: edge.id,
      target: edge.target,
    };
    linkMap.set(sourceLink.id, sourceLink);
    linkMap.set(targetLink.id, targetLink);
  });
  return { nodeMap, linkMap };
};

export default transform;
