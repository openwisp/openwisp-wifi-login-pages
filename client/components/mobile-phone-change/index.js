import {connect} from "react-redux";

import Component from "./mobile-phone-change";
import {logout, setTitle, setUserData} from "../../actions/dispatchers";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  const componentConf = conf.components.phoneNumberChange_form;
  componentConf.inputFields = {
    phoneNumber: conf.components.registration_form.inputFields.phoneNumber,
  };
  return {
    phoneNumberChange: componentConf,
    settings: conf.settings,
    orgSlug: conf.slug,
    orgName: conf.name,
    cookies: ownProps.cookies,
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
