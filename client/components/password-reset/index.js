import {connect} from "react-redux";

import Component from "./password-reset";

const mapStateToProps = state => {
  const conf = state.organization.configuration;
  return {
    passwordReset: conf.components.password_reset_form,
    orgSlug: conf.slug,
    language: state.language,
  };
};
export default connect(
  mapStateToProps,
  null,
)(Component);
