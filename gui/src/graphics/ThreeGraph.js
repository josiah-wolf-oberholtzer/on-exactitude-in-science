import * as THREE from 'three';
import { dispatch } from 'd3-dispatch';
import { DragControls } from './DragControls';

const ThreeGraph = (opts) => {
  const { forceGraph, sceneManager } = opts,
    graphObject = new THREE.Object3D(),
    controls = new DragControls([], sceneManager.camera, sceneManager.canvas),
    lineMaterial = new THREE.LineBasicMaterial({ color: 0x3399cc }),
    cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5),
    cylinderGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2, 32),
    sphereGeometry = new THREE.SphereGeometry(0.75, 32, 32),
    tetrahedronGeometry = new THREE.TetrahedronGeometry(1.5),
    ringGeometry = new THREE.RingGeometry(1.5, 2, 32),
    labelToGeo = {
      artist: tetrahedronGeometry,
      company: cubeGeometry,
      master: sphereGeometry,
      release: sphereGeometry,
      track: cylinderGeometry,
    },
    objects = new Map(),
    dispatcher = dispatch('doubleclick');

  let previousClickObject = null,
    previousClickTime = Date.now();

  controls.on('select', (ev) => {
    console.log('select', ev);
    const { data } = ev.object.parent,
      { ring } = data;
    ring.material.oldColor = 0xff9933;
  });

  controls.on('deselect', (ev) => {
    console.log('deselect', ev);
    const { data } = ev.object.parent,
      { ring, vertex } = data;
    ring.material.color.setHex(0x08ccc8);
    vertex.fx = null;
    vertex.fy = null;
    vertex.fz = null;
  });

  controls.on('dragstart', (ev) => {
    console.log('dragstart', ev);
    sceneManager.controls.enabled = false;
    const { data } = ev.object.parent,
      { vertex } = data,
      currentClickObject = data,
      currentClickTime = Date.now();
    if (currentClickObject === previousClickObject && (currentClickTime - previousClickTime) < 250) {
      console.log('doubleclick');
      dispatcher.call('doubleclick', vertex, vertex);
    }
    previousClickObject = currentClickObject;
    previousClickTime = currentClickTime;
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
      { entity } = data,
      { ring } = data;
    entity.material.color.setHex(entity.material.oldColor);
    ring.material.color.setHex(ring.material.oldColor);
    sceneManager.controls.enabled = true;
  });

  controls.on('mouseover', (ev) => {
    console.log('mouseover', ev);
    const { data } = ev.object.parent,
      { entity } = data,
      { ring } = data;
    entity.material.oldColor = entity.material.color.getHex();
    ring.material.oldColor = ring.material.color.getHex();
    entity.material.color.setHex(0xff0000);
    ring.material.color.setHex(0xff0000);
  });

  controls.on('mouseout', (ev) => {
    console.log('mouseout', ev);
    const { data } = ev.object.parent,
      { entity } = data,
      { ring } = data;
    entity.material.color.setHex(entity.material.oldColor);
    ring.material.color.setHex(ring.material.oldColor);
  });

  function onVertexEnter(vertex) {
    const entityMaterial = new THREE.MeshPhongMaterial({ color: 0xeec808, side: THREE.DoubleSide }),
      ringMaterial = new THREE.MeshPhongMaterial({ color: 0x08ccc8, side: THREE.DoubleSide }),
      parent = new THREE.Object3D(),
      entityGeometry = labelToGeo[vertex.label],
      entity = new THREE.Mesh(entityGeometry, entityMaterial),
      ring = new THREE.Mesh(ringGeometry, ringMaterial),
      object = {
        parent, vertex, entity, ring, entityMaterial, ringMaterial,
      };
    entity.receiveShadow = true;
    entity.castShadow = true;
    ring.receiveShadow = true;
    ring.castShadow = true;
    parent.data = object;
    parent.add(entity);
    parent.add(ring);
    controls.objects().push(entity);
    console.log(vertex);
    object.parent.scale.setScalar(vertex.radius);
    object.parent.position.x = vertex.x;
    object.parent.position.y = vertex.y;
    object.parent.position.z = vertex.z;
    /*
    object.parent.scale.x = 10;
    object.parent.scale.y = 10;
    object.parent.scale.z = 10;
    */
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

  function onVertexExit(vertex) {
    const object = objects.get(vertex.id);
    graphObject.remove(object.parent);
  }

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

  function onEdgeExit(edge) {
    const object = objects.get(edge.id);
    graphObject.remove(object.line);
  }

  function init() {
    forceGraph.on('vertexEnter', onVertexEnter);
    forceGraph.on('vertexUpdate', onVertexUpdate);
    forceGraph.on('vertexExit', onVertexExit);
    forceGraph.on('edgeEnter', onEdgeEnter);
    forceGraph.on('edgeUpdate', onEdgeUpdate);
    forceGraph.on('edgeExit', onEdgeExit);
    sceneManager.scene.add(graphObject);
    sceneManager.on('render', () => forceGraph.tick());
  }

  init();

  return {
    object: graphObject,
    objects,
    on(name, _) { return arguments.length > 1 ? dispatcher.on(name, _) : dispatcher.on(name); },
  };
};

export { ThreeGraph };
