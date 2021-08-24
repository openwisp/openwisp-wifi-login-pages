import {connect} from "react-redux";
import {setTitle, setUserData, logout} from "../../actions/dispatchers";

import Component from "./password-change";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    passwordChange: conf.components.password_change_form,
    orgSlug: conf.slug,
    orgName: conf.name,
    cookies: ownProps.cookies,
    userData: conf.userData,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setTitle: setTitle(dispatch),
  logout: logout(dispatch),
  setUserData: setUserData(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
