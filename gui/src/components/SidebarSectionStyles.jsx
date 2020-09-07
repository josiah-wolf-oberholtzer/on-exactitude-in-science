import React from 'react';
import SidebarSection from './SidebarSection';
import { STYLES } from '../constants';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.stylesOpen,
    highlightedNames: state.highlighted.styles,
    names: state.graph.verticesByStyle,
    filteredNames: state.filtered.styles,
  }
}

const SidebarSectionStyles = (props) => {
  return (
    <SidebarSection
      category={STYLES}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      filteredNames={props.filteredNames}
      title="Styles"
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionStyles);
