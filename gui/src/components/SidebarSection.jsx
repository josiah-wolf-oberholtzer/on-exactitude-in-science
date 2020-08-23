import React from 'react';
import CancelIcon from '@material-ui/icons/Cancel';
import FilterListIcon from '@material-ui/icons/FilterList';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { connect } from 'react-redux';
import { Badge, Chip, Collapse, Divider, IconButton, ListItem, ListItemText, makeStyles, } from '@material-ui/core';
import { pin, unpin } from '../slices/pinnedSlice';
import { toggleSidebarSection } from '../slices/layoutSlice';

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
    pin: (category, name) => { dispatch(pin({category, name})) },
    unpin: (category, name) => { dispatch(unpin({category, name})) },
    toggleOpen: category => { dispatch(toggleSidebarSection({category})) },
  }
}

const SidebarSection = (props) => {
  const { category, highlightedNames, names, onClick, open, pinnedNames } = props;
  const title = category.charAt(0).toUpperCase() + category.slice(1)
  const classes = useStyles();
  const pinnedChips = [];
  const unpinnedChips = [];
  pinnedNames.sort().forEach((name) => {
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
          onDelete={() => {props.unpin(category, name)}}
        />
      </Badge>
    )
    pinnedChips.push(chip);
  });
  Object.entries(names).sort().map(entry => {
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
            onDelete={() => {props.pin(category, name)}}
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
