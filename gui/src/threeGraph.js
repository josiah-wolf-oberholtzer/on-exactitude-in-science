import * as THREE from 'three';

const ThreeGraph = (opts) => {
  const { forceGraph, threeManager } = opts,
    graphObject = new THREE.Object3D(),
    cubeGeometry = new THREE.BoxGeometry(),
    cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xeec808, flatShading: true }),
    ringGeometry = new THREE.RingGeometry(1.5, 2, 32),
    lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }),
    objects = new Map();

  function onVertexEnter(vertex) {
    const material = new THREE.MeshLambertMaterial({ color: 0xeec808, side: THREE.DoubleSide }),
      parent = new THREE.Object3D(),
      cube = new THREE.Mesh(cubeGeometry, material),
      ring = new THREE.Mesh(ringGeometry, material),
      object = { parent, vertex, cube, ring };
    parent.add(cube);
    parent.add(ring);
    cube.on('mouseover', (ev) => { 
      cube.currentHex = cube.material.color.getHex();
      cube.material.color.setHex(0xff0000);
      console.log("mouseover", event);
    });
    cube.on('mouseout', (ev) => {
      cube.material.color.setHex(cube.currentHex);
      console.log("mouseout", event)
    });
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
