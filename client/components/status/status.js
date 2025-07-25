/* eslint-disable camelcase */
/* eslint jsx-a11y/label-has-associated-control: 0 */
import "./index.css";

import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import PropTypes from "prop-types";
import React from "react";
import {Cookies} from "react-cookie";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import InfinteScroll from "react-infinite-scroll-component";
import {t, gettext} from "ttag";
import bytes from "bytes";
import {timeFromSeconds} from "duration-formatter";
import getLanguageHeaders from "../../utils/get-language-headers";

import {
  getUserRadiusSessionsUrl,
  getUserRadiusUsageUrl,
  upgradePlanApiUrl,
  mainToastId,
} from "../../constants";
import LoadingContext from "../../utils/loading-context";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import Contact from "../contact-box";
import shouldLinkBeShown from "../../utils/should-link-be-shown";
import validateToken from "../../utils/validate-token";
import needsVerify from "../../utils/needs-verify";
import Loader from "../../utils/loader";
import {initialState} from "../../reducers/organization";
import Logout from "../organization-wrapper/lazy-logout";
import InfoModal from "../../utils/modal";
import {localStorage} from "../../utils/storage";
import handleSession from "../../utils/session";
import getPlanSelection from "../../utils/get-plan-selection";
import getPlans from "../../utils/get-plans";

export default class Status extends React.Component {
  constructor(props) {
    super(props);
    this.loginIframeRef = React.createRef();
    this.loginFormRef = React.createRef();
    this.logoutIframeRef = React.createRef();
    this.logoutFormRef = React.createRef();
    this.state = {
      username: "",
      password: "",
      activeSessions: [],
      pastSessions: [],
      sessionsToLogout: [],
      loggedOut: false,
      userInfo: {},
      currentPage: 1,
      hasMoreSessions: false,
      screenWidth: window.innerWidth,
      loadSpinner: true,
      showRadiusUsage: true,
      radiusUsageSpinner: true,
      modalActive: false,
      rememberMe: false,
      userChecks: [],
      userPlan: {},
      upgradePlanModalActive: false,
      upgradePlans: [],
    };
    this.repeatLogin = false;
    this.getUserRadiusSessions = this.getUserRadiusSessions.bind(this);
    this.getUserRadiusUsage = this.getUserRadiusUsage.bind(this);
    this.getPlansSuccessCallback = this.getPlansSuccessCallback.bind(this);
    this.upgradeUserPlan = this.upgradeUserPlan.bind(this);
    this.handleSessionLogout = this.handleSessionLogout.bind(this);
    this.fetchMoreSessions = this.fetchMoreSessions.bind(this);
    this.updateScreenWidth = this.updateScreenWidth.bind(this);
    this.updateSpinner = this.updateSpinner.bind(this);
  }

  async componentDidMount() {
    const {
      cookies,
      orgSlug,
      settings,
      setUserData,
      logout,
      setTitle,
      orgName,
      language,
      navigate,
      statusPage,
      captivePortalSyncAuth,
    } = this.props;
    setTitle(t`STATUS_TITL`, orgName);
    const {setLoading} = this.context;
    let {userData} = this.props;
    this.setState({
      rememberMe: localStorage.getItem("rememberMe") === "true",
    });
    Logout.preload();

    // to prevent recursive call in case redirect url is status page
    if (window.top === window.self) {
      try {
        const {location, captivePortalLoginForm} = this.props;
        const searchParams = new URLSearchParams(location.search);
        const macaddr = searchParams.get(
          captivePortalLoginForm.macaddr_param_name,
        );

        window.addEventListener("message", this.handlePostMessage);

        if (macaddr) {
          cookies.set(`${orgSlug}_macaddr`, macaddr, {path: "/"});
        } else {
          cookies.remove(`${orgSlug}_macaddr`, {path: "/"});
        }
      } catch {
        //
      }

      setLoading(true);
      const isValid = await validateToken(
        cookies,
        orgSlug,
        setUserData,
        userData,
        logout,
        language,
      );

      // stop here if token is invalid
      if (isValid === false) {
        setLoading(false);
        return;
      }

      const {
        mustLogin: userMustLogin,
        mustLogout: userMustLogout,
        repeatLogin,
      } = userData;
      const mustLogin = this.resolveStoredValue(
        captivePortalSyncAuth,
        `${orgSlug}_mustLogin`,
        userMustLogin,
        cookies,
      );
      const mustLogout = this.resolveStoredValue(
        captivePortalSyncAuth,
        `${orgSlug}_mustLogout`,
        userMustLogout,
        cookies,
      );
      // If the user is already logged in, we need to handle the
      // the response from the captive portal.
      if (captivePortalSyncAuth && !mustLogin && !mustLogout) {
        this.handleLogin();
      }
      ({userData} = this.props);
      if (userData.password_expired === true) {
        toast.warning(t`PASSWORD_EXPIRED`);
        setUserData({
          ...userData,
          mustLogin,
          mustLogout,
          repeatLogin,
        });
        navigate(`/${orgSlug}/change-password`);
        return;
      }
      const {
        radius_user_token: password,
        username,
        email,
        phone_number,
        is_active,
        method,
        is_verified: isVerified,
      } = userData;
      const userInfo = {};
      userInfo.status = "";
      userInfo.email = email;
      if (username !== email && username !== phone_number) {
        userInfo.username = username;
      }
      if (settings.mobile_phone_verification && phone_number) {
        userInfo.phone_number = phone_number;
      }
      this.setState({username, password, userInfo}, () => {
        // if the user is being automatically logged in but it's not
        // active anymore (eg: has been banned)
        // automatically perform log out
        if (is_active === false) {
          this.handleLogout(false);
        }
      });

      // stop here if user is banned
      if (is_active === false) {
        return;
      }

      if (mustLogout) {
        if (captivePortalSyncAuth) {
          // In synchronous captive portal authentication, the page reloads
          // after form submission, so handleLogoutIframe() must be called manually here.
          // (handleLogout() is already triggered when the user clicks the "Logout" button.)
          this.handleLogoutIframe();
        } else {
          await this.handleLogout(false, repeatLogin);
        }
        return;
      }

      const macaddr = cookies.get(`${orgSlug}_macaddr`);
      if (macaddr) {
        const params = {macaddr};
        await this.getUserActiveRadiusSessions(params);
        if (statusPage.radius_usage_enabled) {
          await this.getUserRadiusUsage();
        }
        /* request to captive portal is made only if there is
          no active session from macaddr stored in the cookie */
        const {activeSessions} = this.state;
        if (activeSessions && activeSessions.length === 0) {
          if (this.loginFormRef && this.loginFormRef.current) {
            this.notifyCpLogin(userData);
            this.loginFormRef.current.submit();
          }
        }
      } else if (this.loginFormRef && this.loginFormRef.current && mustLogin) {
        if (
          method === "bank_card" &&
          isVerified === false &&
          !settings.payment_requires_internet
        ) {
          this.finalOperations();
          return;
        }
        this.notifyCpLogin(userData);
        // When captivePortalSyncAuth is enabled, submitting the form causes a page reload,
        // which resets the component state and can trigger a redirect loop.
        // Storing the value in cookies preserves it across reloads and prevents the loop.
        this.storeValue(
          captivePortalSyncAuth,
          `${orgSlug}_mustLogin`,
          false,
          cookies,
        );
        this.loginFormRef.current.submit();
        // if user is already authenticated and coming from other pages
      } else if (!mustLogin) {
        this.finalOperations();
      }
    }
  }

  componentWillUnmount() {
    const {statusPage} = this.props;
    clearInterval(this.intervalId);
    if (statusPage.radius_usage_enabled) {
      clearInterval(this.usageIntervalId);
    }
    window.removeEventListener("resize", this.updateScreenWidth);
  }

  async finalOperations() {
    const {userData, orgSlug, settings, navigate, setUserData, statusPage} =
      this.props;
    const {setLoading} = this.context;
    // if the user needs bank card verification,
    // redirect to payment page and stop here
    if (needsVerify("bank_card", userData, settings)) {
      // avoid redirect loop from proceed to payment
      if (settings.payment_requires_internet && userData.proceedToPayment) {
        // reset proceedToPayment
        setUserData({
          ...userData,
          proceedToPayment: false,
        });
        navigate(`/${orgSlug}/payment/process`);
        return;
      }
      navigate(`/${orgSlug}/payment/draft`);
      return;
    }

    // if the user is not verified, do not remove the
    // loading overlay unless verification is not needed
    if (
      userData.is_verified ||
      !needsVerify("mobile_phone", userData, settings)
    ) {
      this.dismissCpLogin();
      setLoading(false);
      // if verification is needed, stop here
    } else {
      return;
    }

    // if everything went fine, load the user sessions
    await this.getUserActiveRadiusSessions();
    await this.getUserPassedRadiusSessions();
    this.intervalId = setInterval(() => {
      this.getUserActiveRadiusSessions();
    }, 60000);
    if (statusPage.radius_usage_enabled) {
      await this.getUserRadiusUsage();
      this.usageIntervalId = setInterval(() => {
        this.getUserRadiusUsage();
      }, 60000);
    }

    window.addEventListener("resize", this.updateScreenWidth);
    this.updateSpinner();
  }

  async getUserRadiusSessions(params) {
    const {cookies, orgSlug, logout, userData} = this.props;
    const url = getUserRadiusSessionsUrl(orgSlug);
    const auth_token = cookies.get(`${orgSlug}_auth_token`);
    handleSession(orgSlug, auth_token, cookies);
    const options = {};
    try {
      const response = await axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${userData.auth_token}`,
        },
        url,
        params,
      });
      const {headers} = response;
      if (params.is_open) {
        options.activeSessions = response.data;
        options.sessionsToLogout = response.data;
      } else {
        const {pastSessions} = this.state;
        options.pastSessions =
          params.page === 1
            ? response.data
            : pastSessions.concat(response.data);
        options.currentPage = params.page;
      }
      options.hasMoreSessions =
        "link" in headers && headers.link.includes("next");
      this.setState(options);
    } catch (error) {
      // logout only if unauthorized or forbidden
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        logout(cookies, orgSlug);
        toast.error(t`ERR_OCCUR`, {
          onOpen: () => toast.dismiss(mainToastId),
        });
      }
      logError(error, t`ERR_OCCUR`);
    }
  }

  async getUserRadiusUsage() {
    const {
      cookies,
      orgSlug,
      logout,
      userData,
      planExhausted,
      setPlanExhausted,
    } = this.props;
    const url = getUserRadiusUsageUrl(orgSlug);
    const auth_token = cookies.get(`${orgSlug}_auth_token`);
    handleSession(orgSlug, auth_token, cookies);
    const options = {radiusUsageSpinner: false};
    let isPlanExhausted = false;
    try {
      const response = await axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${userData.auth_token}`,
        },
        url,
      });
      if (response.data.plan) {
        options.userPlan = response.data.plan;
      }
      // Ensures showRadiusUsage is set to a boolean value even if response.data.checks is undefined.
      // This check confirms if the checks property exists, is an array, and contains elements.
      options.showRadiusUsage =
        Array.isArray(response.data.checks) && response.data.checks.length > 0;
      if (options.showRadiusUsage) {
        options.userChecks = response.data.checks;
        options.userChecks.forEach((check) => {
          if (check.value === String(check.result)) {
            isPlanExhausted = true;
          }
        });
        if (planExhausted !== isPlanExhausted) {
          setPlanExhausted(isPlanExhausted);
          if (isPlanExhausted) {
            toast.info(t`PLAN_EXHAUSTED_TOAST`);
          }
        }
      }
      this.setState(options);
    } catch (error) {
      if (error.response) {
        // Do not retry for client side errors
        if (error.response.status >= 400 && error.response.status < 500) {
          // Logout only if unauthorized or forbidden
          this.setState({showRadiusUsage: false});
          if (error.response.status === 401 || error.response.status === 403) {
            logout(cookies, orgSlug);
            toast.error(t`ERR_OCCUR`, {
              onOpen: () => toast.dismiss(mainToastId),
            });
          } else {
            logError(error, t`ERR_OCCUR`);
          }
          return;
        }
      }
      logError(error, t`ERR_OCCUR`);
      setTimeout(this.getUserRadiusUsage, 10000);
    }
  }

  getPlansSuccessCallback(plans) {
    this.setState({
      upgradePlans: plans.filter((plan) => plan.price !== "0.00"),
    });
  }

  async upgradeUserPlan(event) {
    const {language, orgSlug, cookies, userData, navigate, setUserData} =
      this.props;
    const upgradePlanUrl = upgradePlanApiUrl.replace("{orgSlug}", orgSlug);
    const auth_token = cookies.get(`${orgSlug}_auth_token`);
    const {upgradePlans} = this.state;
    handleSession(orgSlug, auth_token, cookies);
    axios({
      method: "post",
      headers: {
        "content-type": "application/json",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.auth_token}`,
      },
      url: upgradePlanUrl,
      data: {
        plan_pricing: upgradePlans[event.target.value].id,
      },
    })
      .then((response) => {
        toast.success(t`SUCCESS_UPGRADE_PLAN`, {
          onOpen: () => toast.dismiss(mainToastId),
        });
        setUserData({
          ...userData,
          payment_url: response.data.payment_url,
        });
        navigate(`/${orgSlug}/payment/process`);
      })
      .catch((error) => {
        toast.error(t`ERR_OCCUR`);
        logError(error, "Error while upgrading plan");
      });
  }

  async getUserActiveRadiusSessions(params = {}) {
    const para = {
      is_open: true,
      ...params,
    };
    await this.getUserRadiusSessions(para);
  }

  async getUserPassedRadiusSessions(params = {}) {
    const para = {
      page: 1,
      is_open: false,
      ...params,
    };
    await this.getUserRadiusSessions(para);
  }

  handleLogout = async (userAutoLogin, repeatLogin = false) => {
    const {setLoading} = this.context;
    const {
      orgSlug,
      logout,
      cookies,
      setUserData,
      internetMode,
      captivePortalSyncAuth,
    } = this.props;
    const macaddr = cookies.get(`${orgSlug}_macaddr`);
    const params = {macaddr};
    localStorage.setItem("userAutoLogin", String(userAutoLogin));
    setLoading(true);
    await this.getUserActiveRadiusSessions(params);
    const {sessionsToLogout} = this.state;

    if (sessionsToLogout.length > 0) {
      if (this.logoutFormRef && this.logoutFormRef.current) {
        if (!repeatLogin) {
          this.setState({loggedOut: true});
        } else {
          this.repeatLogin = true;
        }
        if (!internetMode) {
          this.storeValue(
            captivePortalSyncAuth,
            `${orgSlug}_mustLogout`,
            true,
            cookies,
          );
          this.logoutFormRef.current.submit();
        }
        return;
      }
    }

    if (repeatLogin) {
      return;
    }
    setUserData(initialState.userData);
    logout(cookies, orgSlug, userAutoLogin);
    setLoading(false);
    toast.success(t`LOGOUT_SUCCESS`);
  };

  /*
   * We use <iframe> to perform the POST to the captive portal login URL
   * so that the request is transparent for the user, which does not need
   * to be redirected to a different URL and then come back again.
   */
  handleLoginIframe = () => {
    if (!this.loginIframeRef || !this.loginIframeRef.current) {
      return;
    }
    const {userData, setUserData} = this.props;
    userData.mustLogin = false;
    setUserData(userData);
    /* eslint-disable-next-line no-underscore-dangle */
    this._handleLogin("iframe");
  };

  handleLogin = () => {
    /* eslint-disable-next-line no-underscore-dangle */
    this._handleLogin("window");
  };

  /* eslint-disable-next-line no-underscore-dangle */
  _handleLogin = (mode) => {
    const {
      captivePortalLoginForm,
      captivePortalSyncAuth,
      cookies,
      orgSlug,
      logout,
    } = this.props;
    try {
      const location =
        mode === "iframe"
          ? this.loginIframeRef.current.contentWindow.location
          : window.location;
      const title =
        mode === "iframe"
          ? this.loginIframeRef.current.contentDocument.title
          : document.title;
      const searchParams = new URLSearchParams(location.search);
      const reply = searchParams.get("reply");
      const macaddr = searchParams.get(
        captivePortalLoginForm.macaddr_param_name,
      );
      if (reply || title.indexOf("404") >= 0) {
        logout(cookies, orgSlug);
        toast.error(reply, {
          onOpen: () => toast.dismiss(mainToastId),
        });
      }
      if (macaddr) {
        cookies.set(`${orgSlug}_macaddr`, macaddr, {path: "/"});
      }
    } catch {
      //
    }
    if (!captivePortalSyncAuth) {
      this.finalOperations();
    }
  };

  // eslint-disable-next-line class-methods-use-this
  handleSamlLogout = (saml_logout_url) => {
    window.location.assign(saml_logout_url);
  };

  /*
   * We use <iframe> to perform the POST to the captive portal logout URL
   * so that the request is transparent for the user, which does not need
   * to be redirected to a different URL and then come back again.
   */
  handleLogoutIframe = async () => {
    if (!this.logoutIframeRef || !this.logoutIframeRef.current) {
      return;
    }
    const {
      setUserData,
      statusPage,
      orgSlug,
      logout,
      cookies,
      captivePortalLogoutForm,
      captivePortalSyncAuth,
    } = this.props;
    const {saml_logout_url} = statusPage;
    const {loggedOut} = this.state;
    const {repeatLogin} = this;
    const {setLoading} = this.context;
    const {wait_after} = captivePortalLogoutForm;
    const logoutMethodKey = `${orgSlug}_logout_method`;
    const logoutMethod = localStorage.getItem(logoutMethodKey);
    const userAutoLogin = localStorage.getItem("userAutoLogin") === "true";

    if (
      loggedOut ||
      this.resolveStoredValue(
        captivePortalSyncAuth,
        `${orgSlug}_mustLogout`,
        false,
        cookies,
      )
    ) {
      logout(cookies, orgSlug, userAutoLogin);
      toast.success(t`LOGOUT_SUCCESS`);

      if (saml_logout_url && logoutMethod === "saml") {
        toast.info(t`PLEASE_WAIT`, {autoClose: wait_after});
        setTimeout(async () => {
          localStorage.removeItem(logoutMethodKey);
          this.handleSamlLogout(saml_logout_url);
        }, wait_after);
        return;
      }
      setUserData(initialState.userData);
      setLoading(false);
    }

    if (repeatLogin) {
      this.repeatLogin = false;
      // wait to trigger login to avoid getting stuck
      // in captive portal firewall rule reloading
      toast.info(t`PLEASE_WAIT`, {autoClose: wait_after});
      setTimeout(async () => {
        toast.info(t`PLEASE_LOGIN`, {autoClose: 10000});
        setUserData(initialState.userData);
        setLoading(false);
        logout(cookies, orgSlug, userAutoLogin);
      }, wait_after);
    }
  };

  handlePostMessage = async (event) => {
    const {
      captivePortalLoginForm,
      logout,
      cookies,
      orgSlug,
      setInternetMode,
      setPlanExhausted,
    } = this.props;
    const {setLoading} = this.context;
    const {message, type} = event.data;
    // For security reasons, read https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concern
    if (
      event.origin === new URL(captivePortalLoginForm.action).origin ||
      event.origin === window.location.origin
    ) {
      switch (type) {
        case "authMessage":
        case "authError":
          if (!message) break;
          toast.dismiss();
          if (type === "authMessage") {
            /* disable ttag */
            toast.info(gettext(message));
            /* enable ttag */
            // Change the message on the status page to reflect plan exhaustion
            setPlanExhausted(true);
          } else {
            /* disable ttag */
            toast.error(gettext(message), {
              autoClose: 10000,
            });
            /* enable ttag */
            logout(cookies, orgSlug);
          }
          setLoading(false);
          break;

        case "internet-mode":
          setInternetMode(true);
          break;

        default:
        // do nothing
      }
    }
  };

  // eslint-disable-next-line class-methods-use-this
  storeValue = (captivePortalSyncAuth, key, value, cookies) => {
    /**
     * Stores a value in both cookies and localStorage if synchronous
     * captive portal authentication is enabled.
     *
     * In synchronous authentication, submitting the captive portal form
     * triggers a page reload, which resets the component state.
     * Storing the value in cookies ensures it persists across reloads.
     *
     * The value is also saved in localStorage as a fallback in case the browser does not support cookies.
     *
     * @param {boolean} captivePortalSyncAuth - Whether synchronous authentication is enabled.
     * @param {string} key - The key under which the value is stored.
     * @param {boolean} value - The value to store.
     * @param {Cookies} cookies - The cookies instance used to set the cookie.
     */
    if (!captivePortalSyncAuth) {
      return;
    }
    localStorage.setItem(key, value);
    cookies.set(key, value, {path: "/", maxAge: 60});
  };

  // eslint-disable-next-line class-methods-use-this
  resolveStoredValue = (captivePortalSyncAuth, key, fallback, cookies) => {
    /**
     * Resolves the correct value by checking cookies, then localStorage,
     * falling back to a default value if neither is found.
     *
     * @param {boolean} captivePortalSyncAuth - Whether synchronization is enabled.
     * @param {string} cookieKey - The key to look for in cookies and localStorage.
     * @param {*} fallback - The fallback value if no valid stored value is found.
     * @returns {*} - The selected value based on storage or fallback.
     */
    if (!captivePortalSyncAuth) {
      return fallback;
    }

    const cookieValue = cookies.get(key);
    if (cookieValue !== undefined) {
      localStorage.removeItem(key);
      return cookieValue;
    }

    const localStorageValue = localStorage.getItem(key);
    if (localStorageValue !== null) {
      localStorage.removeItem(key);
      return localStorageValue === "true";
    }

    return fallback;
  };

  updateScreenWidth = () => {
    this.setState({screenWidth: window.innerWidth});
  };

  updateSpinner = () => {
    const {activeSessions, pastSessions} = this.state;
    this.setState({loadSpinner: activeSessions.length || pastSessions.length});
  };

  toggleModal = () => {
    const {modalActive} = this.state;
    this.setState({modalActive: !modalActive});
  };

  toggleUpgradePlanModal = async () => {
    const {orgSlug, language} = this.props;
    const {upgradePlanModalActive, upgradePlans} = this.state;
    this.setState({upgradePlanModalActive: !upgradePlanModalActive});
    if (!upgradePlans.length) {
      await getPlans(orgSlug, language, this.getPlansSuccessCallback);
    }
  };

  async handleSessionLogout(session) {
    this.setState({
      sessionsToLogout: [session],
      pastSessions: [],
      activeSessions: [],
      currentPage: 0,
      hasMoreSessions: true,
    });
    const {setLoading} = this.context;
    if (this.logoutFormRef && this.logoutFormRef.current) {
      this.logoutFormRef.current.submit();
    }
    setLoading(true);
    await this.getUserPassedRadiusSessions();
    await this.getUserActiveRadiusSessions();
    setLoading(false);
  }

  async fetchMoreSessions() {
    const {currentPage} = this.state;
    await this.getUserPassedRadiusSessions({page: currentPage + 1});
  }

  // eslint-disable-next-line class-methods-use-this
  getDuration = (seconds) => {
    const number = Number(seconds);
    const h = Math.floor(number / 3600);
    const m = Math.floor((number % 3600) / 60);
    const s = Math.floor((number % 3600) % 60);
    const hDisplay = h > 0 ? h + (h === 1 ? " hr " : " hrs ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " min " : " mins ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " sec " : " secs ") : "";
    return hDisplay + mDisplay + sDisplay;
  };

  // eslint-disable-next-line class-methods-use-this
  getDateTimeFormat = (language, time_option, date) => {
    if (typeof Intl !== "undefined") {
      return new Intl.DateTimeFormat(language, time_option).format(
        new Date(date),
      );
    }
    return String(new Date(date));
  };

  getLargeTableRow = (session, sessionSettings, showLogoutButton = false) => {
    const {language} = this.props;
    const time_option = {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    };
    const activeSessionText = t`ACCT_ACTIVE`;
    return (
      <>
        <td>
          {this.getDateTimeFormat(language, time_option, session.start_time)}
        </td>
        <td>
          {session.stop_time === null
            ? activeSessionText
            : this.getDateTimeFormat(language, time_option, session.stop_time)}
        </td>
        <td>{this.getDuration(session.session_time)}</td>
        <td>
          {bytes(session.output_octets, {
            decimalPlaces: 0,
            unitSeparator: " ",
            unit: "MB",
          })}
        </td>
        <td>
          {bytes(session.input_octets, {
            decimalPlaces: 0,
            unitSeparator: " ",
            unit: "MB",
          })}
        </td>
        <td>
          {session.calling_station_id}
          {session.stop_time == null && showLogoutButton && (
            <input
              type="button"
              className="button small session-logout"
              value={t`LOGOUT`}
              onClick={() => {
                this.handleSessionLogout(session);
              }}
            />
          )}
        </td>
      </>
    );
  };

  getSmallTableRow = (session, session_info) => {
    const {captivePortalLogoutForm} = this.props;
    const time_option = {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    };
    const activeSessionText = session_info.settings.active_session;
    const {language} = this.props;
    return (
      <tbody key={session.session_id}>
        <tr
          key={`${session.session_id}start_time`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{session_info.header.start_time}:</th>
          <td>
            {this.getDateTimeFormat(language, time_option, session.start_time)}
          </td>
        </tr>
        <tr
          key={`${session.session_id}stop_time`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{session_info.header.stop_time}:</th>
          <td>
            {session.stop_time === null
              ? activeSessionText
              : this.getDateTimeFormat(
                  language,
                  time_option,
                  session.stop_time,
                )}
          </td>
        </tr>
        <tr
          key={`${session.session_id}duration`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{session_info.header.duration}:</th>
          <td>{this.getDuration(session.session_time)}</td>
        </tr>
        <tr
          key={`${session.session_id}download`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{session_info.header.download}:</th>
          <td>
            {bytes(session.output_octets, {
              decimalPlaces: 0,
              unitSeparator: " ",
              unit: "MB",
            })}
          </td>
        </tr>
        <tr
          key={`${session.session_id}upload`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{session_info.header.upload}:</th>
          <td>
            {bytes(session.input_octets, {
              decimalPlaces: 0,
              unitSeparator: " ",
              unit: "MB",
            })}
          </td>
        </tr>
        <tr
          key={`${session.session_id}device_address`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{session_info.header.device_address}:</th>
          <td>{session.calling_station_id}</td>
        </tr>
        {session.stop_time == null &&
          captivePortalLogoutForm.logout_by_session && (
            <tr key={`${session.session_id}logout`} className="active-session">
              <td className="row logout" colSpan="2">
                <input
                  type="button"
                  className="button full"
                  value={t`LOGOUT`}
                  onClick={() => {
                    this.handleSessionLogout(session);
                  }}
                  aria-label={t`LOGOUT`}
                />
              </td>
            </tr>
          )}
      </tbody>
    );
  };

  getLargeTable = (session_info) => {
    const {activeSessions, pastSessions} = this.state;
    const {captivePortalLogoutForm} = this.props;
    const showLogoutButton =
      captivePortalLogoutForm.logout_by_session && activeSessions.length > 1;
    return (
      <table className="large-table bg">
        <thead>
          <tr>
            {Object.keys(session_info.header).map((key) => (
              <th key={key}>{session_info.header[key]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeSessions.map((session) => (
            <tr
              key={session.session_id}
              className={session.stop_time === null ? "active-session" : ""}
            >
              {this.getLargeTableRow(
                session,
                session_info.settings,
                showLogoutButton,
              )}
            </tr>
          ))}
          {pastSessions.map((session) => (
            <tr
              key={session.session_id}
              className={session.stop_time === null ? "active-session" : ""}
            >
              {this.getLargeTableRow(session, session_info.settings)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  getSmallTable = (session_info) => {
    const {activeSessions, pastSessions} = this.state;
    return (
      <table className="small-table bg">
        {activeSessions.map((session) =>
          this.getSmallTableRow(session, session_info),
        )}
        {pastSessions.map((session) =>
          this.getSmallTableRow(session, session_info),
        )}
      </table>
    );
  };

  getTable = (session_info) => {
    const {screenWidth} = this.state;
    if (screenWidth > 656) {
      return this.getLargeTable(session_info);
    }
    return this.getSmallTable(session_info);
  };

  // eslint-disable-next-line class-methods-use-this
  getSpinner = () => <Loader full={false} small />;

  // eslint-disable-next-line class-methods-use-this
  getSessionInfo = () => ({
    header: {
      start_time: t`ACCT_START_TIME`,
      stop_time: t`ACCT_STOP_TIME`,
      duration: t`ACCT_DURATION`,
      download: t`ACCT_DOWNLOAD`,
      upload: t`ACCT_UPLOAD`,
      device_address: t`ACCT_DEVICE_ADDRESS`,
    },
    settings: {
      active_session: t`ACCT_ACTIVE`,
    },
  });

  // eslint-disable-next-line class-methods-use-this
  getUserInfo = () => ({
    status: {
      text: t`STATUS`,
      value: t`LOGGED_IN`,
    },
    email: {
      text: t`EMAIL`,
    },
    username: {
      text: t`USERNAME`,
    },
    phone_number: {
      text: t`PHONE_NUMBER`,
    },
  });

  // eslint-disable-next-line class-methods-use-this
  getUserCheckFormattedValue = (value, type) => {
    const intValue = parseInt(value, 10);
    switch (type) {
      case "bytes":
        return intValue === 0 ? 0 : bytes(intValue, {unitSeparator: " "});
      case "seconds":
        return timeFromSeconds(intValue);
      default:
        return value;
    }
  };

  render() {
    const {
      statusPage,
      language,
      orgSlug,
      captivePortalLoginForm,
      captivePortalLogoutForm,
      captivePortalSyncAuth,
      isAuthenticated,
      userData,
      internetMode,
      planExhausted,
      settings,
      defaultLanguage,
    } = this.props;
    const {links} = statusPage;
    const {
      username,
      password,
      userInfo,
      activeSessions,
      userChecks,
      userPlan,
      pastSessions,
      sessionsToLogout,
      hasMoreSessions,
      loadSpinner,
      showRadiusUsage,
      radiusUsageSpinner,
      upgradePlanModalActive,
      upgradePlans,
      modalActive,
      rememberMe,
    } = this.state;
    const user_info = this.getUserInfo();
    const contentArr = t`STATUS_CONTENT`.split("\n");
    if (planExhausted) {
      user_info.status.value = t`TRAFFIC_EXHAUSTED`;
    }
    userInfo.status = user_info.status.value;
    return (
      <>
        <InfoModal
          active={modalActive}
          toggleModal={this.toggleModal}
          handleResponse={this.handleLogout}
          content={<p className="message">{t`LOGOUT_MODAL_CONTENT`}</p>}
        />
        <div className="container content flex-wrapper" id="status">
          {settings.subscriptions && upgradePlans.length > 0 && (
            <InfoModal
              id="upgrade-plan-modal"
              active={upgradePlanModalActive}
              toggleModal={this.toggleUpgradePlanModal}
              handleResponse={() => {}}
              isConfirmationDialog={false}
              content={
                (upgradePlans.length &&
                  getPlanSelection(
                    defaultLanguage,
                    upgradePlans,
                    null,
                    this.upgradeUserPlan,
                  )) || <>{this.getSpinner()}</>
              }
            />
          )}
          {statusPage.radius_usage_enabled && showRadiusUsage && (
            <div className="inner flex-row limit-info">
              <div className="bg row">
                {radiusUsageSpinner ? this.getSpinner() : null}
                {settings.subscriptions && userPlan.name && (
                  <h3>
                    {t`CURRENT_SUBSCRIPTION_TXT`} {userPlan.name}
                  </h3>
                )}
                {userChecks &&
                  userChecks.map((check) => (
                    <div key={check.attribute}>
                      <progress
                        id={check.attribute}
                        max={check.value}
                        value={check.result}
                      />
                      <p className="progress">
                        <strong>
                          {this.getUserCheckFormattedValue(
                            check.result,
                            check.type,
                          )}
                        </strong>{" "}
                        of{" "}
                        {this.getUserCheckFormattedValue(
                          check.value,
                          check.type,
                        )}{" "}
                        used
                      </p>
                      {settings.subscriptions && planExhausted && (
                        <p className="exhausted">
                          <strong>{t`USAGE_LIMIT_EXHAUSTED_TXT`}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                {settings.subscriptions &&
                  (userPlan.is_free || planExhausted) && (
                    <p>
                      <button
                        id="plan-upgrade-btn"
                        type="button"
                        className="button partial"
                        onClick={this.toggleUpgradePlanModal}
                      >
                        {t`PLAN_UPGRADE_BTN_TXT`}
                      </button>
                    </p>
                  )}
              </div>
            </div>
          )}
          <div className="inner">
            <div className="main-column">
              <div className="inner">
                {!internetMode &&
                  !planExhausted &&
                  contentArr.map((text) => {
                    if (text !== "")
                      return (
                        <p key={text} className="status-content">
                          {text}
                        </p>
                      );
                    return null;
                  })}
                {Object.keys(userInfo).map((key) => (
                  <p key={key} className="status-content">
                    <label>{user_info[key].text}:</label>
                    <span>{userInfo[key]}</span>
                  </p>
                ))}

                <div className="row logout">
                  <input
                    type="button"
                    className="button full"
                    value={t`LOGOUT`}
                    onClick={
                      rememberMe
                        ? this.toggleModal
                        : () => this.handleLogout(false)
                    }
                  />
                </div>

                {links &&
                  links.map((link) => {
                    if (shouldLinkBeShown(link, isAuthenticated, userData)) {
                      return (
                        <div className="links row" key={link.url}>
                          <Link
                            className="button full status-link"
                            to={link.url.replace("{orgSlug}", orgSlug)}
                          >
                            {getText(link.text, language)}
                          </Link>
                        </div>
                      );
                    }
                    return null;
                  })}
              </div>
            </div>

            <Contact />
          </div>
        </div>

        <div id="sessions" className="flex-column">
          {((activeSessions.length > 0 || pastSessions.length > 0) && (
            <InfinteScroll
              dataLength={pastSessions.length}
              next={this.fetchMoreSessions}
              hasMore={hasMoreSessions}
              loader={this.getSpinner()}
              style={{overflow: false}}
            >
              <>{this.getTable(this.getSessionInfo())}</>
            </InfinteScroll>
          )) ||
            (loadSpinner ? this.getSpinner() : null)}
        </div>

        {/* check to ensure this block of code is executed in root document and not in Iframe */}
        {captivePortalLoginForm && window.top === window.self && (
          <>
            <form
              ref={this.loginFormRef}
              method={captivePortalLoginForm.method || "post"}
              id="cp-login-form"
              action={captivePortalLoginForm.action || ""}
              target={captivePortalSyncAuth ? "_self" : "owisp-auth-iframe"}
              className="hidden"
            >
              <input
                readOnly
                type="text"
                name={captivePortalLoginForm.fields.username || ""}
                value={username}
              />
              <input
                readOnly
                type="text"
                name={captivePortalLoginForm.fields.password || ""}
                value={password}
              />
              {captivePortalLoginForm.additional_fields &&
                captivePortalLoginForm.additional_fields.map((field) => (
                  <input
                    readOnly
                    type="text"
                    name={field.name}
                    value={field.value}
                    key={`input-${field.name}`}
                  />
                ))}
            </form>
            {/* login form is submitted in this Iframe
            onLoad: handles response from captive portal
            */}
            {username && (
              <iframe
                onLoad={this.handleLoginIframe}
                ref={this.loginIframeRef}
                name="owisp-auth-iframe"
                className="hidden"
                title="owisp-auth-iframe"
              />
            )}
          </>
        )}
        {captivePortalLogoutForm && window.top === window.self && (
          <>
            <form
              ref={this.logoutFormRef}
              method={captivePortalLogoutForm.method || "post"}
              id="cp-logout-form"
              action={captivePortalLogoutForm.action || ""}
              target={
                captivePortalSyncAuth ? "_self" : "owisp-auth-logout-iframe"
              }
              className="hidden"
            >
              <input
                readOnly
                type="hidden"
                name={captivePortalLogoutForm.fields.id || ""}
                value={
                  sessionsToLogout.length > 0
                    ? sessionsToLogout[0].session_id
                    : ""
                }
              />
              {captivePortalLogoutForm.additional_fields &&
                captivePortalLogoutForm.additional_fields.map((field) => (
                  <input
                    readOnly
                    type="text"
                    name={field.name}
                    value={field.value}
                  />
                ))}
            </form>
            <iframe
              onLoad={this.handleLogoutIframe}
              ref={this.logoutIframeRef}
              name="owisp-auth-logout-iframe"
              className="hidden"
              title="owisp-auth-iframe"
            />
          </>
        )}
      </>
    );
  }

  notifyCpLogin = (userData) => {
    // do not send notification if user is not verified yet
    if (userData.is_verified === false) {
      return;
    }
    this.cpLoginToastId = toast.info(t`CP_LOGIN`, {autoClose: 10000});
  };

  dismissCpLogin = () => {
    const {cpLoginToastId} = this;
    if (cpLoginToastId) toast.dismiss(this.cpLoginToastId);
  };
}
Status.contextType = LoadingContext;
Status.defaultProps = {
  isAuthenticated: false,
  internetMode: false,
  planExhausted: false,
};
Status.propTypes = {
  statusPage: PropTypes.shape({
    links: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.object.isRequired,
        url: PropTypes.string.isRequired,
      }),
    ),
    radius_usage_enabled: PropTypes.bool,
    saml_logout_url: PropTypes.string,
  }).isRequired,
  language: PropTypes.string.isRequired,
  defaultLanguage: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  userData: PropTypes.object.isRequired,
  internetMode: PropTypes.bool,
  planExhausted: PropTypes.bool,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  captivePortalSyncAuth: PropTypes.bool.isRequired,
  captivePortalLoginForm: PropTypes.shape({
    method: PropTypes.string,
    action: PropTypes.string,
    macaddr_param_name: PropTypes.string,
    fields: PropTypes.shape({
      username: PropTypes.string,
      password: PropTypes.string,
    }),
    additional_fields: PropTypes.array,
  }).isRequired,
  captivePortalLogoutForm: PropTypes.shape({
    method: PropTypes.string,
    action: PropTypes.string,
    fields: PropTypes.shape({
      id: PropTypes.string,
    }),
    additional_fields: PropTypes.array,
    logout_by_session: PropTypes.bool.isRequired,
    wait_after: PropTypes.number.isRequired,
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
    subscriptions: PropTypes.bool,
    payment_requires_internet: PropTypes.bool,
  }).isRequired,
  setUserData: PropTypes.func.isRequired,
  setInternetMode: PropTypes.func.isRequired,
  setPlanExhausted: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};
