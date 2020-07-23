import React from "react";
import { 
  Typography,
  makeStyles,
} from '@material-ui/core';
import { connect } from 'react-redux';

const useStyles = makeStyles((theme) => ({
  caption: {
    position: 'absolute',
    bottom: theme.spacing(2),
    left: theme.spacing(10),
  },
}));

const mapStateToProps = state => {
  return {
    label: state.graph.selected.label,
    name: state.graph.selected.name,
  }
}

const EntityCaption = (props) => {
  const classes = useStyles();
  if (props.name) {
    return (
      <div className={classes.caption}>
        <Typography variant="overline" display="block">
        {props.label}
        </Typography>
        <Typography variant="h5" display="block">
        {props.name}
        </Typography>
      </div>
    )
  }
  return null;
}

export default connect(mapStateToProps, null)(EntityCaption);
