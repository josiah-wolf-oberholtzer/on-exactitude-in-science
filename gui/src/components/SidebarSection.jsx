import React from 'react';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

import { Collapse, Divider, IconButton, ListItem, ListItemText, makeStyles, } from '@material-ui/core';

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

const SidebarSection = (props) => {
  const { children, onClick, open, title } = props;
  const classes = useStyles();
  return (
    <React.Fragment>
      <ListItem button key={title} onClick={onClick}>
        <ListItemText primary={title} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto">
        <Divider />
        <div className={classes.chips}>
          {children}
        </div>
        <Divider />
      </Collapse>
    </React.Fragment>
  )
}

export default SidebarSection;
