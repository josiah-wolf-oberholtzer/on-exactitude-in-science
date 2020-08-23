import React from 'react';
import SidebarSection from './SidebarSection';
import { LABELS } from '../constants';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.labelsOpen,
    highlightedNames: state.highlighted.labels,
    names: state.graph.verticesByLabel,
    pinnedNames: state.pinned.labels,
  }
}

const SidebarSectionLabels = (props) => {
  return (
    <SidebarSection
      category={LABELS}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      pinnedNames={props.pinnedNames}
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionLabels);
