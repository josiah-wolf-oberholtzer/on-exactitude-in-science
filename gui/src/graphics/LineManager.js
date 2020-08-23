import * as THREE from 'three';

class LineManager {
  constructor(parent) {
    this.edges = new Map();
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.LineBasicMaterial({ vertexColors: true });
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
  }

  remove(edge) {
    this.edges.delete(edge);
    this.dirty = true;
  }

  frameTick() { }

  graphTick() {
    const positions = [];
    if (this.dirty) {
      const colors = [];
      const indices = [];
      let baseIndex = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const edge of this.edges.keys()) {
        const color = edge.calculateColor();
        this.edges.set(edge, baseIndex);
        // eslint-disable-next-line no-restricted-syntax
        for (const [index, point] of edge.points.entries()) {
          colors.push(color.r, color.g, color.b);
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
      // eslint-disable-next-line no-restricted-syntax
      for (const edge of this.edges.keys()) {
        // eslint-disable-next-line no-restricted-syntax,no-unused-vars
        for (const [index, point] of edge.points.entries()) {
          positions.push(point.x, point.y, point.z);
        }
      }
      this.geometry.getAttribute('position').copyArray(positions).needsUpdate = true;
    }
  }

  updateColor(edge) {
    const index = this.edges.get(edge);
    const color = edge.calculateColor();
    const attribute = this.geometry.getAttribute('color');
    for (let i = 0; i < edge.points.length; i++) {
      attribute.setXYZ(index + (i * 3), color.r, color.g, color.b);
    }
    attribute.needsUpdate = true;
  }
}

export default LineManager;
