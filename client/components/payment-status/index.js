import {connect} from "react-redux";
import Component from "./payment-status";
import {authenticate, logout, setUserData} from "../../actions/dispatchers";

const mapStateToProps = (state, ownProps) => {
  const conf = state.organization.configuration;
  return {
    page: state.organization.configuration.components.payment_status_page,
    orgSlug: state.organization.configuration.slug,
    userData: conf.userData,
    settings: conf.settings,
    isAuthenticated: conf.isAuthenticated,
    cookies: ownProps.cookies,
    status: ownProps.status,
  };
};
const mapDispatchToProps = (dispatch) => ({
  authenticate: authenticate(dispatch),
  logout: logout(dispatch),
  setUserData: setUserData(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
