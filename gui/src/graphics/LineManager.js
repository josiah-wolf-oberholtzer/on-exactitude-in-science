import * as THREE from 'three';

class LineManager {
  constructor(parent) {
    this.edges = new Map();
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.LineBasicMaterial({vertexColors: true});
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3));
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this.geometry.setIndex(new THREE.Uint16BufferAttribute([], 1));
    this.line = new THREE.LineSegments(this.geometry, this.material);
    this.dirty = true;
    parent.add(this.line);
  }

  add(edge) { 
    this.edges.set(edge, 0);
    this.dirty = true;
    // this.group.add(edge.lineMesh);
  }

  remove(edge) { 
    this.edges.delete(edge);
    this.dirty = true;
    // this.group.remove(edge.lineMesh);
  }

  frameTick() { }

  graphTick() { 
    const positions = [];
    const colors = [];
    if (this.dirty) {
      const indices = [];
      let baseIndex = 0;
      for (const edge of this.edges.keys()) {
        this.edges.set(edge, baseIndex);
        for (const [index, point] of edge.points.entries()) {
          colors.push(0.2, 0.4, 0.6);
          positions.push(point.x, point.y, point.z);
          if (index > 0) {
            indices.push(baseIndex + index - 1, baseIndex + index);
          }
        }
        baseIndex += edge.points.length;
      }
      this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      this.geometry.setIndex(new THREE.Uint16BufferAttribute(indices, 1));
      this.dirty = false;
    } else {
      for (const edge of this.edges.keys()) {
        for (const [index, point] of edge.points.entries()) {
          colors.push(0.2, 0.4, 0.6);
          positions.push(point.x, point.y, point.z);
        }
      }
      this.geometry.getAttribute('color').copyArray(colors).needsUpdate = true;
      this.geometry.getAttribute('position').copyArray(positions).needsUpdate = true;
    }
  }
}

export default LineManager;
