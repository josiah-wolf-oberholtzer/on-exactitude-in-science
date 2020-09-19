import React from 'react';
import { Button, CssBaseline, ThemeProvider, makeStyles, } from '@material-ui/core';
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
import ErrorMessage from '../components/ErrorMessage';
import { SnackbarProvider } from 'notistack';

const useStyles = makeStyles((theme) => ({
  root: { display: 'flex' },
}));

const notistackRef = React.createRef();

const onClickDismiss = key => () => { notistackRef.current.closeSnackbar(key); }

const App = () => {
  const classes = useStyles();
  return (
    <ConnectedRouter history={history} noInitialPop>
      <Routing />
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          action={(key) => ( 
            <Button onClick={onClickDismiss(key)}>
              Dismiss
            </Button>
          )}
          maxSnack={3}
          ref={notistackRef}
        >
          <CssBaseline />
          <div className={classes.root}>
            <Graph />
            <EntityDial />
            <EntityCaption />
            <Header />
            <Sidebar />
            <Loading />
            <ErrorMessage />
          </div>
        </SnackbarProvider>
      </ThemeProvider>
    </ConnectedRouter>
  )
};

export default App;
