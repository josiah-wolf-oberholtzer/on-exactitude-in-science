import React from "react";
import { Link } from 'react-router-dom';
import { 
  AppBar,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Toolbar,
  Typography,
  makeStyles,
} from '@material-ui/core';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';
import ShuffleRoundedIcon from '@material-ui/icons/ShuffleRounded';
import { connect } from 'react-redux';
import { push } from 'connected-react-router'
import EntitySearch from './EntitySearch';

const useStyles = makeStyles((theme) => ({
  root: { flexGrow: 1 },
  menuButton: { marginRight: theme.spacing(2) },
  title: { flexGrow: 1 },
}));

const mapDispatchToProps = dispatch => {
  return {
    push: path => dispatch(push(path)),
  }
}

const TopNav = (props) => {
  const classes = useStyles();
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
          <MenuRoundedIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title} onClick={() => props.push("/")}>
          On Exactitude In Science
        </Typography>
        <Button
          className={classes.menuButton}
          onClick={() => props.push("/random")}
          startIcon={<ShuffleRoundedIcon />}
        >
          Random
        </Button>
        <EntitySearch />
      </Toolbar>
    </AppBar>
  );
}

export default connect(null, mapDispatchToProps)(TopNav);
