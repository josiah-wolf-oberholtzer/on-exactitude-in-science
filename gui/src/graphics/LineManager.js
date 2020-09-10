import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

class LineManager {
  constructor(scene, parent) {
    this.scene = scene;
    this.parent = parent;
    this.edges = new Map();
    this.mesh = new LineSegments2(
      new LineSegmentsGeometry(),
      new LineMaterial({
        fog: this.scene.fog,
        linewidth: 2,
        vertexColors: true,
      }),
    );
    this.dirty = true;
    this.parent.add(this.mesh);
    window.lineManager = this;
  }

  add(edge) {
    this.edges.set(edge, 0);
    this.dirty = true;
  }

  remove(edge) {
    this.edges.delete(edge);
    this.dirty = true;
  }

  frameTick() {
    this.mesh.material.resolution.set(window.innerWidth, window.innerHeight);
  }

  graphTick() {
    const positions = [];
    const colors = [];
    this.edges.forEach((_, edge) => {
      const startColor = new THREE.Color(0x401010);
      const endColor = new THREE.Color(0x15385c);
      if (edge.data.label === 'alias_of') {
        startColor.set(0x3a4a18);
        endColor.set(0x3a4a18);
      }
      const { length } = edge.points;
      for (let i = 1; i < length; i++) {
        const startPosition = (i - 1) / (length - 1);
        const endPosition = i / (length - 1);
        const segmentStartColor = new THREE.Color(startColor).lerp(endColor, startPosition);
        const segmentEndColor = new THREE.Color(startColor).lerp(endColor, endPosition);
        positions.push(
          edge.points[i - 1].x,
          edge.points[i - 1].y,
          edge.points[i - 1].z,
          edge.points[i].x,
          edge.points[i].y,
          edge.points[i].z,
        );
        colors.push(
          segmentStartColor.r,
          segmentStartColor.g,
          segmentStartColor.b,
          segmentEndColor.r,
          segmentEndColor.g,
          segmentEndColor.b,
        );
      }
    });
    this.mesh.geometry = new LineSegmentsGeometry();
    this.mesh.geometry.setPositions(positions);
    this.mesh.geometry.setColors(colors);
  }

  updateColor() { }
}

export default LineManager;
