import React from 'react';
import SidebarSection from './SidebarSection';
import { YEARS } from '../constants';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.yearsOpen,
    highlightedNames: state.highlighted.years,
    names: state.graph.verticesByYear,
    filteredNames: state.filtered.years,
  }
}

const SidebarSectionYears = (props) => {
  return (
    <SidebarSection
      category={YEARS}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      filteredNames={props.filteredNames}
      title="Years"
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionYears);
