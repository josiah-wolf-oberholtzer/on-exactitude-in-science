import React from "react";
import { ForceGraph } from '../ForceGraph';
import { ThreeGraph } from '../ThreeGraph';
import { ThreeManager } from '../ThreeManager';

class Graph extends React.Component {
  componentDidMount() {
    const forceGraph = ForceGraph(),
      threeManager = ThreeManager(this.mount),
      threeGraph = ThreeGraph({ forceGraph, threeManager });
    threeManager.scene.add(threeGraph.object);
    threeManager.animate();
    fetch('http://localhost:9090/locality/artist/1', { mode: 'cors' })
      .then((response) => response.json())
      .then((data) => forceGraph.update(data.result.vertices, data.result.edges));
  }

  render() {
    return <div className="graph" ref={ref => (this.mount = ref)} />
  }
}

export { Graph };
