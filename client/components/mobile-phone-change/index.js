import {connect} from "react-redux";

import Component from "./mobile-phone-change";
import {logout, setTitle, setUserData} from "../../actions/dispatchers";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  const componentConf = conf.components.phone_number_change_form;
  componentConf.input_fields = {
    phone_number: conf.components.registration_form.input_fields.phone_number,
  };
  return {
    phone_number_change: componentConf,
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
