import * as THREE from 'three';

class LineManager {
  constructor(parent) {
    this.group = new THREE.Group();
    this.edges = new Set();
    parent.add(this.group);
  }

  add(edge) { 
    this.edges.add(edge);
    this.group.add(edge.lineMesh);
  }

  remove(edge) { 
    this.group.remove(edge.lineMesh);
    this.edges.delete(edge);
  }

  frameTick() { }

  graphTick() { }
}

export default LineManager;
