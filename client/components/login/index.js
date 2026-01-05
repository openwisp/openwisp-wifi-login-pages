import {connect} from "react-redux";

import {authenticate, setUserData, setTitle} from "../../actions/dispatchers";
import Component from "./login";

export const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  const loginForm = conf.components.login_form;
  loginForm.inputFields.phoneNumber =
    conf.components.registration_form.inputFields.phoneNumber;
  return {
    loginForm,
    privacyPolicy: conf.privacyPolicy,
    termsAndConditions: conf.termsAndConditions,
    orgSlug: conf.slug,
    orgName: conf.name,
    settings: conf.settings,
    userData: conf.userData,
    language: state.language,
    captivePortalLoginForm: conf.components.captive_portal_login_form,
  };
};

export const mapDispatchToProps = (dispatch) => ({
  authenticate: authenticate(dispatch),
  setUserData: setUserData(dispatch),
  setTitle: setTitle(dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Component);
