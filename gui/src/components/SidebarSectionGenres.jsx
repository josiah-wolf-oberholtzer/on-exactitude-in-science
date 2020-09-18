import React from 'react';
import SidebarSection from './SidebarSection';
import { GENRES } from '../constants';
import { connect } from 'react-redux';
import { getVerticesByGenre } from '../selectors/graphSelector';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.genresOpen,
    highlightedNames: state.highlighted.genres,
    names: getVerticesByGenre(state),
    filteredNames: state.filtered.genres,
  }
}

const SidebarSectionGenres = (props) => {
  return (
    <SidebarSection
      category={GENRES}
      highlightedNames={props.highlighedNames}
      names={props.names}
      open={props.open}
      filteredNames={props.filteredNames}
      title="Genres"
    />
  )
}

export default connect(mapStateToProps)(SidebarSectionGenres);
