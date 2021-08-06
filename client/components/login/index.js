import {connect} from "react-redux";

import {authenticate, setUserData, setTitle} from "../../actions/dispatchers";
import Component from "./login";

export const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  const loginForm = conf.components.login_form;
  loginForm.input_fields.phone_number =
    conf.components.registration_form.input_fields.phone_number;
  return {
    loginForm,
    privacyPolicy: conf.privacy_policy,
    termsAndConditions: conf.terms_and_conditions,
    orgSlug: conf.slug,
    orgName: conf.name,
    settings: conf.settings,
    userData: conf.userData,
    language: state.language,
  };
};

export const mapDispatchToProps = (dispatch) => ({
  authenticate: authenticate(dispatch),
  setUserData: setUserData(dispatch),
  setTitle: setTitle(dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Component);
