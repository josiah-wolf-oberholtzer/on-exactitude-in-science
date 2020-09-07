import React from 'react';
import { ListItem, ListItemText } from '@material-ui/core';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

const SidebarSectionMainReleases = (props) => {
  const [checked, setChecked] = React.useState(true)
  const toggleChecked = () => { setChecked(!checked); }
  return (
    <ListItem button onClick={() => { toggleChecked() }}>
      <ListItemText primary="Main Releases Only" />
      { checked ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon /> }
    </ListItem>
  )
}

export default SidebarSectionMainReleases;
