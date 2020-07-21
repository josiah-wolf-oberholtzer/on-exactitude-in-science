import { timer } from 'd3-timer';
import { ForceGraph } from './ForceGraph';

const forceGraph = ForceGraph();

let loop = null;

onmessage = (event) => {
  const [kind, payload] = event.data;
  // console.log("worker", kind, payload);
  switch (kind) {
    case 'pin':
      forceGraph.pin(payload.nodeId, payload.x, payload.y, payload.z);
      break;
    case 'reheat':
      forceGraph.reheat();
      if (loop === null) {
        loop = timer(() => forceGraph.tick(), 30);
      }
      break;
    case 'start': // fall through
      if (loop === null) {
        loop = timer(() => forceGraph.tick(), 30);
      }
      break;
    case 'stop':
      if (loop !== null) {
        loop.stop();
        loop = null;
      }
      break;
    case 'tick':
      if ((Date.now() - payload.timestamp) < 15) {
        forceGraph.tick();
      }
      break;
    case 'update':
      forceGraph.update(payload.vertices, payload.edges);
      break;
    case 'unpin':
      forceGraph.unpin(payload.nodeId);
      break;
    default:
      console.log(event);
  }
};

forceGraph.on('ticked', (result) => postMessage(['ticked', result]));