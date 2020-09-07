import React from 'react';
import { Drawer, List, Toolbar, makeStyles, } from '@material-ui/core';
import { connect } from 'react-redux';
import SidebarSectionCountries from './SidebarSectionCountries';
import SidebarSectionEdgeLimits from './SidebarSectionEdgeLimits';
import SidebarSectionFormats from './SidebarSectionFormats';
import SidebarSectionGenres from './SidebarSectionGenres';
import SidebarSectionLabels from './SidebarSectionLabels';
import SidebarSectionMainReleases from './SidebarSectionMainReleases';
import SidebarSectionRoles from './SidebarSectionRoles';
import SidebarSectionStyles from './SidebarSectionStyles';
import SidebarSectionYears from './SidebarSectionYears';

const drawerWidth = '420px';

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
    open: state.layout.sidebar.open,
  }
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
          <SidebarSectionLabels />
          <SidebarSectionRoles />
          <SidebarSectionYears />
          <SidebarSectionFormats />
          <SidebarSectionStyles />
          <SidebarSectionGenres />
          <SidebarSectionCountries />
          <SidebarSectionEdgeLimits />
          { /* <SidebarSectionMainReleases /> */ }
        </List>
      </div>
    </Drawer>
  )
}

export default connect(mapStateToProps)(Sidebar);
