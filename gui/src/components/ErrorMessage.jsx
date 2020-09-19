import React from 'react';
import CloseIcon from '@material-ui/icons/Close';
import Box from '@material-ui/core/Box';
import Fade from '@material-ui/core/Fade';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  errorMessage: {
    zIndex: theme.zIndex.drawer,
  },
}));

const mapStateToProps = state => {
  return {
    error: state.graph.error,
  }
}

const ErrorMessage = (props) => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(props.error !== null);
  const handleClose = () => { setOpen(false); }
  return (
    <Snackbar
      TransitionComponent={Fade}
      action={
        <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      }
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      autoHideDuration={10000}
      className={classes.errorMessage}
      message={`Errored: ${props.error}`}
      onClose={handleClose}
      open={open}
    />
  )
};

export default connect(mapStateToProps)(ErrorMessage);
