import { dispatch } from 'd3-dispatch';
import Worker from './ForceGraph.worker.js';

const ForceGraphWorkerProxy = () => {
  const worker = new Worker(),
    dispatcher = dispatch(
      'vertexEnter',
      'vertexUpdate',
      'vertexExit',
      'edgeEnter',
      'edgeUpdate',
      'edgeExit',
      'ticked',
    );

  worker.onmessage = (event) => {
    const [kind, payload] = event.data;
    if (kind === 'ticked') {
      payload.edges.entrances.forEach((entity) => dispatcher.call('edgeEnter', entity, entity));
      payload.edges.updates.forEach((entity) => dispatcher.call('edgeUpdate', entity, entity));
      payload.edges.exits.forEach((entity) => dispatcher.call('edgeExit', entity, entity));
      payload.vertices.entrances.forEach((entity) => dispatcher.call('vertexEnter', entity, entity));
      payload.vertices.updates.forEach((entity) => dispatcher.call('vertexUpdate', entity, entity));
      payload.vertices.exits.forEach((entity) => dispatcher.call('vertexExit', entity, entity));
    } else {
      dispatcher.call(kind, payload, payload);
    }
  };

  return {
    on(name, _) { return arguments.length > 1 ? dispatcher.on(name, _) : dispatcher.on(name); },
    pin(nodeId, x, y, z) {
      worker.postMessage(['pin', {
        nodeId, x, y, z,
      }]);
    },
    reheat() { worker.postMessage(['reheat']); },
    tick() { worker.postMessage(['tick', { timestamp: Date.now() }]); },
    start() { worker.postMessage(['start']) },
    stop() { worker.postMessage(['stop']) },
    unpin(nodeId) { worker.postMessage(['unpin', { nodeId }]); },
    update(vertices, edges) { worker.postMessage(['update', { vertices, edges }]); },
  };
};

export default ForceGraphWorkerProxy;
