import React from 'react';
import SidebarSection from './SidebarSection';
import { FORMATS } from '../constants';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.formatsOpen,
    highlightedNames: state.highlighted.formats,
    names: state.graph.verticesByFormat,
    pinnedNames: state.pinned.formats,
  }
}

const SidebarSectionFormats = (props) => {
  return (
    <SidebarSection
      category={FORMATS}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      pinnedNames={props.pinnedNames}
      title="Formats"
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionFormats);
