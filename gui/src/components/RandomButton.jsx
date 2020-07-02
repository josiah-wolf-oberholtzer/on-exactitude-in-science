import React from "react";
import ShuffleRoundedIcon from '@material-ui/icons/ShuffleRounded';
import { 
  Button,
  makeStyles,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: { flexGrow: 1 },
  menuButton: { marginRight: theme.spacing(2) },
}));

const RandomButton = () => {
  const classes = useStyles();
  return (
    <Button
      className={classes.menuButton}
      color="inherit" 
      startIcon={<ShuffleRoundedIcon />}
    >
      Random
    </Button>
  );
}

export { RandomButton };
