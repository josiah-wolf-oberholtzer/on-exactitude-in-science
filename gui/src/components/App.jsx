import React from "react";
import { Graph } from "./Graph";
import MenuIcon from '@material-ui/icons/Menu';
import ShuffleRoundedIcon from '@material-ui/icons/ShuffleRounded';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';
import { 
  AppBar,
  Button,
  CssBaseline,
  IconButton,
  TextField,
  ThemeProvider, 
  Toolbar,
  Typography,
  createMuiTheme,
  makeStyles,
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: { flexGrow: 1 },
  menuButton: { marginRight: theme.spacing(2) },
  title: { flexGrow: 1 },
}));

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

const App = () => {
  const classes = useStyles();
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Graph name="3D" />
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            On Exactitude In Science
          </Typography>
          <Button
            className={classes.menuButton}
            color="inherit" 
            startIcon={<ShuffleRoundedIcon />}
          >
            Random
          </Button>
          <Button
            className={classes.menuButton}
            color="inherit" 
            startIcon={<SearchRoundedIcon />}
          >
            Search
          </Button>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  )
}

export { App };
