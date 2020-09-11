import React from 'react';
import AlbumIcon from '@material-ui/icons/Album';
import AssessmentIcon from '@material-ui/icons/Assessment';
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { refocusCamera } from '../slices/cameraSlice';

const useStyles = makeStyles((theme) => ({
  speedDial: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  speedDialAction: {},
}));

const mapStateToProps = state => {
  return { 
    selected: state.graph.selected,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    refocusCamera: () => dispatch(refocusCamera()),
  }
}

const buildDiscogsUrl = (label, eid) => {
  const discogsPrefix = "https://discogs.com";
  if (label === "track") {
    const releaseEid = eid.split("-")[0];
    return `${discogsPrefix}/release/${releaseEid}`;
  } else if (label === "company") {
    return `${discogsPrefix}/label/${eid}`;
  } else {
    return `${discogsPrefix}/${label}/${eid}`;
  }
}

const EntityDial = (props) => {
  const classes = useStyles();
  const { selected } = props;
  const [open, setOpen] = React.useState(false);
  const handleClose = () => { setOpen(false); };
  const handleOpen = () => { setOpen(true); };

  return (
    <SpeedDial
      ariaLabel="Speed Dial"
      className={classes.speedDial}
      icon={<SpeedDialIcon />}
      direction="up"
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      { (selected !== null && selected.kind === "vertex") &&
        <SpeedDialAction
          className={classes.speedDialAction}
          key="discogs"
          icon={<AlbumIcon />}
          onClick={() => {
            window.open(buildDiscogsUrl(selected.label, selected.eid), "_blank");
            handleClose();
          }}
          tooltipOpen
          tooltipPlacement="left"
          tooltipTitle="Discogs"
        />
      }
      <SpeedDialAction
        className={classes.speedDialAction}
        key="focus"
        icon={<CenterFocusStrongIcon />}
        onClick={() => {
          props.refocusCamera();
          handleClose();
        }}
        tooltipOpen
        tooltipPlacement="left"
        tooltipTitle="Refocus Camera"
      />
    </SpeedDial>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityDial);
