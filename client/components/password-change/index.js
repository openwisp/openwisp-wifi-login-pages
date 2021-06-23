import {connect} from "react-redux";
import {setTitle} from "../../actions/dispatchers";

import Component from "./password-change";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    passwordChange: conf.components.password_change_form,
    orgSlug: conf.slug,
    orgName: conf.name,
    language: state.language,
    cookies: ownProps.cookies,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setTitle: setTitle(dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
