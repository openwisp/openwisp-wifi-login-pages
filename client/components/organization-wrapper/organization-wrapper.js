import "./index.css";

import PropTypes from "prop-types";
import React from "react";

export default class OrganizationWrapper extends React.Component {
  constructor(props) {
    super(props);
    const {match, setOrganization} = this.props;
    const organizationSlug = match.params.organization;
    if (organizationSlug) setOrganization(organizationSlug);
  }

  render() {
    return (
      <React.Fragment>
        <div className="header-container">App Header</div>
      </React.Fragment>
    );
  }
}

OrganizationWrapper.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      organization: PropTypes.string.isRequired,
    }),
  }).isRequired,
  setOrganization: PropTypes.func.isRequired,
};
