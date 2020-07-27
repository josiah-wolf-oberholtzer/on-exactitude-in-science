import * as THREE from 'three';
import { dispatch } from 'd3-dispatch';
import { DragControls } from './DragControls';

const ThreeGraph = (opts) => {
  const { forceGraph, sceneManager, textLoader } = opts,
    graphObject = new THREE.Object3D(),
    controls = new DragControls([], sceneManager.camera, sceneManager.canvas),
    cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5),
    cylinderGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2, 32),
    sphereGeometry = new THREE.SphereGeometry(0.75, 32, 32),
    tetrahedronGeometry = new THREE.TetrahedronGeometry(1.5),
    labelToGeo = {
      artist: tetrahedronGeometry,
      company: cubeGeometry,
      master: sphereGeometry,
      release: sphereGeometry,
      track: cylinderGeometry,
    },
    envelopes = new Map(),
    dispatcher = dispatch(
      'deselect',
      'doubleclick',
      'select',
    );

  let previousClickObject = null,
    previousClickTime = Date.now();

  controls.on('select', (event) => {
    console.log('select', event);
    const { envelope } = event.object.parent,
      { ring, vertex } = envelope;
    ring.material.oldColor = 0xff9933;
    forceGraph.pin(vertex.id, vertex.x, vertex.y, vertex.z);
    forceGraph.reheat();
    envelope.light = new THREE.PointLight(0xff0000, 4, 100, 2);
    event.object.parent.add(envelope.light);
    dispatcher.call('select', vertex, vertex);
  });

  controls.on('deselect', (event) => {
    console.log('deselect', event);
    const { envelope } = event.object.parent,
      { ring, vertex, light } = envelope;
    ring.material.color.setHex(0x08ccc8);
    forceGraph.unpin(vertex.id);
    event.object.parent.remove(light);
    dispatcher.call('deselect', vertex, vertex);
  });

  controls.on('dragstart', (event) => {
    console.log('dragstart', event);
    sceneManager.controls.enabled = false;
    const { envelope } = event.object.parent,
      { vertex } = envelope,
      currentClickObject = envelope,
      currentClickTime = Date.now();
    if (
      (currentClickObject === previousClickObject)
      && ((currentClickTime - previousClickTime) < 250)
    ) {
      console.log('doubleclick');
      dispatcher.call('doubleclick', vertex, vertex);
    }
    previousClickObject = currentClickObject;
    previousClickTime = currentClickTime;
  });

  controls.on('drag', (event) => {
    console.log('drag', event);
    const { envelope } = event.object.parent,
      { vertex } = envelope,
      { position } = event;
    forceGraph.pin(vertex.id, position.x, position.y, position.z);
    forceGraph.reheat();
  });

  controls.on('dragend', (event) => {
    console.log('dragend', event);
    const { envelope } = event.object.parent,
      { entity, ring } = envelope;
    entity.material.color.setHex(entity.material.oldColor);
    ring.material.color.setHex(ring.material.oldColor);
    sceneManager.controls.enabled = true;
  });

  controls.on('mouseover', (event) => {
    console.log('mouseover', event);
    const { envelope } = event.object.parent,
      { entity, ring } = envelope;
    entity.material.oldColor = entity.material.color.getHex();
    ring.material.oldColor = ring.material.color.getHex();
    entity.material.color.setHex(0xff0000);
    ring.material.color.setHex(0xff0000);
  });

  controls.on('mouseout', (event) => {
    console.log('mouseout', event);
    const { envelope } = event.object.parent,
      { entity, ring } = envelope;
    entity.material.color.setHex(entity.material.oldColor);
    ring.material.color.setHex(ring.material.oldColor);
  });

  function onVertexEnter(vertex) {
    const radius = vertex.radius || 1,
      group = new THREE.Group(),
      entityMaterial = new THREE.MeshPhongMaterial({ color: 0xeec808, side: THREE.DoubleSide }),
      ringGeometry = new THREE.RingGeometry(
        radius + 1.5,
        radius + 1.5 + ((vertex.child_count || 1) * 0.25),
        32,
      ),
      ringMaterial = new THREE.MeshPhongMaterial({ color: 0x08ccc8, side: THREE.DoubleSide }),
      entityGeometry = labelToGeo[vertex.label],
      entity = new THREE.Mesh(entityGeometry, entityMaterial),
      ring = new THREE.Mesh(ringGeometry, ringMaterial),
      textA = textLoader.loadMesh(vertex.name),
      textB = textA.clone(false),
      envelope = {
        entity,
        entityMaterial,
        group,
        ring,
        ringMaterial,
        textA,
        textB,
        vertex,
      };
    entity.receiveShadow = true;
    entity.castShadow = true;
    ring.receiveShadow = true;
    ring.castShadow = true;
    textA.position.set(0, 0, radius + textA.geometry.parameters.width / 2);
    textB.position.set(0, 0, radius + textB.geometry.parameters.width / 2);
    textA.rotation.set(0, Math.PI * 0.5, 0);
    textB.rotation.set(0, Math.PI * 1.5, 0);
    group.envelope = envelope;
    group.add(entity);
    if (vertex.child_count) {
      group.add(ring);
    }
    group.add(textA);
    group.add(textB);
    entity.scale.setScalar(radius);
    group.position.copy(vertex.position);
    group.lookAt(vertex.rudderPosition);
    controls.objects().push(entity);
    envelopes.set(vertex.id, envelope);
    graphObject.add(group);
  }

  function onVertexUpdate(vertex) {
    const envelope = envelopes.get(vertex.id),
      { group } = envelope;
    group.position.copy(vertex.position);
    group.lookAt(vertex.rudderPosition);
  }

  function onVertexExit(vertex) {
    const envelope = envelopes.get(vertex.id);
    graphObject.remove(envelope.group);
  }

  function onEdgeEnter(edge) {
    const source = edge.sourcePosition,
      target = edge.targetPosition,
      lineColor = edge.label === 'alias_of' ? 0xcc9933 : 0x3399cc,
      lineMaterial = new THREE.LineBasicMaterial({ color: lineColor }),
      points = [],
      geometry = new THREE.BufferGeometry(),
      line = new THREE.Line(geometry, lineMaterial),
      envelope = {
        geometry, line, edge,
      };
    if (edge.controlPosition) {
      const control = edge.controlPosition,
        curve = new THREE.QuadraticBezierCurve3(source, control, target);
      points.push(...curve.getPoints(25));
    } else {
      points.push(source);
      points.push(target);
    }
    geometry.setFromPoints(points);
    envelopes.set(edge.id, envelope);
    graphObject.add(line);
  }

  function onEdgeUpdate(edge) {
    const envelope = envelopes.get(edge.id),
      source = edge.sourcePosition,
      target = edge.targetPosition,
      points = [];
    if (edge.controlPosition) {
      const control = edge.controlPosition,
        curve = new THREE.QuadraticBezierCurve3(source, control, target);
      points.push(...curve.getPoints(25));
    } else {
      points.push(source);
      points.push(target);
    }
    envelope.geometry.setFromPoints(points);
  }

  function onEdgeExit(edge) {
    const envelope = envelopes.get(edge.id);
    graphObject.remove(envelope.line);
  }

  function init() {
    forceGraph.on('vertexEnter', onVertexEnter);
    forceGraph.on('vertexUpdate', onVertexUpdate);
    forceGraph.on('vertexExit', onVertexExit);
    forceGraph.on('edgeEnter', onEdgeEnter);
    forceGraph.on('edgeUpdate', onEdgeUpdate);
    forceGraph.on('edgeExit', onEdgeExit);
    sceneManager.scene.add(graphObject);
    sceneManager.on('render', forceGraph.tick);
  }

  init();

  return {
    object: graphObject,
    envelopes,
    on(name, _) { return arguments.length > 1 ? dispatcher.on(name, _) : dispatcher.on(name); },
  };
};

export { ThreeGraph };
