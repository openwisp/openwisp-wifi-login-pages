import {connect} from "react-redux";

import Component from "./mobile-phone-verification";
import {logout, setTitle, setUserData} from "../../actions/dispatchers";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    mobile_phone_verification: conf.components.mobile_phone_verification_form,
    settings: conf.settings,
    orgSlug: conf.slug,
    orgName: conf.name,
    userData: conf.userData,
    language: state.language,
  };
};
const mapDispatchToProps = (dispatch) => ({
  logout: logout(dispatch),
  setUserData: setUserData(dispatch),
  setTitle: setTitle(dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Component);
