const transform = (vertices, edges) => {
  const nodeMap = new Map(),
    linkMap = new Map();
  vertices.forEach((vertex) => {
    nodeMap.set(vertex.id, vertex);
  });
  edges.forEach((edge) => {
    const link = edge,
      sourceLink = {
        id: `${link.source}-${link.id}`,
        source: link.source,
        target: link.id,
      },
      targetLink = {
        id: `${link.id}-${link.target}`,
        source: link.id,
        target: link.target,
      };
    link.intermediate = true;
    nodeMap.set(link.id, link);
    linkMap.set(sourceLink.id, sourceLink);
    linkMap.set(targetLink.id, targetLink);
  });
  return { nodeMap, linkMap };
};

export default transform;
