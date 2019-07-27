import {connect} from "react-redux";

import Component from "./password-reset";

const mapStateToProps = state => {
  return {
    passwordReset: state.organization.configuration.components.reset_form,
    language: state.language,
    orgSlug: state.organization.configuration.slug,
  };
};
export default connect(
  mapStateToProps,
  null,
)(Component);
