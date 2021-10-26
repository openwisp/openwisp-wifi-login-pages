import {connect} from "react-redux";
import Component from "./payment-buffer";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    isAuthenticated: conf.isAuthenticated,
    orgSlug: state.organization.configuration.slug,
    settings: conf.settings,
  };
};
export default connect(mapStateToProps)(Component);
