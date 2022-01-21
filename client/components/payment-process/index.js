import "./index.css";

import {connect} from "react-redux";
import Component from "./payment-process";
import {logout, setUserData} from "../../actions/dispatchers";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    orgSlug: state.organization.configuration.slug,
    userData: conf.userData,
    settings: conf.settings,
    isAuthenticated: conf.isAuthenticated,
    cookies: ownProps.cookies,
  };
};
const mapDispatchToProps = (dispatch) => ({
  logout: logout(dispatch),
  setUserData: setUserData(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
