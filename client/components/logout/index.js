import {connect} from "react-redux";
import {authenticate, setTitle, setUserData} from "../../actions/dispatchers";
import Component from "./logout";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    orgSlug: conf.slug,
    orgName: conf.name,
    isAuthenticated: conf.isAuthenticated,
    userData: conf.userData,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: authenticate(dispatch),
    setUserData: setUserData(dispatch),
    setTitle: setTitle(dispatch),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Component);
