import React from "react";
import { connect } from "react-redux";
import { fetchByEntity, fetchRandom } from "../slices/graphSlice";

const mapDispatchToProps = dispatch => {
  return {
    fetchByEntity: (label, id) => dispatch(fetchByEntity({label, id})),
    fetchRandom: () => dispatch(fetchRandom()),
  }
}

class Fetcher extends React.Component {
  match() {
    switch (this.props.match.path) {
      case "/":
        document.title = "Home | On Exactitude In Science"
        break;
      case "/random":
        document.title = "Random | On Exactitude In Science"
        this.props.fetchRandom(label, id);
        break;
      case "/:label(artist|company|master|release|track)/:id":
        const { label, id } = this.props.match.params;
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
