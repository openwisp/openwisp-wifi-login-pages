/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, {Suspense} from "react";
import {Link, Route} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import getText from "../../utils/get-text";
import getHtml from "../../utils/get-html";
import "react-phone-input-2/lib/style.css";
import "react-toastify/dist/ReactToastify.css";

import PasswordToggleIcon from "../../utils/password-toggle";
import {loginApiUrl, mainToastId} from "../../constants";
import getAssetPath from "../../utils/get-asset-path";
import getErrorText from "../../utils/get-error-text";
import getParameterByName from "../../utils/get-parameter-by-name";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import renderAdditionalInfo from "../../utils/render-additional-info";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";
import Modal from "../modal";
import {Status} from "../organization-wrapper/lazy-import";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";
import redirectToPayment from "../../utils/redirect-to-payment";

const PhoneInput = React.lazy(() => import("react-phone-input-2"));

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      remember_me: true,
      errors: {},
    };
    this.realmsRadiusLoginForm = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.passwordToggleRef = React.createRef();
  }

  componentDidMount() {
    const username = getParameterByName("username");
    const token = getParameterByName("token");
    const {loginForm, setTitle, orgName, orgSlug} = this.props;
    setTitle(t`LOGIN`, orgName);
    let remember_me;

    if (localStorage.getItem("rememberMe") !== null) {
      remember_me = localStorage.getItem("rememberMe") === "true";
    } else {
      remember_me = loginForm.input_fields.remember_me.value;
    }
    this.setState({remember_me});
    Status.preload();

    // social login / SAML login
    if (username && token) {
      const loginMethod = getParameterByName("login_method");
      if (loginMethod) {
        // we have to use localStorage because the page may be
        // closed and the information may be lost if we use sessionStorage
        localStorage.setItem(`${orgSlug}_logout_method`, loginMethod);
      }
      // will trigger token validation in status
      // autologin is disabled in this mode (user has to log in each time)
      this.handleAuthentication(
        {
          username,
          key: token,
          is_active: true,
          radius_user_token: undefined,
        },
        true,
      );
    }
  }

  getUsernameField = (input_fields) => {
    const {settings} = this.props;
    let usePhoneNumberField;
    if (typeof input_fields.username.auto_switch_phone_input !== "undefined") {
      usePhoneNumberField = Boolean(
        input_fields.username.auto_switch_phone_input,
      );
    } else {
      usePhoneNumberField = settings.mobile_phone_verification;
    }

    if (usePhoneNumberField) {
      return this.getPhoneNumberField(input_fields);
    }
    return this.getTextField(input_fields);
  };

  getTextField = (input_fields) => {
    const {username, errors} = this.state;
    const {language} = this.props;
    const label = input_fields.username.label
      ? getText(input_fields.username.label, language)
      : t`USERNAME_LOG_LBL`;
    const placeholder = input_fields.username.placeholder
      ? getText(input_fields.username.placeholder, language)
      : t`USERNAME_LOG_PHOLD`;
    const patternDesc = input_fields.username.pattern_description
      ? getText(input_fields.username.pattern_description, language)
      : t`USERNAME_LOG_TITL`;
    return (
      <div className="row username">
        <label htmlFor="username">{label}</label>
        {getError(errors, "username")}
        <input
          className={`input ${errors.username ? "error" : ""}`}
          type={input_fields.username.type}
          id="username"
          name="username"
          value={username}
          onChange={this.handleChange}
          required
          placeholder={placeholder}
          pattern={input_fields.username.pattern}
          autoComplete="username"
          title={patternDesc}
        />
      </div>
    );
  };

  getPhoneNumberField = (input_fields) => {
    const {username, errors} = this.state;
    return (
      <div className="row phone-number">
        <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
        {getError(errors, "username")}
        <Suspense
          fallback={
            <input
              type="tel"
              name="username"
              className="form-control input"
              value={username}
              id="username"
              onChange={(value) =>
                this.handleChange({
                  target: {name: "username", value: `+${value}`},
                })
              }
              placeholder={t`PHONE_PHOLD`}
            />
          }
        >
          <PhoneInput
            name="username"
            country={input_fields.phone_number.country}
            onlyCountries={input_fields.phone_number.only_countries || []}
            preferredCountries={
              input_fields.phone_number.preferred_countries || []
            }
            excludeCountries={input_fields.phone_number.exclude_countries || []}
            value={username}
            onChange={(value) =>
              this.handleChange({
                target: {name: "username", value: `+${value}`},
              })
            }
            placeholder={t`PHONE_PHOLD`}
            enableSearch={Boolean(input_fields.phone_number.enable_search)}
            inputProps={{
              name: "username",
              id: "username",
              className: `form-control input ${errors.username ? "error" : ""}`,
              required: true,
              autoComplete: "tel",
            }}
          />
        </Suspense>
      </div>
    );
  };

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    if (event) event.preventDefault();
    const {orgSlug, setUserData, language, settings} = this.props;
    const {radius_realms} = settings;
    const {username, password, errors} = this.state;
    const url = loginApiUrl(orgSlug);
    this.setState({
      errors: {},
    });
    setLoading(true);
    this.waitToast = toast.info(t`PLEASE_WAIT`, {autoClose: 20000});
    if (radius_realms && username.includes("@")) {
      return this.realmsRadiusLoginForm.current.submit();
    }
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
      },
      url,
      data: qs.stringify({
        username,
        password,
      }),
    })
      .then((res = {}) => {
        if (!res.data) throw new Error();
        return this.handleAuthentication(res.data);
      })
      .catch((error = {}) => {
        if (!error.response || !error.response.data || !error) {
          toast.error(t`ERR_OCCUR`);
          return;
        }

        const {data} = error.response;
        if (!data) throw new Error();

        if (error.response.status === 401 && data.is_active) {
          this.handleAuthentication(data);
          return;
        }

        setUserData(data);

        const errorText =
          data.is_active === false
            ? getErrorText(error, t`USER_INACTIVE`)
            : getErrorText(error, t`LOGIN_ERR`);
        logError(error, errorText);
        toast.error(errorText);

        if (data.is_active === false) {
          data.username = "";
        }

        this.setState({
          errors: {
            ...errors,
            ...(data.username
              ? {username: data.username.toString()}
              : {username: ""}),
            ...(data.password ? {password: data.password} : {password: ""}),
          },
        });

        this.dismissWait();
        setLoading(false);
      });
  }

  dismissWait = () => {
    const {waitToast} = this;
    if (waitToast) toast.dismiss(this.waitToast);
  };

  handleAuthentication = (data = {}, useSessionStorage = false) => {
    const {orgSlug, authenticate, setUserData} = this.props;
    const {remember_me} = this.state;
    // useSessionStorage=true is passed from social login or SAML
    // user needs to repeat the login process each time
    localStorage.setItem("rememberMe", remember_me && !useSessionStorage);
    // if remember me checkbox is unchecked
    // store auth token in sessionStorage instead of cookie
    if (!remember_me || useSessionStorage) {
      sessionStorage.setItem(`${orgSlug}_auth_token`, data.key);
    }
    this.dismissWait();
    toast.success(t`LOGIN_SUCCESS`, {
      toastId: mainToastId,
    });
    setUserData({...data, mustLogin: true});
    // if requires payment redirect to payment status component
    if (data.method === "bank_card" && data.is_verified === false) {
      redirectToPayment(orgSlug);
    }
    authenticate(true);
  };

  handleCheckBoxChange = (event) => {
    this.setState({
      remember_me: event.target.checked,
    });
  };

  getRealmRadiusForm = () => {
    const {username, password} = this.state;
    const {settings, captivePortalLoginForm} = this.props;
    const {radius_realms} = settings;
    if (radius_realms && captivePortalLoginForm)
      return (
        <form
          ref={this.realmsRadiusLoginForm}
          method={captivePortalLoginForm.method || "post"}
          id="cp-login-form"
          action={captivePortalLoginForm.action || ""}
          className="hidden"
        >
          <input
            type="hidden"
            name={captivePortalLoginForm.fields.username || ""}
            value={username}
          />
          <input
            type="hidden"
            name={captivePortalLoginForm.fields.password || ""}
            value={password}
          />
          {captivePortalLoginForm.additional_fields.length &&
            captivePortalLoginForm.additional_fields.map((field) => (
              <input
                type="hidden"
                name={field.name}
                value={field.value}
                key={field.name}
              />
            ))}
        </form>
      );
    return null;
  };

  render() {
    const {errors, password, remember_me} = this.state;
    const {loginForm, orgSlug, match, language} = this.props;
    const {
      links,
      buttons,
      input_fields,
      social_login,
      additional_info_text,
      intro_html,
      pre_html,
      help_html,
      after_html,
    } = loginForm;
    return (
      <>
        {intro_html && (
          <div className="container intro">
            {getHtml(intro_html, language, "inner")}
          </div>
        )}
        <div className="container content" id="login">
          <div className="inner">
            <form className="main-column" onSubmit={this.handleSubmit}>
              <div className="inner">
                {getHtml(pre_html, language, "pre-html")}

                {social_login && social_login.links && (
                  <div className="social-links row">
                    {social_login.links.map((link) => (
                      <p key={link.url}>
                        <a
                          href={link.url}
                          rel="noopener noreferrer"
                          className="social-link button full"
                        >
                          <span className="inner">
                            <img
                              src={getAssetPath(orgSlug, link.icon)}
                              alt={getText(link.text, language)}
                              className="icon"
                            />
                            <span className="text">
                              {getText(link.text, language)}
                            </span>
                          </span>
                        </a>
                      </p>
                    ))}
                  </div>
                )}

                {getHtml(help_html, language, "help-container")}

                <div className="fieldset">
                  {getError(errors)}

                  {this.getUsernameField(input_fields)}

                  <div className="row password">
                    <label htmlFor="password">{t`PWD_LBL`}</label>
                    {getError(errors, "password")}
                    <input
                      className={`input ${errors.password ? "error" : ""}`}
                      type="password"
                      id="password"
                      required
                      name="password"
                      value={password}
                      onChange={this.handleChange}
                      placeholder={t`PWD_PHOLD`}
                      pattern={input_fields.password.pattern}
                      title={t`PWD_PTRN_DESC`}
                      ref={this.passwordToggleRef}
                      autoComplete="current-password"
                    />
                    <PasswordToggleIcon inputRef={this.passwordToggleRef} />
                  </div>

                  <div className="row remember-me">
                    <input
                      type="checkbox"
                      id="remember_me"
                      name="remember_me"
                      checked={remember_me}
                      onChange={this.handleCheckBoxChange}
                    />
                    <label htmlFor="remember_me">{t`REMEMBER_ME`}</label>
                  </div>
                </div>

                {additional_info_text && (
                  <div className="row add-info">
                    {renderAdditionalInfo(
                      t`LOGIN_ADD_INFO_TXT`,
                      orgSlug,
                      "login",
                    )}
                  </div>
                )}

                <div className="row login">
                  <input
                    type="submit"
                    className="button full"
                    value={t`LOGIN`}
                  />
                </div>

                {buttons.register && (
                  <div className="row register">
                    <p>{t`REGISTER_BTN_LBL`}</p>
                    <Link
                      to={`/${orgSlug}/registration`}
                      className="button full"
                    >
                      {t`REGISTER_BTN_TXT`}
                    </Link>
                  </div>
                )}

                {links && links.forget_password && (
                  <div className="row links">
                    <Link to={`/${orgSlug}/password/reset`} className="link">
                      {t`FORGOT_PASSWORD`}
                    </Link>
                  </div>
                )}

                {getHtml(after_html, language, "after-html")}
              </div>
            </form>

            {this.getRealmRadiusForm()}

            <Contact />
          </div>
        </div>
        <Route
          path={`${match.path}/:name`}
          render={(props) => <Modal {...props} prevPath={match.url} />}
        />
      </>
    );
  }
}

Login.contextType = LoadingContext;
Login.propTypes = {
  loginForm: PropTypes.shape({
    social_login: PropTypes.shape({
      divider_text: PropTypes.object,
      description: PropTypes.object,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
          icon: PropTypes.string.isRequired,
          text: PropTypes.object.isRequired,
        }),
      ),
    }),
    input_fields: PropTypes.shape({
      username: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string,
        label: PropTypes.object,
        placeholder: PropTypes.object,
      }).isRequired,
      password: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
      phone_number: PropTypes.shape({
        type: PropTypes.string,
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      remember_me: PropTypes.shape({
        value: PropTypes.bool.isRequired,
      }),
    }),
    additional_info_text: PropTypes.bool,
    buttons: PropTypes.shape({
      register: PropTypes.bool,
    }),
    links: PropTypes.shape({
      forget_password: PropTypes.bool,
    }).isRequired,
    pre_html: PropTypes.object,
    intro_html: PropTypes.object,
    help_html: PropTypes.object,
    after_html: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
  match: PropTypes.shape({
    path: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  privacyPolicy: PropTypes.object.isRequired,
  termsAndConditions: PropTypes.object.isRequired,
  authenticate: PropTypes.func.isRequired,
  setUserData: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  settings: PropTypes.shape({
    radius_realms: PropTypes.bool,
    mobile_phone_verification: PropTypes.bool,
    subscriptions: PropTypes.bool,
  }).isRequired,
  setTitle: PropTypes.func.isRequired,
  captivePortalLoginForm: PropTypes.shape({
    method: PropTypes.string,
    action: PropTypes.string,
    fields: PropTypes.shape({
      username: PropTypes.string,
      password: PropTypes.string,
    }),
    additional_fields: PropTypes.array,
  }).isRequired,
};
