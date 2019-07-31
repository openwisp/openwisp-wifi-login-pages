import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";

import getAssetPath from "../../utils/get-asset-path";
import getText from "../../utils/get-text";

export default class Header extends React.Component {
  render() {
    const {header, languages, language, orgSlug, setLanguage} = this.props;
    const {logo, links} = header;
    return (
      <React.Fragment>
        <div className="owisp-header-container">
          <div className="owisp-header-row-1">
            <div className="owisp-header-row-1-inner">
              <div className="owisp-header-left">
                <div className="owisp-header-logo-div">
                  {logo.url ? (
                    <Link to={`/${orgSlug}`}>
                      <img
                        src={getAssetPath(orgSlug, logo.url)}
                        alt={logo.alternate_text}
                        className="owisp-header-logo-image"
                      />
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="owisp-header-right">
                {languages.map(lang => {
                  return (
                    <button
                      type="button"
                      className={`${
                        language === lang.slug ? "active " : ""
                      }owisp-header-language-btn owisp-header-language-btn-${
                        lang.slug
                      }`}
                      key={lang.slug}
                      onClick={() => setLanguage(lang.slug)}
                    >
                      {lang.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="owisp-header-row-2">
            <div className="owisp-header-row-2-inner">
              {links.map((link, index) => {
                return (
                  <a
                    href={link.url}
                    className={`owisp-header-link
                    owisp-header-link-${index + 1}`}
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
        </div>
      </React.Fragment>
    );
  }
}

Header.propTypes = {
  header: PropTypes.shape({
    logo: PropTypes.shape({
      alternate_text: PropTypes.string,
      url: PropTypes.string,
    }),
    links: PropTypes.array,
  }).isRequired,
  language: PropTypes.string.isRequired,
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      slug: PropTypes.string,
      text: PropTypes.string,
    }),
  ).isRequired,
  setLanguage: PropTypes.func.isRequired,
  orgSlug: PropTypes.string.isRequired,
};
