import {connect} from "react-redux";

import Component from "./contact";

const mapStateToProps = state => {
  return {
    contactPage: state.organization.configuration.components.contact_page,
    language: state.language,
    orgSlug: state.organization.configuration.slug,
    isAuthenticated: state.organization.configuration.isAuthenticated,
  };
};
export default connect(
  mapStateToProps,
  null,
)(Component);
