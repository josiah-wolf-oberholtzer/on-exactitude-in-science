import React from "react";
import { connect } from 'react-redux';
import { ForceGraph } from '../graphics/ForceGraph';
import { SceneManager } from '../graphics/SceneManager';
import { ThreeGraph } from '../graphics/ThreeGraph';
import { fetchByEntity } from '../slices/graphSlice';

const mapStateToProps = state => {
  return {
    center: state.graph.center,
    edges: state.graph.edges,
    vertices: state.graph.vertices,
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

  componentDidMount() {
    this.forceGraph = ForceGraph();
    this.sceneManager = SceneManager(this.mount);
    this.threeGraph = ThreeGraph({
        forceGraph: this.forceGraph,
        sceneManager: this.sceneManager,
    });
    this.sceneManager.scene.add(this.threeGraph.object);
    this.forceGraph.update(this.props.vertices, this.props.edges);
    this.start();
  }

  componentDidUpdate() {
    this.forceGraph.update(this.props.vertices, this.props.edges);
  }

  componentWillUnmount() {
    this.stop();
  }

  start() {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.sceneManager.animate);
    }
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }

  render() {
    return <div id="graph" ref={ref => (this.mount = ref)} />
  }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Graph);
