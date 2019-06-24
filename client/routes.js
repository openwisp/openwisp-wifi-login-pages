import React from "react";
import {Route, Switch} from "react-router-dom";

import Header from "./components/header";

class Routes extends React.Component {
  render() {
    return (
      <Switch>
        <Route path="/" render={props => <Header {...props} />} />
      </Switch>
    );
  }
}
export default Routes;
