/* eslint-disable camelcase */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";

import getAssetPath from "../../utils/get-asset-path";
import getText from "../../utils/get-text";

export default class Contact extends React.Component {
  render() {
    const {contactPage, language, orgSlug} = this.props;
    const {email, helpdesk, social_links} = contactPage;
    return (
      <React.Fragment>
        <div className="owisp-contact-container">
          <div className="owisp-contact-inner">
            <div className="owisp-contact-row">
              <div className="owisp-contact-label">
                {getText(email.label, language)}:
              </div>
              <a
                href={`mailto:${getText(email.value, language)}`}
                className="owisp-contact-text"
              >
                {getText(email.value, language)}
              </a>
            </div>
            <div className="owisp-contact-row">
              <div className="owisp-contact-label">
                {getText(helpdesk.label, language)}:
              </div>
              <a
                href={`tel:${getText(helpdesk.value, language)}`}
                className="owisp-contact-text"
              >
                {getText(helpdesk.value, language)}
              </a>
            </div>
            <div className="owisp-contact-links">
              {social_links.map(link => {
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={link.url}
                    className={`owisp-contact-${getText(
                      link.alt,
                      language,
                    )}-link owisp-contact-link`}
                  >
                    <img
                      src={getAssetPath(orgSlug, link.icon)}
                      alt={getText(link.alt, language)}
                      className={`owisp-contact-${getText(
                        link.alt,
                        language,
                      )}-image owisp-contact-image`}
                    />
                  </a>
                );
              })}
            </div>
            <div className="owisp-contact-inner"/>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

Contact.propTypes = {
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  contactPage: PropTypes.shape({
    social_links: PropTypes.array,
    email: PropTypes.object,
    helpdesk: PropTypes.object,
  }).isRequired,
};
