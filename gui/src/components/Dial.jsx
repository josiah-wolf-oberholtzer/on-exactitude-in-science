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
        tooltipTitle="Focus"
      />
      <SpeedDialAction
        className={classes.speedDialAction}
        key="connections"
        icon={<AssessmentIcon />}
        onClick={handleClose}
        tooltipOpen
        tooltipTitle="Connections"
      />
      <SpeedDialAction
        className={classes.speedDialAction}
        key="discogs"
        icon={<AlbumIcon />}
        onClick={handleClose}
        tooltipOpen
        tooltipTitle="Discogs"
      />
    </SpeedDial>
  )
}

export default connect(
  null,
  mapDispatchToProps,
)(Dial);

