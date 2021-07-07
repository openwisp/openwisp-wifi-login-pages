/* eslint-disable camelcase */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";

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
              <span className="label">{getText(email.label, language)}:</span>
              <a
                href={`mailto:${getText(email.value, language)}`}
                className="link"
              >
                {getText(email.value, language)}
              </a>
            </div>
          )}

          {helpdesk && (
            <div className="row">
              <span className="label">
                {getText(helpdesk.label, language)}:
              </span>
              <a
                href={`tel:${getText(helpdesk.value, language)}`}
                className="link"
              >
                {getText(helpdesk.value, language)}
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
    email: PropTypes.object,
    helpdesk: PropTypes.object,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  userData: PropTypes.object,
};
