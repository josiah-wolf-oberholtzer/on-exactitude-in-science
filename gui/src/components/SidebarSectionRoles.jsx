import React from 'react';
import SidebarSection from './SidebarSection';
import { ROLES } from '../constants';
import { connect } from 'react-redux';
import { getEdgesByRole } from '../selectors/graphSelector';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.rolesOpen,
    highlightedNames: state.highlighted.roles,
    names: getEdgesByRole(state),
    filteredNames: state.filtered.roles,
    suggestedNames: state.graph.centerRoles,
  }
}

const SidebarSectionRoles = (props) => {
  return (
    <SidebarSection
      category={ROLES}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      filteredNames={props.filteredNames}
      suggestedNames={props.suggestedNames}
      title="Roles"
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionRoles);
