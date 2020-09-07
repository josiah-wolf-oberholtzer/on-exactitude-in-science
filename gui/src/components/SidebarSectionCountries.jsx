import React from 'react';
import SidebarSection from './SidebarSection';
import { COUNTRIES } from '../constants';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.countriesOpen,
    highlightedNames: state.highlighted.countries,
    names: state.graph.verticesByCountry,
    filteredNames: state.filtered.countries,
  }
}

const SidebarSectionCountries = (props) => {
  return (
    <SidebarSection
      category={COUNTRIES}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      filteredNames={props.filteredNames}
      title="Countries"
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionCountries);
