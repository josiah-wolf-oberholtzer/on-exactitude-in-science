import React from "react";
import ForceGraph from '../physics/ForceGraph';
// import ForceGraph from '../physics/ForceGraphProxy';
import GraphManager from '../graphics/GraphManager';
import SceneManager from '../graphics/SceneManager';
import { connect } from 'react-redux';
import { deselectEntity, fetchByEntity, selectEntity } from '../slices/graphSlice';
import { push } from 'connected-react-router';

const mapStateToProps = state => {
  return {
    center: state.graph.center,
    edges: state.graph.edges,
    vertices: state.graph.vertices,
    cameraNonce: state.camera.nonce,
  } 
}

const mapDispatchToProps = dispatch => {
  return {
    fetchByEntity: (label, id) => dispatch(fetchByEntity({label, id})),
    push: (label, id) => dispatch(push(`/${label}/${id}`)),
    selectEntity: (eid, label, name) => dispatch(selectEntity({eid, label, name})),
    deselectEntity: () => dispatch(deselectEntity()),
  }
}

class Graph extends React.Component {

  static defaultProps = {
    center: null,
    edges: [],
    vertices: [],
  }

  updateCamera(prevProps, nextProps) {
    if (prevProps.cameraNonce != nextProps.cameraNonce) {
      this.sceneManager.resetCamera();
    }
  }

  updateGraph(prevProps, nextProps) {
    if (
      prevProps.edges != nextProps.edges ||
      prevProps.vertices != nextProps.vertices
    ) {
      this.forceGraph.update(nextProps.vertices, nextProps.edges);
      this.forceGraph.reheat();
    }
  }

  componentDidMount(prevProps) {
    this.forceGraph = new ForceGraph();
    this.sceneManager = new SceneManager(this.mount);
    this.threeGraph = new GraphManager(this.forceGraph, this.sceneManager);
    this.threeGraph.on("doubleclick", (vertex) => {
      this.props.push(vertex.label, vertex.eid);
    });
    this.threeGraph.on("select", (vertex) => {
      this.props.selectEntity(vertex.eid, vertex.label, vertex.name);
    });
    this.threeGraph.on("deselect", (vertex) => {
      this.props.deselectEntity();
    });
    this.updateGraph({}, this.props);
    this.start();
  }

  componentDidUpdate(prevProps) {
    this.updateGraph(prevProps, this.props);
    this.updateCamera(prevProps, this.props);
  }

  componentWillUnmount() {
    this.stop();
  }

  start() {
    this.sceneManager.start();
  }

  stop() {
    this.sceneManager.stop();
  }

  render() {
    return <div id="graph" ref={ref => (this.mount = ref)} />
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Graph);
