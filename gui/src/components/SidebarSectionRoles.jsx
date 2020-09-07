import React from 'react';
import SidebarSection from './SidebarSection';
import { ROLES } from '../constants';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.rolesOpen,
    highlightedNames: state.highlighted.roles,
    names: state.graph.edgesByRole,
    pinnedNames: state.pinned.roles,
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
      pinnedNames={props.pinnedNames}
      suggestedNames={props.suggestedNames}
      title="Roles"
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionRoles);
