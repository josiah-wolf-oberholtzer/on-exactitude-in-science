import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { setLoading } from '../slices/loadingSlice';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));

const mapStateToProps = state => ({ loading: state.graph.loading })

const mapDispatchToProps = dispatch => ({
  setLoading: loading => dispatch(setLoading(loading))
})

const Loading = (props) => {
  const classes = useStyles();
  return (
    <div>
      <Backdrop
        className={classes.backdrop}
        open={props.loading}
        onClick={() => props.setLoading(false)}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Loading)
