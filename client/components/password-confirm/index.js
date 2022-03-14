import {connect} from "react-redux";
import {setTitle} from "../../actions/dispatchers";
import withRouteProps from "../../utils/withRouteProps";

import Component from "./password-confirm";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    passwordConfirm: conf.components.password_reset_confirm_form,
    orgSlug: conf.slug,
    orgName: conf.name,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setTitle: setTitle(dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouteProps(Component));
