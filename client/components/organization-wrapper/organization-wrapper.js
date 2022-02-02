/* eslint-disable camelcase */
/* eslint jsx-a11y/label-has-associated-control: 0 */
import "./index.css";

import PropTypes from "prop-types";
import React, {Suspense} from "react";
import {Cookies} from "react-cookie";
import {Helmet} from "react-helmet";
import {Navigate, Route, Routes} from "react-router-dom";
import {t} from "ttag";

import getAssetPath from "../../utils/get-asset-path";
import Header from "../header";
import Footer from "../footer";
import LoadingContext from "../../utils/loading-context";
import Loader from "../../utils/loader";
import needsVerify from "../../utils/needs-verify";
import loadTranslation from "../../utils/load-translation";
import Login from "../login";
import {
  Registration,
  Status,
  PasswordChange,
  MobilePhoneChange,
  PasswordReset,
  PasswordConfirm,
  Logout,
  MobilePhoneVerification,
  PaymentStatus,
  PaymentProcess,
  ConnectedDoesNotExist,
  DoesNotExist,
} from "./lazy-import";
import {localStorage} from "../../utils/storage";
import isOldBrowser from "../../utils/is-old-browser";

export default class OrganizationWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      translationLoaded: true,
      configLoaded: false,
    };
    this.loadLanguage = this.loadLanguage.bind(this);
  }

  async componentDidMount() {
    const {params, setOrganization, cookies} = this.props;
    const organizationSlug = params.organization;
    if (organizationSlug) await setOrganization(organizationSlug, cookies);
    this.setState({translationLoaded: false, configLoaded: true});
  }

  async componentDidUpdate(prevProps) {
    const {setOrganization, params, cookies, language} = this.props;
    const {translationLoaded, configLoaded} = this.state;
    if (prevProps.params.organization !== params.organization) {
      if (params.organization) setOrganization(params.organization, cookies);
    }
    if (translationLoaded !== true && configLoaded === true) {
      const userLangChoice = localStorage.getItem(
        `${params.organization}-userLangChoice`,
      );
      if (userLangChoice) {
        await this.loadLanguage(userLangChoice, params.organization, false);
      } else await this.loadLanguage(language, params.organization, true);
    } else if (prevProps.language !== language && prevProps.language !== "") {
      this.setLoading(true);
      localStorage.setItem(`${params.organization}-userLangChoice`, language);
      await this.loadLanguage(language, params.organization, false);
      this.setLoading(false);
    }
  }

  setLoading = (value) => {
    this.setState({loading: value});
  };

  loadLanguage = async (language, orgSlug, useBrowserLang = false) => {
    const {languages, defaultLanguage, setLanguage} = this.props;
    await loadTranslation(
      language,
      orgSlug,
      defaultLanguage,
      setLanguage,
      useBrowserLang,
      languages,
    );
    this.setState(
      {
        translationLoaded: true,
        configLoaded: false,
      },
      () => this.setState({configLoaded: true}), // to force re-render in child components
    );
  };

  render() {
    const {organization, params, cookies, location} = this.props;
    const {loading, translationLoaded, configLoaded} = this.state;
    const {
      title,
      favicon,
      isAuthenticated,
      userData,
      settings,
      pageTitle,
      slug: orgSlug,
      name: orgName,
      css_path: cssPath,
      js,
    } = organization.configuration;
    const {is_active} = userData;
    let {css} = organization.configuration;
    if (!css) css = [];
    if (cssPath) css.push(cssPath);
    const userAutoLogin = localStorage.getItem("userAutoLogin") === "true";
    const needsVerifyPhone = needsVerify("mobile_phone", userData, settings);
    if (organization.exists === true) {
      const {setLoading} = this;
      let extraClasses = "";
      if (loading) extraClasses += " no-scroll";
      if (isOldBrowser()) extraClasses += " oldbrowser";
      return (
        <>
          {translationLoaded && configLoaded ? (
            <LoadingContext.Provider
              value={{setLoading, getLoading: () => loading}}
            >
              <div className={`app-container ${extraClasses}`}>
                <Routes>
                  <Route
                    path="*"
                    element={<Header location={location} params={params} />}
                  />
                </Routes>
                <Routes>
                  <Route
                    path=""
                    exact
                    element={<Navigate to={`/${orgSlug}/login`} />}
                  />
                  <Route
                    path="*"
                    element={
                      <Suspense fallback={<Loader />}>
                        <ConnectedDoesNotExist />
                      </Suspense>
                    }
                  />
                  <Route
                    path="registration/*"
                    element={(() => {
                      if (isAuthenticated && !needsVerifyPhone) {
                        return <Navigate to={`/${orgSlug}/status`} />;
                      }
                      if (isAuthenticated && needsVerifyPhone) {
                        return (
                          <Navigate
                            to={`/${orgSlug}/mobile-phone-verification`}
                          />
                        );
                      }
                      return (
                        <Suspense fallback={<Loader />}>
                          <Registration loading={loading} />
                        </Suspense>
                      );
                    })()}
                  />
                  <Route
                    path="mobile-phone-verification"
                    element={(() => {
                      if (
                        isAuthenticated &&
                        needsVerifyPhone === false &&
                        is_active
                      ) {
                        return <Navigate to={`/${orgSlug}/status`} />;
                      }
                      if (!isAuthenticated) {
                        return <Navigate to={`/${orgSlug}/login`} />;
                      }
                      return (
                        <Suspense fallback={<Loader />}>
                          <MobilePhoneVerification cookies={cookies} />
                        </Suspense>
                      );
                    })()}
                  />
                  <Route
                    path="password/reset/confirm/:uid/:token"
                    element={
                      isAuthenticated ? (
                        <Navigate to={`/${orgSlug}/status`} />
                      ) : (
                        <Suspense fallback={<Loader />}>
                          <PasswordConfirm />
                        </Suspense>
                      )
                    }
                  />
                  <Route
                    path="password/reset"
                    exact
                    element={
                      isAuthenticated ? (
                        <Navigate to={`/${orgSlug}/status`} />
                      ) : (
                        <Suspense fallback={<Loader />}>
                          <PasswordReset />
                        </Suspense>
                      )
                    }
                  />
                  <Route
                    path="login/*"
                    element={
                      isAuthenticated && is_active ? (
                        <Navigate to={`/${orgSlug}/status`} />
                      ) : (
                        <Login />
                      )
                    }
                  />
                  <Route
                    path="status"
                    element={(() => {
                      if (isAuthenticated && needsVerifyPhone)
                        return (
                          <Navigate
                            to={`/${orgSlug}/mobile-phone-verification`}
                          />
                        );
                      if (isAuthenticated) {
                        return (
                          <Suspense fallback={<Loader />}>
                            <Status cookies={cookies} location={location} />
                          </Suspense>
                        );
                      }
                      if (userAutoLogin)
                        return <Navigate to={`/${orgSlug}/logout`} />;
                      return <Navigate to={`/${orgSlug}/login`} />;
                    })()}
                  />
                  <Route
                    path="logout"
                    element={(() => {
                      if (isAuthenticated)
                        return <Navigate to={`/${orgSlug}/status`} />;
                      if (userAutoLogin)
                        return (
                          <Suspense fallback={<Loader />}>
                            <Logout />
                          </Suspense>
                        );
                      return <Navigate to={`/${orgSlug}/login`} />;
                    })()}
                  />
                  <Route
                    path="change-password"
                    element={
                      isAuthenticated ? (
                        <Suspense fallback={<Loader />}>
                          <PasswordChange cookies={cookies} />
                        </Suspense>
                      ) : (
                        <Navigate to={`/${orgSlug}/login`} />
                      )
                    }
                  />
                  <Route
                    path="change-phone-number"
                    element={
                      isAuthenticated ? (
                        <Suspense fallback={<Loader />}>
                          <MobilePhoneChange cookies={cookies} />
                        </Suspense>
                      ) : (
                        <Navigate to={`/${orgSlug}/login`} />
                      )
                    }
                  />
                  <Route
                    path="payment/process/"
                    element={
                      <Suspense fallback={<Loader />}>
                        <PaymentProcess cookies={cookies} />
                      </Suspense>
                    }
                  />
                  <Route
                    path="payment/:status"
                    element={
                      <Suspense fallback={<Loader />}>
                        <PaymentStatus cookies={cookies} />
                      </Suspense>
                    }
                  />
                </Routes>
                <Routes>
                  <Route path="*" element={<Footer />} />
                </Routes>
              </div>
              <Helmet>
                <title>
                  {pageTitle === undefined
                    ? t`DEFAULT_TITL${orgName}`
                    : pageTitle}
                </title>
              </Helmet>
              {loading && <Loader />}
            </LoadingContext.Provider>
          ) : null}
          {css && css.length !== 0 && orgSlug ? (
            <Helmet>
              {css.map((cssLocation) => (
                <link
                  rel="stylesheet"
                  href={getAssetPath(orgSlug, cssLocation)}
                  key={cssLocation}
                />
              ))}
            </Helmet>
          ) : null}
          {favicon && orgSlug ? (
            <Helmet>
              <link
                rel="shortcut icon"
                type="image/x-icon"
                href={getAssetPath(orgSlug, favicon)}
              />
            </Helmet>
          ) : null}
          {js && js.length !== 0 && orgSlug ? (
            <Helmet>
              {js.map((jsPath) => (
                <script src={getAssetPath(orgSlug, jsPath)} key={jsPath} />
              ))}
            </Helmet>
          ) : null}
        </>
      );
    }
    if (organization.exists === false) {
      return (
        <>
          <div className="org-wrapper-not-found">
            <Suspense fallback={<Loader />}>
              <DoesNotExist />
            </Suspense>
          </div>
        </>
      );
    }
    return <Loader />;
  }
}
OrganizationWrapper.defaultProps = {
  defaultLanguage: "",
  languages: [],
};
OrganizationWrapper.propTypes = {
  params: PropTypes.shape({
    organization: PropTypes.string.isRequired,
  }).isRequired,
  location: PropTypes.object.isRequired,
  setOrganization: PropTypes.func.isRequired,
  setLanguage: PropTypes.func.isRequired,
  organization: PropTypes.shape({
    configuration: PropTypes.shape({
      title: PropTypes.string,
      pageTitle: PropTypes.string,
      css_path: PropTypes.string,
      css: PropTypes.array,
      slug: PropTypes.string,
      name: PropTypes.string,
      favicon: PropTypes.string,
      isAuthenticated: PropTypes.bool,
      needsVerifyPhone: PropTypes.bool,
      userData: PropTypes.object,
      settings: PropTypes.shape({
        mobile_phone_verification: PropTypes.bool,
      }),
      js: PropTypes.array,
    }),
    exists: PropTypes.bool,
  }).isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  language: PropTypes.string.isRequired,
  defaultLanguage: PropTypes.string,
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      slug: PropTypes.string,
      text: PropTypes.string,
    }),
  ),
};
