import React from "react";
import { connect } from "react-redux";
import { fetchByEntity } from "../slices/graphSlice";

const mapDispatchToProps = dispatch => {
  return {
    fetchByEntity: (label, id) => dispatch(fetchByEntity({label, id}))
  }
}

class Fetcher extends React.Component {
  componentDidMount() {
    const { label, id } = this.props.match.params;
    this.props.fetchByEntity(label, id);
  }

  componentDidUpdate() {
    const { label, id } = this.props.match.params;
    this.props.fetchByEntity(label, id);
  }

  render() {
    return null;
  }
}

export default connect(null, mapDispatchToProps)(Fetcher);
