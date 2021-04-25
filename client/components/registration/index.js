import {connect} from "react-redux";

import {authenticate, verifyMobileNumber} from "../../actions/dispatchers";
import Component from "./registration";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    registration: conf.components.registration_form,
    settings: conf.settings,
    privacyPolicy: conf.privacy_policy,
    termsAndConditions: conf.terms_and_conditions,
    orgSlug: conf.slug,
    language: state.language,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: authenticate(dispatch),
    verifyMobileNumber: verifyMobileNumber(dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
