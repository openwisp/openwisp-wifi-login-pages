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
import {
  genericError,
  getUserRadiusSessionsUrl,
  logoutSuccess,
  mainToastId,
} from "../../constants";
import getText from "../../utils/get-text";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import Contact from "../contact-box";
import shouldLinkBeShown from "../../utils/should-link-be-shown";
import handleSession from "../../utils/session";
import validateToken from "../../utils/validateToken";

export default class Status extends React.Component {
  constructor(props) {
    super(props);
    this.loginIfameRef = React.createRef();
    this.loginFormRef = React.createRef();
    this.logoutIfameRef = React.createRef();
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
      hasMoreSessions: true,
      intervalId: null,
      screenWidth: window.innerWidth,
      loadSpinner: true,
      modalActive: false,
      rememberMe: false,
    };
    this.getUserRadiusSessions = this.getUserRadiusSessions.bind(this);
    this.handleSessionLogout = this.handleSessionLogout.bind(this);
    this.fetchMoreSessions = this.fetchMoreSessions.bind(this);
    this.updateScreenWidth = this.updateScreenWidth.bind(this);
    this.updateSpinner = this.updateSpinner.bind(this);
  }

  async componentDidMount() {
    const {
      cookies,
      orgSlug,
      verifyMobileNumber,
      settings,
      setUserData,
      setIsActive,
      logout,
    } = this.props;
    let {userData} = this.props;
    this.setState({
      rememberMe: localStorage.getItem("rememberMe") === "true",
    });
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

      const isValid = await validateToken(
        cookies,
        orgSlug,
        setUserData,
        userData,
        logout,
      );
      if (isValid) {
        ({userData} = this.props);
        const {
          radius_user_token: password,
          username,
          email,
          phone_number,
          is_active,
          is_verified,
        } = userData;
        const userInfo = {};
        userInfo.status = "";
        userInfo.email = email;
        if (username !== email && username !== phone_number) {
          userInfo.username = username;
        }
        if (settings.mobile_phone_verification) {
          userInfo.phone_number = phone_number;
        }
        setIsActive(is_active);
        this.setState({username, password, userInfo}, () => {
          // if the user is being automatically logged in but it's not
          // active anymore (eg: has been banned)
          // automatically perform log out
          if (is_active === false) {
            this.handleLogout(false);
          }
        });
        if (isValid && is_active) {
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
          } else if (this.loginFormRef && this.loginFormRef.current)
            this.loginFormRef.current.submit();

          await this.getUserActiveRadiusSessions();
          await this.getUserPassedRadiusSessions();
          const intervalId = setInterval(() => {
            this.getUserActiveRadiusSessions();
          }, 60000);
          this.setState({intervalId});
          window.addEventListener("resize", this.updateScreenWidth);
          this.updateSpinner();
        }
        // would be better to show a different button in the status page
        if (isValid && !is_verified && settings.mobile_phone_verification) {
          verifyMobileNumber(true);
        }
      }
    }
  }

  componentWillUnmount = () => {
    const {intervalId} = this.state;
    clearInterval(intervalId);
    window.removeEventListener("resize", this.updateScreenWidth);
  };

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
      if (params.is_open) {
        options.activeSessions = response.data;
        options.sessionsToLogout = response.data;
      } else {
        const {pastSessions} = this.state;
        options.pastSessions = pastSessions.concat(response.data);
        options.currentPage = params.page;
      }
      if (
        "link" in response.headers &&
        !response.headers.link.includes("next")
      ) {
        options.hasMoreSessions = false;
      }
      this.setState(options);
    } catch (error) {
      logout(cookies, orgSlug);
      toast.error(genericError, {
        onOpen: () => toast.dismiss(mainToastId),
      });
      logError(error, genericError);
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

  handleLogout = async (userAutoLogin) => {
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
        this.setState({loggedOut: true}, () => {
          this.logoutFormRef.current.submit();
        });
        return;
      }
    }
    logout(cookies, orgSlug, userAutoLogin);
    setUserData({});
    setLoading(false);
    toast.success(logoutSuccess);
  };

  /*
   * We use <iframe> to perform the POST to the captive portal login URL
   * so that the request is transparent for the user, which does not need
   * to be redirected to a different URL and then come back again.
   */
  handleLoginIframe = () => {
    const {cookies, orgSlug, logout, captivePortalLoginForm} = this.props;
    if (this.loginIfameRef && this.loginIfameRef.current) {
      try {
        const searchParams = new URLSearchParams(
          this.loginIfameRef.current.contentWindow.location.search,
        );
        const reply = searchParams.get("reply");
        const macaddr = searchParams.get(
          captivePortalLoginForm.macaddr_param_name,
        );
        if (
          reply ||
          this.loginIfameRef.current.contentDocument.title.indexOf("404") >= 0
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
    }
  };

  /*
   * We use <iframe> to perform the POST to the captive portal logout URL
   * so that the request is transparent for the user, which does not need
   * to be redirected to a different URL and then come back again.
   */
  handleLogoutIframe = () => {
    if (this.logoutIfameRef && this.logoutIfameRef.current) {
      const {loggedOut} = this.state;
      if (loggedOut) {
        const {setLoading} = this.context;
        const {orgSlug, logout, cookies} = this.props;
        const userAutoLogin = localStorage.getItem("userAutoLogin") === "true";
        logout(cookies, orgSlug, userAutoLogin);
        setLoading(false);
        toast.success(logoutSuccess);
      }
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

  getLargeTableRow = (session, sessionSettings) => {
    const {language, captivePortalLogoutForm, statusPage} = this.props;
    const {buttons} = statusPage;
    const time_option = {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    };
    const activeSessionText = getText(
      sessionSettings.active_session.text,
      language,
    );
    return (
      <>
        <td>
          {new Intl.DateTimeFormat(
            sessionSettings.date_language_locale,
            time_option,
          ).format(new Date(session.start_time))}
        </td>
        <td>
          {session.stop_time === null
            ? activeSessionText
            : new Intl.DateTimeFormat(
                sessionSettings.date_language_locale,
                time_option,
              ).format(new Date(session.stop_time))}
        </td>
        <td>{this.getDuration(session.session_time)}</td>
        <td>{this.getMB(session.output_octets)}</td>
        <td>{this.getMB(session.input_octets)}</td>
        <td>{session.calling_station_id}</td>
        {session.stop_time == null &&
          captivePortalLogoutForm.logout_by_session && (
            <td>
              <div className="row logout">
                <input
                  type="button"
                  className="button"
                  value={getText(buttons.logout.text, language)}
                  onClick={() => {
                    this.handleSessionLogout(session);
                  }}
                />
              </div>
            </td>
          )}
      </>
    );
  };

  getSmallTableRow = (session, session_info) => {
    const {language, captivePortalLogoutForm, statusPage} = this.props;
    const {buttons} = statusPage;
    const time_option = {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    };
    const activeSessionText = getText(
      session_info.settings.active_session.text,
      language,
    );
    return (
      <tbody key={session.session_id}>
        <tr
          key={`${session.session_id}start_time`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{getText(session_info.header.start_time.text, language)}:</th>
          <td>
            {new Intl.DateTimeFormat(
              session_info.settings.date_language_locale,
              time_option,
            ).format(new Date(session.start_time))}
          </td>
        </tr>
        <tr
          key={`${session.session_id}stop_time`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{getText(session_info.header.stop_time.text, language)}:</th>
          <td>
            {session.stop_time === null
              ? activeSessionText
              : new Intl.DateTimeFormat(
                  session_info.settings.date_language_locale,
                  time_option,
                ).format(new Date(session.stop_time))}
          </td>
        </tr>
        <tr
          key={`${session.session_id}duration`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{getText(session_info.header.duration.text, language)}:</th>
          <td>{this.getDuration(session.session_time)}</td>
        </tr>
        <tr
          key={`${session.session_id}download`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{getText(session_info.header.download.text, language)}:</th>
          <td>{this.getMB(session.output_octets)}</td>
        </tr>
        <tr
          key={`${session.session_id}upload`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{getText(session_info.header.upload.text, language)}:</th>
          <td>{this.getMB(session.input_octets)}</td>
        </tr>
        <tr
          key={`${session.session_id}device_address`}
          className={session.stop_time === null ? "active-session" : ""}
        >
          <th>{getText(session_info.header.device_address.text, language)}:</th>
          <td>{session.calling_station_id}</td>
        </tr>
        {session.stop_time == null &&
          captivePortalLogoutForm.logout_by_session && (
            <tr key={`${session.session_id}logout`} className="active-session">
              <th>{`${getText(buttons.logout.text, language)} ?`}:</th>
              <td className="row logout">
                <input
                  type="button"
                  className="button"
                  value={getText(buttons.logout.text, language)}
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
    const {language} = this.props;
    return (
      <table className="large-table bg">
        <thead>
          <tr>
            {Object.keys(session_info.header).map((key) => {
              return (
                <th key={key}>
                  {getText(session_info.header[key].text, language)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {activeSessions.map((session) => {
            return (
              <tr
                key={session.session_id}
                className={session.stop_time === null ? "active-session" : ""}
              >
                {this.getLargeTableRow(session, session_info.settings)}
              </tr>
            );
          })}
          {pastSessions.map((session) => {
            return (
              <tr
                key={session.session_id}
                className={session.stop_time === null ? "active-session" : ""}
              >
                {this.getLargeTableRow(session, session_info.settings)}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  getSmallTable = (session_info) => {
    const {activeSessions, pastSessions} = this.state;
    return (
      <table className="small-table bg">
        {activeSessions.map((session) => {
          return this.getSmallTableRow(session, session_info);
        })}
        {pastSessions.map((session) => {
          return this.getSmallTableRow(session, session_info);
        })}
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

  getSpinner = () => {
    return (
      <div className="loadingContainer">
        <p className="loading" />
      </div>
    );
  };

  render() {
    const {
      statusPage,
      language,
      orgSlug,
      captivePortalLoginForm,
      captivePortalLogoutForm,
      isAuthenticated,
    } = this.props;
    const {
      content,
      links,
      buttons,
      session_info,
      user_info,
      logout_modal,
    } = statusPage;
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
    const contentArr = getText(content, language).split("\n");
    userInfo.status = getText(user_info.status.value, language);
    return (
      <>
        <div
          className={modalActive ? "logout-modal is-visible" : "logout-modal"}
        >
          <div className="logout-modal-container">
            <button
              type="button"
              className="logout-modal-close-btn"
              onClick={this.toggleModal}
            >
              &#10006;
            </button>
            <p className="message">{getText(logout_modal.content, language)}</p>

            <p className="modal-buttons">
              <button
                type="button"
                className="button partial"
                onClick={() => this.handleLogout(true)}
              >
                {getText(logout_modal.buttons.agree.text, language)}
              </button>
              <button
                type="button"
                className="button partial"
                onClick={() => this.handleLogout(false)}
              >
                {getText(logout_modal.buttons.disagree.text, language)}
              </button>
            </p>
          </div>
        </div>
        <div className="container content" id="status">
          <div className="inner">
            <div className="main-column">
              {contentArr.map((text) => {
                if (text !== "") return <p key={text}>{text}</p>;
                return null;
              })}
              {Object.keys(userInfo).map((key) => {
                return (
                  <p key={key}>
                    <label>{getText(user_info[key].text, language)}:</label>
                    <span>{userInfo[key]}</span>
                  </p>
                );
              })}

              <div className="row logout">
                <input
                  type="button"
                  className="button full"
                  value={getText(buttons.logout.text, language)}
                  onClick={
                    rememberMe
                      ? this.toggleModal
                      : () => this.handleLogout(false)
                  }
                />
              </div>

              {links &&
                links.map((link) => {
                  if (shouldLinkBeShown(link, isAuthenticated)) {
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
            <>{this.getTable(session_info)}</>
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
            <iframe
              onLoad={this.handleLoginIframe}
              ref={this.loginIfameRef}
              name="owisp-auth-iframe"
              className="hidden"
              title="owisp-auth-iframe"
            />
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
              {captivePortalLogoutForm.additional_fields.length &&
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
              ref={this.logoutIfameRef}
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
    content: PropTypes.object.isRequired,
    session_info: PropTypes.shape({
      header: PropTypes.shape({
        start_time: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
        stop_time: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
        duration: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
        download: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
        upload: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
        device_address: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
      }).isRequired,
      settings: PropTypes.shape({
        active_session: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
        date_language_locale: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.object.isRequired,
        url: PropTypes.string.isRequired,
      }),
    ),
    user_info: PropTypes.shape({
      status: PropTypes.shape({
        text: PropTypes.object.isRequired,
        value: PropTypes.object.isRequired,
      }).isRequired,
      email: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
      username: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
      phone_number: PropTypes.shape({
        text: PropTypes.object,
      }),
    }).isRequired,
    buttons: PropTypes.shape({
      logout: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
    logout_modal: PropTypes.shape({
      content: PropTypes.object.isRequired,
      buttons: PropTypes.shape({
        agree: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
        disagree: PropTypes.shape({
          text: PropTypes.object.isRequired,
        }).isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
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
  verifyMobileNumber: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  setIsActive: PropTypes.func.isRequired,
  setUserData: PropTypes.func.isRequired,
};
