import React from 'react';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';
import ShuffleRoundedIcon from '@material-ui/icons/ShuffleRounded';
import { AppBar, Button, CssBaseline, Drawer, IconButton, InputAdornment, TextField, ThemeProvider, Toolbar, Typography, makeStyles, } from '@material-ui/core';
import { ConnectedRouter, push } from 'connected-react-router'
import { EntityDial, EntityCaption, EntityGraph, EntitySearch, Fetcher, Loading } from '../components';
import { Switch, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { history } from './store';
import { theme } from './theme';

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

const App = (props) => {
  const classes = useStyles();
  return (
    <ConnectedRouter history={history}>
      <Switch>
        <Route exact path="/:label(artist|company|master|release|track)/:id" component={Fetcher} />
        <Route exact path="/random" component={Fetcher} />
        <Route exact path="/" component={Fetcher} />
        <Route path="*" component={Fetcher} />
      </Switch>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EntityGraph />
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
        <EntityDial />
        <EntityCaption />
        <Loading />
      </ThemeProvider>
    </ConnectedRouter>
  )
};

export default connect(null, mapDispatchToProps)(App);
