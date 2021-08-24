import {connect} from "react-redux";
import {setTitle} from "../../actions/dispatchers";

import Component from "./password-reset";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    passwordReset: conf.components.password_reset_form,
    orgSlug: conf.slug,
    orgName: conf.name,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setTitle: setTitle(dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Component);
