import {connect} from "react-redux";

import {SET_AUTHENTICATION_STATUS} from "../../constants/action-types";
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

const mapDispatchToProps = dispatch => {
  return {
    authenticate: status => {
      dispatch({type: SET_AUTHENTICATION_STATUS, payload: status});
    },
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component);
