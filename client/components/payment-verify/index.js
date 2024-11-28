import {connect} from "react-redux";

import {authenticate, logout, setTitle, setUserData} from "../../actions/dispatchers";
import Component from "./payment-verify";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    payment_verify_form: conf.components.payment_verify_form,
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
  authenticate: authenticate(dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Component);
