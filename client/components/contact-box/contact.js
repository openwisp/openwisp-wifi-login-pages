/* eslint-disable camelcase */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {t} from "ttag";

import getAssetPath from "../../utils/get-asset-path";
import getText from "../../utils/get-text";
import shouldLinkBeShown from "../../utils/should-link-be-shown";

export default class Contact extends React.Component {
  render() {
    const {contactPage, language, orgSlug, isAuthenticated, userData} =
      this.props;
    const {email, helpdesk, social_links} = contactPage;
    return (
      <div className="side-column contact">
        <div className="inner">
          {email && (
            <div className="row">
              <span className="label">{t`EMAIL`}:</span>
              <a href={`mailto:${email}`} className="link">
                {email}
              </a>
            </div>
          )}

          {helpdesk && (
            <div className="row">
              <span className="label">{t`HELPDESK`}:</span>
              <a href={`tel:${helpdesk}`} className="link">
                {helpdesk}
              </a>
            </div>
          )}

          <div className="contact-links">
            {social_links.map((link) => {
              if (shouldLinkBeShown(link, isAuthenticated, userData)) {
                const css = link.css || "";
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={link.url}
                    className={`link ${css}`}
                  >
                    <img
                      src={getAssetPath(orgSlug, link.icon)}
                      alt={getText(link.alt, language)}
                      className={`contact-image ${css}`}
                    />
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    );
  }
}

Contact.defaultProps = {
  isAuthenticated: false,
  userData: {},
};
Contact.propTypes = {
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  contactPage: PropTypes.shape({
    social_links: PropTypes.array,
    email: PropTypes.string,
    helpdesk: PropTypes.string,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  userData: PropTypes.object,
};
