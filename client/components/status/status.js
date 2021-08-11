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
import {t} from "ttag";
import {getUserRadiusSessionsUrl, mainToastId} from "../../constants";
import LoadingContext from "../../utils/loading-context";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import Contact from "../contact-box";
import shouldLinkBeShown from "../../utils/should-link-be-shown";
import handleSession from "../../utils/session";
import validateToken from "../../utils/validate-token";
import needsVerify from "../../utils/needs-verify";
import {initialState} from "../../reducers/organization";
import {Logout} from "../organization-wrapper/lazy-import";

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
      intervalId: null,
      screenWidth: window.innerWidth,
      loadSpinner: true,
      modalActive: false,
      rememberMe: false,
    };
    this.repeatLogin = false;
    this.getUserRadiusSessions = this.getUserRadiusSessions.bind(this);
    this.handleSessionLogout = this.handleSessionLogout.bind(this);
    this.fetchMoreSessions = this.fetchMoreSessions.bind(this);
    this.updateScreenWidth = this.updateScreenWidth.bind(this);
    this.updateSpinner = this.updateSpinner.bind(this);
  }

  async componentDidMount() {
    const {cookies, orgSlug, settings, setUserData, logout, setTitle, orgName} =
      this.props;
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
      );

      // stop here if token is invalid
      if (isValid === false) {
        setLoading(false);
        return;
      }

      const {justAuthenticated, mustLogout, repeatLogin} = userData;
      ({userData} = this.props);

      const {
        radius_user_token: password,
        username,
        email,
        phone_number,
        is_active,
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
        await this.handleLogout(false, repeatLogin);
        return;
      }

      const macaddr = cookies.get(`${orgSlug}_macaddr`);
      if (macaddr) {
        const params = {macaddr};
        await this.getUserActiveRadiusSessions(params);
        /* request to captive portal is made only if there is
          no active session from macaddr stored in the cookie */
        const {activeSessions} = this.state;
        if (activeSessions && activeSessions.length === 0) {
          if (this.loginFormRef && this.loginFormRef.current)
            this.loginFormRef.current.submit();
        }
      } else if (
        this.loginFormRef &&
        this.loginFormRef.current &&
        justAuthenticated
      ) {
        this.loginFormRef.current.submit();
        userData.justAuthenticated = false;
        setUserData(userData);
        // if user is already authenticated and coming from other pages
      } else if (!justAuthenticated) {
        this.finalOperations();
      }
    }
  }

  componentWillUnmount = () => {
    const {intervalId} = this.state;
    clearInterval(intervalId);
    window.removeEventListener("resize", this.updateScreenWidth);
  };

  async finalOperations() {
    const {userData, settings} = this.props;
    const {setLoading} = this.context;
    // if the user needs bank card verification,
    // redirect to payment page and stop here
    if (needsVerify("bank_card", userData, settings)) {
      window.location.assign(userData.payment_url);
      return;
    }

    // if the user is not verified, do not remove the
    // loading overlay unless verification is not needed
    if (
      userData.is_verified ||
      !needsVerify("mobile_phone", userData, settings)
    ) {
      setLoading(false);
      // if verification is needed, stop here
    } else {
      return;
    }

    // if everything went fine, load the user sessions
    await this.getUserActiveRadiusSessions();
    await this.getUserPassedRadiusSessions();
    const intervalId = setInterval(() => {
      this.getUserActiveRadiusSessions();
    }, 60000);
    this.setState({intervalId});
    window.addEventListener("resize", this.updateScreenWidth);
    this.updateSpinner();
  }

  async getUserRadiusSessions(para) {
    const {cookies, orgSlug, logout} = this.props;
    const url = getUserRadiusSessionsUrl(orgSlug);
    const auth_token = cookies.get(`${orgSlug}_auth_token`);
    const {token, session} = handleSession(orgSlug, auth_token, cookies);
    const options = {};
    const params = {
      token,
      session,
      ...para,
    };
    try {
      const response = await axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
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
        options.pastSessions = pastSessions.concat(response.data);
        options.currentPage = params.page;
      }
      options.hasMoreSessions =
        "link" in headers && headers.link.includes("next");
      this.setState(options);
    } catch (error) {
      logout(cookies, orgSlug);
      toast.error(t`ERR_OCCUR`, {
        onOpen: () => toast.dismiss(mainToastId),
      });
      logError(error, t`ERR_OCCUR`);
    }
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
    const {orgSlug, logout, cookies, setUserData} = this.props;
    const macaddr = cookies.get(`${orgSlug}_macaddr`);
    const params = {macaddr};
    localStorage.setItem("userAutoLogin", userAutoLogin);
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
        this.logoutFormRef.current.submit();
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
    const {cookies, orgSlug, logout, captivePortalLoginForm} = this.props;

    try {
      const searchParams = new URLSearchParams(
        this.loginIframeRef.current.contentWindow.location.search,
      );
      const reply = searchParams.get("reply");
      const macaddr = searchParams.get(
        captivePortalLoginForm.macaddr_param_name,
      );
      if (
        reply ||
        this.loginIframeRef.current.contentDocument.title.indexOf("404") >= 0
      ) {
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

    this.finalOperations();
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
    const {userData, setUserData, statusPage, orgSlug} = this.props;
    const {saml_logout_url} = statusPage;
    const {loggedOut} = this.state;
    const {repeatLogin} = this;
    const {setLoading} = this.context;
    const logoutMethodKey = `${orgSlug}_logout_method`;
    const logoutMethod = localStorage.getItem(logoutMethodKey);

    if (loggedOut) {
      const {logout, cookies} = this.props;
      const userAutoLogin = localStorage.getItem("userAutoLogin") === "true";
      logout(cookies, orgSlug, userAutoLogin);
      toast.success(t`LOGOUT_SUCCESS`);

      if (saml_logout_url && logoutMethod === "saml") {
        window.location.assign(saml_logout_url);
        localStorage.removeItem(logoutMethodKey);
        return;
      }
      setUserData(initialState.userData);
      setLoading(false);
    }

    if (repeatLogin) {
      userData.justAuthenticated = true;
      userData.mustLogout = false;
      userData.repeatLogin = false;
      // will trigger the creation of a new radius token
      userData.radius_user_token = undefined;
      this.repeatLogin = false;
      setUserData(userData);
      // wait to trigger login to avoid getting stuck
      // in captive portal firewall rule reloading
      setTimeout(async () => this.componentDidMount(), 1000);
    }
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

  getMB = (bytes) => {
    const number = Number(bytes);
    const mb = Math.round(number / (1024 * 1024));
    return `${mb}MB`;
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
          {new Intl.DateTimeFormat(language, time_option).format(
            new Date(session.start_time),
          )}
        </td>
        <td>
          {session.stop_time === null
            ? activeSessionText
            : new Intl.DateTimeFormat(language, time_option).format(
                new Date(session.stop_time),
              )}
        </td>
        <td>{this.getDuration(session.session_time)}</td>
        <td>{this.getMB(session.output_octets)}</td>
        <td>{this.getMB(session.input_octets)}</td>
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
            {new Intl.DateTimeFormat(language, time_option).format(
              new Date(session.start_time),
            )}
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
              : new Intl.DateTimeFormat(language, time_option).format(
                  new Date(session.stop_time),
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
          <td>{this.getMB(session.output_octets)}</td>
        </tr>
        <tr
          key={`${session.session_id}upload`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{session_info.header.upload}:</th>
          <td>{this.getMB(session.input_octets)}</td>
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

  getSpinner = () => (
    <div className="loadingContainer">
      <p className="loading" />
    </div>
  );

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

  render() {
    const {
      statusPage,
      language,
      orgSlug,
      captivePortalLoginForm,
      captivePortalLogoutForm,
      isAuthenticated,
      userData,
    } = this.props;
    const {links} = statusPage;
    const {
      username,
      password,
      userInfo,
      activeSessions,
      pastSessions,
      sessionsToLogout,
      hasMoreSessions,
      loadSpinner,
      modalActive,
      rememberMe,
    } = this.state;
    const user_info = this.getUserInfo();
    const contentArr = t`STATUS_CONTENT`.split("\n");
    userInfo.status = user_info.status.value;
    return (
      <>
        <div className={modalActive ? "modal is-visible" : "modal"}>
          <div className="modal-container bg">
            <button
              type="button"
              className="modal-close-btn"
              onClick={this.toggleModal}
            >
              &#10006;
            </button>
            <p className="message">{t`LOGOUT_MODAL_CONTENT`}</p>

            <p className="modal-buttons">
              <button
                type="button"
                className="button partial"
                onClick={() => this.handleLogout(true)}
              >
                {t`YES`}
              </button>
              <button
                type="button"
                className="button partial"
                onClick={() => this.handleLogout(false)}
              >
                {t`NO`}
              </button>
            </p>
          </div>
        </div>
        <div className="container content" id="status">
          <div className="inner">
            <div className="main-column">
              <div className="inner">
                {contentArr.map((text) => {
                  if (text !== "") return <p key={text}>{text}</p>;
                  return null;
                })}
                {Object.keys(userInfo).map((key) => (
                  <p key={key}>
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
        {((activeSessions.length > 0 || pastSessions.length > 0) && (
          <InfinteScroll
            dataLength={pastSessions.length}
            next={this.fetchMoreSessions}
            hasMore={hasMoreSessions}
            loader={this.getSpinner()}
          >
            <>{this.getTable(this.getSessionInfo())}</>
          </InfinteScroll>
        )) ||
          (loadSpinner ? this.getSpinner() : null)}

        {/* check to ensure this block of code is executed in root document and not in Iframe */}
        {captivePortalLoginForm && window.top === window.self && (
          <>
            <form
              ref={this.loginFormRef}
              method={captivePortalLoginForm.method || "post"}
              id="cp-login-form"
              action={captivePortalLoginForm.action || ""}
              target="owisp-auth-iframe"
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
              {captivePortalLoginForm.additional_fields.length &&
                captivePortalLoginForm.additional_fields.map((field) => (
                  <input
                    readOnly
                    type="text"
                    name={field.name}
                    value={field.value}
                    key={field.name}
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
              target="owisp-auth-logout-iframe"
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
}
Status.contextType = LoadingContext;
Status.defaultProps = {
  isAuthenticated: false,
};
Status.propTypes = {
  statusPage: PropTypes.shape({
    links: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.object.isRequired,
        url: PropTypes.string.isRequired,
      }),
    ),
    saml_logout_url: PropTypes.string,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  userData: PropTypes.object.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
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
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
    subscriptions: PropTypes.bool,
  }).isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
};
