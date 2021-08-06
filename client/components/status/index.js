import {connect} from "react-redux";
import {logout, setTitle, setUserData} from "../../actions/dispatchers";
import Component from "./status";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    statusPage: conf.components.status_page,
    orgSlug: conf.slug,
    orgName: conf.name,
    settings: conf.settings,
    userData: conf.userData,
    captivePortalLoginForm: conf.components.captive_portal_login_form,
    captivePortalLogoutForm: conf.components.captive_portal_logout_form,
    isAuthenticated: conf.isAuthenticated,
    cookies: ownProps.cookies,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => ({
  logout: logout(dispatch),
  setUserData: setUserData(dispatch),
  setTitle: setTitle(dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Component);
