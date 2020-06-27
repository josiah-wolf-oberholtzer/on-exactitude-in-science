import * as d3 from 'd3';
import * as d3force3d from 'd3-force-3d';
import { JSDOM } from 'jsdom';

d3.namespaces.custom = 'https://d3js.org/namespace/custom';

const sceneGraph = () => {
  const nodeMap = new Map(),
    linkMap = new Map(),
    dom = new JSDOM(),
    event = d3.dispatch('vertexEnter', 'vertexUpdate', 'vertexExit', 'edgeEnter', 'edgeUpdate', 'edgeExit'),
    simulation = d3force3d.forceSimulation()
      .stop()
      .alpha(1)
      .numDimensions(3)
      .force('center', d3force3d.forceCenter())
      .force('charge', d3force3d.forceManyBody())
      .force('links', d3force3d.forceLink().id((d) => d.id))
      .force('collide', d3force3d.forceCollide());

  d3.select(dom.window.document.body).append('custom:scene');

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

  function updateDataJoins() {
    const shadowScene = d3.select(dom.window.document).selectAll('scene'),
      vertexNodes = [],
      edgeNodes = [];
    nodeMap.forEach((node) => {
      if (node.type === 'vertex') {
        vertexNodes.push(node);
      } else {
        edgeNodes.push(node);
      }
    });
    shadowScene.selectAll('vertex')
      .data(vertexNodes, (d) => d.id)
      .join(
        (enter) => enter
          .append('custom:vertex')
          .attr('id', (d) => d.id)
          .each((vertex) => event.call('vertexEnter', vertex, vertex)),
        (update) => update
          .each((vertex) => event.call('vertexUpdate', vertex, vertex)),
        (exit) => exit
          .each((vertex) => event.call('vertexExit', vertex, vertex))
          .remove(),
      );
    shadowScene.selectAll('edge')
      .data(edgeNodes, (d) => d.id)
      .join(
        (enter) => enter
          .append('custom:edge')
          .attr('id', (d) => d.id)
          .each((edge) => event.call('edgeEnter', edge, edge)),
        (update) => update
          .each((edge) => event.call('edgeUpdate', edge, edge)),
        (exit) => exit
          .each((edge) => event.call('edgeExit', edge, edge))
          .remove(),
      );
  }

  function updateSimulation() {
    simulation.nodes(Array.from(nodeMap.values()));
    simulation.force('links').links(Array.from(linkMap.values()));
  }

  function updateSceneGraph(vertices, edges) {
    updateMaps(vertices, edges);
    updateDataJoins();
    updateSimulation();
  }

  function tick() {
    if (simulation.alpha() >= simulation.alphaMin()) {
      const shadowScene = d3.select(dom.window.document).selectAll('scene');
      simulation.tick();
      shadowScene.selectAll('vertex').each((vertex) => event.call('vertexUpdate', vertex, vertex));
      shadowScene.selectAll('edge').each((edge) => event.call('edgeUpdate', edge, edge));
    }
  }

  return {
    linkMap: () => linkMap,
    nodeMap: () => nodeMap,
    on(name, _) { return arguments.length > 1 ? event.on(name, _) : event.on(name); },
    shadowScene: () => dom.window.document.getElementsByTagName('scene')[0],
    simulation: () => simulation,
    tick,
    update: updateSceneGraph,
  };
};

export default sceneGraph;
