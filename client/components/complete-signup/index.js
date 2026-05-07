import {connect} from "react-redux";

import Component from "./complete-signup";
import {setTitle, setUserData} from "../../actions/dispatchers";

const mapStateToProps = (state) => {
  const conf = state.organization.configuration;
  return {
    orgSlug: conf.slug,
    orgName: conf.name,
    settings: conf.settings,
    defaultLanguage: conf.default_language,
    userData: conf.userData,
    language: state.language,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setTitle: setTitle(dispatch),
  setUserData: setUserData(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
