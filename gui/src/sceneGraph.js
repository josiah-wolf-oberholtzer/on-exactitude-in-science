import * as d3 from 'd3';
import * as d3force3d from 'd3-force-3d';
import { JSDOM } from 'jsdom';

d3.namespaces.custom = 'https://d3js.org/namespace/custom';

const sceneGraph = () => {
  const nodeMap = new Map(),
    linkMap = new Map(),
    vertexNodes = [],
    edgeNodes = [],
    dom = new JSDOM(),
    scene = d3.select(dom.window.document.body).append('custom:scene'),
    simulation = d3force3d.forceSimulation();

  function updateMaps(vertices, edges) {
    const newNodeMap = new Map(),
      newLinkMap = new Map();
    vertices.forEach((vertex) => {
      newNodeMap.set(vertex.id, Object.assign(vertex, { type: 'vertex' }));
    });
    edges.forEach((edge) => {
      const sourceLink = {
          id: `${edge.source}-${edge.id}`,
          source: edge.source,
          target: edge.id,
        },
        targetLink = {
          id: `${edge.id}-${edge.target}`,
          source: edge.id,
          target: edge.target,
        };
      newNodeMap.set(edge.id, Object.assign(edge, { type: 'edge' }));
      newLinkMap.set(sourceLink.id, sourceLink);
      newLinkMap.set(targetLink.id, targetLink);
    });
    Array.from(nodeMap.keys()).forEach((nodeId) => {
      if (!newNodeMap.has(nodeId)) nodeMap.delete(nodeId);
    });
    Array.from(linkMap.keys()).forEach((linkId) => {
      if (!newLinkMap.has(linkId)) linkMap.delete(linkId);
    });
    newNodeMap.forEach((newNode, nodeId) => {
      nodeMap.set(nodeId, Object.assign(nodeMap.get(nodeId) || {}, newNode));
    });
    newLinkMap.forEach((newLink, linkId) => {
      linkMap.set(linkId, Object.assign(linkMap.get(linkId) || {}, newLink));
    });
    return { newNodeMap, newLinkMap };
  }

  function updateNodeArrays() {
    vertexNodes.length = 0;
    edgeNodes.length = 0;
    nodeMap.forEach((node) => {
      if (node.type === 'vertex') {
        vertexNodes.push(node);
      } else {
        edgeNodes.push(node);
      }
    });
  }

  function updateDataJoins() {
    const vertexSelection = scene.selectAll('vertex').data(vertexNodes, (d) => d.id),
      edgeSelection = scene.selectAll('edge').data(edgeNodes, (d) => d.id);
    vertexSelection.enter().append('custom:vertex').attr('id', (d) => d.id);
    vertexSelection.exit().remove();
    edgeSelection.enter().append('custom:edge').attr('id', (d) => d.id);
    edgeSelection.exit().remove();
  }

  function update(vertices, edges) {
    updateMaps(vertices, edges);
    updateNodeArrays();
    updateDataJoins();
  }

  return {
    dom: () => dom,
    linkMap: () => linkMap,
    nodeMap: () => nodeMap,
    scene: () => scene,
    simulation: () => simulation,
    update,
  };
};

export default sceneGraph;
