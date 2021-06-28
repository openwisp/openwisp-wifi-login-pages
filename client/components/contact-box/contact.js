/* eslint-disable camelcase */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {t} from "ttag";

import getAssetPath from "../../utils/get-asset-path";
import shouldLinkBeShown from "../../utils/should-link-be-shown";

export default class Contact extends React.Component {
  render() {
    const {contactPage, orgSlug, isAuthenticated, userData} = this.props;
    const {email, helpdesk, social_links} = contactPage;
    const socialLink = (link) => t`CONTACT_SOCIAL_LINK ${link.alt}`;
    return (
      <div className="side-column contact">
        <div className="inner">
          {email && (
            <div className="row">
              <span className="label">{t`CONTACT_EMAIL_LABEL`}:</span>
              <a href={`mailto:${email}`} className="link">
                {t`CONTACT_EMAIL`}
              </a>
            </div>
          )}

          {helpdesk && (
            <div className="row">
              <span className="label">{t`CONTACT_HELPDESK_LABEL`}:</span>
              <a href={`tel:${helpdesk}`} className="link">
                {t`CONTACT_HELPDESK`}
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
                    className={`contact-${socialLink(link)}-link link`}
                  >
                    <img
                      src={getAssetPath(orgSlug, link.icon)}
                      alt={socialLink(link)}
                      className={`contact-${socialLink(
                        link,
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
  isAuthenticated: false,
  userData: {},
};
Contact.propTypes = {
  orgSlug: PropTypes.string.isRequired,
  contactPage: PropTypes.shape({
    social_links: PropTypes.array,
    email: PropTypes.string,
    helpdesk: PropTypes.string,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  userData: PropTypes.object,
};
