import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Helmet} from "react-helmet";
import {Route, Switch} from "react-router-dom";

import getAssetPath from "../../utils/get-asset-path";
import DoesNotExist from "../404";
import Footer from "../footer";
import Header from "../header";
import PasswordConfirm from "../password-confirm";
import PasswordReset from "../password-reset";
import Registration from "../registration";

export default class OrganizationWrapper extends React.Component {
  constructor(props) {
    super(props);
    const {match, setOrganization} = this.props;
    const organizationSlug = match.params.organization;
    if (organizationSlug) setOrganization(organizationSlug);
  }

  render() {
    const {match} = this.props;
    const {organization} = this.props;
    const {title, favicon} = organization.configuration;
    const orgSlug = organization.configuration.slug;
    const cssPath = organization.configuration.css_path;
    if (organization.exists === true) {
      return (
        <React.Fragment>
          <div className="owisp-app-container">
            <Route path={match.path} render={() => <Header />} />
            <Switch>
              <Route
                path={`${match.path}/register`}
                render={() => <Registration />}
              />
              <Route
                path={`${match.path}/password/reset/confirm/:uid/:token`}
                render={props => <PasswordConfirm {...props} />}
              />
              <Route
                path={`${match.path}/password/reset`}
                exact
                render={() => <PasswordReset />}
              />
            </Switch>
            <Route path={match.path} render={() => <Footer />} />
          </div>
          {title ? (
            <Helmet>
              <title>{title}</title>
            </Helmet>
          ) : null}
          {cssPath && orgSlug ? (
            <Helmet>
              <link rel="stylesheet" href={getAssetPath(orgSlug, cssPath)} />
            </Helmet>
          ) : null}
          {favicon && orgSlug ? (
            <Helmet>
              <link
                rel="shortcut icon"
                type="image/x-icon"
                href={getAssetPath(orgSlug, favicon)}
              />
            </Helmet>
          ) : null}
        </React.Fragment>
      );
    }
    if (organization.exists === false) {
      return (
        <React.Fragment>
          <div className="owisp-org-wrapper-not-found">
            <DoesNotExist />
          </div>
          <Helmet>
            <title>Page not found</title>
          </Helmet>
        </React.Fragment>
      );
    }
    return (
      <div className="owisp-loader-container">
        <div className="owisp-loader" />
      </div>
    );
  }
}

OrganizationWrapper.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      organization: PropTypes.string.isRequired,
    }),
    path: PropTypes.string,
  }).isRequired,
  setOrganization: PropTypes.func.isRequired,
  organization: PropTypes.shape({
    configuration: PropTypes.shape({
      title: PropTypes.string,
      css_path: PropTypes.string,
      slug: PropTypes.string,
      favicon: PropTypes.string,
    }),
    exists: PropTypes.bool,
  }).isRequired,
};
