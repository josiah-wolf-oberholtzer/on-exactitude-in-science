import { createMuiTheme } from '@material-ui/core';

const colors = {
  main: '#223344',
  light: '#223344',
  dark: '#223344',
  contrastText: '#fff',
};

export const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: { ...colors },
    secondary: { ...colors },
  },
});
