import React from "react";
import {Route, Switch} from "react-router-dom";

import OrganizationWrapper from "./components/organization-wrapper";

class Routes extends React.Component {
  render() {
    return (
      <Switch>
        <Route
          path="/:organization"
          render={props => <OrganizationWrapper {...props} />}
        />
      </Switch>
    );
  }
}
export default Routes;
