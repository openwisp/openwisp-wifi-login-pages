import {connect} from "react-redux";

import Component from "./registration";

const mapStateToProps = state => {
  return {
    registration: state.organization.configuration.components.registration_form,
    language: state.language,
    orgSlug: state.organization.configuration.slug,
  };
};

export default connect(
  mapStateToProps,
  null,
)(Component);
