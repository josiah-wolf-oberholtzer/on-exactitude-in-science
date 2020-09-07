import React from 'react';
import { ListItem, ListItemText } from '@material-ui/core';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { connect } from 'react-redux';
import { useLocation } from "react-router-dom";
import { push } from 'connected-react-router';
import { queryObjectToString, queryStringToObject } from '../utils';


const mapStateToProps = state => {
  return {
    checked: state.pinned.showSecondaryReleases,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    pushChecked: (location, checked) => {
      const parsedQuery = queryStringToObject(location.search);
      if (checked) {
        parsedQuery.showSecondaryReleases = true;
      } else {
        delete parsedQuery.showSecondaryReleases;
      }
      dispatch(push(location.pathname + "?" + queryObjectToString(parsedQuery)));
    }
  }
}

const SidebarSectionMainReleases = (props) => {
  const location = useLocation();
  return (
    <ListItem button onClick={() => { props.pushChecked(location, !props.checked) }}>
      <ListItemText primary="Show Secondary Releases" />
      { props.checked ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon /> }
    </ListItem>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SidebarSectionMainReleases);
