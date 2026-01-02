/* eslint-disable import/no-import-module-exports */
import "./index.css";
import {createRoot} from "react-dom/client";
import {Provider, connect} from "react-redux";
import {HelmetProvider} from "react-helmet-async";
import {CookiesProvider} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Route, BrowserRouter as Router, Routes} from "react-router-dom";
import {ToastContainer} from "react-toastify";
import OrganizationRoutes from "./routes";
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
      <Router>
        <ToastContainer className={isOldBrowser() ? "oldbrowser" : null} />
        <Routes>
          <Route path="*" element={<OrganizationRoutes />} />
        </Routes>
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
  const container = document.getElementById("root");
  const root = createRoot(container);

  root.render(
    <HelmetProvider>
      <CookiesProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </CookiesProvider>
    </HelmetProvider>,
  );
}

if (module && module.hot) {
  module.hot.accept();
}

window.addEventListener("load", () => {
  document.getElementById("preload").remove();
});
