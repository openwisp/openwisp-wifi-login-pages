/* eslint-disable react/no-array-index-key */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";

import isInternalLink from "../../utils/check-internal-links";
import getAssetPath from "../../utils/get-asset-path";
import getText from "../../utils/get-text";
import shouldLinkBeShown from "../../utils/should-link-be-shown";

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menu: false,
    };
    this.handleHamburger = this.handleHamburger.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  handleHamburger() {
    const { menu } = this.state;
    this.setState({
      menu: !menu,
    });
  }

  handleKeyUp(event) {
    const { menu } = this.state;
    switch (event.keyCode) {
      case 13:
        this.setState({
          menu: !menu,
        });
        break;
      default:
        break;
    }
  }

  render() {
    const { menu } = this.state;
    const {
      header,
      languages,
      language,
      orgSlug,
      setLanguage,
      location,
      isAuthenticated
    } = this.props;
    const { logo, links } = header;
    const { pathname } = location;
    const internalLinks = [`/${orgSlug}/login`, `/${orgSlug}/registration`];
    return (
      <>
        <div className="owisp-header-container owisp-header-desktop">
          <div className="owisp-header-row-1">
            <div className="owisp-header-row-1-inner">
              <div className="owisp-header-left">
                <div className="owisp-header-logo-div">
                  {logo && logo.url ? (
                    <Link to={`/${orgSlug}`}>
                      <img
                        src={getAssetPath(orgSlug, logo.url)}
                        alt={logo.alternate_text}
                        className="owisp-header-logo-image owisp-header-desktop-logo-image"
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
                        }owisp-header-language-btn owisp-header-desktop-language-btn owisp-header-language-btn-${
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
                if (shouldLinkBeShown(link, isAuthenticated)) {
                  if (isInternalLink(link.url) && (internalLinks.indexOf(link.url) < 0 || !isAuthenticated)) {
                      return (
                        <Link
                          className={`owisp-header-link owisp-header-desktop-link
                      owisp-header-link-${index + 1} ${
                            pathname === link.url ? "active" : ""
                            } owisp-btn-primary `}
                          to={link.url}
                          key={index}
                        >
                          {getText(link.text, language)}
                        </Link>
                      );
                  }
                  return (
                    <a
                      href={link.url}
                      className={`owisp-header-link owisp-header-desktop-link
                      owisp-header-link-${index + 1} owisp-btn-primary`}
                      target="_blank"
                      rel="noreferrer noopener"
                      key={link.url}
                    >
                      {getText(link.text, language)}
                    </a>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
        <div className="owisp-header-mobile ">
          <div className="owisp-header-row-1">
            <div className="owisp-header-row-1-inner">
              <div className="owisp-header-left">
                <div className="owisp-header-logo-div">
                  {logo && logo.url ? (
                    <Link to={`/${orgSlug}`}>
                      <img
                        src={getAssetPath(orgSlug, logo.url)}
                        alt={logo.alternate_text}
                        className="owisp-header-logo-image owisp-header-mobile-logo-image"
                      />
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="owisp-header-right">
                <div
                  role="button"
                  tabIndex={0}
                  className="owisp-header-hamburger"
                  onClick={this.handleHamburger}
                  onKeyUp={this.handleKeyUp}
                >
                  <div className={`${menu ? "owisp-rot45" : ""}`} />
                  <div className={`${menu ? "owisp-rot-45" : ""}`} />
                  <div className={`${menu ? "owisp-opacity-hidden" : ""}`} />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`${
              menu ? "owisp-display-flex" : "owisp-display-none"
              } owisp-header-mobile-menu`}
          >
            {links.map((link, index) => {
              if (shouldLinkBeShown(link, isAuthenticated)) {
                if (isInternalLink(link.url)) {
                  return (
                    <Link
                      className={`owisp-header-link owisp-mobile-link
                    owisp-header-link-${index + 1} ${
                        pathname === link.url ? "active" : ""
                        } owisp-btn-primary`}
                      to={link.url}
                      key={index}
                    >
                      {getText(link.text, language)}
                    </Link>
                  );
                }
                return (
                  <a
                    href={link.url}
                    className={`owisp-header-link owisp-mobile-link
                      owisp-header-link-${index + 1} owisp-btn-primary`}
                    target="_blank"
                    rel="noreferrer noopener"
                    key={link.url}
                  >
                    {getText(link.text, language)}
                  </a>
                );
              }
              return null;
            })}
            <div className="owisp-mobile-languages-row">
              {languages.map(lang => {
                return (
                  <button
                    type="button"
                    className={`${
                      language === lang.slug ? "active " : ""
                      }owisp-header-language-btn owisp-header-mobile-language-btn owisp-header-language-btn-${
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
      </>
    );
  }
}
Header.defaultProps = {
  isAuthenticated: false
};
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
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
};
