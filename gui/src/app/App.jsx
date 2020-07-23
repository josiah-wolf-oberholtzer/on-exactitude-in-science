import React from 'react';
import { ConnectedRouter } from 'connected-react-router'
import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { Dial, EntityCaption, Fetcher, Graph, Loading, Nav } from '../components';
import { Switch, Route } from 'react-router-dom';
import { history } from './store';
import { theme } from './theme';

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
        <EntityCaption />
        <Loading />
      </ThemeProvider>
    </ConnectedRouter>
  )
};

export default App;
