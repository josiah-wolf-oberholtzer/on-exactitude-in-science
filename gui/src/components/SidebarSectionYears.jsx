import React from 'react';
import SidebarSection from './SidebarSection';
import { YEARS } from '../constants';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.yearsOpen,
    highlightedNames: state.highlighted.years,
    names: state.graph.verticesByYear,
    pinnedNames: state.pinned.years,
  }
}

const SidebarSectionYears = (props) => {
  return (
    <SidebarSection
      category={YEARS}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      pinnedNames={props.pinnedNames}
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionYears);
