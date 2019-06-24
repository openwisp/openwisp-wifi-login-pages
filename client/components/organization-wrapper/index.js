import {connect} from "react-redux";

import setOrganization from "../../actions/set-organization";
import Component from "./organization-wrapper";

const mapDispatchToProps = dispatch => {
  return {
    setOrganization: slug => {
      dispatch(setOrganization(slug));
    },
  };
};
export default connect(
  null,
  mapDispatchToProps,
)(Component);
