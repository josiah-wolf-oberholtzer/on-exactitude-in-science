import React from 'react';
import CancelIcon from '@material-ui/icons/Cancel';
import FilterListIcon from '@material-ui/icons/FilterList';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { connect } from 'react-redux';
import { Badge, Chip, Collapse, Divider, IconButton, ListItem, ListItemText, makeStyles, } from '@material-ui/core';
import { toggleSidebarSection } from '../slices/layoutSlice';
import { useLocation } from "react-router-dom";
import { push } from 'connected-react-router';
import * as QueryString from 'query-string';
import { queryObjectToString, queryStringToObject } from '../utils';

const useStyles = makeStyles((theme) => ({
  chips: {
    display: 'flex',
    justifyContent: 'left',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(1),
    },
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
}));

const mapDispatchToProps = dispatch => {
  return {
    toggleOpen: category => { dispatch(toggleSidebarSection({category})) },
    pushPin: (location, category, name) => {
      dispatch(push(pinQuery(location, category, name)));
    },
    pushUnpin: (location, category, name) => {
      dispatch(push(unpinQuery(location, category, name)));
    },
  }
}

const pinQuery = (location, category, name) => {
  const parsedQuery = queryStringToObject(location.search);
  const names = new Set(parsedQuery[category]);
  names.add(name);
  parsedQuery[category] = Array.from(names).sort()
  return location.pathname + "?" + queryObjectToString(parsedQuery);

}

const unpinQuery = (location, category, name) => {
  const parsedQuery = queryStringToObject(location.search);
  const names = new Set(parsedQuery[category]);
  names.delete(name);
  parsedQuery[category] = Array.from(names).sort()
  return location.pathname + "?" + queryObjectToString( parsedQuery);
}

const SidebarSection = (props) => {
  const { category, highlightedNames, names, onClick, open, pinnedNames } = props;
  const location = useLocation();
  const title = category.charAt(0).toUpperCase() + category.slice(1)
  const classes = useStyles();
  const pinnedChips = [];
  const unpinnedChips = [];
  pinnedNames.forEach((name) => {
    const ids = names[name] || [];
    const chip = (
      <Badge
        badgeContent={ids.length}
        key={name}
      >
        <Chip
          deleteIcon={<CancelIcon />}
          label={name}
          onClick={() => {}}
          onDelete={() => {props.pushUnpin(location, category, name)}}
        />
      </Badge>
    )
    pinnedChips.push(chip);
  });
  Object.entries(names).map(entry => {
    const [name, ids] = entry;
    if (!pinnedNames.includes(name)) {
      const chip = (
        <Badge
          badgeContent={ids.length}
          key={name}
        >
          <Chip
            deleteIcon={<FilterListIcon />}
            label={name}
            onClick={() => {}}
            onDelete={() => {props.pushPin(location, category, name)}}
            variant="outlined"
          />
        </Badge>
      )
      pinnedChips.push(chip);
    }
  });
  return (
    <React.Fragment>
      <ListItem button key={title} onClick={() => { props.toggleOpen(category) }}>
        <ListItemText primary={title} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto">
        <Divider />
        <div className={classes.chips}>
          {pinnedChips}
          {unpinnedChips}
        </div>
        <Divider />
      </Collapse>
    </React.Fragment>
  )
}

export default connect(null, mapDispatchToProps)(SidebarSection);
