import React from 'react';
import { CssBaseline, ThemeProvider, makeStyles, } from '@material-ui/core';
import { ConnectedRouter } from 'connected-react-router'
import { history } from './store';
import { theme } from './theme';
import EntityCaption from '../components/EntityCaption';
import EntityDial from '../components/EntityDial';
import Graph from '../components/Graph';
import Header from '../components/Header';
import Loading from '../components/Loading';
import Routing from '../components/Routing';
import Sidebar from '../components/Sidebar';

const useStyles = makeStyles((theme) => ({
  root: { display: 'flex' },
}));

const App = () => {
  const classes = useStyles();
  return (
    <ConnectedRouter history={history} noInitialPop>
      <Routing />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={classes.root}>
          <Graph />
          <EntityDial />
          <EntityCaption />
          <Header />
          <Sidebar />
          <Loading />
        </div>
      </ThemeProvider>
    </ConnectedRouter>
  )
};

export default App;
