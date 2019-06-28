import {connect} from "react-redux";

import setOrganization from "../../actions/set-organization";
import Component from "./organization-wrapper";

const mapStateToProps = state => {
  return {
    organization: state.organization,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setOrganization: slug => {
      dispatch(setOrganization(slug));
    },
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component);
