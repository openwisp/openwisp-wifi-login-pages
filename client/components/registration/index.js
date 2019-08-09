import {connect} from "react-redux";

import {SET_AUTHENTICATION_STATUS} from "../../constants/action-types";
import Component from "./registration";

const mapStateToProps = state => {
  return {
    registration: state.organization.configuration.components.registration_form,
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
