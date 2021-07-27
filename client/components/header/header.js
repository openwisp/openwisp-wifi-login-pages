/* eslint-disable react/no-array-index-key */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";
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
    const {menu} = this.state;
    this.setState({
      menu: !menu,
    });
  }

  handleKeyUp(event) {
    const {menu} = this.state;
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
    const {menu} = this.state;
    const {
      header,
      languages,
      language,
      orgSlug,
      setLanguage,
      location,
      isAuthenticated,
      userData,
    } = this.props;
    const {logo, links, second_logo: secondLogo} = header;
    const {pathname} = location;
    const internalLinks = [`/${orgSlug}/login`, `/${orgSlug}/registration`];
    return (
      <>
        <div className="header-container header-desktop">
          <div className="header-row-1">
            <div className="header-row-1-inner">
              <div className="header-left">
                <div className="header-logo-div">
                  {logo && logo.url ? (
                    <Link to={`/${orgSlug}`}>
                      <img
                        src={getAssetPath(orgSlug, logo.url)}
                        alt={logo.alternate_text}
                        className="header-logo-image header-desktop-logo-image"
                      />
                    </Link>
                  ) : null}
                </div>
              </div>

              {secondLogo && (
                <div className="header-logo-2">
                  <img
                    src={getAssetPath(orgSlug, secondLogo.url)}
                    alt={secondLogo.alternate_text}
                    className="header-logo-image header-desktop-logo-image"
                  />
                </div>
              )}

              <div className="header-right">
                {languages.map((lang) => (
                  <button
                    type="button"
                    className={`${
                      language === lang.slug ? "active " : ""
                    }header-language-btn header-desktop-language-btn header-language-btn-${
                      lang.slug
                    }`}
                    key={lang.slug}
                    onClick={() => setLanguage(lang.slug)}
                  >
                    {lang.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="header-row-2">
            <div className="header-row-2-inner">
              {links.map((link, index) => {
                if (!shouldLinkBeShown(link, isAuthenticated, userData)) {
                  return null;
                }
                if (
                  isInternalLink(link.url) &&
                  (internalLinks.indexOf(link.url) < 0 || !isAuthenticated)
                ) {
                  return (
                    <Link
                      className={`header-link header-desktop-link
                  header-link-${index + 1} ${
                        pathname === link.url.replace("{orgSlug}", orgSlug)
                          ? "active"
                          : ""
                      } button `}
                      to={link.url.replace("{orgSlug}", orgSlug)}
                      key={index}
                    >
                      {getText(link.text, language)}
                    </Link>
                  );
                }
                return (
                  <a
                    href={link.url}
                    className={`header-link header-desktop-link
                    header-link-${index + 1} button`}
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
        <div className="header-mobile ">
          <div className="header-row-1">
            <div className="header-row-1-inner">
              <div className="header-left">
                <div className="header-logo-div">
                  {logo && logo.url ? (
                    <Link to={`/${orgSlug}`}>
                      <img
                        src={getAssetPath(orgSlug, logo.url)}
                        alt={logo.alternate_text}
                        className="header-logo-image header-mobile-logo-image"
                      />
                    </Link>
                  ) : null}
                </div>
              </div>
              {secondLogo && (
                <div className="header-logo-2">
                  <img
                    src={getAssetPath(orgSlug, secondLogo.url)}
                    alt={secondLogo.alternate_text}
                    className="header-logo-image header-mobile-logo-image"
                  />
                </div>
              )}
              <div className="header-right">
                <div
                  role="button"
                  tabIndex={0}
                  className="header-hamburger"
                  onClick={this.handleHamburger}
                  onKeyUp={this.handleKeyUp}
                >
                  <div className={`${menu ? "rot45" : ""}`} />
                  <div className={`${menu ? "rot-45" : ""}`} />
                  <div className={`${menu ? "opacity-hidden" : ""}`} />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`${
              menu ? "display-flex" : "display-none"
            } header-mobile-menu`}
          >
            {links.map((link, index) => {
              if (shouldLinkBeShown(link, isAuthenticated, userData)) {
                if (isInternalLink(link.url)) {
                  return (
                    <Link
                      className={`header-link mobile-link
                    header-link-${index + 1} ${
                        pathname === link.url.replace("{orgSlug}", orgSlug)
                          ? "active"
                          : ""
                      } button`}
                      to={link.url.replace("{orgSlug}", orgSlug)}
                      key={index}
                    >
                      {getText(link.text, language)}
                    </Link>
                  );
                }
                return (
                  <a
                    href={link.url}
                    className={`header-link mobile-link
                      header-link-${index + 1} button`}
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
            <div className="mobile-languages-row">
              {languages.map((lang) => (
                <button
                  type="button"
                  className={`${
                    language === lang.slug ? "active " : ""
                  }header-language-btn header-mobile-language-btn header-language-btn-${
                    lang.slug
                  }`}
                  key={lang.slug}
                  onClick={() => setLanguage(lang.slug)}
                >
                  {lang.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
}
Header.defaultProps = {
  isAuthenticated: false,
};
Header.propTypes = {
  header: PropTypes.shape({
    logo: PropTypes.shape({
      alternate_text: PropTypes.string,
      url: PropTypes.string,
    }),
    second_logo: PropTypes.shape({
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
  userData: PropTypes.object.isRequired,
};
