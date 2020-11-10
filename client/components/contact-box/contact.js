/* eslint-disable camelcase */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";

import getAssetPath from "../../utils/get-asset-path";
import getText from "../../utils/get-text";
import shouldLinkBeShown from "../../utils/should-link-be-shown";

export default class Contact extends React.Component {
  render() {
    const {contactPage, language, orgSlug, isAuthenticated} = this.props;
    const {email, helpdesk, social_links} = contactPage;
    return (
      <div className="side-column contact">
        <div className="inner">

          <div className="row">
            <span className="label">
              {getText(email.label, language)}:
            </span>
            <a
              href={`mailto:${getText(email.value, language)}`}
              className="link"
            >
              {getText(email.value, language)}
            </a>
          </div>

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

          <div className="contact-links">
            {social_links.map(link => {
              if (shouldLinkBeShown(link, isAuthenticated)) {
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={link.url}
                    className={`contact-${getText(
                      link.alt,
                      language,
                    )}-link link`}
                  >
                    <img
                      src={getAssetPath(orgSlug, link.icon)}
                      alt={getText(link.alt, language)}
                      className={`contact-${getText(
                        link.alt,
                        language,
                      )}-image contact-image`}
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
  isAuthenticated: false
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
};
