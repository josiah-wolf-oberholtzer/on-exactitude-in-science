import React from "react";
import { Box, Grid, Typography, makeStyles } from '@material-ui/core';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import { connect } from 'react-redux';

const useStyles = makeStyles((theme) => ({
  caption: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(10),
  },
}));

const mapStateToProps = state => {
  return {
    selected: state.graph.selected,
  }
}

const roleCaptions = {
  "credited_with": "credited with",
  "member_of": "is a",
  "subsidiary_of": "is a",
  "subrelease_of": "is a",
}

const EntityCaption = (props) => {
  const classes = useStyles();
  const { selected } = props;
  if (selected === null) {
    return null
  }
  switch (selected.kind) {
    case "vertex":
      return (
        <div className={classes.caption}>
          <Grid container>
            <Grid item>
              <Typography variant="overline" display="block">{selected.label}</Typography>
              <Typography variant="h5" display="block">{selected.name}</Typography>
            </Grid>
          </Grid>
        </div>
      )
    case "edge":
      return (
        <div className={classes.caption}>
          <Grid container>
            <Grid item>
              <Typography variant="overline" display="block">{selected.sourceLabel}</Typography>
              <Typography variant="h5" display="block">{selected.sourceName}</Typography>
            </Grid>
            <Grid item>
              <Box px={1}>
                <Typography variant="overline" display="block">&nbsp;</Typography>
                { 
                  selected.label === "alias_of"
                  ? <SwapHorizIcon />
                  : <ArrowForwardIosIcon />
                }
              </Box>
            </Grid>
            <Grid item>
              { (roleCaptions[selected.label] !== undefined)
                ? <Typography variant="overline" display="block">{roleCaptions[selected.label]}</Typography>
                : <Typography variant="overline" display="block">&nbsp;</Typography>
              }
              <Typography variant="h5" display="block">{selected.role}</Typography>
            </Grid>
            <Grid item>
              <Box px={1}>
                <Typography variant="overline" display="block">&nbsp;</Typography>
                { 
                  selected.label === "alias_of"
                  ? <SwapHorizIcon />
                  : <ArrowForwardIosIcon />
                }
              </Box>
            </Grid>
            <Grid item>
              <Typography variant="overline" display="block">{selected.targetLabel}</Typography>
              <Typography variant="h5" display="block">{selected.targetName}</Typography>
            </Grid>
          </Grid>
        </div>
      );
    default:
      return null;
  }
}

export default connect(mapStateToProps, null)(EntityCaption);
