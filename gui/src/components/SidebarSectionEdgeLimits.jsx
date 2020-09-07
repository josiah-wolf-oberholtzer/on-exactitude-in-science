import React from 'react';
import SidebarSection from './SidebarSection';
import Slider from '@material-ui/core/Slider';
import { connect } from 'react-redux';


const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.edgeLimitsOpen,
  }
}

const SidebarSectionEdgeLimits = (props) => {
  return (
    <SidebarSection
      category="edgeLimits"
      title="Edge Limits"
      open={props.open}
    >
      <Slider
        defaultValue={250}
        max={500}
        min={0}
        step={25}
        valueLabelDisplay="auto"
      />
    </SidebarSection>
  )
}

export default connect(mapStateToProps)(SidebarSectionEdgeLimits);
