import {connect} from "react-redux";

import Component from "./password-change";

const mapStateToProps = state => {
  return {
    passwordChange:
      state.organization.configuration.components.password_change_page,
    language: state.language,
    orgSlug: state.organization.configuration.slug,
  };
};
export default connect(
  mapStateToProps,
  null,
)(Component);
