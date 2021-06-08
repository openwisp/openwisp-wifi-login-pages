import {connect} from "react-redux";

import {
  authenticate,
  verifyMobileNumber,
  setIsActive,
  setUserData,
} from "../../actions/dispatchers";
import Component from "./login";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  const loginForm = conf.components.login_form;
  loginForm.input_fields.phone_number =
    conf.components.registration_form.input_fields.phone_number;
  return {
    loginForm,
    privacyPolicy: conf.privacy_policy,
    termsAndConditions: conf.terms_and_conditions,
    orgSlug: conf.slug,
    settings: conf.settings,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: authenticate(dispatch),
    verifyMobileNumber: verifyMobileNumber(dispatch),
    setIsActive: setIsActive(dispatch),
    setUserData: setUserData(dispatch),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Component);
