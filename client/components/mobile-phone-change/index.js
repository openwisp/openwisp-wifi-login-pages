import {connect} from "react-redux";

import Component from "./mobile-phone-change";
import {logout, verifyMobileNumber} from "../../actions/dispatchers";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  const componentConf = conf.components.phone_number_change_form;
  componentConf.input_fields = {
    phone_number: conf.components.registration_form.input_fields.phone_number
  };
  componentConf.text = {
    token_sent: conf.components.mobile_phone_verification_form.text.token_sent
  };
  return {
    phone_number_change: componentConf,
    settings: conf.settings,
    orgSlug: conf.slug,
    language: state.language,
    cookies: ownProps.cookies,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    logout: logout(dispatch),
    verifyMobileNumber: verifyMobileNumber(dispatch)
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component);
