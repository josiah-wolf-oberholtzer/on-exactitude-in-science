import * as THREE from 'three';

const ThreeVertex = () => {
  let controls,
    data = {},
    scene,
    textA,
    textB,
    radii = {
      baseRadius: 1,
      edgeRingVisible: false,
      edgeRingInnerRadius: 1.5,
      edgeRingOuterRadius: 1.75,
      childRingVisible: false,
      childRingInnerRadius: 2.0,
      childRingOuterRadius: 2.25,
    };

  const group = new THREE.Group(),
    coreMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
    ),
    childRingMesh = new THREE.Mesh(
      new THREE.RingBufferGeometry(),
      new THREE.MeshLambertMaterial({ color: 0x3366cc, side: THREE.DoubleSide }),
    ),
    edgeRingMesh = new THREE.Mesh(
      new THREE.RingBufferGeometry(),
      new THREE.MeshLambertMaterial({ color: 0xff9933, side: THREE.DoubleSide }),
    ),
    pointLight = new THREE.PointLight(0xff0000, 4, 100, 2);

  function calculateCoreGeometry(label) {
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

  function calculateRadii(newData) {
    const baseRadius = newData.radius,
      edgeRingVisible = newData.edge_count < newData.total_edge_count,
      edgeRingInnerRadius = baseRadius + 0.5,
      edgeRingOuterRadius = edgeRingInnerRadius + (0.1 * +edgeRingVisible),
      childRingInnerRadius = edgeRingOuterRadius + 0.25,
      childRingOuterRadius = childRingInnerRadius + ((newData.child_count || 1) * 0.25),
      childRingVisible = newData.child_count > 0;
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

  function enter(newData, newScene, newControls, textLoader) {
    controls = newControls;
    scene = newScene;
    scene.add(group);
    controls.add(coreMesh);
    textA = textLoader.loadMesh(newData.name);
    textB = textA.clone(false);
    textA.rotation.set(0, Math.PI * 0.5, 0);
    textB.rotation.set(0, Math.PI * 1.5, 0);
    group.add(textA);
    group.add(textB);
    update(newData);
    tick(newData);
  }

  function update(newData) {
    const newRadii = calculateRadii(newData),
      textPositionZ = newRadii.baseRadius + textA.geometry.parameters.width / 2;

    if (data.label !== newData.label) {
      coreMesh.geometry.dispose();
      coreMesh.geometry = calculateCoreGeometry(newData.label);
    }

    coreMesh.scale.setScalar(newRadii.baseRadius);

    textA.position.set(0, 0, textPositionZ);
    textB.position.set(0, 0, textPositionZ);

    if (!radii.childRingVisible && newRadii.childRingVisible) {
      group.add(childRingMesh);
    } else if (radii.childRingVisible && !newRadii.childRingVisible) {
      group.remove(childRingMesh);
    }

    childRingMesh.geometry.dispose();
    childRingMesh.geometry = new THREE.RingBufferGeometry(
      newRadii.childRingInnerRadius,
      newRadii.childRingOuterRadius,
      32,
    );

    if (!radii.edgeRingVisible && newRadii.edgeRingVisible) {
      group.add(edgeRingMesh);
    } else if (radii.edgeRingVisible && !newRadii.edgeRingVisible) {
      group.remove(edgeRingMesh);
    }

    edgeRingMesh.geometry.dispose();
    edgeRingMesh.geometry = new THREE.RingBufferGeometry(
      newRadii.edgeRingInnerRadius,
      newRadii.edgeRingOuterRadius,
      32,
    );

    radii = newRadii;
  }

  function exit() {
    scene.remove(group);
    controls.remove(coreMesh);
    group.remove(textA);
    group.remove(textB);
    scene = null;
    data = {};
    controls = null;
  }

  function select() {
    group.add(pointLight);
  }

  function deselect() {
    group.remove(pointLight);
  }

  function tick(newData) {
    group.position.copy(newData.position);
    group.lookAt(newData.rudderPosition);
    edgeRingMesh.rotation.y += 0.1;
    Object.assign(data, newData);
  }

  const closure = {
    deselect,
    enter,
    exit,
    mouseout: () => {},
    mouseover: () => {},
    select,
    tick,
    update,
    data: () => data,
  };

  function init() {
    childRingMesh.castShadow = true;
    childRingMesh.receiveShadow = true;
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    edgeRingMesh.castShadow = true;
    edgeRingMesh.receiveShadow = true;
    group.envelope = closure;
    group.add(coreMesh);
  }

  init();

  return closure;
};

export default ThreeVertex;
