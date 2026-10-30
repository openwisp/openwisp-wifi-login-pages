/* eslint-disable camelcase */
/* eslint jsx-a11y/label-has-associated-control: 0 */
/* eslint-disable react/no-unstable-nested-components */
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
import {userPendingVerification} from "../../utils/pending-verification";
import Login from "../login";
import {
  Registration,
  Status,
  PasswordChange,
  MobilePhoneChange,
  PasswordReset,
  PasswordConfirm,
  MobilePhoneVerification,
  PaymentStatus,
  PaymentProcess,
  CompleteSignup,
  ConnectedDoesNotExist,
  DoesNotExist,
} from "./lazy-import";
import Logout from "./lazy-logout";
import {localStorage} from "../../utils/storage";
import isOldBrowser from "../../utils/is-old-browser";
import {getPaymentRoute, hasPendingPayment} from "../../utils/payment";
import {cleanContinuationSearch} from "../../utils/continuation";
import routes from "../../constants/routes";

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
    const {params, setOrganization, cookies, location} = this.props;
    const organizationSlug = params.organization;
    if (organizationSlug) {
      await setOrganization(organizationSlug, cookies, location);
    }
    this.setState({translationLoaded: false, configLoaded: true});
  }

  async componentDidUpdate(prevProps) {
    const {setOrganization, params, cookies, language, location} = this.props;
    const {translationLoaded, configLoaded} = this.state;
    if (prevProps.params.organization !== params.organization) {
      if (params.organization) {
        setOrganization(params.organization, cookies, location);
      }
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

  setLoading = (value, owner) => {
    if (!value && owner !== undefined && owner !== this.loadingOwner) {
      return;
    }
    this.loadingOwner = value ? owner : undefined;
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
    const {organization, params, cookies, location, navigate} = this.props;
    const {loading, translationLoaded, configLoaded} = this.state;
    const {
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
    const loginSearch = cleanContinuationSearch(
      location.search,
      settings && settings.passwordless_auth_token_name,
    );
    let {css} = organization.configuration;
    if (!css) css = [];
    if (cssPath) css.push(cssPath);
    const userAutoLogin = localStorage.getItem("userAutoLogin") === "true";
    const needsVerifyPhone = needsVerify("mobile_phone", userData, settings);
    const needsVerifyBankCard = needsVerify("bank_card", userData, settings);
    const needsMethodSelection = userPendingVerification(userData);
    if (organization.exists === true) {
      const {setLoading} = this;
      let extraClasses = "";
      if (loading) extraClasses += " no-scroll";
      if (isOldBrowser()) extraClasses += " oldbrowser";
      return (
        <>
          {translationLoaded && configLoaded ? (
            <LoadingContext.Provider
              // eslint-disable-next-line react/jsx-no-constructed-context-values
              value={{setLoading, getLoading: () => loading}}
            >
              <div className={`app-container ${extraClasses}`}>
                <Routes>
                  <Route
                    path={routes.notFound.path}
                    element={<Header location={location} params={params} />}
                  />
                </Routes>
                <Routes>
                  <Route
                    path={routes.root.path}
                    exact
                    element={<Navigate to={`/${orgSlug}/login`} />}
                  />
                  <Route
                    path={routes.notFound.path}
                    element={
                      <Suspense fallback={<Loader />}>
                        <ConnectedDoesNotExist />
                      </Suspense>
                    }
                  />
                  <Route
                    path={routes.registration.path}
                    element={(() => {
                      if (isAuthenticated && needsMethodSelection) {
                        return <Navigate to={`/${orgSlug}/complete-signup`} />;
                      }
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
                          <Registration loading={loading} navigate={navigate} />
                        </Suspense>
                      );
                    })()}
                  />
                  <Route
                    path={routes.verification.path}
                    element={(() => {
                      if (isAuthenticated && needsMethodSelection) {
                        return <Navigate to={`/${orgSlug}/complete-signup`} />;
                      }
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
                    path={routes.passwordConfirm.path}
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
                    path={routes.passwordReset.path}
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
                    path={routes.login.path}
                    element={(() => {
                      if (isAuthenticated) {
                        if (needsMethodSelection) {
                          return (
                            <Navigate
                              to={`/${orgSlug}/complete-signup${loginSearch}`}
                            />
                          );
                        }
                        if (is_active) {
                          return (
                            <Navigate to={`/${orgSlug}/status${loginSearch}`} />
                          );
                        }
                      }
                      return <Login navigate={navigate} cookies={cookies} />;
                    })()}
                  />
                  <Route
                    path={routes.status.path}
                    element={(() => {
                      if (isAuthenticated) {
                        if (needsMethodSelection) {
                          return (
                            <Navigate to={`/${orgSlug}/complete-signup`} />
                          );
                        }
                        if (needsVerifyPhone) {
                          return (
                            <Navigate
                              to={`/${orgSlug}/mobile-phone-verification`}
                            />
                          );
                        }
                        return (
                          <Suspense fallback={<Loader />}>
                            <Status
                              cookies={cookies}
                              location={location}
                              navigate={navigate}
                            />
                          </Suspense>
                        );
                      }
                      if (userAutoLogin)
                        return <Navigate to={`/${orgSlug}/logout`} />;
                      return <Navigate to={`/${orgSlug}/login`} />;
                    })()}
                  />
                  <Route
                    path={routes.logout.path}
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
                    path={routes.passwordChange.path}
                    element={
                      isAuthenticated ? (
                        <Suspense fallback={<Loader />}>
                          <PasswordChange
                            cookies={cookies}
                            navigate={navigate}
                          />
                        </Suspense>
                      ) : (
                        <Navigate to={`/${orgSlug}/login`} />
                      )
                    }
                  />
                  <Route
                    path={routes.phoneChange.path}
                    element={
                      isAuthenticated ? (
                        <Suspense fallback={<Loader />}>
                          <MobilePhoneChange
                            cookies={cookies}
                            navigate={navigate}
                          />
                        </Suspense>
                      ) : (
                        <Navigate to={`/${orgSlug}/login`} />
                      )
                    }
                  />
                  <Route
                    path={routes.paymentProcess.path}
                    element={
                      <Suspense fallback={<Loader />}>
                        <PaymentProcess cookies={cookies} navigate={navigate} />
                      </Suspense>
                    }
                  />
                  <Route
                    path={routes.paymentStatus.path}
                    element={
                      <Suspense fallback={<Loader />}>
                        <PaymentStatus cookies={cookies} />
                      </Suspense>
                    }
                  />
                  <Route
                    path={routes.signup.path}
                    element={(() => {
                      if (!isAuthenticated) {
                        return <Navigate to={`/${orgSlug}/login`} />;
                      }
                      if (!needsMethodSelection) {
                        if (needsVerifyPhone) {
                          return (
                            <Navigate
                              to={`/${orgSlug}/mobile-phone-verification`}
                            />
                          );
                        }
                        if (needsVerifyBankCard) {
                          const paymentRoute = hasPendingPayment(userData)
                            ? getPaymentRoute(orgSlug, userData, settings)
                            : `/${orgSlug}/payment/draft`;
                          return <Navigate to={paymentRoute} />;
                        }
                        return <Navigate to={`/${orgSlug}/status`} />;
                      }
                      return (
                        <Suspense fallback={<Loader />}>
                          <CompleteSignup navigate={navigate} />
                        </Suspense>
                      );
                    })()}
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
        <div className="org-wrapper-not-found">
          <Suspense fallback={<Loader />}>
            <DoesNotExist />
          </Suspense>
        </div>
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
  navigate: PropTypes.func.isRequired,
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
        subscriptions: PropTypes.bool,
        passwordless_auth_token_name: PropTypes.string,
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
