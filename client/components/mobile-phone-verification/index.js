import {connect} from "react-redux";

import Component from "./mobile-phone-verification";
import {
  logout,
  verifyMobileNumber,
  setIsActive,
  setUserData,
} from "../../actions/dispatchers";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    mobile_phone_verification: conf.components.mobile_phone_verification_form,
    settings: conf.settings,
    orgSlug: conf.slug,
    language: state.language,
    userData: conf.userData,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    logout: logout(dispatch),
    verifyMobileNumber: verifyMobileNumber(dispatch),
    setIsActive: setIsActive(dispatch),
    setUserData: setUserData(dispatch),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Component);
