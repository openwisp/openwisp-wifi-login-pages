import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import OrganizationWrapper from "./components/organization-wrapper";

class Routes extends React.Component {
  render() {
    const { match, organizations } = this.props;
    if (match.isExact && organizations.length > 0) {
      return <Redirect to={`/${organizations[0].slug}/`} />;
    }
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

const mapStateToProps = state => {
  return {
    organizations: state.organizations,
  };
};
Routes.defaultProps = {
  organizations: []
};

Routes.propTypes = {
  match: PropTypes.shape({
    isExact: PropTypes.bool
  }).isRequired,
  organizations: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string
  }))
};

export default connect(
  mapStateToProps,
  null,
)(Routes);
