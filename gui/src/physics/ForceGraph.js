import { dispatch } from 'd3-dispatch';
import * as d3force3d from 'd3-force-3d';
import forceManyBody from './manyBody';

const ForceGraph = () => {
  const nodeMap = new Map(),
    linkMap = new Map(),
    dispatcher = dispatch('ticked'),
    simulation = d3force3d.forceSimulation()
      .stop()
      .alpha(1)
      .numDimensions(3)
      .alphaDecay(0.001)
      .velocityDecay(0.4)
      /*
      .force('charge', d3force3d.forceManyBody()
        .distanceMax(250)
        .distanceMin(25)
        .strength((d) => {
          if (d.type === 'edge') {
            return 0;
          } if (d.type === 'rudder') {
            return -1;
          }
          return -2;
        })
        .theta(0.5))
      */
      .force('charge', forceManyBody()
        .distanceMax(50)
        .strength((d) => {
          if (d.type === 'edge') {
            return 0.0;
          } if (d.type === 'rudder') {
            return -1.0;
          }
          return -2.0;
        }))
      .force('links', d3force3d.forceLink()
        .id((d) => d.id)
        .distance((d) => 5 + (d.index % 100) / 100)
        .iterations(3)
      )
      /*
      .force('collision', d3force3d.forceCollide()
        .radius((d) => {
          if (d.type === 'edge') {
            return 2;
          } if (d.type === 'rudder') {
            return 1;
          }
          const radius = (d.radius || 1) * 2;
          if (d.selected) {
            return radius + 5;
          }
          return radius;
        })
        .strength(1))
      */
      .force('centering', d3force3d.forceCenter());

  function update(vertices, edges) {
    const newNodeMap = new Map(),
      newLinkMap = new Map(),
      enters = [],
      updates = [],
      exits = [],
      result = {
        vertices: {
          entrances: [],
          updates: [],
          exits: [],
        },
        edges: {
          entrances: [],
          updates: [],
          exits: [],
        },
      };
    vertices.forEach((vertex) => {
      const rudderId = `${vertex.id}-rudder`;
      newNodeMap.set(vertex.id, {
        ...vertex,
        radius: Math.sqrt(vertex.child_count + 1),
        type: 'vertex',
      });
      newNodeMap.set(rudderId, { ...vertex, id: rudderId, type: 'rudder' });
      newLinkMap.set(rudderId, { id: rudderId, source: vertex.id, target: rudderId });
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
      newNodeMap.set(edge.id, { ...edge, type: 'edge' });
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
        if (oldNode.type !== 'edge') {
          Object.assign(oldNode, newNode);
        }
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
      switch (entity.type) {
        case 'edge':
          entity.source = nodeMap.get(entity.source);
          entity.target = nodeMap.get(entity.target);
          result.edges.entrances.push(entity);
          break;
        case 'vertex':
          entity.rudder = nodeMap.get(`${entity.id}-rudder`);
          result.vertices.entrances.push(entity);
          break;
        default:
          break;
      }
    });
    updates.forEach((entity) => {
      switch (entity.type) {
        case 'edge':
          result.edges.updates.push(entity);
          break;
        case 'vertex':
          result.vertices.updates.push(entity);
          break;
        default:
          break;
      }
    });
    exits.forEach((entity) => {
      switch (entity.type) {
        case 'edge':
          result.edges.exits.push(entity);
          break;
        case 'vertex':
          result.vertices.exits.push(entity);
          break;
        default:
          break;
      }
    });
    simulation.alpha(1.0);
    dispatcher.call('ticked', result, result);
  }

  function pin(nodeID, x, y, z) {
    const node = nodeMap.get(nodeID);
    if (node) {
      node.fx = x;
      node.fy = y;
      node.fz = z;
    }
  }

  function unpin(nodeID) {
    const node = nodeMap.get(nodeID);
    if (node) {
      node.fx = null;
      node.fy = null;
      node.fz = null;
    }
  }

  function tick() {
    const result = {
      vertices: {
        entrances: [],
        updates: [],
        exits: [],
      },
      edges: {
        entrances: [],
        updates: [],
        exits: [],
      },
    };
    if (simulation.alpha() >= simulation.alphaMin()) {
      simulation.tick();
      nodeMap.forEach((entity) => {
        switch (entity.type) {
          case 'edge':
            result.edges.updates.push(entity);
            break;
          case 'vertex':
            result.vertices.updates.push(entity);
            break;
          default:
            break;
        }
      });
    }
    dispatcher.call('ticked', result, result);
  }

  return {
    linkMap: () => linkMap,
    nodeMap: () => nodeMap,
    on(name, _) { return arguments.length > 1 ? dispatcher.on(name, _) : dispatcher.on(name); },
    reheat: () => simulation.alpha(1.0),
    simulation: () => simulation,
    tick,
    update,
    pin,
    unpin,
  };
};

export { ForceGraph };
