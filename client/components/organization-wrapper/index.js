import {withCookies} from "react-cookie";
import {connect} from "react-redux";
import {setUserData} from "../../actions/dispatchers";
import setOrganization from "../../actions/set-organization";
import setLanguage from "../../actions/set-language";
import Component from "./organization-wrapper";
import withRouteProps from "../../utils/withRouteProps";

const mapStateToProps = (state, ownProps) => ({
  organization: state.organization,
  cookies: ownProps.cookies,
  language: state.language,
  defaultLanguage: state.organization.configuration.default_language,
  languages: state.organization.configuration.languages,
});

const mapDispatchToProps = (dispatch) => ({
  setOrganization: async (slug, cookies) => {
    await dispatch(setOrganization(slug, cookies));
  },
  setUserData: setUserData(dispatch),
  setLanguage: (slug) => {
    dispatch(setLanguage(slug));
  },
});
export default withCookies(
  connect(mapStateToProps, mapDispatchToProps)(withRouteProps(Component)),
);
