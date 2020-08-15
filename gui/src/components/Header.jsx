import React from 'react';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';
import { AppBar, IconButton, Toolbar, Typography, makeStyles, } from '@material-ui/core';
import { connect } from 'react-redux';
import { push } from 'connected-react-router'
import EntitySearch from '../components/EntitySearch';
import { toggleSidebar } from '../slices/layoutSlice';

const useStyles = makeStyles((theme) => ({
  appBar: {
    backdropFilter: "blur(5px)",
    backgroundColor: '#00000080',
    borderBottomColor: '#ffffff20',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

const mapDispatchToProps = dispatch => {
  return {
    push: path => dispatch(push(path)),
    toggleSidebar: () => dispatch(toggleSidebar()),
  }
}

const mapStateToProps = state => { return {} }

const Header = (props) => {
  const classes = useStyles();
  return (
    <AppBar
      position="fixed"
      className={classes.appBar}
    >
      <Toolbar>
        <IconButton 
          aria-label="menu"
          className={classes.menuButton}
          color="inherit"
          edge="start" 
          onClick={props.toggleSidebar}
        >
          <MenuRoundedIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title} onClick={() => props.push("/")}>
          On Exactitude In Science
        </Typography>
        <EntitySearch />
      </Toolbar>
    </AppBar>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
