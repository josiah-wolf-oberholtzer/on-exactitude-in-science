import React from "react";
import { withRouter } from "react-router";

class DummyGraph extends React.Component {
  componentDidMount() {
    console.log("componentDidMount", this);
  }
  componentDidUpdate() {
    console.log("componentDidUpdate", this);
  }
  componentWillUnmount() {
    console.log("componentWillUnmount", this);
  }
  render() {
    console.log("render", this);
    return (
      <div ref={ref => (this.mount = ref)}>
        Hello!
      </div>
    );
  }
}

const DummyGraphWithRouter = withRouter(DummyGraph);

export { DummyGraph, DummyGraphWithRouter };
