/* eslint-disable camelcase */
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Cookies} from "react-cookie";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {
  genericError,
  getUserRadiusSessionsUrl,
  logoutSuccess,
  mainToastId,
  validateApiUrl,
} from "../../constants";
import getText from "../../utils/get-text";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import Contact from "../contact-box";
import shouldLinkBeShown from "../../utils/should-link-be-shown";

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
      is_active: null,
      sessions: [],
      loggedOut: false,
    };
    this.validateToken = this.validateToken.bind(this);
    this.getUserRadiusSessions = this.getUserRadiusSessions.bind(this);
  }

  async componentDidMount() {
    const {cookies, orgSlug, verifyMobileNumber, settings} = this.props;
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
      const isValid = await this.validateToken();
      const {is_active} = this.state;
      if (isValid && is_active) {
        const macaddr = cookies.get(`${orgSlug}_macaddr`);

        if (macaddr) {
          await this.getUserRadiusSessions();
          /* request to captive portal is made only if there is
            no active session from macaddr stored in the cookie */
          const {sessions} = this.state;
          if (sessions && sessions.length === 0) {
            if (this.loginFormRef && this.loginFormRef.current)
              this.loginFormRef.current.submit();
          }
        } else if (this.loginFormRef && this.loginFormRef.current)
          this.loginFormRef.current.submit();
      }
      // would be better to show a different button in the status page
      if (isValid && !is_active && settings.mobile_phone_verification) {
        verifyMobileNumber(true);
      }
    }
  }

  async getUserRadiusSessions() {
    const {cookies, orgSlug, logout} = this.props;
    const url = getUserRadiusSessionsUrl(orgSlug);
    try {
      const response = await axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url,
      });
      this.setState({sessions: response.data});
    } catch (error) {
      logout(cookies, orgSlug);
      toast.error(genericError, {
        onOpen: () => toast.dismiss(mainToastId),
      });
      logError(error, genericError);
    }
  }

  handleLogout = async () => {
    const {setLoading} = this.context;
    const {orgSlug, logout, cookies} = this.props;
    setLoading(true);
    await this.getUserRadiusSessions();
    const {sessions} = this.state;
    if (sessions.length > 0) {
      if (this.logoutFormRef && this.logoutFormRef.current) {
        this.setState({loggedOut: true}, () => {
          this.logoutFormRef.current.submit();
        });
        return;
      }
    }
    logout(cookies, orgSlug);
    setLoading(false);
    toast.success(logoutSuccess);
  };

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

  handleLogoutIframe = () => {
    if (this.logoutIfameRef && this.logoutIfameRef.current) {
      const {loggedOut} = this.state;
      if (loggedOut) {
        const {setLoading} = this.context;
        const {orgSlug, logout, cookies} = this.props;
        logout(cookies, orgSlug);
        setLoading(false);
        toast.success(logoutSuccess);
      }
    }
  };

  async validateToken() {
    const {cookies, orgSlug, logout} = this.props;
    const token = cookies.get(`${orgSlug}_auth_token`);
    const url = validateApiUrl(orgSlug);
    try {
      const response = await axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url,
        data: qs.stringify({
          token,
        }),
      });
      if (response.data.response_code !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL") {
        logout(cookies, orgSlug);
        toast.error(genericError, {
          onOpen: () => toast.dismiss(mainToastId),
        });
        logError(
          response,
          '"response_code" !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL"',
        );
      } else {
        const {radius_user_token: password, username, is_active} = response.data;
        this.setState({username, password, is_active});
      }
      return true;
    } catch (error) {
      logout(cookies, orgSlug);
      toast.error(genericError, {
        onOpen: () => toast.dismiss(mainToastId),
      });
      logError(error, genericError);
      return false;
    }
  }

  render() {
    const {
      statusPage,
      language,
      orgSlug,
      captivePortalLoginForm,
      captivePortalLogoutForm,
      isAuthenticated,
    } = this.props;
    const {content, links, buttons} = statusPage;
    const {username, password, sessions} = this.state;
    const contentArr = getText(content, language).split("\n");
    return (
      <>
        <div className="container content" id="status">
          <div className="inner">
            <div className="main-column">
              {contentArr.map(text => {
                if (text !== "")
                  return (
                    <p key={text}>
                      {text}
                    </p>
                  );
                return null;
              })}

              {links && (
                <div className="links row">
                {links.map(link => {
                  if (shouldLinkBeShown(link, isAuthenticated)) {
                    return (
                      <Link
                        className="button full status-link"
                        key={link.url}
                        to={link.url.replace("{orgSlug}", orgSlug)}
                      >
                        {getText(link.text, language)}
                      </Link>
                    );
                  }
                  return null;
                })}
                </div>
              )}

              <div className="row logout">
                <input
                  type="button"
                  className="button full"
                  value={getText(buttons.logout.text, language)}
                  onClick={this.handleLogout}
                />
              </div>
            </div>

            <Contact />
          </div>
        </div>

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
               captivePortalLoginForm.additional_fields.map(field => (
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
                value={sessions.length > 0 ? sessions[0].session_id : ""}
              />
              {captivePortalLogoutForm.additional_fields.length &&
               captivePortalLogoutForm.additional_fields.map(field => (
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
  isAuthenticated: false
};
Status.propTypes = {
  statusPage: PropTypes.shape({
    content: PropTypes.object.isRequired,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.object.isRequired,
        url: PropTypes.string.isRequired,
      }),
    ),
    buttons: PropTypes.shape({
      logout: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
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
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  verifyMobileNumber: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool
  }).isRequired,
};
