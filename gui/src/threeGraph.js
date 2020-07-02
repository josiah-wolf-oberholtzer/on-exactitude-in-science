import * as THREE from 'three';
import { DragControls } from './DragControls';

const ThreeGraph = (opts) => {
  const { forceGraph, threeManager } = opts,
    graphObject = new THREE.Object3D(),
    geometry = new THREE.SphereGeometry(5, 32, 32),
    cubeGeometry = new THREE.BoxGeometry(),
    tetrahedronGeometry = new THREE.TetrahedronGeometry(),
    ringGeometry = new THREE.RingGeometry(1.5, 2, 32),
    lineMaterial = new THREE.LineBasicMaterial({ color: 0x3399cc }),
    controls = new DragControls([], threeManager.camera, threeManager.canvas),
    objects = new Map();

  controls.on('select', (ev) => {
    console.log('select', ev);
  });
  controls.on('deselect', (ev) => {
    console.log('deselect', ev);
  });
  controls.on('dragstart', (ev) => {
    console.log('dragstart', ev);
    threeManager.controls.enabled = false;
  });
  controls.on('drag', (ev) => {
    console.log('drag', ev);
    const { data } = ev.object.parent,
      { vertex } = data,
      { position } = ev;
    vertex.fx = position.x;
    vertex.fy = position.y;
    vertex.fz = position.z;
    forceGraph.reheat();
  });
  controls.on('dragend', (ev) => {
    console.log('dragend', ev);
    const { data } = ev.object.parent,
      { vertex } = data,
      { cube } = data,
      { ring } = data;
    vertex.fx = null;
    vertex.fy = null;
    vertex.fz = null;
    cube.material.color.setHex(cube.material.oldColor);
    ring.material.color.setHex(ring.material.oldColor);
    threeManager.controls.enabled = true;
  });
  controls.on('mouseover', (ev) => {
    console.log('mouseover', ev);
    const { data } = ev.object.parent,
      { cube } = data,
      { ring } = data;
    cube.material.oldColor = cube.material.color.getHex();
    ring.material.oldColor = ring.material.color.getHex();
    cube.material.color.setHex(0xff0000);
    ring.material.color.setHex(0xff0000);
  });
  controls.on('mouseout', (ev) => {
    console.log('mouseout', ev);
    const { data } = ev.object.parent,
      { cube } = data,
      { ring } = data;
    cube.material.color.setHex(cube.material.oldColor);
    ring.material.color.setHex(ring.material.oldColor);
  });

  function onVertexEnter(vertex) {
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0xeec808, side: THREE.DoubleSide }),
      ringMaterial = new THREE.MeshPhongMaterial({ color: 0x08ccc8, side: THREE.DoubleSide }),
      parent = new THREE.Object3D(),
      cube = new THREE.Mesh(cubeGeometry, cubeMaterial),
      ring = new THREE.Mesh(ringGeometry, ringMaterial),
      object = {
        parent, vertex, cube, ring,
      };
    cube.receiveShadow = true;
    cube.castShadow = true;
    ring.receiveShadow = true;
    ring.castShadow = true;
    parent.data = object;
    parent.add(cube);
    parent.add(ring);
    controls.objects().push(cube);
    object.parent.position.x = vertex.x;
    object.parent.position.y = vertex.y;
    object.parent.position.z = vertex.z;
    object.parent.scale.x = 10;
    object.parent.scale.y = 10;
    object.parent.scale.z = 10;
    object.parent.lookAt(vertex.rudder.x, vertex.rudder.y, vertex.rudder.z);
    objects.set(vertex.id, object);
    graphObject.add(parent);
  }

  function onVertexUpdate(vertex) {
    const object = objects.get(vertex.id);
    object.parent.position.x = vertex.x;
    object.parent.position.y = vertex.y;
    object.parent.position.z = vertex.z;
    object.parent.lookAt(vertex.rudder.x, vertex.rudder.y, vertex.rudder.z);
  }

  function onVertexExit() { }

  function onEdgeEnter(edge) {
    const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(edge.source.x, edge.source.y, edge.source.z),
        new THREE.Vector3(edge.x, edge.y, edge.z),
        new THREE.Vector3(edge.target.x, edge.target.y, edge.target.z),
      ),
      points = curve.getPoints(50),
      geometry = new THREE.BufferGeometry().setFromPoints(points),
      line = new THREE.Line(geometry, lineMaterial),
      object = { geometry, line, edge };
    objects.set(edge.id, object);
    graphObject.add(line);
  }

  function onEdgeUpdate(edge) {
    const object = objects.get(edge.id),
      curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(edge.source.x, edge.source.y, edge.source.z),
        new THREE.Vector3(edge.x, edge.y, edge.z),
        new THREE.Vector3(edge.target.x, edge.target.y, edge.target.z),
      ),
      points = curve.getPoints(50);
    object.geometry.setFromPoints(points);
  }

  function onEdgeExit() { }

  function init() {
    forceGraph.on('vertexEnter', onVertexEnter);
    forceGraph.on('vertexUpdate', onVertexUpdate);
    forceGraph.on('vertexExit', onVertexExit);
    forceGraph.on('edgeEnter', onEdgeEnter);
    forceGraph.on('edgeUpdate', onEdgeUpdate);
    forceGraph.on('edgeExit', onEdgeExit);
    threeManager.scene.add(graphObject);
    threeManager.on('render', () => forceGraph.tick());
  }

  init();

  return {
    object: graphObject,
    objects,
  };
};

export { ThreeGraph };
