import React from "react";
import { connect } from "react-redux";
import { fetchByEntity, fetchRandom } from "../slices/graphSlice";

const mapDispatchToProps = dispatch => {
  return {
    fetchByEntity: (label, id) => dispatch(fetchByEntity({label, id})),
    fetchRandom: (label) => dispatch(fetchRandom({label})),
  }
}

class Fetcher extends React.Component {
  match() {
    const { label, id } = this.props.match.params;
    switch (this.props.match.path) {
      case "/":
        document.title = "Home | On Exactitude In Science"
        break;
      case "/random/:label(artist|company|master|release|track)":
        document.title = "Random | On Exactitude In Science"
        this.props.fetchRandom(label);
        break;
      case "/random":
        document.title = "Random | On Exactitude In Science"
        this.props.fetchRandom();
        break;
      case "/:label(artist|company|master|release|track)/:id":
        this.props.fetchByEntity(label, id);
        break;
      default:
        document.title = "404 | On Exactitude In Science"
        break;
    }
  }

  componentDidMount() { this.match(); }

  componentDidUpdate() { this.match(); }

  render() {
    return null;
  }
}

export default connect(null, mapDispatchToProps)(Fetcher);
