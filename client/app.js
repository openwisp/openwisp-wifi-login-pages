import "./index.css";

import {Provider, connect} from "react-redux";

import {CookiesProvider} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Route, Router} from "react-router-dom";
import {render} from "react-dom";
import {ToastContainer} from "react-toastify";
import Routes from "./routes";
import organizations from "./organizations.json";
import history from "./utils/history";
import parseOrganizations from "./actions/parse-organizations";
import store from "./store";
import isOldBrowser from "./utils/is-old-browser";

class BaseApp extends React.Component {
  constructor(props) {
    super(props);
    const {parseOrgs} = this.props;
    parseOrgs(organizations);
  }

  render() {
    return (
      <Router history={history}>
        <ToastContainer className={isOldBrowser() ? "oldbrowser" : null} />
        <Route path="/" component={Routes} />
      </Router>
    );
  }
}

BaseApp.propTypes = {
  parseOrgs: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  parseOrgs: (orgSlugs) => {
    dispatch(parseOrganizations(orgSlugs));
  },
});

const App = connect(null, mapDispatchToProps)(BaseApp);

export default function app() {
  render(
    <CookiesProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </CookiesProvider>,
    document.getElementById("root"),
  );
}

if (module && module.hot) {
  module.hot.accept();
}

window.addEventListener("load", () => {
  document.getElementById("preload").remove();
});
