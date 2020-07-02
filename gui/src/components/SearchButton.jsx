import React from "react";
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';
import { 
  Button,
  makeStyles,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: { flexGrow: 1 },
  menuButton: { marginRight: theme.spacing(2) },
}));

const SearchButton = () => {
  const classes = useStyles();
  return (
    <Button
      className={classes.menuButton}
      color="inherit" 
      startIcon={<SearchRoundedIcon />}
    >
      Search
    </Button>
  );
}

export { SearchButton };
