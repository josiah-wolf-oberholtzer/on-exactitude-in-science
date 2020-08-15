import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import cameraReducer from '../slices/cameraSlice';
import graphReducer from '../slices/graphSlice';
import layoutReducer from '../slices/layoutSlice';

const createRootReducer = (history) => combineReducers({
  camera: cameraReducer,
  graph: graphReducer,
  layout: layoutReducer,
  router: connectRouter(history),
});

export default createRootReducer;
