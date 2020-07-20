import React from "react";
import { connect } from 'react-redux';
import { SceneManager } from '../graphics/SceneManager';
import { TextLoader } from '../graphics/TextLoader';
import { ThreeGraph } from '../graphics/ThreeGraph';
import { fetchByEntity } from '../slices/graphSlice';
import ForceGraphWorkerProxy from '../physics/ForceGraphWorkerProxy';
import { ForceGraph } from '../physics/ForceGraph';

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
      this.sceneManager.camera.position.set(0, 0, 200);
      this.sceneManager.camera.rotation.set(0, 0, 0);
      this.sceneManager.controls.target.set(0, 0, 0);
      this.sceneManager.controls.enableDamping = false;
      this.sceneManager.controls.update();
      this.sceneManager.controls.enableDamping = true;
    }
  }

  updateGraph(prevProps, nextProps) {
    if (
      prevProps.edges != nextProps.edges ||
      prevProps.vertices != nextProps.vertices
    ) {
      this.forceGraph.update(nextProps.vertices, nextProps.edges);
    }
  }

  componentDidMount(prevProps) {
    this.textLoader = TextLoader();
    this.forceGraph = ForceGraph();
    this.sceneManager = SceneManager(this.mount);
    this.threeGraph = ThreeGraph({
        forceGraph: this.forceGraph,
        sceneManager: this.sceneManager,
        textLoader: this.textLoader,
    });
    this.threeGraph.on("doubleclick", (vertex) => {
      this.props.fetchByEntity(vertex.label, vertex.eid);
    });
    this.sceneManager.scene.add(this.threeGraph.object);
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
    // this.forceGraph.start();
    this.sceneManager.start();
  }

  stop() {
    // this.forceGraph.stop();
    this.sceneManager.stop();
  }

  render() {
    return <div id="graph" ref={ref => (this.mount = ref)} />
  }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Graph);
