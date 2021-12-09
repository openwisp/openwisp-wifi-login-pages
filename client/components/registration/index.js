import {connect} from "react-redux";

import {authenticate, setUserData, setTitle} from "../../actions/dispatchers";
import Component from "./registration";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    language: state.language,
    registration: conf.components.registration_form,
    settings: conf.settings,
    privacyPolicy: conf.privacy_policy,
    termsAndConditions: conf.terms_and_conditions,
    orgSlug: conf.slug,
    orgName: conf.name,
  };
};
const mapDispatchToProps = (dispatch) => ({
  authenticate: authenticate(dispatch),
  setTitle: setTitle(dispatch),
  setUserData: setUserData(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
