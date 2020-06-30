import * as THREE from 'three';

const threeGraph = () => {
  const graphObject = new THREE.Object3D(),
    cubeGeometry = new THREE.BoxGeometry(),
    cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xeec808, flatShading: true }),
    ringGeometry = new THREE.RingGeometry(1.5, 2, 32),
    ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xeec808, flatShading: true, side: THREE.DoubleSide,
    }),
    lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }),
    objects = new Map();

  let forceGraph;

  function onVertexEnter(vertex) {
    const
      cube = new THREE.Mesh(cubeGeometry, cubeMaterial),
      ring = new THREE.Mesh(ringGeometry, ringMaterial),
      object = { vertex, cube, ring };
    cube.add(ring);
    object.cube.position.x = vertex.x;
    object.cube.position.y = vertex.y;
    object.cube.position.z = vertex.z;
    object.cube.scale.x = 10;
    object.cube.scale.y = 10;
    object.cube.scale.z = 10;
    object.cube.lookAt(vertex.rudder.x, vertex.rudder.y, vertex.rudder.z);
    objects.set(vertex.id, object);
    graphObject.add(cube);
  }

  function onVertexUpdate(vertex) {
    const object = objects.get(vertex.id);
    object.cube.position.x = vertex.x;
    object.cube.position.y = vertex.y;
    object.cube.position.z = vertex.z;
    object.cube.lookAt(vertex.rudder.x, vertex.rudder.y, vertex.rudder.z);
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

  function connect(graph) {
    forceGraph = graph;
    forceGraph.on('vertexEnter', onVertexEnter);
    forceGraph.on('vertexUpdate', onVertexUpdate);
    forceGraph.on('vertexExit', onVertexExit);
    forceGraph.on('edgeEnter', onEdgeEnter);
    forceGraph.on('edgeUpdate', onEdgeUpdate);
    forceGraph.on('edgeExit', onEdgeExit);
  }

  return {
    connect,
    object: graphObject,
  };
};

export { threeGraph };
