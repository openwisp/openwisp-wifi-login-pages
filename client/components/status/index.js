import {connect} from "react-redux";
import {logout, setUserData} from "../../actions/dispatchers";
import Component from "./status";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    statusPage: conf.components.status_page,
    orgSlug: conf.slug,
    settings: conf.settings,
    userData: conf.userData,
    captivePortalLoginForm: conf.components.captive_portal_login_form,
    captivePortalLogoutForm: conf.components.captive_portal_logout_form,
    isAuthenticated: conf.isAuthenticated,
    language: state.language,
    cookies: ownProps.cookies,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    logout: logout(dispatch),
    setUserData: setUserData(dispatch),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Component);
