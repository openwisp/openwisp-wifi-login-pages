import {connect} from "react-redux";
import withRouteProps from "../../utils/withRouteProps";

import Component from "./modal";

export const mapStateToProps = (state, ownProps) => ({
  orgSlug: state.organization.configuration.slug,
  privacyPolicy: state.organization.configuration.privacy_policy,
  termsAndConditions: state.organization.configuration.terms_and_conditions,
  language: state.language,
  prevPath: ownProps.prevPath,
});
export default connect(mapStateToProps, null)(withRouteProps(Component));
