import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import { CookiesProvider } from "react-cookie";
import { render } from "react-dom";
import { Provider, connect } from "react-redux";
import { Router } from "react-router-dom";

import parseOrganizations from "./actions/parse-organizations";
import config from "./config.json";
import Routes from "./routes";
import store from "./store";
import history from './utils/history';

class BaseApp extends React.Component {
  constructor(props) {
    super(props);
    const { parseOrgs } = this.props;
    parseOrgs(config);
  }

  render() {
    return (
      <Router history={history}>
        <Routes />
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
