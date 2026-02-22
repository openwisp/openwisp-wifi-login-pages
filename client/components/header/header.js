/* eslint-disable react/no-array-index-key */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";
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

  getStickyMsg = () => {
    const {stickyMsg} = this.state;
    const {header, language} = this.props;
    const {sticky_html: stickyHtml} = header;
    return stickyMsg && stickyHtml ? (
      <div className="sticky-container" role="banner">
        <div className="inner">
          {getHtml(stickyHtml, language, "sticky-msg")}
          <button
            type="button"
            className="close-sticky-btn"
            onClick={() => this.setState({stickyMsg: false})}
          >
            ✖
          </button>
        </div>
      </div>
    ) : null;
  };

  renderLogos = (isMobile = false) => {
    const {header, orgSlug} = this.props;
    const {logo, second_logo: secondLogo} = header;
    const deviceClass = isMobile ? "mobile" : "desktop";

    return (
      <>
        <div className="header-logo-div">
          {logo?.url && (
            <Link to={`/${orgSlug}`}>
              <img
                src={getAssetPath(orgSlug, logo.url)}
                alt={logo.alternate_text}
                className={`header-logo-image header-${deviceClass}-logo-image`}
              />
            </Link>
          )}
        </div>
        {secondLogo?.url && (
          <div className="header-logo-2">
            <img
              src={getAssetPath(orgSlug, secondLogo.url)}
              alt={secondLogo.alternate_text}
              className={`header-logo-image header-${deviceClass}-logo-image`}
            />
          </div>
        )}
      </>
    );
  };

  renderLanguageButtons = (isMobile = false) => {
    const {languages, language, setLanguage} = this.props;
    const deviceClass = isMobile ? "mobile" : "desktop";

    return languages.map((lang) => (
      <button
        type="button"
        key={lang.slug}
        className={`${language === lang.slug ? "active " : ""}header-language-btn header-${deviceClass}-language-btn header-language-btn-${lang.slug}`}
        onClick={() => setLanguage(lang.slug)}
      >
        {lang.text}
      </button>
    ));
  };

  renderNavLinks = (isMobile = false) => {
    const {header, orgSlug, isAuthenticated, userData, language, location} =
      this.props;
    const {links} = header;
    const {pathname} = location;
    const internalLinks = ["/login", "/registration"].map(
      (p) => `/${orgSlug}${p}`,
    );

    return links?.map((link, index) => {
      if (!shouldLinkBeShown(link, isAuthenticated, userData)) return null;

      const isInternal = isInternalLink(link.url);
      const resolvedUrl = link.url.replace("{orgSlug}", orgSlug);
      const isActive = pathname === resolvedUrl;
      const className = `header-link ${isMobile ? "mobile-link" : "header-desktop-link"} header-link-${index + 1} ${isActive ? "active" : ""} button`;

      if (
        isInternal &&
        (internalLinks.indexOf(resolvedUrl) < 0 || !isAuthenticated)
      ) {
        return (
          <Link className={className} to={resolvedUrl} key={resolvedUrl}>
            {getText(link.text, language)}
          </Link>
        );
      }
      return (
        <a
          href={resolvedUrl}
          className={className}
          target="_blank"
          rel="noreferrer noopener"
          key={resolvedUrl}
        >
          {getText(link.text, language)}
        </a>
      );
    });
  };

  render() {
    const {menu} = this.state;

    return (
      <>
        <header className="main-header">
          {/* Row 1: Logo and Languages */}
          <div className="header-row-1">
            <div className="header-row-1-inner">
              <div className="header-left">{this.renderLogos()}</div>
              {/* Desktop Languages */}
              <div className="header-right header-desktop-only">
                {this.renderLanguageButtons()}
              </div>
              {/* Mobile Hamburger */}
              <div className="header-right header-mobile-only">
                <div
                  role="button"
                  className="header-hamburger"
                  tabIndex={0}
                  aria-label="Toggle menu"
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
          {/* Row 2: Desktop Navigation */}
          <div className="header-row-2 header-desktop-only">
            <div className="header-row-2-inner">{this.renderNavLinks()}</div>
          </div>
          {/* Mobile Menu Overlay */}
          <div
            className={`${menu ? "display-flex" : "display-none"} header-mobile-menu header-mobile-only`}
          >
            {this.renderLogos(true)}
            {this.renderNavLinks(true)}
            <div className="mobile-languages-row">
              {this.renderLanguageButtons(true)}
            </div>
          </div>
        </header>
        {this.getStickyMsg()}
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
