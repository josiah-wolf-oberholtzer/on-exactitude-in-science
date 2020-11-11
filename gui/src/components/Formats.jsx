import React from 'react';
import Operator from './Operator';
import SidebarSection from './SidebarSection';
import { FORMATS } from '../constants';
import { connect } from 'react-redux';
import { getVerticesByFormat } from '../selectors/graphSelector';

const mapStateToProps = state => {
  return {
    open: state.layout.sidebar.formatsOpen,
    highlightedNames: state.highlighted.formats,
    names: getVerticesByFormat(state),
    filteredNames: state.filtered.formats,
    formatsOp: state.filtered.formatsOp,
  }
}

const Formats = (props) => {
  return (
    <SidebarSection
      category={FORMATS}
      highlightedNames={props.highlightedNames}
      names={props.names}
      open={props.open}
      filteredNames={props.filteredNames}
      title="Formats"
    >
      <Operator name="formatsOp" value={props.formatsOp} />
    </SidebarSection>
  )
}

export default connect(mapStateToProps)(Formats);
