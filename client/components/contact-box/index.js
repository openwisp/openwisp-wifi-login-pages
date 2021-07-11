import {connect} from "react-redux";

import Component from "./contact";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    contactPage: conf.components.contact_page,
    orgSlug: conf.slug,
    isAuthenticated: conf.isAuthenticated,
    language: state.language,
    userData: conf.userData,
  };
};
export default connect(mapStateToProps, null)(Component);
