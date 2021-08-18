import {connect} from "react-redux";

import Component from "./footer";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    footer: conf.components.footer,
    orgSlug: conf.slug,
    isAuthenticated: conf.isAuthenticated,
    language: state.language,
    userData: conf.userData,
  };
};
export default connect(mapStateToProps, null)(Component);
