import {connect} from "react-redux";

import Component from "./login";

const mapStateToProps = state => {
  return {
    loginForm: state.organization.configuration.components.login_form,
    privacyPolicy: state.organization.configuration.privacy_policy,
    termsAndConditions: state.organization.configuration.terms_and_conditions,
    language: state.language,
    orgSlug: state.organization.configuration.slug,
  };
};

export default connect(
  mapStateToProps,
  null,
)(Component);
