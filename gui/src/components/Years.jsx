import React from 'react';
import SidebarSection from './SidebarSection';
import { YEARS } from '../constants';
import { connect } from 'react-redux';
import { getVerticesByYear } from '../selectors/graphSelector';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.yearsOpen,
    highlightedNames: state.highlighted.years,
    names: getVerticesByYear(state),
    filteredNames: state.filtered.years,
  }
}

const Years = (props) => {
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

export default connect(mapStateToProps)(Years);
