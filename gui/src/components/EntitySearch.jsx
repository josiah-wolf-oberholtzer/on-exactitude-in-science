import * as graphAPI from '../api/graphAPI';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import React from "react";
import throttle from 'lodash/throttle';
import { FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography, makeStyles } from '@material-ui/core';
import { connect } from 'react-redux';
import { push } from 'connected-react-router'

const useStyles = makeStyles((theme) => ({
  autocomplete: { marginRight: theme.spacing(2) },
}));

const mapDispatchToProps = dispatch => {
  return {
    push: (label, id) => dispatch(push(`/${label}/${id}`)),
  }
}

const EntitySearch = (props) => {
  const classes = useStyles();
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);
  const [entityType, setEntityType] = React.useState('any');
  const [nonce, setNonce] = React.useState(Date.now());

  const fetch = throttle(() => {
    const thisNonce = Date.now();
    setNonce(thisNonce);
    graphAPI.search(inputValue, entityType).then((response) => {
      let newOptions = [];
      if (response.data.result) {
        newOptions = [...newOptions, ...response.data.result];
      }
      if (thisNonce >= nonce) {
        setOptions(newOptions);
      }
    })
  }, 200)

  React.useEffect(() => {if (inputValue.length >= 3) { fetch() }}, [value, inputValue]);

  return (
    <React.Fragment>
      <Autocomplete
        blurOnSelect
        className={classes.autocomplete}
        clearOnBlur
        clearOnEscape
        selectOnFocus
        filterSelectedOptions
        filterOptions={(x) => x}
        getOptionLabel={(option) => option.name}
        getOptionSelected={(option, value) => option.id === value.id}
        noOptionsText='Start searching... e.g. "bjork"'
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={(event, newValue) => {
          // setOptions(newValue ? [newValue, ...options] : options);
          if (newValue !== null) {
            props.push(newValue.label, newValue.eid);
          }
          setOptions([]);
          setValue(null);
          setInputValue("");
        }}
        options={options}
        renderInput={(params) => (
          <TextField {...params} label="Search" size="small" variant="outlined" fullWidth />
        )}
        renderOption={(option) => (
          <Grid
            container
            justify="space-between"
          >
            <Grid item>
              {option.name}
            </Grid>
            <Grid item>
              <Typography variant="body2" color="textSecondary">
                {option.label}
              </Typography>
            </Grid>
          </Grid>
        )}
        style={{ width: 400 }}
        value={value}
      />
      <TextField
        id="entity-search-select"
        label="Type"
        onChange={(event, newValue) => {
          setEntityType(event.target.value);
          setOptions([]);
          setValue(null);
          setInputValue("");
        }}
        select
        size="small"
        style={{ width: 120 }}
        value={entityType}
        variant="outlined"
      >
        <MenuItem value={"any"}>Any</MenuItem>
        <MenuItem value={"artist"}>Artist</MenuItem>
        <MenuItem value={"company"}>Company</MenuItem>
        <MenuItem value={"master"}>Master</MenuItem>
        <MenuItem value={"release"}>Release</MenuItem>
        <MenuItem value={"track"}>Track</MenuItem>
      </TextField>
 
    </React.Fragment>
  )
};

export default connect(null, mapDispatchToProps)(EntitySearch);
