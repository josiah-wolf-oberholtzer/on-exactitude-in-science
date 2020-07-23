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
    left: theme.spacing(2),
  },
  speedDialAction: {},
}));

const mapStateToProps = state => {
  const discogsPrefix = "https://discogs.com",
    eid = state.graph.selected.eid,
    name = state.graph.selected.name,
    label = state.graph.selected.label;
  let discogsUrl = null;
  if (label !== null) {
    if (label === "track") {
      const releaseEid = eid.split("-")[0];
      discogsUrl = `${discogsPrefix}/release/${releaseEid}`;
    } else if (label === "company") {
      discogsUrl = `${discogsPrefix}/label/${eid}`;
    } else {
      discogsUrl = `${discogsPrefix}/${label}/${eid}`;
    }
  }
  return { discogsUrl, eid, label, name }
}

const mapDispatchToProps = dispatch => ({
  refocusCamera: () => dispatch(refocusCamera()),
});

const Dial = (props) => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

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
        tooltipOpen
        tooltipPlacement="right"
        tooltipTitle="Focus"
      />
      { props.label !== null &&
        <SpeedDialAction
          className={classes.speedDialAction}
          key="connections"
          icon={<AssessmentIcon />}
          onClick={handleClose}
          tooltipOpen
          tooltipPlacement="right"
          tooltipTitle="Connections"
        />
      }
      { props.label !== null &&
        <SpeedDialAction
          className={classes.speedDialAction}
          key="discogs"
          icon={<AlbumIcon />}
          onClick={() => {
            window.open(props.discogsUrl, "_blank");
            handleClose();
          }}
          tooltipOpen
          tooltipPlacement="right"
          tooltipTitle="Discogs"
        />
      }
    </SpeedDial>
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dial);

