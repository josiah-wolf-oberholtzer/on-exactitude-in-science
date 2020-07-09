import * as graphAPI from '../api/graphAPI';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import React from "react";
import throttle from 'lodash/throttle';
import { Grid, TextField, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { push } from 'connected-react-router'

const mapDispatchToProps = dispatch => {
  return {
    push: (label, id) => dispatch(push(`/${label}/${id}`)),
  }
}

const EntitySearch = (props) => {
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);

  const fetch = throttle(() => {
    graphAPI.search(inputValue).then((response) => {
      let newOptions = [];
      /*
      if (value) {
        newOptions = [value];
      }
      */
      if (response.data.result) {
        newOptions = [...newOptions, ...response.data.result];
      }
      setOptions(newOptions);
    })
  }, 200)

  React.useEffect(() => {if (inputValue.length >= 3) { fetch() }}, [value, inputValue]);

  return (
    <Autocomplete
      blurOnSelect
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
  )
};

export default connect(null, mapDispatchToProps)(EntitySearch);
