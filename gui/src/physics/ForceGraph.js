import * as d3force3d from 'd3-force-3d';
import { Vector3 } from 'three';
import { dispatch } from 'd3-dispatch';
import forceManyBodyGPU from './forceManyBodyGPU';
import forceManyBodyNaive from './forceManyBodyNaive';

const edgeRequiresBezier = (edge) => edge.label !== 'alias_of';
const buildVertexAndEdgeMaps = (newVertices, newEdges) => {
  const newVertexMap = new Map(newVertices.map((vertex) => {
    const extra = {
      position: new Vector3(),
      radius: Math.sqrt(vertex.child_count + 1),
      rudderPosition: new Vector3(),
    };
    return [vertex.id, { ...vertex, ...extra }];
  }));
  const newEdgeMap = new Map(newEdges.map((edge) => {
    const extra = {
      sourcePosition: new Vector3(),
      targetPosition: new Vector3(),
    };
    if (edgeRequiresBezier(edge)) {
      extra.controlPosition = new Vector3();
    }
    return [edge.id, { ...edge, ...extra }];
  }));
  return { newVertexMap, newEdgeMap };
};
const buildNewNodeAndLinkMaps = (newVertexMap, newEdgeMap) => {
  const newNodeMap = new Map();
  const newLinkMap = new Map();
  newVertexMap.forEach((vertex) => {
    const rudderId = `${vertex.id}-rudder`;
    const node = { ...vertex, radius: Math.sqrt(vertex.child_count + 1), type: 'vertex' };
    const rudderNode = { ...vertex, id: rudderId, type: 'rudder' };
    const rudderLink = { id: rudderId, source: vertex.id, target: rudderId };
    newNodeMap.set(vertex.id, node);
    newNodeMap.set(rudderId, rudderNode);
    newLinkMap.set(rudderId, rudderLink);
  });
  newEdgeMap.forEach((edge) => {
    if (edgeRequiresBezier(edge)) {
      const sourceLinkId = `${edge.source}-to-${edge.id}`;
      const targetLinkId = `${edge.id}-to-${edge.target}`;
      const sourceLink = { id: sourceLinkId, source: edge.source, target: edge.id };
      const targetLink = { id: targetLinkId, source: edge.id, target: edge.target };
      const edgeNode = { ...edge, type: 'edge' };
      newNodeMap.set(edge.id, edgeNode);
      newLinkMap.set(sourceLinkId, sourceLink);
      newLinkMap.set(targetLinkId, targetLink);
    } else {
      const link = { ...edge };
      newLinkMap.set(edge.id, link);
    }
  });
  return { newNodeMap, newLinkMap };
};
const updateOldNodeAndLinkMaps = (newNodeMap, oldNodeMap, newLinkMap, oldLinkMap) => {
  Array.from(oldLinkMap.keys()).forEach((linkId) => {
    if (!newLinkMap.has(linkId)) { oldLinkMap.delete(linkId); }
  });
  newLinkMap.forEach((newLink, linkId) => {
    oldLinkMap.set(linkId, Object.assign(oldLinkMap.get(linkId) || {}, newLink));
  });
  Array.from(oldNodeMap.keys()).forEach((nodeId) => {
    if (!newNodeMap.has(nodeId)) { oldNodeMap.delete(nodeId); }
  });
  newNodeMap.forEach((newNode, nodeId) => {
    oldNodeMap.set(nodeId, Object.assign(oldNodeMap.get(nodeId) || {}, newNode));
  });
};
const updateSimulation = (simulation, nodeMap, linkMap) => {
  simulation.nodes(Array.from(nodeMap.values()));
  simulation.force('links').links(Array.from(linkMap.values()));
};
const nodeToVector3 = (node, vector) => {
  vector.x = node.x;
  vector.y = node.y;
  vector.z = node.z;
};
const updateOldVertexAndEdgeMaps = (newVertexMap, oldVertexMap, newEdgeMap, oldEdgeMap) => {
  const result = {
    vertices: { entrances: [], exits: [], updates: [] },
    edges: { entrances: [], exits: [], updates: [] },
  };
  Array.from(oldEdgeMap.keys()).forEach((edgeId) => {
    if (!newEdgeMap.has(edgeId)) {
      const edge = oldEdgeMap.get(edgeId);
      oldEdgeMap.delete(edgeId);
      result.edges.exits.push(edge);
    }
  });
  newEdgeMap.forEach((newEdge, edgeId) => {
    const edge = oldEdgeMap.get(edgeId) || newEdge;
    if (oldEdgeMap.has(edgeId)) { // update
      result.edges.updates.push(edge);
    } else { // entrance
      oldEdgeMap.set(edgeId, edge);
      result.edges.entrances.push(edge);
    }
  });
  Array.from(oldVertexMap.keys()).forEach((vertexId) => {
    if (!newVertexMap.has(vertexId)) {
      const vertex = oldVertexMap.get(vertexId);
      oldVertexMap.delete(vertexId);
      result.vertices.exits.push(vertex);
    }
  });
  newVertexMap.forEach((newVertex, vertexId) => {
    const vertex = oldVertexMap.get(vertexId) || newVertex;
    if (oldVertexMap.has(vertexId)) { // update
      result.vertices.updates.push(vertex);
    } else { // entrance
      oldVertexMap.set(vertexId, vertex);
      result.vertices.entrances.push(vertex);
    }
  });
  return result;
};
const updateVertexAndEdgePositions = (vertexMap, edgeMap, nodeMap) => {
  edgeMap.forEach((edge, edgeId) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    nodeToVector3(source, edge.sourcePosition);
    nodeToVector3(target, edge.targetPosition);
    if (edgeRequiresBezier(edge)) {
      const control = nodeMap.get(edgeId);
      nodeToVector3(control, edge.controlPosition);
    }
  });
  vertexMap.forEach((vertex, vertexId) => {
    const rudderId = `${vertex.id}-rudder`;
    const node = nodeMap.get(vertexId);
    const rudder = nodeMap.get(rudderId);
    nodeToVector3(node, vertex.position);
    nodeToVector3(rudder, vertex.rudderPosition);
  });
};
const ForceGraph = () => {
  const initSimulation = () => d3force3d.forceSimulation()
    .stop()
    .alpha(1)
    .numDimensions(3)
    .alphaDecay(0.01)
    .velocityDecay(0.5)
  // .force('charge', forceManyBodyGPU()
  // .force('charge', d3force3d.forceManyBody()
    .force('charge', forceManyBodyNaive()
      .distanceMax(250)
      .distanceMin(1)
      .strength((d) => {
        if (d.type === 'edge') {
          return -0.5;
        } if (d.type === 'rudder') {
          return -1.0;
        }
        return -3.0;
      }))
    .force('links', d3force3d.forceLink()
      .id((d) => d.id)
      .distance((d) => (d.source.radius || 1) + (d.target.radius || 1))
      .iterations(3))
    .force('x', d3force3d.forceX().strength((d) => (d.type === 'rudder' ? 0.0 : 0.1)))
    .force('y', d3force3d.forceY().strength((d) => (d.type === 'rudder' ? 0.0 : 0.1)))
    .force('z', d3force3d.forceZ().strength((d) => (d.type === 'rudder' ? 0.0 : 0.1)))
    .force('centering', d3force3d.forceCenter());
  const dispatcher = dispatch('vertexEnter', 'vertexExit', 'vertexUpdate', 'vertexTick', 'edgeEnter', 'edgeExit', 'edgeUpdate', 'edgeTick');
  const edgeMap = new Map();
  const linkMap = new Map();
  const nodeMap = new Map();
  const vertexMap = new Map();
  const simulation = initSimulation();
  const pin = (nodeID, x, y, z) => {
    const node = nodeMap.get(nodeID);
    if (node) {
      node.fx = x;
      node.fy = y;
      node.fz = z;
    }
  };
  const tick = () => {
    if (simulation.alpha() >= simulation.alphaMin()) {
      simulation.tick();
      updateVertexAndEdgePositions(vertexMap, edgeMap, nodeMap);
      vertexMap.forEach((vertex) => { dispatcher.call('vertexTick', vertex, vertex); });
      edgeMap.forEach((edge) => { dispatcher.call('edgeTick', edge, edge); });
    }
  };
  const unpin = (nodeID) => {
    const node = nodeMap.get(nodeID);
    if (node) {
      node.fx = null;
      node.fy = null;
      node.fz = null;
    }
  };
  const update = (vertices, edges) => {
    const { newVertexMap, newEdgeMap } = buildVertexAndEdgeMaps(vertices, edges);
    const { newNodeMap, newLinkMap } = buildNewNodeAndLinkMaps(newVertexMap, newEdgeMap);
    updateOldNodeAndLinkMaps(newNodeMap, nodeMap, newLinkMap, linkMap);
    updateSimulation(simulation, nodeMap, linkMap);
    const result = updateOldVertexAndEdgeMaps(newVertexMap, vertexMap, newEdgeMap, edgeMap);
    updateVertexAndEdgePositions(vertexMap, edgeMap, nodeMap);
    result.vertices.entrances.forEach((vertex) => { dispatcher.call('vertexEnter', vertex, vertex); });
    result.vertices.exits.forEach((vertex) => { dispatcher.call('vertexExit', vertex, vertex); });
    result.vertices.updates.forEach((vertex) => { dispatcher.call('vertexUpdate', vertex, vertex); });
    result.edges.entrances.forEach((edge) => { dispatcher.call('edgeEnter', edge, edge); });
    result.edges.exits.forEach((edge) => { dispatcher.call('edgeExit', edge, edge); });
    result.edges.updates.forEach((edge) => { dispatcher.call('edgeUpdate', edge, edge); });
  };
  return {
    edgeMap: () => edgeMap,
    linkMap: () => linkMap,
    nodeMap: () => nodeMap,
    on(name, _) { return arguments.length > 1 ? dispatcher.on(name, _) : dispatcher.on(name); },
    pin,
    reheat: () => simulation.alpha(1.0),
    simulation: () => simulation,
    tick,
    unpin,
    update,
    vertexMap: () => vertexMap,
  };
};

export default ForceGraph;
