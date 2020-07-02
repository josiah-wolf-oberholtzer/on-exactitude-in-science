import React from "react";
import { Graph } from "./Graph";
import { 
  CssBaseline,
  ThemeProvider, 
  createMuiTheme,
} from '@material-ui/core';
import { TopNav } from './TopNav';

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Graph name="3D" />
      <TopNav />
    </ThemeProvider>
  )
}

export { App };
