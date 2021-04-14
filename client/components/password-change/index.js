import {connect} from "react-redux";

import Component from "./password-change";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    passwordChange: conf.components.password_change_form,
    orgSlug: conf.slug,
    language: state.language,
    cookies: ownProps.cookies,
  };
};
export default connect(mapStateToProps, null)(Component);
