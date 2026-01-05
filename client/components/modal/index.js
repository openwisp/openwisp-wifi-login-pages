import {connect} from "react-redux";
import withRouteProps from "../../utils/with-route-props";

import Component from "./modal";

export const mapStateToProps = (state, ownProps) => ({
  orgSlug: state.organization.configuration.slug,
  privacyPolicy: state.organization.configuration.privacyPolicy,
  termsAndConditions: state.organization.configuration.termsAndConditions,
  language: state.language,
  prevPath: ownProps.prevPath,
});
export default connect(mapStateToProps, null)(withRouteProps(Component));
