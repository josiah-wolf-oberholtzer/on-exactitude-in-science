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
    this.colors = [];
    this.positions = [];
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

  buildColorSegment(startColor, endColor, length) {
    const colors = [];
    for (let i = 1; i < length; i++) {
      const startPosition = (i - 1) / (length - 1);
      const endPosition = i / (length - 1);
      const segmentStartColor = new THREE.Color(startColor).lerp(endColor, startPosition);
      const segmentEndColor = new THREE.Color(startColor).lerp(endColor, endPosition);
      colors.push(
        segmentStartColor.r,
        segmentStartColor.g,
        segmentStartColor.b,
        segmentEndColor.r,
        segmentEndColor.g,
        segmentEndColor.b,
      );
    }
    return colors;
  }

  buildPositionSegment(points) {
    const positions = [];
    const { length } = points;
    for (let i = 1; i < length; i++) {
      positions.push(
        points[i - 1].x,
        points[i - 1].y,
        points[i - 1].z,
        points[i].x,
        points[i].y,
        points[i].z,
      );
    }
    return positions;
  }

  graphTick() {

    let baseIndex = 0;
    if (this.dirty) {
      this.colors.length = 0;
      this.positions.length = 0;
      this.edges.forEach((_, edge) => {
        const { startColor, endColor } = edge.calculateColors();
        this.edges.set(edge, baseIndex);
        this.positions.push(...this.buildPositionSegment(edge.points));
        this.colors.push(...this.buildColorSegment(startColor, endColor, edge.points.length));
        baseIndex += ((edge.points.length - 1) * 2);
      });
      this.dirty = false;
      this.mesh.geometry = new LineSegmentsGeometry();
      this.mesh.geometry.setPositions(this.positions);
      this.mesh.geometry.setColors(this.colors);
    } else {
      const { instanceStart, instanceEnd } = this.mesh.geometry.attributes;
      this.edges.forEach((_, edge) => {
        const { length } = edge.points;
        for (let i = 0; i < (length - 1); i++) {
          const start = edge.points[i];
          const end = edge.points[i + 1]
          instanceStart.setXYZ(baseIndex + i, start.x, start.y, start.z);
          instanceEnd.setXYZ(baseIndex + i, end.x, end.y, end.z);
        }
        baseIndex += length - 1;
      })
      instanceStart.data.needsUpdate = true;
    }
  }

  updateColor() {}
}

export default LineManager;
