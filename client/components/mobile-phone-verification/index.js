import {connect} from "react-redux";

import Component from "./mobile-phone-verification";
import {logout, setUserData} from "../../actions/dispatchers";

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
    setUserData: setUserData(dispatch),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Component);
