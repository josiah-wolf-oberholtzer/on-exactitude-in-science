import * as THREE from 'three';

class Edge {
  constructor() {
    this.isEdge = true;
    this.controls = null;
    this.data = {};
    this.parent = null;
    this.curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    );
    this.line = new THREE.Line();
    this.group = new THREE.Group();
    this.group.envelope = this;
    this.group.add(this.line);
    this.lineManager = null;
    this.points = [];
    this.hovered = false;
    this.selected = false;
  }

  calculateColors() {
    const startColor = new THREE.Color(0x401010);
    const endColor = new THREE.Color(0x15385c);
    if (this.data.label === 'alias_of') {
      startColor.set(0x3a4a18);
      endColor.set(0x3a4a18);
    }
    if (this.selected === true) {
      startColor.setHex(0xffff00);
      endColor.setHex(0xffff00);
    }
    if (this.hovered === true) {
      startColor.setHex(0xff0000);
      endColor.setHex(0xff0000);
    }
    return {startColor, endColor};
  }

  enter(newData, newParent, newControls, newLineManager) {
    this.controls = newControls;
    this.parent = newParent;
    this.lineManager = newLineManager;
    this.lineManager.add(this);
    this.controls.add(this.line);
    this.update(newData);
  }

  update(newData) {
    this.graphTick(newData);
  }

  exit() {
    this.controls.remove(this.line);
    this.lineManager.remove(this);
    this.lineManager = null;
    this.parent = null;
    this.controls = null;
    this.data = {};
  }

  frameTick() { }

  graphTick(newData) {
    this.points.length = 0;
    if (newData.controlPosition) {
      this.curve.v0.copy(newData.sourcePosition);
      this.curve.v1.copy(newData.controlPosition);
      this.curve.v2.copy(newData.targetPosition);
      this.points.push(...this.curve.getPoints(10));
    } else {
      this.points.push(
        newData.sourcePosition,
        newData.targetPosition,
      );
    }
    Object.assign(this.data, newData);
    const pointArray = [];
    for (let i = 0; i < this.points.length; i++) {
      pointArray.push(this.points[i].x, this.points[i].y, this.points[i].z);
    }
    this.line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pointArray, 3));
    this.line.geometry.computeBoundingSphere();
  }

  mouseout() {
    console.log("edge/mouseout", this.data.id);
    this.hovered = false;
    this.lineManager.updateColor(this);
  }

  mouseover() {
    console.log("edge/mouseover", this.data.id);
    this.hovered = true;
    this.lineManager.updateColor(this);
  }

  select() {
    console.log("edge/select", this.data.id);
    this.selected = true;
    this.hovered = false;
    this.lineManager.updateColor(this);
  }

  deselect() {
    console.log("edge/deselect", this.data.id);
    this.selected = false;
    this.lineManager.updateColor(this);
  }
}

export default Edge;
