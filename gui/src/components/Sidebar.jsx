import React from 'react';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import FilterListIcon from '@material-ui/icons/FilterList';
import { Badge, Chip, Drawer, List, Toolbar, makeStyles, } from '@material-ui/core';
import { connect } from 'react-redux';
import SidebarSection from './SidebarSection';
import { toggleSidebarSection } from '../slices/layoutSlice';
import { COUNTRIES, FORMATS, GENRES, LABELS, ROLES, STYLES, YEARS } from '../constants';

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
    labelsOpen: state.layout.sidebar.labelsOpen,
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
            category={LABELS}
            highlightedNames={[]}
            names={props.verticesByLabel}
            open={props.labelsOpen}
            pinnedNames={[]}
          />
          <SidebarSection
            category={ROLES}
            highlightedNames={[]}
            names={props.edgesByRole}
            open={props.rolesOpen}
            pinnedNames={[]}
          />
          <SidebarSection
            category={YEARS}
            highlightedNames={[]}
            names={props.verticesByYear}
            open={props.yearsOpen}
            pinnedNames={[]}
          />
          <SidebarSection
            category={FORMATS}
            highlightedNames={[]}
            names={props.verticesByFormat}
            open={props.formatsOpen}
            pinnedNames={[]}
          />
          <SidebarSection
            category={STYLES}
            highlightedNames={[]}
            names={props.verticesByStyle}
            open={props.stylesOpen}
            pinnedNames={[]}
          />
          <SidebarSection
            category={GENRES}
            highlightedNames={[]}
            names={props.verticesByGenre}
            open={props.genresOpen}
            pinnedNames={[]}
          />
          <SidebarSection
            category={COUNTRIES}
            highlightedNames={[]}
            names={props.verticesByCountry}
            open={props.countriesOpen}
            pinnedNames={[]}
          />
        </List>
      </div>
    </Drawer>
  )
}

export default connect(mapStateToProps)(Sidebar);
