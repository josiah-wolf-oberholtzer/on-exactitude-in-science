import { dispatch } from 'd3-dispatch';
import * as d3force3d from 'd3-force-3d';

const sceneGraph = () => {
  const nodeMap = new Map(),
    linkMap = new Map(),
    event = dispatch('vertexEnter', 'vertexUpdate', 'vertexExit', 'edgeEnter', 'edgeUpdate', 'edgeExit'),
    simulation = d3force3d.forceSimulation()
      .stop()
      .alpha(1)
      .numDimensions(3)
      .alphaDecay(0.01)
      .velocityDecay(0.01)
      .force('center', d3force3d.forceCenter())
      .force('charge', d3force3d.forceManyBody())
      .force('links', d3force3d.forceLink().id((d) => d.id));

  function update(vertices, edges) {
    const newNodeMap = new Map(),
      newLinkMap = new Map(),
      enters = [],
      updates = [],
      exits = [];
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

    // links
    Array.from(linkMap.keys()).forEach((linkId) => {
      if (!newLinkMap.has(linkId)) linkMap.delete(linkId);
    });

    newLinkMap.forEach((newLink, linkId) => {
      linkMap.set(linkId, Object.assign(linkMap.get(linkId) || {}, newLink));
    });

    // calculate node exits
    Array.from(nodeMap.keys()).forEach((nodeId) => {
      if (!newNodeMap.has(nodeId)) {
        exits.push(nodeMap.get(nodeId));
        nodeMap.delete(nodeId);
      }
    });

    // calculate node updates and enters
    newNodeMap.forEach((newNode, nodeId) => {
      // TODO: disambiguate enters from exits
      if (nodeMap.has(nodeId)) {
        const oldNode = nodeMap.get(nodeId);
        Object.assign(oldNode, newNode);
        updates.push(oldNode);
      } else {
        const enterNode = { ...newNode }; // don't modify incoming data
        nodeMap.set(nodeId, enterNode);
        enters.push(enterNode);
      }
    });

    // update the simulation
    simulation.nodes(Array.from(nodeMap.values()));
    simulation.force('links').links(Array.from(linkMap.values()));

    // emit events
    enters.forEach((entity) => {
      if (entity.type === 'edge') {
        entity.source = nodeMap.get(entity.source);
        entity.target = nodeMap.get(entity.target);
      }
      event.call(`${entity.type}Enter`, entity, entity);
    });
    updates.forEach((entity) => event.call(`${entity.type}Update`, entity, entity));
    exits.forEach((entity) => event.call(`${entity.type}Exit`, entity, entity));
  }

  function tick() {
    if (simulation.alpha() >= simulation.alphaMin()) {
      simulation.tick();
      nodeMap.forEach((entity) => event.call(`${entity.type}Update`, entity, entity));
    }
  }

  return {
    linkMap: () => linkMap,
    nodeMap: () => nodeMap,
    on(name, _) { return arguments.length > 1 ? event.on(name, _) : event.on(name); },
    simulation: () => simulation,
    tick,
    update,
  };
};

export { sceneGraph };
