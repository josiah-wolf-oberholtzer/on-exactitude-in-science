import { LOCATION_CHANGE, connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';
import { useRouteMatch } from 'react-router-dom';
import graphReducer from '../slices/graphSlice';

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  graph: graphReducer,
});

export default createRootReducer;
