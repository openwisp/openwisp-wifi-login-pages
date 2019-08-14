import {connect} from "react-redux";

import Component from "./404";

const mapStateToProps = state => {
  return {
    page: state.organization.configuration.components["404_page"],
    language: state.language,
    orgSlug: state.organization.configuration.slug,
  };
};

export default connect(
  mapStateToProps,
  null,
)(Component);
