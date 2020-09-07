import React from 'react';
import SidebarSection from './SidebarSection';
import Slider from '@material-ui/core/Slider';
import { connect } from 'react-redux';
import { EDGE_LIMIT_DEFAULT, EDGE_LIMIT_MINIMUM, EDGE_LIMIT_MAXIMUM } from '../constants';
import { useLocation } from "react-router-dom";
import { push } from 'connected-react-router';
import { queryObjectToString, queryStringToObject } from '../utils';


const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.edgeLimitsOpen,
    limit: state.filtered.limit,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    pushLimit: (location, limit) => {
      const parsedQuery = queryStringToObject(location.search);
      if (limit === EDGE_LIMIT_DEFAULT) {
        delete parsedQuery.limit; 
      } else {
        parsedQuery.limit = limit;
      }
      dispatch(push(location.pathname + "?" + queryObjectToString(parsedQuery)));
    }
  }
}

const SidebarSectionEdgeLimits = (props) => {
  const location = useLocation();
  return (
    <SidebarSection
      category="edgeLimits"
      title="Edge Limits"
      open={props.open}
    >
      <Slider
        defaultValue={props.limit}
        max={EDGE_LIMIT_MAXIMUM}
        // Calculate marks programmatically
        marks={[
          {value: 100, label: 100},
          {value: 200, label: 200},
          {value: 300, label: 300},
          {value: 400, label: 400},
        ]}
        min={EDGE_LIMIT_MINIMUM}
        onChange={(event, newValue) => { props.pushLimit(location, newValue) }}
        step={25}
        value={props.limit}
        valueLabelDisplay="auto"
      />
    </SidebarSection>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SidebarSectionEdgeLimits);