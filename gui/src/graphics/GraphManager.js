import * as THREE from 'three';
import { dispatch } from 'd3-dispatch';
import { DragControls } from './DragControls';
import ThreeEdge from './ThreeEdge';
import ThreeVertex from './ThreeVertex';

const GraphManager = (opts) => {
  const { forceGraph, sceneManager, textLoader } = opts;
  const graphObject = new THREE.Object3D();
  const controls = new DragControls([], sceneManager.camera, sceneManager.canvas);
  const envelopes = new Map();
  const dispatcher = dispatch(
    'deselect',
    'doubleclick',
    'select',
  );

  let previousClickObject = null,
    previousClickTime = Date.now();

  controls.on('select', (event) => {
    console.log('select', event);
    const { envelope } = event.object.parent;
    const vertex = envelope.data;
    envelope.select();
    forceGraph.pin(vertex.id, vertex.x, vertex.y, vertex.z);
    forceGraph.reheat();
    dispatcher.call('select', vertex, vertex);
  });

  controls.on('deselect', (event) => {
    console.log('deselect', event);
    const { replaced } = event;
    const { envelope } = event.object.parent;
    const vertex = envelope.data;
    envelope.deselect();
    forceGraph.unpin(vertex.id);
    if (!replaced) {
      dispatcher.call('deselect', vertex, vertex);
    }
  });

  controls.on('dragstart', (event) => {
    console.log('dragstart', event);
    sceneManager.controls.enabled = false;
    const { envelope } = event.object.parent;
    const vertex = envelope.data;
    const currentClickObject = envelope;
    const currentClickTime = Date.now();
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
    const { envelope } = event.object.parent;
    const vertex = envelope.data;
    const { position } = event;
    forceGraph.pin(vertex.id, position.x, position.y, position.z);
    forceGraph.reheat();
  });

  controls.on('dragend', (event) => {
    console.log('dragend', event);
    sceneManager.controls.enabled = true;
  });

  controls.on('mouseover', (event) => {
    console.log('mouseover', event);
    const { envelope } = event.object.parent;
    envelope.mouseover();
  });

  controls.on('mouseout', (event) => {
    console.log('mouseout', event);
    const { envelope } = event.object.parent;
    envelope.mouseout();
  });

  function onVertexEnter(vertex) {
    const threeVertex = new ThreeVertex();
    threeVertex.enter(vertex, graphObject, controls, textLoader);
    envelopes.set(vertex.id, threeVertex);
  }

  function onVertexUpdate(vertex) {
    const threeVertex = envelopes.get(vertex.id);
    threeVertex.update(vertex);
  }

  function onVertexGraphTick(vertex) {
    const threeVertex = envelopes.get(vertex.id);
    threeVertex.tick(vertex);
  }

  function onVertexFrameTick() { }

  function onVertexExit(vertex) {
    const threeVertex = envelopes.get(vertex.id);
    threeVertex.exit();
  }

  function onEdgeEnter(edge) {
    const threeEdge = new ThreeEdge();
    threeEdge.enter(edge, graphObject, controls, textLoader);
    envelopes.set(edge.id, threeEdge);
  }

  function onEdgeUpdate(edge) {
    const threeEdge = envelopes.get(edge.id);
    threeEdge.update(edge);
  }

  function onEdgeGraphTick(edge) {
    const threeEdge = envelopes.get(edge.id);
    threeEdge.tick(edge);
  }

  function onEdgeFrameTick() { }

  function onEdgeExit(edge) {
    const threeEdge = envelopes.get(edge.id);
    threeEdge.exit();
  }

  function onGraphRebuild(data) {
    console.log("onGraphRebuild", data);
    data.vertices.entrances.forEach(onVertexEnter);
    data.vertices.updates.forEach(onVertexUpdate);
    data.vertices.exits.forEach(onVertexExit);
    data.edges.entrances.forEach(onEdgeEnter);
    data.edges.updates.forEach(onEdgeUpdate);
    data.edges.exits.forEach(onEdgeExit);
  }

  function onGraphTick(data) {
    data.vertices.forEach(onVertexGraphTick);
    data.edges.forEach(onEdgeGraphTick);
  }

  function init() {
    forceGraph.on('graphRebuild', onGraphRebuild);
    forceGraph.on('graphTick', onGraphTick);
    sceneManager.scene.add(graphObject);
    sceneManager.on('render', () => { forceGraph.tick(); });
  }

  init();

  return {
    object: graphObject,
    envelopes,
    on(name, _) { return arguments.length > 1 ? dispatcher.on(name, _) : dispatcher.on(name); },
  };
};

export default GraphManager;
