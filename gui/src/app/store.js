import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import { gaMiddleware } from './analytics';
import createRootReducer from './rootReducer';

const history = createBrowserHistory(),
  store = configureStore({
    reducer: createRootReducer(history),
    middleware: getDefaultMiddleware()
      .concat(routerMiddleware(history))
      .concat(gaMiddleware),
    devTools: process.env.NODE_ENV !== 'production',
  });

export { history };

export default store;
