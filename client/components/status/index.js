import {connect} from "react-redux";
import {
  logout,
  setTitle,
  setUserData,
  setInternetMode,
  setPlanExhausted,
} from "../../actions/dispatchers";
import Component from "./status";

export const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    statusPage: conf.components.status_page,
    orgSlug: conf.slug,
    orgName: conf.name,
    settings: conf.settings,
    userData: conf.userData,
    defaultLanguage: conf.default_language,
    captivePortalLoginForm: conf.components.captive_portal_login_form,
    captivePortalLogoutForm: conf.components.captive_portal_logout_form,
    captivePortalSyncAuth: conf.components.captive_portal_sync_auth,
    captivePortalApi: conf.components.captive_portal_api,
    isAuthenticated: conf.isAuthenticated,
    cookies: ownProps.cookies,
    language: state.language,
    internetMode: state.internetMode,
    planExhausted: state.planExhausted,
  };
};

export const mapDispatchToProps = (dispatch) => ({
  logout: logout(dispatch),
  setUserData: setUserData(dispatch),
  setTitle: setTitle(dispatch),
  setInternetMode: setInternetMode(dispatch),
  setPlanExhausted: setPlanExhausted(dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Component);
