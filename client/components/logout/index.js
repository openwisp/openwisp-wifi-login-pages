import {connect} from "react-redux";
import {authenticate} from "../../actions/dispatchers";
import Component from "./logout";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    logoutPage: conf.components.logout,
    orgSlug: conf.slug,
    isAuthenticated: conf.isAuthenticated,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: authenticate(dispatch),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Component);
