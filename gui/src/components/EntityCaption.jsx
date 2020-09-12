import React from "react";
import { Box, Grid, Link, Typography, makeStyles } from '@material-ui/core';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import { connect } from 'react-redux';
import { buildDiscogsURL } from '../utils';

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
      const vertexHREF = buildDiscogsURL(selected.label, selected.eid);
      return (
        <div className={classes.caption}>
          <Grid container>
            <Grid item>
              <Typography variant="overline" display="block">{selected.label}</Typography>
              <Typography variant="h5" display="block">
                <Link
                  href={vertexHREF}
                  rel="noopener"
                  target="_blank"
                >
                  {selected.name}
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </div>
      )
    case "edge":
      const sourceHREF = buildDiscogsURL(selected.sourceLabel, selected.sourceEID);
      const targetHREF = buildDiscogsURL(selected.targetLabel, selected.targetEID);
      return (
        <div className={classes.caption}>
          <Grid container>
            <Grid item>
              <Typography variant="overline" display="block">{selected.sourceLabel}</Typography>
              <Typography variant="h5" display="block">
                <Link
                  href={sourceHREF}
                  rel="noopener"
                  target="_blank"
                >
                  {selected.sourceName}
                </Link>
              </Typography>
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
              <Typography variant="h5" display="block">
                <Link
                  href={targetHREF}
                  rel="noopener"
                  target="_blank"
                >
                  {selected.targetName}
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </div>
      );
    default:
      return null;
  }
}

export default connect(mapStateToProps, null)(EntityCaption);
