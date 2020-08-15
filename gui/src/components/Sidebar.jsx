import React from 'react';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import FilterListIcon from '@material-ui/icons/FilterList';
import { Badge, Chip, Drawer, List, Toolbar, makeStyles, } from '@material-ui/core';
import { connect } from 'react-redux';
import SidebarSection from './SidebarSection';

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
    open: state.layout.sidebarOpen,
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
          <SidebarSection title="Entities">
            {objectToChips(props.verticesByLabel)}
          </SidebarSection>
          <SidebarSection title="Roles">
            {objectToChips(props.edgesByRole)}
          </SidebarSection>
          <SidebarSection title="Countries">
            {objectToChips(props.verticesByCountry)}
          </SidebarSection>
          <SidebarSection title="Formats">
            {objectToChips(props.verticesByFormat)}
          </SidebarSection>
          <SidebarSection title="Genres">
            {objectToChips(props.verticesByGenre)}
          </SidebarSection>
          <SidebarSection title="Styles">
            {objectToChips(props.verticesByStyle)}
          </SidebarSection>
          <SidebarSection title="Years">
            {objectToChips(props.verticesByYear)}
          </SidebarSection>
        </List>
      </div>
    </Drawer>
  )
}

export default connect(mapStateToProps)(Sidebar);
