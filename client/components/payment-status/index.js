import {connect} from "react-redux";

import Component from "./payment-status";

import {logout} from "../../actions/dispatchers";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    page: state.organization.configuration.components.payment_status_page,
    orgSlug: state.organization.configuration.slug,
    settings: conf.settings,
    isAuthenticated: conf.isAuthenticated,
    language: state.language,
    cookies: ownProps.cookies,
    result: ownProps.result,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    logout: logout(dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
