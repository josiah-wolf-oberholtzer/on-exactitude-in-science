import React from 'react';
import * as QueryString from 'query-string';
import { Box, Divider, ListItem } from '@material-ui/core';
import Pagination from '@material-ui/lab/Pagination';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { queryObjectToString, queryStringToObject } from '../utils';
import { useLocation } from "react-router-dom";

const mapStateToProps = state => {
  return {
    page: state.filtered.page,
    pageCount: state.graph.pageCount,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    pushPage: (location, page) => {
      const parsedQuery = queryStringToObject(location.search);
      if (page === 1) {
        delete parsedQuery.page;
      } else {
        parsedQuery.page = page;
      }
      dispatch(push(location.pathname + queryObjectToString(parsedQuery)));
    }
  }
}

const SidebarPagination = (props) => {
  const location = useLocation();
  return (
    <React.Fragment>
      <ListItem>
        <Box 
          display="flex" 
          width="100%"
          alignItems="center"
          justifyContent="center"
          pb={1}
        >
          <Pagination
            count={props.pageCount}
            disabled={props.pageCount == 1}
            onChange={(event, value) => { props.pushPage(location, value) }}
            page={props.page <= props.pageCount ? props.page : props.pageCount }
          />
        </Box>
      </ListItem>
      <Divider />
    </React.Fragment>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SidebarPagination);
