import React from "react";
import ReactDOM from "react-dom";
import { Provider } from 'react-redux';

import './index.css';
import fnt16 from './Lato-Regular-16.fnt';
import fnt24 from './Lato-Regular-24.fnt';
import fnt32 from './Lato-Regular-32.fnt';
import fnt64 from './Lato-Regular-64.fnt';
import App from './app/App';
import store from './app/store'

ReactDOM.render(
  <Provider store={store}>
    <App />,
  </Provider>,
  document.getElementById("root")
);
