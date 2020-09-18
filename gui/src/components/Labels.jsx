import React from 'react';
import SidebarSection from './SidebarSection';
import { LABELS } from '../constants';
import { connect } from 'react-redux';
import { getVerticesByLabel } from '../selectors/graphSelector';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.labelsOpen,
    highlightedNames: state.highlighted.labels,
    names: getVerticesByLabel(state),
    filteredNames: state.filtered.labels,
  }
}

const Labels = (props) => {
  return (
    <SidebarSection
      category={LABELS}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      filteredNames={props.filteredNames}
      title="Labels"
    />
  )
}

export default connect(mapStateToProps)(Labels);
