import * as THREE from 'three';

class Edge {
  constructor() {
    this.controls = null;
    this.data = {};
    this.curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    );
    this.group = new THREE.Group();
    this.lineManager = null;
    this.lineMesh = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x336699 }),
    );
    this.group.add(this.lineMesh);
    this.group.envelope = this;
  }

  enter(newData, newControls, newLineManager) {
    this.controls = newControls;
    this.lineManager = newLineManager;
    this.lineManager.add(this);
    this.update(newData);
  }

  update(newData) {
    this.graphTick(newData);
  }

  exit() {
    this.lineManager.remove(this);
    this.data = {};
    this.controls = null;
    this.lineManager = null;
  }

  frameTick() { }

  graphTick(newData) {
    if (newData.controlPosition) {
      this.curve.v0.copy(newData.sourcePosition);
      this.curve.v1.copy(newData.controlPosition);
      this.curve.v2.copy(newData.targetPosition);
      this.lineMesh.geometry.setFromPoints(this.curve.getPoints(25));
    } else {
      this.lineMesh.geometry.setFromPoints([
        newData.sourcePosition,
        newData.targetPosition,
      ]);
    }
    Object.assign(this.data, newData);
  }
}

export default Edge;
