import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {t} from "ttag";

import shouldLinkBeShown from "../../utils/should-link-be-shown";

export default class Footer extends React.Component {
  render() {
    const {footer, isAuthenticated, userData} = this.props;
    const {links} = footer;
    return (
      <div className="footer-container">
        <div className="footer-row-1">
          <div className="footer-row-1-inner">
            {links.map((link, index) => {
              if (shouldLinkBeShown(link, isAuthenticated, userData)) {
                return (
                  <a
                    href={link.url}
                    className={`footer-link
                  footer-link-${index + 1}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    key={link.url}
                  >
                    {t`FOOTER_LINK ${link.text}`}
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
        <div className="footer-row-2">
          <div className="footer-row-2-inner">{t`FOOTER_SECONDARY_TEXT`}</div>
        </div>
      </div>
    );
  }
}

Footer.defaultProps = {
  isAuthenticated: false,
};
Footer.propTypes = {
  footer: PropTypes.shape({
    links: PropTypes.array,
    secondary_text: PropTypes.object,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  userData: PropTypes.object.isRequired,
};
