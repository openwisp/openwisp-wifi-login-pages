import "./index.css";
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
      sessions: [],
      loggedOut: false,
    };
    this.validateToken = this.validateToken.bind(this);
    this.getUserRadiusSessions = this.getUserRadiusSessions.bind(this);
  }

  async componentDidMount() {
    const {cookies, orgSlug} = this.props;
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
        }
      } catch {
        //
      }
      const isValid = await this.validateToken();
      if (isValid) {
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
        const {radius_user_token: password, username} = response.data;
        this.setState({username, password});
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
    } = this.props;
    const {content, links, buttons} = statusPage;
    const {username, password, sessions} = this.state;
    const contentArr = getText(content, language).split("\n");
    return (
      <>
        <div className="owisp-status-container">
          <div className="owisp-status-inner">
            <div className="owisp-status-content-div">
              {contentArr.map(text => {
                if (text !== "")
                  return (
                    <div className="owisp-status-content-line" key={text}>
                      {text}
                    </div>
                  );
                return null;
              })}
              {links
                ? links.map(link => (
                    <Link
                      className="owisp-status-link"
                      key={link.url}
                      to={link.url.replace("{orgSlug}", orgSlug)}
                    >
                      {getText(link.text, language)}
                    </Link>
                  ))
                : null}
              {buttons.logout ? (
                <>
                  {buttons.logout.label ? (
                    <>
                      <label
                        className="owisp-status-label owisp-status-label-logout-btn"
                        htmlFor="owisp-status-logout-btn"
                      >
                        <div className="owisp-status-label-text">
                          {getText(buttons.logout.label, language)}
                        </div>
                      </label>
                    </>
                  ) : null}
                  <input
                    type="button"
                    className="owisp-status-btn owisp-status-logout-btn owisp-btn-primary "
                    id="owisp-status-logout-btn"
                    value={getText(buttons.logout.text, language)}
                    onClick={this.handleLogout}
                  />
                </>
              ) : null}
            </div>
            <div className="owisp-status-contact-div">
              <Contact />
            </div>
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
              className="owisp-auth-hidden"
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
              {captivePortalLoginForm.additional_fields.length > 0
                ? captivePortalLoginForm.additional_fields.map(field => (
                    <input
                      readOnly
                      type="text"
                      name={field.name}
                      value={field.value}
                      key={field.name}
                    />
                  ))
                : null}
            </form>
            {/* login form is submitted in this Iframe
            onLoad: handles response from captive portal
            */}
            <iframe
              onLoad={this.handleLoginIframe}
              ref={this.loginIfameRef}
              name="owisp-auth-iframe"
              className="owisp-auth-hidden"
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
              className="owisp-auth-hidden"
            >
              <input
                readOnly
                type="hidden"
                name={captivePortalLogoutForm.fields.id || ""}
                value={sessions.length > 0 ? sessions[0].session_id : ""}
              />
              {captivePortalLogoutForm.additional_fields.length > 0
                ? captivePortalLogoutForm.additional_fields.map(field => (
                    <input
                      readOnly
                      type="text"
                      name={field.name}
                      value={field.value}
                    />
                  ))
                : null}
            </form>
            <iframe
              onLoad={this.handleLogoutIframe}
              ref={this.logoutIfameRef}
              name="owisp-auth-logout-iframe"
              className="owisp-auth-hidden"
              title="owisp-auth-iframe"
            />
          </>
        )}
      </>
    );
  }
}
Status.contextType = LoadingContext;

Status.propTypes = {
  statusPage: PropTypes.shape({
    content: PropTypes.object,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.object,
        url: PropTypes.string,
      }),
    ),
    buttons: PropTypes.shape({
      logout: PropTypes.object,
    }),
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
};
