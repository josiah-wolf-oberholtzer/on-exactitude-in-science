import React from 'react';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import FilterListIcon from '@material-ui/icons/FilterList';
import { Badge, Chip, Drawer, List, Toolbar, makeStyles, } from '@material-ui/core';
import { connect } from 'react-redux';
import SidebarSection from './SidebarSection';
import { toggleSidebarSection } from '../slices/layoutSlice';

const drawerWidth = '320px';

const useStyles = makeStyles((theme) => ({
  drawer: {
    flexShrink: 0,
    width: drawerWidth,
  },
  drawerPaper: {
    backdropFilter: "blur(5px)",
    backgroundColor: '#00000080',
    width: drawerWidth,
  },
  drawerContainer: {
    overflow: 'auto',
  },
}));

const mapStateToProps = state => {
  return {
    edgesByRole: state.graph.edgesByRole,
    open: state.layout.sidebar.open,
    countriesOpen: state.layout.sidebar.countriesOpen,
    entitiesOpen: state.layout.sidebar.entitiesOpen,
    formatsOpen: state.layout.sidebar.formatsOpen,
    genresOpen: state.layout.sidebar.genresOpen,
    rolesOpen: state.layout.sidebar.rolesOpen,
    stylesOpen: state.layout.sidebar.stylesOpen,
    yearsOpen: state.layout.sidebar.yearsOpen,
    verticesByCountry: state.graph.verticesByCountry,
    verticesByFormat: state.graph.verticesByFormat,
    verticesByGenre: state.graph.verticesByGenre,
    verticesByLabel: state.graph.verticesByLabel,
    verticesByStyle: state.graph.verticesByStyle,
    verticesByYear: state.graph.verticesByYear,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    toggleCountriesSection: () => dispatch(toggleSidebarSection("countries")),
    toggleEntitiesSection: () => dispatch(toggleSidebarSection("entities")),
    toggleFormatsSection: () => dispatch(toggleSidebarSection("formats")),
    toggleGenresSection: () => dispatch(toggleSidebarSection("genres")),
    toggleRolesSection: () => dispatch(toggleSidebarSection("roles")),
    toggleStyleSection: () => dispatch(toggleSidebarSection("styles")),
    toggleYearsSection: () => dispatch(toggleSidebarSection("years")),
  }
}

const objectToChips = (object) => {
  return Object.entries(object).sort().map(entry => {
    const [label, ids] = entry;
    return (
      <Badge
        badgeContent={ids.length}
        key={label}
        max={9999}
      >
        <Chip
          deleteIcon={<FilterListIcon />}
          label={label}
          onClick={() => {}}
          onDelete={() => {}}
          variant="outlined"
        />
      </Badge>
    )
  })
}

const Sidebar = (props) => {
  const classes = useStyles();
  return (
    <Drawer
      anchor="left"
      className={classes.drawer}
      classes={{paper: classes.drawerPaper}}
      open={props.open}
      variant="persistent"
    >
      <Toolbar />
      <div className={classes.drawerContainer}>
        <List>
          <SidebarSection
            onClick={props.toggleEntitiesSection}
            open={props.entitiesOpen}
            title="Entities"
          >
            {objectToChips(props.verticesByLabel)}
          </SidebarSection>
          <SidebarSection
            onClick={props.toggleRolesSection}
            open={props.rolesOpen}
            title="Roles"
          >
            {objectToChips(props.edgesByRole)}
          </SidebarSection>
          <SidebarSection
            onClick={props.toggleYearsSection}
            open={props.yearsOpen}
            title="Years"
          >
            {objectToChips(props.verticesByYear)}
          </SidebarSection>
          <SidebarSection
            onClick={props.toggleFormatsSection}
            open={props.formatsOpen}
            title="Formats"
          >
            {objectToChips(props.verticesByFormat)}
          </SidebarSection>
          <SidebarSection
            onClick={props.toggleStyleSection}
            open={props.stylesOpen}
            title="Styles"
          >
            {objectToChips(props.verticesByStyle)}
          </SidebarSection>
          <SidebarSection
            onClick={props.toggleGenresSection}
            open={props.genresOpen}
            title="Genres"
          >
            {objectToChips(props.verticesByGenre)}
          </SidebarSection>
          <SidebarSection
            onClick={props.toggleCountriesSection}
            open={props.countriesOpen}
            title="Countries"
          >
            {objectToChips(props.verticesByCountry)}
          </SidebarSection>
        </List>
      </div>
    </Drawer>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
