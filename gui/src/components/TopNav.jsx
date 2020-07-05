import React from "react";
import { Link } from 'react-router-dom';
import { 
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  makeStyles,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { RandomButton } from './RandomButton';
import { SearchButton } from './SearchButton';

const useStyles = makeStyles((theme) => ({
  root: { flexGrow: 1 },
  menuButton: { marginRight: theme.spacing(2) },
  title: { flexGrow: 1 },
}));

const TopNav = () => {
  const classes = useStyles();
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          On Exactitude In Science
        </Typography>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/artist/1">Artist</Link></li>
          <li><Link to="/company/1">Company</Link></li>
          <li><Link to="/404">404</Link></li>
        </ul>
        <RandomButton />
        <SearchButton />
      </Toolbar>
    </AppBar>
  );
}

export default TopNav;
