import "./index.css";

import { Provider, connect } from "react-redux";

import { CookiesProvider } from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import { Router, Route } from "react-router-dom";
import { render } from "react-dom";
import { ToastContainer } from "react-toastify";
import Routes from "./routes";
import config from "./config.json";
import history from './utils/history';
import parseOrganizations from "./actions/parse-organizations";
import store from "./store";

class BaseApp extends React.Component {
  constructor(props) {
    super(props);
    const { parseOrgs } = this.props;
    parseOrgs(config);
  }

  render() {
    return (
      <Router history={history}>
        <ToastContainer />
        <Route
          path="/"
          component={Routes} />
      </Router>
    );
  }
}

BaseApp.propTypes = {
  parseOrgs: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => {
  return {
    parseOrgs: configuration => {
      dispatch(parseOrganizations(configuration));
    },
  };
};

const App = connect(
  null,
  mapDispatchToProps,
)(BaseApp);

render(
  <CookiesProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </CookiesProvider>,
  document.getElementById("root"),
);

if (module && module.hot) {
  module.hot.accept();
}
