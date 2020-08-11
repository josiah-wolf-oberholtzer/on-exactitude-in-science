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
    this.points = [];
    this.group.add(this.lineMesh);
    this.group.envelope = this;
    this.hovered = false;
    this.selected = false;
  }

  calculateColor() {
    const color = new THREE.Color(0xffffff);
    if (this.data.label === "alias_of") {
      color.setHex(0xd0ff00);
    } else {
      color.setHex(0x336699);
    }
    if (this.selected) {
      color.setHex(0xffff00);
    } else if (this.hovererd) {
      color.setHex(0xff0000);
    }
    return color;
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
    this.points.length = 0;
    if (newData.controlPosition) {
      this.curve.v0.copy(newData.sourcePosition);
      this.curve.v1.copy(newData.controlPosition);
      this.curve.v2.copy(newData.targetPosition);
      this.points.push(...this.curve.getPoints(25));
    } else {
      this.points.push(
        newData.sourcePosition,
        newData.targetPosition,
      );
    }
    this.lineMesh.geometry.setFromPoints(this.points);
    Object.assign(this.data, newData);
  }

  mouseout() {
    this.hovered = false;
    this.lineManager.updateColor(this);
  }

  mouseover() {
    this.hovered = true;
    this.lineManager.updateColor(this);
  }

  select() {
    this.selected = true;
    this.lineManager.updateColor(this);
  }

  deselect() {
    this.selected = false;
    this.lineManager.updateColor(this);
  }
}

export default Edge;
