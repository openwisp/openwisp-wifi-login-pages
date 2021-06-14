import {connect} from "react-redux";

import setLanguage from "../../actions/set-language";
import Component from "./header";

const mapStateToProps = (state) => {
  return {
    header: state.organization.configuration.components.header,
    languages: state.organization.configuration.languages,
    language: state.language,
    orgSlug: state.organization.configuration.slug,
    isAuthenticated: state.organization.configuration.isAuthenticated,
    userData: state.organization.configuration.userData,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setLanguage: (slug) => {
      dispatch(setLanguage(slug));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
