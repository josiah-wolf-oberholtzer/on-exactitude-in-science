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
s.update(data.result.vertices, data.result.edges);
m.scene.add(g.object);
m.on('render', () => s.tick());
m.animate();
