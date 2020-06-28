import 'normalize.css';
import './index.css';

import { data } from './data';
import { sceneGraph } from './sceneGraph';
import { threeGraph } from './threeGraph';
import { threeManager } from './threeManager';

const canvas = document.getElementById('container'),
  m = threeManager(canvas),
  g = threeGraph(),
  s = sceneGraph();

g.connect(s);
m.scene.add(g.object);
m.on('render', () => s.tick());
m.animate();

fetch('http://localhost:9090/locality/artist/1', {mode: 'cors'})
  .then(response => response.json())
  .then(data => s.update(data.result.vertices, data.result.edges));
