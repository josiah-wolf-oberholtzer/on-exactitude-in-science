import * as THREE from 'three';
import * as d3 from 'd3-scale-chromatic';

class Vertex {
  constructor() {
    this.controls = null;
    this.data = {};
    this.scene = null;
    this.textA = null;
    this.textB = null;
    this.radii = {
      baseRadius: 1,
      edgeRingVisible: false,
      edgeRingInnerRadius: 1.5,
      edgeRingOuterRadius: 1.75,
      childRingVisible: false,
      childRingInnerRadius: 2.0,
      childRingOuterRadius: 2.25,
    };
    this.group = new THREE.Group();
    this.coreMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
    );
    this.childRingMesh = new THREE.Mesh(
      new THREE.RingBufferGeometry(),
      new THREE.MeshLambertMaterial({ color: 0x3366cc, side: THREE.DoubleSide }),
    );
    this.edgeRingMesh = new THREE.Mesh(
      new THREE.RingBufferGeometry(),
      new THREE.MeshLambertMaterial({ color: 0xff9933, side: THREE.DoubleSide }),
    );
    this.pointLight = new THREE.PointLight(0xff0000, 4, 100, 2);
    this.childRingMesh.castShadow = true;
    this.childRingMesh.receiveShadow = true;
    this.coreMesh.castShadow = true;
    this.coreMesh.receiveShadow = true;
    this.edgeRingMesh.castShadow = true;
    this.edgeRingMesh.receiveShadow = true;
    this.group.envelope = this;
    this.group.add(this.coreMesh);
    this.hovered = false;
    this.selected = false;
  }

  calculateColor() {
    if (this.hovered) {
      this.coreMesh.material.color.setHex(0xffff00);
      this.childRingMesh.material.color.setHex(0xffff00);
    } else if (this.selected) {
      this.coreMesh.material.color.setHex(0xff0000);
      this.childRingMesh.material.color.setHex(0xff0000);
    } else {
      const colorScheme = d3.schemeSpectral[10]
      this.coreMesh.material.color.set(
        colorScheme[(this.data.depth || 0) % 10]
      );
      this.childRingMesh.material.color.set(
        colorScheme[((this.data.depth || 0) + 1) % 10]
      );
    }
  }

  static calculateCoreGeometry(label) {
    switch (label) {
      case 'artist':
        return new THREE.TetrahedronGeometry(1.5);
      case 'company':
        return new THREE.BoxGeometry(1.5, 1.5, 1.5);
      case 'master':
        return new THREE.SphereGeometry(0.75, 32, 32);
      case 'release':
        return new THREE.SphereGeometry(0.75, 32, 32);
      case 'track':
        return new THREE.CylinderGeometry(0.25, 0.25, 2, 32);
      default:
        return new THREE.BufferGeometry();
    }
  }

  static calculateRadii(newData) {
    const baseRadius = newData.radius;
    const edgeRingVisible = newData.edge_count < newData.total_edge_count;
    const edgeRingInnerRadius = baseRadius + 0.5;
    const edgeRingOuterRadius = edgeRingInnerRadius + (0.1 * +edgeRingVisible);
    const childRingInnerRadius = edgeRingOuterRadius + 0.25;
    const childRingOuterRadius = childRingInnerRadius + ((newData.child_count || 1) ** 0.5);
    const childRingVisible = newData.child_count > 0;
    return {
      baseRadius,
      childRingInnerRadius,
      childRingOuterRadius,
      childRingVisible,
      edgeRingInnerRadius,
      edgeRingOuterRadius,
      edgeRingVisible,
    };
  }

  enter(newData, newScene, newControls, textLoader) {
    this.controls = newControls;
    this.scene = newScene;
    this.scene.add(this.group);
    this.controls.add(this.coreMesh);
    this.textA = textLoader.loadMesh(newData.name);
    this.textB = this.textA.clone(false);
    this.textA.rotation.set(0, Math.PI * 0.5, 0);
    this.textB.rotation.set(0, Math.PI * 1.5, 0);
    this.group.add(this.textA);
    this.group.add(this.textB);
    this.update(newData);
  }

  update(newData) {
    const newRadii = Vertex.calculateRadii(newData);
    const textPositionZ = newRadii.baseRadius + this.textA.geometry.parameters.width / 2;
    if (this.data.label !== newData.label) {
      this.coreMesh.geometry.dispose();
      this.coreMesh.geometry = Vertex.calculateCoreGeometry(newData.label);
    }
    this.coreMesh.scale.setScalar(newRadii.baseRadius);
    this.textA.position.set(0, 0, textPositionZ);
    this.textB.position.set(0, 0, textPositionZ);
    if (newRadii.childRingVisible) {
      this.group.add(this.childRingMesh);
    } else {
      this.group.remove(this.childRingMesh);
    }
    this.childRingMesh.geometry.dispose();
    this.childRingMesh.geometry = new THREE.RingBufferGeometry(
      newRadii.childRingInnerRadius,
      newRadii.childRingOuterRadius,
      32,
    );
    if (newRadii.edgeRingVisible) {
      this.group.add(this.edgeRingMesh);
    } else {
      this.group.remove(this.edgeRingMesh);
    }
    this.edgeRingMesh.geometry.dispose();
    this.edgeRingMesh.geometry = new THREE.RingBufferGeometry(
      newRadii.edgeRingInnerRadius,
      newRadii.edgeRingOuterRadius,
      32,
    );
    this.radii = newRadii;
    this.graphTick(newData);
  }

  exit() {
    this.scene.remove(this.group);
    this.controls.remove(this.coreMesh);
    this.group.remove(this.textA);
    this.group.remove(this.textB);
    this.scene = null;
    this.data = {};
    this.controls = null;
  }

  select() {
    this.group.add(this.pointLight);
    this.selected = true;
  }

  deselect() {
    this.group.remove(this.pointLight);
    this.selected = false;
  }

  frameTick() {
    this.edgeRingMesh.rotation.y += 0.05 + ((this.data.random || 1) * 0.1);
    this.calculateColor();
  }

  graphTick(newData) {
    // newData.position may not be a Vector3
    this.group.position.set(
      newData.position.x,
      newData.position.y,
      newData.position.z,
    );
    // newData.rudderPosition may not be a Vector3
    this.group.lookAt(
      newData.rudderPosition.x,
      newData.rudderPosition.y,
      newData.rudderPosition.z,
    );
    this.data = newData;
  }

  mouseout() {
    this.hovered = false;
  }

  mouseover() {
    this.hovered = true;
  }
}

export default Vertex;
