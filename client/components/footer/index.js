import {connect} from "react-redux";

import Component from "./footer";

const mapStateToProps = (state) => {
  return {
    footer: state.organization.configuration.components.footer,
    isAuthenticated: state.organization.configuration.isAuthenticated,
    userData: state.organization.configuration.userData,
  };
};
export default connect(mapStateToProps, null)(Component);
