import GoogleAnalytics, { trackEvent, trackPageView } from '@redux-beacon/google-analytics';
import logger from '@redux-beacon/logger';
import { LOCATION_CHANGE, connectRouter, routerMiddleware } from 'connected-react-router';
import { combineReducers } from 'redux';
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { createBrowserHistory } from 'history';
import { createMiddleware } from 'redux-beacon';
import { persistStore, persistReducer } from 'redux-persist';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import cameraReducer from '../slices/cameraSlice';
import graphReducer from '../slices/graphSlice';
import layoutReducer from '../slices/layoutSlice';

const history = createBrowserHistory();

const rootReducer = combineReducers({
  camera: cameraReducer,
  graph: graphReducer,
  layout: layoutReducer,
  router: connectRouter(history),
});

const persistConfig = {
  key: 'root',
  whitelist: ['layout'],
  storage,
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

const gaMiddleware = createMiddleware(
  {
    [LOCATION_CHANGE]: trackPageView((action) => ({ 
      page: action.payload.location.pathname,
    })),
    'graph/selectEntity': trackEvent((action) => ({
      category: 'interaction', action: 'selected', label: action.payload.label, value: action.payload.eid,
    })),
    'graph/deselectEntity': trackEvent(() => ({
      category: 'interaction', action: 'deselected',
    })),
  },
  GoogleAnalytics(),
  { logger },
);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
    }
  }).concat(routerMiddleware(history)).concat(gaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

const persistor = persistStore(store)

export { history, persistor };

export default store;
