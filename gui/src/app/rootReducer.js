import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';
import graphReducer from '../slices/graphSlice';
import cameraReducer from '../slices/cameraSlice';

const createRootReducer = (history) => combineReducers({
  camera: cameraReducer,
  graph: graphReducer,
  router: connectRouter(history),
});

export default createRootReducer;
