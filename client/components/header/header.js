/* eslint-disable react/no-array-index-key */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import isInternalLink from "../../utils/check-internal-links";
import getAssetPath from "../../utils/get-asset-path";
import getText from "../../utils/get-text";
import shouldLinkBeShown from "../../utils/should-link-be-shown";
import getHtml from "../../utils/get-html";

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menu: false,
      stickyMsg: true,
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

  getStickyMsg = () => {
    const { stickyMsg } = this.state;
    const { header, language } = this.props;
    const { sticky_html: stickyHtml } = header;
    return stickyMsg && stickyHtml ? (
      <div className="sticky-container" role="banner">
        <div className="inner">
          {getHtml(stickyHtml, language, "sticky-msg")}
          <button
            type="button"
            className="close-sticky-btn"
            onClick={() => this.setState({ stickyMsg: false })}
          >
            ✖
          </button>
        </div>
      </div>
    ) : null;
  };

  // Logos 
  renderLogos = (deviceClass) => {
    const { header, orgSlug } = this.props;
    const { logo, second_logo: secondLogo } = header;
    return (
      <>
        {logo?.url && (
          <div className="header-logo-div">
            <Link to={`/${orgSlug}`}>

              <img
                src={getAssetPath(orgSlug, logo.url)}
                alt={logo.alternate_text}
                className={`header-logo-image ${deviceClass}-logo-image`}
              />

            </Link>
          </div>
        )}
        {secondLogo && (
          <div className="header-logo-2">
            <img
              src={getAssetPath(orgSlug, secondLogo.url)}
              alt={secondLogo.alternate_text}
              className={`header-logo-image ${deviceClass}-logo-image`}
            />
          </div>
        )}
      </>
    );
  };

  //  Language Switcher
  renderLanguageSwitcher = (deviceClass) => {
    const { languages, language, setLanguage } = this.props;
    return (
      <div className={`header-languages ${deviceClass}-languages`}>
        {languages.map((lang) => (
          <button
            type="button"
            key={lang.slug}
            className={`${language === lang.slug ? "active " : ""}header-language-btn ${deviceClass}-language-btn header-language-btn-${lang.slug}`}
            onClick={() => setLanguage(lang.slug)}
          >
            {lang.text}
          </button>
        ))}
      </div>
    );
  };

  //  Navigation Links
  renderNavLinks = (deviceClass) => {
    const { header, language, orgSlug, location, isAuthenticated, userData } = this.props;
    const { links } = header;
    const { pathname } = location;
    const internalLinks = [`/${orgSlug}/login`, `/${orgSlug}/registration`];

    return (
      <nav className={`header-nav ${deviceClass}-nav`}>
        {links?.map((link, index) => {
          if (!shouldLinkBeShown(link, isAuthenticated, userData)) return null;

          const isInternal = isInternalLink(link.url) && (internalLinks.indexOf(link.url) < 0 || !isAuthenticated);
          const activeClass = pathname === link.url.replace("{orgSlug}", orgSlug) ? "active" : "";
          const commonProps = {
            className: `header-link ${deviceClass}-link header-link-${index + 1} ${activeClass} button`,
            key: link.url + index
          };

          return isInternal ? (
            <Link {...commonProps} to={link.url.replace("{orgSlug}", orgSlug)}>
              {getText(link.text, language)}
            </Link>
          ) : (
            <a {...commonProps} href={link.url} target="_blank" rel="noreferrer noopener">
              {getText(link.text, language)}
            </a>
          );
        })}
      </nav>
    );
  };

  render() {
    const { menu } = this.state;
    const { language } = this.props;

    return (
      <header className="unified-header">
        <div className="header-row-1">
          <div className="header-row-1-inner">
            
            <div className="header-left">
              {this.renderLogos("responsive")}
            </div>


            <div className="header-right desktop-only">
              {this.renderLanguageSwitcher("header-desktop")}
            </div>


            <div className="header-right mobile-only">
              <div
                role="button"
                tabIndex={0}
                className="header-hamburger"
                onClick={this.handleHamburger}
                onKeyUp={this.handleKeyUp}
                aria-label={getText({ en: "Menu Button" }, language)}
              >
                <div className={`${menu ? "rot45" : ""}`} />
                <div className={`${menu ? "rot-45" : ""}`} />
                <div className={`${menu ? "opacity-hidden" : ""}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="header-row-2 desktop-only">
          <div className="header-row-2-inner">
            {this.renderNavLinks("header-desktop")}
          </div>
        </div>

       
        <div className={`header-mobile-menu ${menu ? "display-flex" : "display-none"} mobile-only`}>
          {this.renderNavLinks("mobile")}
          {this.renderLanguageSwitcher("header-mobile")}
        </div>

        {this.getStickyMsg()}
      </header>
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
    sticky_html: PropTypes.object,
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

