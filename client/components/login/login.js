import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, {Suspense} from "react";
import {Link, Route, Routes} from "react-router-dom";
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
import {localStorage, sessionStorage} from "../../utils/storage";

const PhoneInput = React.lazy(
  () => import(/* webpackChunkName: 'PhoneInput' */ "react-phone-input-2"),
);
export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      rememberMe: true,
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
    const {loginForm, setTitle, orgName, orgSlug, settings} = this.props;
    const sesameToken = getParameterByName(settings.passwordless_authToken_name);
    setTitle(t`LOGIN`, orgName);
    let rememberMe;

    if (localStorage.getItem("rememberMe") !== null) {
      rememberMe = localStorage.getItem("rememberMe") === "true";
    } else {
      rememberMe = loginForm.inputFields.rememberMe.value;
    }
    this.setState({rememberMe});
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
          isActive: true,
          radius_user_token: undefined,
        },
        true,
      );
    }

    // password-less authentication
    if (sesameToken) {
      this.handleSubmit(null, sesameToken);
    }
  }

  getUsernameField = (inputFields) => {
    const {settings} = this.props;
    let usePhoneNumberField;
    if (typeof inputFields.username.auto_switch_phone_input !== "undefined") {
      usePhoneNumberField = Boolean(inputFields.username.auto_switch_phone_input);
    } else {
      usePhoneNumberField = settings.mobilePhoneVerification;
    }

    if (usePhoneNumberField) {
      return this.getPhoneNumberField(inputFields);
    }
    return this.getTextField(inputFields);
  };

  getTextField = (inputFields) => {
    const {username, errors} = this.state;
    const {language} = this.props;
    const usernameLabel =
      inputFields.username.type === "email" ? t`EMAIL` : t`USERNAME_LOG_LBL`;
    const label = inputFields.username.label
      ? getText(inputFields.username.label, language)
      : usernameLabel;
    const placeholder = inputFields.username.placeholder
      ? getText(inputFields.username.placeholder, language)
      : t`USERNAME_LOG_PHOLD`;
    const patternDesc = inputFields.username.pattern_description
      ? getText(inputFields.username.pattern_description, language)
      : t`USERNAME_LOG_TITL`;
    return (
      <div className="row username">
        <label htmlFor="username">{label}</label>
        {getError(errors, "username")}
        <input
          className={`input ${errors.username ? "error" : ""}`}
          type={inputFields.username.type}
          id="username"
          name="username"
          value={username}
          onChange={this.handleChange}
          required
          placeholder={placeholder}
          pattern={inputFields.username.pattern}
          autoComplete="username"
          title={patternDesc}
        />
      </div>
    );
  };

  getPhoneNumberField = (inputFields) => {
    const {username, errors} = this.state;
    return (
      <div className="row phone-number">
        <label htmlFor="username">{t`PHONE_LBL`}</label>
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
            country={inputFields.phoneNumber.country}
            onlyCountries={inputFields.phoneNumber.only_countries || []}
            preferredCountries={inputFields.phoneNumber.preferred_countries || []}
            excludeCountries={inputFields.phoneNumber.exclude_countries || []}
            value={username}
            onChange={(value) =>
              this.handleChange({
                target: {name: "username", value: `+${value}`},
              })
            }
            placeholder={t`PHONE_PHOLD`}
            enableSearch={Boolean(inputFields.phoneNumber.enable_search)}
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

  handleSubmit(event, sesameToken = null) {
    const {setLoading} = this.context;
    if (event) event.preventDefault();
    const {orgSlug, setUserData, language, settings} = this.props;
    const {radiusRealms} = settings;
    const {username, password, errors} = this.state;
    const url = loginApiUrl(orgSlug);
    this.setState({
      errors: {},
    });
    setLoading(true);
    if (!sesameToken) {
      this.waitToast = toast.info(t`PLEASE_WAIT`, {autoClose: 20000});
    }
    if (radiusRealms && username.includes("@")) {
      return this.realmsRadiusLoginForm.current.submit();
    }
    const headers = {
      "content-type": "application/x-www-form-urlencoded",
      "accept-language": getLanguageHeaders(language),
    };
    if (sesameToken) {
      headers.Authorization = `${settings.passwordless_authToken_name} ${sesameToken}`;
    }
    return axios({
      method: "post",
      headers,
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

        if (error.response.status === 401 && data.isActive) {
          this.handleAuthentication(data);
          return;
        }

        setUserData(data);

        const errorText =
          data.isActive === false
            ? getErrorText(error, t`USER_INACTIVE`)
            : getErrorText(error, t`LOGIN_ERR`);
        logError(error, errorText);
        toast.error(errorText);

        if (data.isActive === false) {
          data.username = "";
        }

        this.setState({
          errors: {
            ...errors,
            ...(data.username ? {username: data.username.toString()} : {username: ""}),
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
    const {orgSlug, authenticate, setUserData, navigate} = this.props;
    const {rememberMe} = this.state;
    // useSessionStorage=true is passed from social login or SAML
    // user needs to repeat the login process each time
    localStorage.setItem("rememberMe", String(rememberMe && !useSessionStorage));
    // if remember me checkbox is unchecked
    // store auth token in sessionStorage instead of cookie
    if (!rememberMe || useSessionStorage) {
      sessionStorage.setItem(`${orgSlug}_authToken`, data.key);
    }
    this.dismissWait();
    toast.success(t`LOGIN_SUCCESS`, {
      toastId: mainToastId,
    });
    const {key: authToken} = data;
    setUserData({...data, authToken, mustLogin: true});
    // if requires payment redirect to payment status component
    if (data.method === "bank_card" && data.isVerified === false) {
      redirectToPayment(orgSlug, navigate);
    }
    authenticate(true);
  };

  handleCheckBoxChange = (event) => {
    this.setState({
      rememberMe: event.target.checked,
    });
  };

  getRealmRadiusForm = () => {
    const {username, password} = this.state;
    const {settings, captivePortalLoginForm} = this.props;
    const {radiusRealms} = settings;
    if (radiusRealms && captivePortalLoginForm)
      return (
        <form
          ref={this.realmsRadiusLoginForm}
          method={captivePortalLoginForm.method || "post"}
          id="cp-login-form"
          data-testid="cp-login-form"
          action={captivePortalLoginForm.action || ""}
          className="hidden"
          aria-label="Captive portal login form"
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
    const {errors, password, rememberMe} = this.state;
    const {loginForm, orgSlug, language} = this.props;
    const {
      links,
      buttons,
      inputFields,
      socialLogin,
      additionalInfoText,
      introHtml,
      preHtml,
      helpHtml,
      afterHtml,
    } = loginForm;
    return (
      <>
        {introHtml && (
          <div className="container intro">{getHtml(introHtml, language, "inner")}</div>
        )}
        <div className="container content" id="login">
          <div className="inner">
            <form
              className="main-column"
              onSubmit={this.handleSubmit}
              aria-label="Login form"
            >
              <div className="inner">
                {getHtml(preHtml, language, "pre-html")}

                {socialLogin && socialLogin.links && (
                  <div className="social-links row">
                    {socialLogin.links.map((link) => (
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
                            <span className="text">{getText(link.text, language)}</span>
                          </span>
                        </a>
                      </p>
                    ))}
                  </div>
                )}

                {getHtml(helpHtml, language, "help-container")}

                <div className="fieldset">
                  {getError(errors)}

                  {this.getUsernameField(inputFields)}

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
                      pattern={inputFields.password.pattern}
                      title={t`PWD_PTRN_DESC`}
                      ref={this.passwordToggleRef}
                      autoComplete="current-password"
                    />
                    <PasswordToggleIcon inputRef={this.passwordToggleRef} />
                  </div>

                  <div className="row remember-me">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={rememberMe}
                      onChange={this.handleCheckBoxChange}
                    />
                    <label htmlFor="rememberMe">{t`rememberMe`}</label>
                  </div>
                </div>

                {additionalInfoText && (
                  <div className="row add-info">
                    {renderAdditionalInfo(t`LOGIN_ADD_INFO_TXT`, orgSlug, "login")}
                  </div>
                )}

                <div className="row login">
                  <input type="submit" className="button full" value={t`LOGIN`} />
                </div>

                {buttons.register && (
                  <div className="row register">
                    <p>{t`REGISTER_BTN_LBL`}</p>
                    <Link to={`/${orgSlug}/registration`} className="button full">
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

                {getHtml(afterHtml, language, "after-html")}
              </div>
            </form>

            {this.getRealmRadiusForm()}

            <Contact />
          </div>
        </div>
        <Routes>
          <Route path=":name" element={<Modal prevPath={`/${orgSlug}/login`} />} />
        </Routes>
      </>
    );
  }
}

Login.contextType = LoadingContext;
Login.propTypes = {
  loginForm: PropTypes.shape({
    socialLogin: PropTypes.shape({
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
    inputFields: PropTypes.shape({
      username: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string,
        label: PropTypes.object,
        placeholder: PropTypes.object,
      }).isRequired,
      password: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
      phoneNumber: PropTypes.shape({
        type: PropTypes.string,
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      rememberMe: PropTypes.shape({
        value: PropTypes.bool.isRequired,
      }),
    }),
    additionalInfoText: PropTypes.bool,
    buttons: PropTypes.shape({
      register: PropTypes.bool,
    }),
    links: PropTypes.shape({
      forget_password: PropTypes.bool,
    }).isRequired,
    preHtml: PropTypes.object,
    introHtml: PropTypes.object,
    helpHtml: PropTypes.object,
    afterHtml: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  authenticate: PropTypes.func.isRequired,
  setUserData: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    radiusRealms: PropTypes.bool,
    mobilePhoneVerification: PropTypes.bool,
    subscriptions: PropTypes.bool,
    passwordless_authToken_name: PropTypes.string,
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
  navigate: PropTypes.func.isRequired,
};
