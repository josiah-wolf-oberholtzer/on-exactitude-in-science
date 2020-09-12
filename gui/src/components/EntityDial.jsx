import React from 'react';
import AlbumIcon from '@material-ui/icons/Album';
import AssessmentIcon from '@material-ui/icons/Assessment';
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { refocusCamera } from '../slices/cameraSlice';
import { buildDiscogsURL } from '../utils';

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

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen(); 
    }
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
      <SpeedDialAction
        className={classes.speedDialAction}
        key="focus"
        icon={<CenterFocusStrongIcon />}
        onClick={() => {
          props.refocusCamera();
          handleClose();
        }}
        style={{ whiteSpace: "nowrap" }}
        tooltipOpen
        tooltipPlacement="left"
        tooltipTitle="Refocus Camera"
      />
      <SpeedDialAction
        className={classes.speedDialAction}
        key="fullscreen"
        icon={ document.fullscreenElement ? <FullscreenExitIcon /> : <FullscreenIcon /> }
        onClick={() => {
          toggleFullscreen();
          handleClose();
        }}
        style={{ whiteSpace: "nowrap" }}
        tooltipOpen
        tooltipPlacement="left"
        tooltipTitle={ document.fullscreenElement ? "Exit Fullscreen" : "Enter Fullscreen" }
      />
      { (selected !== null && selected.kind === "vertex") &&
        <SpeedDialAction
          className={classes.speedDialAction}
          key="discogs"
          icon={<AlbumIcon />}
          onClick={() => {
            window.open(buildDiscogsURL(selected.label, selected.eid), "_blank");
            handleClose();
          }}
          style={{ whiteSpace: "nowrap" }}
          tooltipOpen
          tooltipPlacement="left"
          tooltipTitle="See on Discogs"
        />
      }
    </SpeedDial>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(EntityDial);
