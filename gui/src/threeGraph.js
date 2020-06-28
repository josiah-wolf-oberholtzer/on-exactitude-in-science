import * as THREE from 'three';

const threeGraph = () => {
  const graphObject = new THREE.Object3D(),
    cubeGeometry = new THREE.BoxGeometry(),
    lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }),
    objects = new Map();

  let sceneGraph;

  function onVertexEnter(vertex) {
    const material = new THREE.MeshStandardMaterial({ color: 0xee0808, flatShading: true }),
      mesh = new THREE.Mesh(cubeGeometry, material),
      object = { vertex, mesh };
    object.mesh.position.x = vertex.x;
    object.mesh.position.y = vertex.y;
    object.mesh.position.z = vertex.z;
    object.mesh.scale.x = 10;
    object.mesh.scale.y = 10;
    object.mesh.scale.z = 10;
    objects.set(vertex.id, object);
    graphObject.add(mesh);
  }

  function onVertexUpdate(vertex) {
    const object = objects.get(vertex.id);
    object.mesh.position.x = vertex.x;
    object.mesh.position.y = vertex.y;
    object.mesh.position.z = vertex.z;
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
    sceneGraph = graph;
    sceneGraph.on('vertexEnter', onVertexEnter);
    sceneGraph.on('vertexUpdate', onVertexUpdate);
    sceneGraph.on('vertexExit', onVertexExit);
    sceneGraph.on('edgeEnter', onEdgeEnter);
    sceneGraph.on('edgeUpdate', onEdgeUpdate);
    sceneGraph.on('edgeExit', onEdgeExit);
  }

  return {
    connect,
    object: graphObject,
  };
};

export { threeGraph };
