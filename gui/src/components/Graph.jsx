import React from "react";
import ForceGraph from '../physics/ForceGraph';
// import ForceGraph from '../physics/ForceGraphProxy';
import GraphManager from '../graphics/GraphManager';
import SceneManager from '../graphics/SceneManager';
import { connect } from 'react-redux';
import { deselectEntity, selectEntity } from '../slices/graphSlice';
import { push } from 'connected-react-router';
import { freezeVertex, freezeEdge, queryObjectToString, queryStringToObject } from '../utils';

const mapStateToProps = state => {
  return {
    cameraNonce: state.camera.nonce,
    center: state.graph.center,
    edges: state.graph.edges,
    location: state.router.location,
    vertices: state.graph.vertices,
  } 
}

const mapDispatchToProps = dispatch => {
  return {
    push: (location, label, id) => {
      const parsedQuery = queryStringToObject(location.search);
      delete parsedQuery.page;
      dispatch(push(`/${label}/${id}` + queryObjectToString(parsedQuery)));
    },
    selectVertex: (vertex) => {
      dispatch(selectEntity({
        kind: "vertex",
        vertex: freezeVertex(vertex),
      }));
    },
    selectEdge: (edge, source, target) => {
      dispatch(selectEntity({
        kind: "edge",
        edge: freezeEdge(edge),
        source: freezeVertex(source),
        target: freezeVertex(target),
      }));
    },
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
    this.threeGraph.on("deselect", (vertex) => {
      this.props.deselectEntity();
    });
    this.threeGraph.on("doubleclick", (vertex) => {
      this.props.push(this.props.location, vertex.label, vertex.eid);
    });
    this.threeGraph.on("selectEdge", (payload) => {
      const {edge, source, target} = payload;
      this.props.selectEdge(edge, source, target);
    });
    this.threeGraph.on("selectVertex", (vertex) => {
      this.props.selectVertex(vertex);
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
