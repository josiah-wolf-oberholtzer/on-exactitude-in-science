import * as THREE from 'three';

const ThreeEdge = () => {
  let controls,
    data = {},
    scene;

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  );
  const group = new THREE.Group();
  const lineMesh = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );

  function enter(newData, newScene, newControls, textLoader) {
    controls = newControls;
    scene = newScene;
    scene.add(group);
    update(newData);
  }

  function update(newData) {
    tick(newData);
  }

  function exit() {
    scene.remove(group);
    controls.remove(lineMesh);
    scene = null;
    data = {};
    controls = null;
  }

  function tick(newData) {
    if (newData.controlPosition) {
      curve.v0.copy(newData.sourcePosition);
      curve.v1.copy(newData.controlPosition);
      curve.v2.copy(newData.targetPosition);
      lineMesh.geometry.setFromPoints(curve.getPoints(25));
    } else {
      lineMesh.geometry.setFromPoints([
        newData.sourcePosition,
        newData.targetPosition,
      ]);
    }
    Object.assign(data, newData);
  }

  const closure = {
    enter,
    exit,
    tick,
    update,
    data: () => data,
  };

  group.envelope = closure;
  group.add(lineMesh);

  return closure;
};

export default ThreeEdge;
