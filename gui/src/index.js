import 'normalize.css';
import './index.css';

import { ForceGraph } from './ForceGraph';
import { threeGraph } from './threeGraph';
import { threeManager } from './threeManager';

const canvas = document.getElementById('container'),
  m = threeManager(canvas),
  g = threeGraph(),
  forceGraph = ForceGraph();

g.connect(forceGraph);
m.scene.add(g.object);
m.on('render', () => forceGraph.tick());
m.animate();

fetch('http://localhost:9090/locality/artist/1', { mode: 'cors' })
  .then((response) => response.json())
  .then((data) => forceGraph.update(data.result.vertices, data.result.edges));
