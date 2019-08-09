import {connect} from "react-redux";

import logout from "../../actions/logout";
import Component from "./status";

const mapStateToProps = (state, ownProps) => {
  return {
    statusPage: state.organization.configuration.components.status_page,
    language: state.language,
    orgSlug: state.organization.configuration.slug,
    cookies: ownProps.cookies,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    logout: (cookies, slug) => {
      dispatch(logout(cookies, slug));
    },
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Component);
