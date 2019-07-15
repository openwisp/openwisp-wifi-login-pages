import "./index.css";

import PropTypes from "prop-types";
import React from "react";

import getText from "../../utils/get-text";

export default class Footer extends React.Component {
  render() {
    const {footer, language} = this.props;
    const {links} = footer;
    const secondaryText = footer.secondary_text;
    return (
      <React.Fragment>
        <div className="owisp-footer-container">
          <div className="owisp-footer-row-1">
            <div className="owisp-footer-row-1-inner">
              {links.map((link, index) => {
                return (
                  <a
                    href={link.url}
                    className={`owisp-footer-link
                  owisp-footer-link-${index + 1}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    key={link.url}
                  >
                    {getText(link.text, language)}
                  </a>
                );
              })}
            </div>
          </div>
          <div className="owisp-footer-row-2">
            <div className="owisp-footer-row-2-inner">
              {getText(secondaryText, language)}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

Footer.propTypes = {
  language: PropTypes.string.isRequired,
  footer: PropTypes.shape({
    links: PropTypes.array,
    secondary_text: PropTypes.object,
  }).isRequired,
};
