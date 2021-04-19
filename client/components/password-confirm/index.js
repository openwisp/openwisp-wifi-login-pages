import {connect} from "react-redux";

import Component from "./password-confirm";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    passwordConfirm: conf.components.password_reset_confirm_form,
    orgSlug: conf.slug,
    language: state.language,
  };
};
export default connect(mapStateToProps, null)(Component);
