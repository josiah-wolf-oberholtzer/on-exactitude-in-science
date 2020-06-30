import 'normalize.css';
import './index.css';

import { ForceGraph } from './ForceGraph';
import { ThreeGraph } from './ThreeGraph';
import { ThreeManager } from './ThreeManager';

const canvas = document.getElementById('container'),
  forceGraph = ForceGraph(),
  threeManager = ThreeManager(canvas),
  threeGraph = ThreeGraph({ forceGraph, threeManager });

threeManager.scene.add(threeGraph.object);
threeManager.animate();

fetch('http://localhost:9090/locality/artist/1', { mode: 'cors' })
  .then((response) => response.json())
  .then((data) => forceGraph.update(data.result.vertices, data.result.edges));
