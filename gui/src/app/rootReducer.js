import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import cameraReducer from '../slices/cameraSlice';
import graphReducer from '../slices/graphSlice';

const createRootReducer = (history) => combineReducers({
  camera: cameraReducer,
  graph: graphReducer,
  router: connectRouter(history),
});

export default createRootReducer;
