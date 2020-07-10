import React from 'react';
import { ConnectedRouter } from 'connected-react-router'
import { Switch, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { Dial, Fetcher, Graph, Loading, Nav } from '../components';
import { theme } from './theme';
import { history } from './store';
import { useRouteMatch } from "react-router-dom";

const App = () => {
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
        <Graph />
        <Nav />
        <Dial />
        <Loading />
      </ThemeProvider>
    </ConnectedRouter>
  )
};

export default App;
