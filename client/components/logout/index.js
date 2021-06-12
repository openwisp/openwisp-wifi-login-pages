import {connect} from "react-redux";
import {authenticate, setTitle} from "../../actions/dispatchers";
import Component from "./logout";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    logoutPage: conf.components.logout,
    orgSlug: conf.slug,
    orgName: conf.name,
    isAuthenticated: conf.isAuthenticated,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: authenticate(dispatch),
    setTitle: setTitle(dispatch),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Component);
