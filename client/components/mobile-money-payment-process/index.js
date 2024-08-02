import "./index.css";

import {connect} from "react-redux";
import Component from "./mobile-money-payment-process";
import {logout, setTitle, setUserData} from "../../actions/dispatchers";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  const componentConf = conf.components.mobile_money_payment_form;
  componentConf.input_fields = {
    phone_number: conf.components.registration_form.input_fields.phone_number,
  };
  return {
    mobile_money_payment_form: componentConf,
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
