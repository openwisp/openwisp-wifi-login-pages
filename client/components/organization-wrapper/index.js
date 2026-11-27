import {withCookies} from "react-cookie";
import {connect} from "react-redux";
import setOrganization from "../../actions/set-organization";
import setLanguage from "../../actions/set-language";
import Component from "./organization-wrapper";
import withRouteProps from "../../utils/with-route-props";

const mapStateToProps = (state, ownProps) => ({
  organization: state.organization,
  cookies: ownProps.cookies,
  language: state.language,
  defaultLanguage: state.organization.configuration.default_language,
  languages: state.organization.configuration.languages,
});

const mapDispatchToProps = (dispatch) => ({
  setOrganization: async (slug, cookies, location) => {
    await dispatch(setOrganization(slug, cookies, location));
  },
  setLanguage: (slug) => {
    dispatch(setLanguage(slug));
  },
});
export default withCookies(
  connect(mapStateToProps, mapDispatchToProps)(withRouteProps(Component)),
);
